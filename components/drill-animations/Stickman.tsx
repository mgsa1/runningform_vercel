// Segmented stickman: each limb has two bones joined at an articulated joint.
// SVG transform="translate" places each joint's origin at (0,0) in local space.
// CSS transform: rotate() + transformOrigin: "0px 0px" rotates around that joint.
// Shin/forearm rotations are relative to their parent segment — this means
// a shin class of rotate(-60deg) = 60° of knee flexion regardless of thigh angle.

interface StickmanProps {
  leftThighClass?: string
  rightThighClass?: string
  leftShinClass?: string
  rightShinClass?: string
  leftUpperArmClass?: string
  rightUpperArmClass?: string
  leftForearmClass?: string
  rightForearmClass?: string
  // Lean the whole figure forward (degrees, +ve = forward tilt)
  bodyLean?: number
}

const STROKE = 'currentColor'
const SW = 3
const CAP = 'round' as const

// Anatomy constants (px, SVG userspace)
const THIGH = 22
const SHIN  = 20
const UARM  = 14
const FARM  = 13

export default function Stickman({
  leftThighClass,
  rightThighClass,
  leftShinClass,
  rightShinClass,
  leftUpperArmClass,
  rightUpperArmClass,
  leftForearmClass,
  rightForearmClass,
  bodyLean = 0,
}: StickmanProps) {
  const lineProps = { stroke: STROKE, strokeWidth: SW, strokeLinecap: CAP }

  return (
    <svg
      viewBox="0 0 60 110"
      width="60"
      height="110"
      fill="none"
      aria-hidden="true"
      style={{ color: '#9ca3af' /* gray-400 */ }}
    >
      {/* Optional whole-body lean (e.g. WallLean) */}
      <g transform={bodyLean !== 0 ? `rotate(${bodyLean} 30 57)` : undefined}>

        {/* ── Head ── */}
        <circle cx="30" cy="9" r="8" stroke={STROKE} strokeWidth={SW} />

        {/* ── Torso ── */}
        <line x1="30" y1="17" x2="30" y2="57" {...lineProps} />

        {/* ── Left arm ── shoulder at (30, 27) */}
        <g transform="translate(30, 27)">
          <g style={{ transformOrigin: '0px 0px' }} className={leftUpperArmClass}>
            <line x1="0" y1="0" x2={-UARM} y2={UARM} {...lineProps} />
            <g transform={`translate(${-UARM}, ${UARM})`}>
              <g style={{ transformOrigin: '0px 0px' }} className={leftForearmClass}>
                <line x1="0" y1="0" x2={-FARM * 0.5} y2={FARM} {...lineProps} />
              </g>
            </g>
          </g>
        </g>

        {/* ── Right arm ── shoulder at (30, 27) */}
        <g transform="translate(30, 27)">
          <g style={{ transformOrigin: '0px 0px' }} className={rightUpperArmClass}>
            <line x1="0" y1="0" x2={UARM} y2={UARM} {...lineProps} />
            <g transform={`translate(${UARM}, ${UARM})`}>
              <g style={{ transformOrigin: '0px 0px' }} className={rightForearmClass}>
                <line x1="0" y1="0" x2={FARM * 0.5} y2={FARM} {...lineProps} />
              </g>
            </g>
          </g>
        </g>

        {/* ── Left leg ── hip at (30, 57) */}
        <g transform="translate(30, 57)">
          <g style={{ transformOrigin: '0px 0px' }} className={leftThighClass}>
            <line x1="0" y1="0" x2="0" y2={THIGH} {...lineProps} />
            <g transform={`translate(0, ${THIGH})`}>
              <g style={{ transformOrigin: '0px 0px' }} className={leftShinClass}>
                <line x1="0" y1="0" x2="0" y2={SHIN} {...lineProps} />
              </g>
            </g>
          </g>
        </g>

        {/* ── Right leg ── hip at (30, 57) */}
        <g transform="translate(30, 57)">
          <g style={{ transformOrigin: '0px 0px' }} className={rightThighClass}>
            <line x1="0" y1="0" x2="0" y2={THIGH} {...lineProps} />
            <g transform={`translate(0, ${THIGH})`}>
              <g style={{ transformOrigin: '0px 0px' }} className={rightShinClass}>
                <line x1="0" y1="0" x2="0" y2={SHIN} {...lineProps} />
              </g>
            </g>
          </g>
        </g>

      </g>
    </svg>
  )
}
