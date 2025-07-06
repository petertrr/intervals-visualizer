import { useState } from "react"
import { Interval, Scale, Key } from "tonal"

const keys = [
  "C", "G", "D", "A", "E", "B", "F♯", "C♯",
  "F", "B♭", "E♭", "A♭", "D♭", "G♭", "C♭"
]

type Mode = "linear" | "circle"

interface VisualizerControlsProps {
  selectedKey: string
  mode: Mode
  onKeyChange: (key: string) => void
  onModeToggle: () => void
}

function VisualizerControls({
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

export default function OctaveVisualizer() {
  const [key, setKey] = useState("C")
  const [mode, setMode] = useState<Mode>("circle")
  const [selectedNotes, setSelectedNotes] = useState<string[]>([])

  const notes = Scale.get(`${key} major`).notes
  const fullNotes = [...notes, ...notes] // two octaves

  const handleNoteClick = (note: string) => {
    if (selectedNotes.length >= 2) {
      setSelectedNotes([note])
    } else if (selectedNotes.includes(note)) {
      setSelectedNotes(selectedNotes.filter(n => n !== note))
    } else {
      setSelectedNotes([...selectedNotes, note])
    }
  }

  const getClass = (note: string) => {
    return selectedNotes.includes(note)
      ? "bg-blue-400 text-white"
      : "bg-gray-200"
  }

  const intervalLabel = selectedNotes.length === 2
    ? Interval.distance(selectedNotes[0], selectedNotes[1])
    : null

  return (
    <div className="p-6 space-y-6">
      <VisualizerControls
        selectedKey={key}
        mode={mode}
        onKeyChange={setKey}
        onModeToggle={() => setMode(mode === "circle" ? "linear" : "circle")}
      />

      {intervalLabel && (
        <div className="text-center text-lg font-semibold text-blue-600">
          Interval: {intervalLabel}
        </div>
      )}

      {mode === "linear" ? (
        <div className="flex gap-4 justify-center mt-4">
          {fullNotes.map((note, i) => (
            <div
              key={i}
              onClick={() => handleNoteClick(note)}
              className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium"
            >
              {note}
            </div>
          ))}
        </div>
      ) : (
        <div className="relative w-[300px] h-[300px] mx-auto">
          {notes.map((note, i) => {
            const angle = (360 / notes.length) * i
            const rad = (angle * Math.PI) / 180
            const r = 120
            const x = r * Math.cos(rad) + 150
            const y = r * Math.sin(rad) + 150

            return (
              <div
                key={note}
                className="absolute w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium"
                style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
              >
                {note}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
