import DrillAnimation from '@/components/DrillAnimation'

const drills = [
  { id: 'high-knees',          label: 'High Knees' },
  { id: 'a-skip',              label: 'A-Skip' },
  { id: 'butt-kicks',          label: 'Butt Kicks' },
  { id: 'arm-drive-drill',     label: 'Arm Drive' },
  { id: 'elbow-angle-check',   label: '90° Elbow Run' },
  { id: 'cadence-builder',     label: 'Cadence Builder' },
  { id: 'short-stride-run',    label: 'Short Stride Run' },
  { id: 'wall-lean-drill',     label: 'Wall Lean' },
  { id: 'posture-tall-run',    label: 'Run Tall' },
  { id: 'gaze-drill',          label: 'Gaze Drill' },
  { id: 'barefoot-strides',    label: 'Barefoot Strides' },
  { id: 'bounding-drill',      label: 'Bounding Drill' },
  { id: 'relaxed-shoulders-run', label: 'Shoulder Drop' },
  { id: 'single-leg-balance',  label: 'Single Leg Balance' },
  { id: 'glute-bridge',        label: 'Glute Bridge' },
]

export default function TestAnimations() {
  return (
    <main className="min-h-screen bg-gray-950 p-8">
      <h1 className="text-white text-2xl font-bold mb-8">Drill Animations</h1>
      <div className="grid grid-cols-3 gap-6 sm:grid-cols-4 lg:grid-cols-5">
        {drills.map(({ id, label }) => (
          <div key={id} className="flex flex-col items-center gap-2 bg-gray-900 rounded-xl p-4">
            <DrillAnimation drillId={id} />
            <span className="text-gray-400 text-xs text-center">{label}</span>
          </div>
        ))}
      </div>
    </main>
  )
}
