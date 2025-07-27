import type { Mode } from "./OctaveVisualizer"

const keys = [
  "C", "G", "D", "A", "E", "B", "F♯", "C♯",
  "F", "B♭", "E♭", "A♭", "D♭", "G♭", "C♭"
]

interface VisualizerControlsProps {
  selectedKey: string
  mode: Mode
  onKeyChange: (key: string) => void
  onModeToggle: () => void
}

export default function VisualizerControls({
  selectedKey,
  mode,
  onKeyChange,
  onModeToggle,
}: VisualizerControlsProps) {
  return (
      <div className="flex items-center justify-between">
        <div className="flex gap-4 items-center">
          <label htmlFor="key" className="text-lg font-medium">Key:</label>
          <select
            id="key"
            value={selectedKey}
            onChange={e => onKeyChange(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {keys.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
        <button
          onClick={onModeToggle}
          className="bg-blue-500 text-white px-4 py-2 rounded shadow"
        >
          Switch to {mode === "circle" ? "Linear" : "Circle"}
        </button>
      </div>
  )
}
