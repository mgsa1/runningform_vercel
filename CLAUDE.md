# RunningForm — Project Context for Claude Code

This is the RunningForm MVP: a web app where runners upload videos, the browser extracts frames, and Claude 3.5 Sonnet analyzes running form from those frames. Results are stored as structured JSON and displayed with drill recommendations.

## Tech Stack (do not deviate from these choices)

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 14.x |
| Language | TypeScript | strict mode |
| Styling | Tailwind CSS | 3.x |
| Database + Auth + Storage | Supabase | `@supabase/ssr` 0.5.x |
| Job Queue | Inngest | v3.x (pinned) |
| AI Analysis | Anthropic Claude 3.5 Sonnet | `@anthropic-ai/sdk` latest |
| Hosting | Vercel | — |
| Validation | Zod | — |

## Architecture

- Next.js API routes are the only backend (no separate server)
- Raw video is NEVER stored — only JPEG frames extracted in the browser
- Frames are stored in Supabase Storage public bucket named `frames`
- Analysis results are stored as JSONB in `analysis_results.result`
- Async jobs handled by Inngest; worker runs inside Next.js at `/api/inngest`
- All DB writes from the Inngest worker use `SUPABASE_SERVICE_ROLE_KEY`

## Critical Implementation Rules

### Supabase clients (P1)
- Use `createServerClient` from `@supabase/ssr` in server components and API routes
- Use `createBrowserClient` from `@supabase/ssr` in client components
- NEVER import `createClient` from `@supabase/supabase-js` directly in server components
- NEVER use the deprecated `@supabase/auth-helpers-nextjs` package

### Middleware (P2)
- `middleware.ts` at project root MUST implement Supabase session refresh
- Without it, sessions expire silently. It is required for App Router auth to work.

### Inngest (P3)
- Use Inngest v3 patterns ONLY
- Function handler signature: `async ({ event, step }) => { ... }`
- Wrap each logical unit in `step.run('name', async () => { ... })`
- Inngest serve handler MUST be at `/api/inngest/route.ts`

### Inngest worker DB access (P4)
- The Inngest worker has no user JWT
- It MUST use `SUPABASE_SERVICE_ROLE_KEY` to create the Supabase client
- Using the anon key will silently fail all DB writes due to RLS

### Canvas frame extraction (P5)
- MUST wait for the `seeked` event before drawing to canvas
- Pattern: set `video.currentTime` → await a Promise that resolves on `seeked` → then `canvas.drawImage(video)` → then `canvas.toBlob()`
- Do NOT call `drawImage` immediately after setting `currentTime` — the frame will not be ready

### Claude API frames (P6)
- Convert Supabase Storage frame URLs to base64 before sending to Claude API
- Fetch the image → ArrayBuffer → base64 string
- Do NOT pass raw Supabase Storage URLs to Claude API — it cannot access them

### Frames bucket (P7)
- The `frames` Supabase Storage bucket MUST be PUBLIC
- This allows the Inngest worker to fetch frames without auth headers
- Apply JPEG-only file type restriction and 3MB per-file size limit at the bucket level

### API route authentication (P12)
- Every API route handler (except `/api/inngest`) MUST call `supabase.auth.getUser()`
- Return 401 if user is null — do not rely on RLS alone as the auth check

### redirect() (P10)
- NEVER wrap `redirect()` from `next/navigation` in a try/catch block
- It throws a special Next.js error; catching it causes the redirect to silently fail

## Security Rules

