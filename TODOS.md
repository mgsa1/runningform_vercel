# TODOs

- [x] Constrain Claude's system prompt so it can only recommend drills from the existing drill library (`data/drills.json`), rather than inventing arbitrary drill names — done via tool schema enum in `lib/workers/analysis.ts` (commit `ba85af9`)
- [ ] Milestones: replace score-band milestones (Score 60+/75+/90+) with behavior/outcome milestones — "Consistent" (3 analyses in a month), "Fixed it" (trait moves critical→good), "Dedicated" (10 drills practiced), "Strong foundation" (all traits green in one analysis)
- [ ] Lightweight drill correlation on results page (no new DB tables): after the 2nd+ analysis, check if drills recommended in the prior session correspond to traits that improved — show a celebration card "You improved [trait] — keep up the [Drill Name] work"
- [ ] Share card: "Share your progress" button on results page generating an OG-style image (score ring, delta, one-line headline) using `@vercel/og`
- [ ] Ingest Strava / Garmin history to build a runner profile ahead of analysing the frames with Claude. Confirm how much this would improve the analysis