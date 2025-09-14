import { useState, useRef, useEffect } from "react"
import { Scale, Interval } from "tonal"
import VisualizerControls from "./VisualizerControls"
import { getNoteChain } from "./Notes"

export type Mode = "linear" | "circle"

function getAngle(svg: SVGElement, clientX: number, clientY: number): number {
    const svgRect = svg.getBoundingClientRect()
    const centerX = 150, centerY = 150
    const mouseX = clientX - svgRect.left
    const mouseY = clientY - svgRect.top
    return Math.atan2(mouseY - centerY, mouseX - centerX)
}

function getOuterSVG(): SVGElement | null {
  return document.querySelector('.circle-svg') as SVGElement | null;
}

export default function OctaveVisualizer() {
  const [key, setKey] = useState("C")
  const [mode, setMode] = useState<Mode>("circle")
  const [selectedNotes, setSelectedNotes] = useState<string[]>([])
  const noteRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const scale = Scale.get(`${key}1 major`)
  const notes = scale.notes
  const semitones = scale.intervals.map(i => Interval.get(i).semitones)
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

  const [intervalLabel, setIntervalLabel] = useState<string | null>(null)

  // Coordinates of points (i.e. notes) which should be connected with a line
  const [linePos, setLinePos] = useState<Array<{ x1: number, y1: number, x2: number, y2: number }>>([])

  // Add state for dragging and drag angle
  const [dragging, setDragging] = useState(false)
  const [dragStartAngle, setDragStartAngle] = useState<number | null>(null)
  const [dragCurrentAngle, setDragCurrentAngle] = useState<number | null>(null)

  // Handler for starting drag on a line segment
  const handleLineDragStart = (e: React.MouseEvent, segmentIndex: number) => {
    e.preventDefault()
    if (mode !== "circle" || selectedNotes.length < 2) {
      // TODO: linear mode
      return
    }
    setDragging(true)
    // Always use the outer SVG element
    const svg = getOuterSVG()
    if (!svg) return
    const angle = getAngle(svg, e.clientX, e.clientY)
    setDragStartAngle(angle)
    setDragCurrentAngle(angle)
  }

  // Handler for dragging
  const handleLineDragMove = (e: React.MouseEvent) => {
    if (!dragging || dragStartAngle === null) return
    const svg = getOuterSVG()
    if (!svg) return
    const angle = getAngle(svg, e.clientX, e.clientY)
    setDragCurrentAngle(angle)
  }

  const handleLineDragEnd = () => {
    setDragging(false)
    setDragStartAngle(null)
    setDragCurrentAngle(null)
  }

  const getClass = (note: string) => {
    if (selectedNotes[0] === note) return "bg-green-200"
    if (selectedNotes[1] === note) return "bg-green-400 text-white"
    return "bg-gray-200"
  }

  useEffect(() => {
    const chain = (selectedNotes.length === 2 ? getNoteChain(selectedNotes[0], selectedNotes[1], mode === "linear" ? fullNotes : notes) : [])
    if (chain.length >= 2) {
      let positions: Array<{ x: number, y: number }> = []
      if (mode === "linear") {
        chain.forEach(note => {
          const el = noteRefs.current[note]
          if (el) {
            const rect = el.getBoundingClientRect()
            const svg = el.closest("svg") || el.closest(".relative")
            const svgRect = svg?.getBoundingClientRect() ?? { left: 0, top: 0 }
            positions.push({
              x: rect.left + rect.width / 2 - svgRect.left,
              y: rect.top + rect.height / 2 - svgRect.top,
            })
          }
        })
      } else {
        const r = 120
        const centerX = 150, centerY = 150
        let offset = 0
        if (dragging && dragStartAngle !== null && dragCurrentAngle !== null) {
          offset = dragCurrentAngle - dragStartAngle
        }
        chain.forEach(note => {
          const i = notes.findIndex(n => n === note)
          if (i !== -1) {
            const angle = (360 / 12 * semitones[i] - 90) * Math.PI / 180 + offset
            positions.push({
              x: r * Math.cos(angle) + centerX,
              y: r * Math.sin(angle) + centerY,
            })
          }
        })
      }
      // Build line segments between consecutive positions
      const segments = []
      for (let i = 0; i < positions.length - 1; ++i) {
        segments.push({
          x1: positions[i].x,
          y1: positions[i].y,
          x2: positions[i + 1].x,
          y2: positions[i + 1].y,
        })
      }
      setLinePos(segments)
      setIntervalLabel(chain[0] + " to " + chain[chain.length - 1] + ": " + Interval.distance(chain[0], chain[chain.length - 1]))
    } else {
      setLinePos([])
      setIntervalLabel(null)
    }
  }, [selectedNotes, mode, key, dragging, dragStartAngle, dragCurrentAngle]) // note: dependencies should (mostly) only contain state values

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
            <svg
              className="absolute top-0 left-0 w-full h-full pointer-events-auto"
            >
              {linePos.map((seg, i) => (
                <line
                  key={i}
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  stroke={"gray"}
                  strokeWidth="2"
                  onMouseDown={e => handleLineDragStart(e, i)}
                  style={{ cursor: "grab" }}
                />
              ))}
            </svg>
          )}
        </div>
      ) : (
        <div className="relative w-[300px] h-[300px] mx-auto"
            onMouseMove={handleLineDragMove}
            onMouseUp={handleLineDragEnd}
            onMouseLeave={handleLineDragEnd}
        >
          <svg
            className="absolute top-0 left-0 w-full h-full pointer-events-auto circle-svg"
          >
            {linePos && linePos.map((seg, i) => (
              <line
                key={i}
                x1={seg.x1}
                y1={seg.y1}
                x2={seg.x2}
                y2={seg.y2}
                stroke={"gray"}
                strokeWidth="2"
                onMouseDown={e => handleLineDragStart(e, i)}
                style={{ cursor: "grab" }}
              />
            ))}
            {/* Draw chain nodes as circles */}
            {(() => {
              const chain = (selectedNotes.length === 2 ? getNoteChain(selectedNotes[0], selectedNotes[1], notes) : [])
              if (chain.length < 2) return null
              const r = 120
              const centerX = 150, centerY = 150
              return chain.map((note, i) => {
                const idx = notes.findIndex(n => n === note)
                if (idx === -1) return null
                let offset = 0
                if (dragging && dragStartAngle !== null && dragCurrentAngle !== null) {
                  offset = dragCurrentAngle - dragStartAngle
                }
                const angle = (360 / 12 * semitones[idx] - 90) * Math.PI / 180 + offset
                const x = r * Math.cos(angle) + centerX
                const y = r * Math.sin(angle) + centerY
                // Outer nodes: first and last
                if (i === 0 || i === chain.length - 1) {
                  return (
                    <circle
                      key={note}
                      cx={x}
                      cy={y}
                      r={26}
                      stroke="green"
                      strokeWidth={6}
                      fill="white"
                    />
                  )
                } else {
                  // Inner nodes: small and grey
                  return (
                    <circle
                      key={note}
                      cx={x}
                      cy={y}
                      r={12}
                      stroke="gray"
                      strokeWidth={2}
                      fill="#eee"
                    />
                  )
                }
              })
            })()}
          </svg>
          {/* Draw notes above chain nodes */}
          {notes.map((note, i) => {
            const angle = (360 / 12 * semitones[i] - 90) * Math.PI / 180
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
                style={{ left: x, top: y, transform: "translate(-50%, -50%)", zIndex: 2 }}
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