- `.env.local` is NEVER committed to Git
- `.env.example` is committed with empty values only
- The following MUST be server-side only — NEVER prefix with `NEXT_PUBLIC_`:
  - `ANTHROPIC_API_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `INNGEST_SIGNING_KEY`
  - `INNGEST_EVENT_KEY`
- Safe for browser (NEXT_PUBLIC_ is correct):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Database Schema (3 tables)

```sql
profiles (id, display_name, experience_level, goals[], video_consent, consent_given_at, created_at)
analysis_sessions (id, user_id, frame_paths[], frame_count, original_filename, status, error, attempts, queued_at, started_at, completed_at)
analysis_results (id, session_id, user_id, result JSONB, llm_model, frame_count, usefulness_rating, created_at)
```

RLS: `auth.uid() = user_id` on SELECT/INSERT/UPDATE/DELETE for all three tables.

## AI Analysis JSON Schema

The Claude `tool_use` call must enforce this exact schema:

```typescript
{
  overall_quality: "good" | "fair" | "poor"
  confidence: "high" | "medium" | "low"
  video_quality_note: string | null
  observations: Array<{
    area: "overstriding" | "arm_crossing" | "forward_lean" | "head_position" | "foot_strike" | "arm_drive" | "hip_drop" | "vertical_oscillation" | "positive" | "other"
    severity: "positive" | "minor" | "moderate" | "significant"
    description: string  // 1-2 sentences, hedged language ("appears to", "may indicate")
    confidence: "high" | "medium" | "low"
    drill_tags: string[]  // must match tags in /data/drills.json
  }>
  analysis_limitations: string | null
  disclaimer: string
}
```

## API Endpoints

```
GET/PATCH /api/profile
POST      /api/profile/consent
POST      /api/uploads/presign-frames   ← enforces: JPEG only, ≤3MB/frame, ≤15 frames, ≤3 sessions/user/day
POST      /api/uploads/submit
GET       /api/jobs/:session_id
GET       /api/results/:result_id
POST      /api/results/:result_id/rate
GET       /api/history
POST      /api/inngest                  ← Inngest webhook (no JWT auth, uses signing key)
```

## File Structure Conventions

```
/app
  /(auth)/login
  /(auth)/signup
  /onboarding          ← profile + consent
  /upload              ← video uploader
  /sessions/[id]/status ← polling page
  /results/[id]        ← analysis results
  /history             ← past sessions
/api
  /profile/...
  /uploads/...
  /jobs/[id]/...
  /results/[id]/...
  /history/...
  /inngest/...
/lib
  /supabase/server.ts  ← createServerClient factory
  /supabase/client.ts  ← createBrowserClient factory
  /anthropic.ts        ← Claude API call wrapper
  /frames.ts           ← base64 conversion helper
/data
  /drills.json         ← drill library (10-15 drills)
/components
  /VideoUploader.tsx   ← canvas frame extraction
```

## What This App Must NOT Claim

- No injury risk predictions or medical claims
- No precise biomechanics metrics (stride length, ground contact time)
- No guarantee of accuracy
- Every results page must show: "This analysis is AI-generated and intended for educational purposes only. It is not a substitute for advice from a qualified running coach or physiotherapist."

## Build Sequence

Follow these steps in order. Complete and verify each before moving to the next.

1. Scaffold: `next.config.ts`, `tailwind.config.ts`, `package.json`, `.gitignore`, `.env.example`
2. DB schema: `supabase/migrations/001_initial.sql` + RLS policies
3. `middleware.ts` — Supabase session refresh
4. `lib/supabase/server.ts` and `lib/supabase/client.ts`
5. Auth: `/app/(auth)/signup` and `/app/(auth)/login`
6. Onboarding: `/app/onboarding` — profile form + consent gate
7. `components/VideoUploader.tsx` — Canvas extraction + Supabase Storage upload
8. Upload API: `/api/uploads/presign-frames` and `/api/uploads/submit`
9. Mock Inngest worker: `/api/inngest/route.ts` — 5s delay + hardcoded result JSON
10. Status page: `/app/sessions/[id]/status` — polls every 5s, redirects on complete
11. Results page: `/app/results/[id]` — renders JSONB + drill lookup + rating
12. History: `/app/history`
13. Real AI worker: replace mock with Claude API call + Zod validation
14. Error states: failed job UI, retry, low-quality warning
16. Deploy: push to Vercel, configure Inngest App URL in dashboard


Stay focused. Do not build the following, for example:
no raw video upload/storage
no pose estimation
no Python worker
no Redis/BullMQ
no custom JWT auth
no charts/dashboard beyond history list
no admin panel
no email notifications
no payments
