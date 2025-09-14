import type { Mode } from "./OctaveVisualizer"

const keys = [
  "C", "D", "E", "F", "G", "A", "H"
]

const allKeys = keys.flatMap(key => [key, key + "#", key + "b"]).flatMap(key => [key + "1 major", key + "1 minor"])

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
            {allKeys.map(k => (
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
