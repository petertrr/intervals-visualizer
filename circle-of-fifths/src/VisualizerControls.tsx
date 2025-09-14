import type { Mode } from "./OctaveVisualizer"

const keys = [
  "C", "D", "E", "F", "G", "A", "H"
]

const allKeys = keys.flatMap(key => [key, key + "#", key + "b"]).flatMap(key => [key + "1 major", key + "1 minor"])

export const chords = new Map<string, string>([
  ["major triad", "major"],
  ["minor triad", "minor"],
  ["dominant seventh", "maj7"]
])

interface VisualizerControlsProps {
  selectedKey: string
  mode: Mode
  selectedChord: string | null
  onKeyChange: (key: string) => void
  onModeToggle: () => void
  onChordChange: (chord: string) => void
}

export default function VisualizerControls({
  selectedKey,
  mode,
  selectedChord,
  onKeyChange,
  onModeToggle,
  onChordChange,
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
          <label htmlFor="chord" className="text-lg font-medium">Chord:</label>
          <select
            id="chord"
            value={selectedChord || ""}
            onChange={e => onChordChange(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">None</option>
            {[...chords.keys()].map(c => (
              <option key={c} value={c}>{c}</option>
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
