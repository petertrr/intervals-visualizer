import { useState, useRef, useEffect } from "react"
import { Scale, Interval } from "tonal"
import VisualizerControls from "./VisualizerControls"

export type Mode = "linear" | "circle"

export default function OctaveVisualizer() {
  const [key, setKey] = useState("C")
  const [mode, setMode] = useState<Mode>("circle")
  const [selectedNotes, setSelectedNotes] = useState<string[]>([])
  const noteRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const scale = Scale.get(`${key}1 major`)
  const notes = scale.notes
  const fullNotes = [
    ...scale.notes,
    ...Scale.get(`${key}2 major`).notes
  ] // two octaves for linear mode

  const handleNoteClick = (note: string) => {
    if (selectedNotes.length >= 2) {
      setSelectedNotes([])
    } else if (selectedNotes.includes(note)) {
      setSelectedNotes(selectedNotes.filter(n => n !== note))
    } else {
      setSelectedNotes([...selectedNotes, note])
    }
  }

  const getClass = (note: string) => {
    if (selectedNotes[0] === note) return "bg-green-200"
    if (selectedNotes[1] === note) return "bg-green-400 text-white"
    return "bg-gray-200"
  }

  const [intervalLabel, setIntervalLabel] = useState<string | null>(null)

  // ⬇️ Positions for line rendering
  const [linePos, setLinePos] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null)

  useEffect(() => {
    if (selectedNotes.length === 2) {
      const el1 = noteRefs.current[selectedNotes[0]]
      const el2 = noteRefs.current[selectedNotes[1]]

      if (el1 && el2) {
        const rect1 = el1.getBoundingClientRect()
        const rect2 = el2.getBoundingClientRect()
        const svg = el1.closest("svg") || el1.closest(".relative") // for fallback
        const svgRect = svg?.getBoundingClientRect() ?? { left: 0, top: 0 }

        setLinePos({
          x1: rect1.left + rect1.width / 2 - svgRect.left,
          y1: rect1.top + rect1.height / 2 - svgRect.top,
          x2: rect2.left + rect2.width / 2 - svgRect.left,
          y2: rect2.top + rect2.height / 2 - svgRect.top,
        })
      }

      setIntervalLabel(selectedNotes[0] + " to " + selectedNotes[1] + ": " + Interval.distance(selectedNotes[0], selectedNotes[1]))
    } else {
      setLinePos(null)
      setIntervalLabel(null)
    }
  }, [selectedNotes, mode])

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
        <div className="relative">
          <div className="flex gap-4 justify-center mt-4">
            {fullNotes.map((note, i) => (
              <div
                key={i}
                ref={el => { noteRefs.current[note] = el }}
                onClick={() => handleNoteClick(note)}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer ${getClass(note)}`}
              >
                {note}
              </div>
            ))}
          </div>
          {linePos && (
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
              <line
                x1={linePos.x1}
                y1={linePos.y1}
                x2={linePos.x2}
                y2={linePos.y2}
                stroke="green"
                strokeWidth="2"
              />
            </svg>
          )}
        </div>
      ) : (
        <div className="relative w-[300px] h-[300px] mx-auto">
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {linePos && (
              <line
                x1={linePos.x1}
                y1={linePos.y1}
                x2={linePos.x2}
                y2={linePos.y2}
                stroke="green"
                strokeWidth="2"
              />
            )}
          </svg>

          {notes.map((note, i) => {
            const angle = (360 / notes.length * i - 90) * Math.PI / 180
            const r = 120
            const x = r * Math.cos(angle) + 150
            const y = r * Math.sin(angle) + 150

            return (
              <div
                key={note}
                ref={el => { 
                  noteRefs.current[note] = el 
                  noteRefs.current[note.substring(0, note.length - 1) + "2"] = el 
                  // FixMe: handle notes from octave 3
                }}
                onClick={() => handleNoteClick(note)}
                className={`absolute w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer ${getClass(note)}`}
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
