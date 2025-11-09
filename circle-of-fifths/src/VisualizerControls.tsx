import { VisualizationMode } from "./types/music"
import { ALL_KEYS, CHORD_TYPES } from "./constants/music"

interface VisualizerControlsProps {
  selectedKey: string
  mode: VisualizationMode
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
            {ALL_KEYS.map(k => (
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
            {[...CHORD_TYPES.keys()].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <button
          onClick={onModeToggle}
          className="bg-blue-500 text-white px-4 py-2 rounded shadow"
        >
          Switch to {mode === VisualizationMode.CIRCLE ? "Linear" : "Circle"}
        </button>
      </div>
  )
}
