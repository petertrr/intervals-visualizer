import { useState, useRef, useEffect } from "react"
import { Scale, Interval, Chord } from "tonal"
import VisualizerControls, { chords } from "./VisualizerControls"
import { getNoteChain } from "./Notes"

export type Mode = "linear" | "circle"

function getAngle(svg: SVGElement, clientX: number, clientY: number): number {
    const svgRect = svg.getBoundingClientRect()
    const mouseX = clientX - svgRect.left
    const mouseY = clientY - svgRect.top
    return Math.atan2(mouseY - cirleCenter, mouseX - cirleCenter)
}

function getOuterSVG(): SVGElement | null {
  return document.querySelector('.circle-svg');
}

const cirleRadius = 120
const cirleCenter = 150

export default function OctaveVisualizer() {
  const [key, setKey] = useState("C1 major")
  const [mode, setMode] = useState<Mode>("circle")
  const [selectedNotes, setSelectedNotes] = useState<string[]>([])
  const [selectedChord, setSelectedChord] = useState<string | null>(null)
  const noteRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const scale = Scale.get(key)
  const notes = scale.notes
  // Array of distances in semitones between consecutive steps of the scale
  const semitones = scale.intervals.map(i => Interval.get(i).semitones)

  const visibleNotes = notes // first octave, visible
  const invisibleNotes = Scale.get(key.replace("1", "2")).notes // second octave, invisible in circular mode
  const allNotes = [...visibleNotes, ...invisibleNotes]

  const handleNoteClick = (note: string) => {
    if (selectedNotes.length >= 2) {
      setSelectedNotes([])
    } else if (selectedNotes.includes(note)) {
      setSelectedNotes(selectedNotes.filter(n => n !== note))
    } else {
      setSelectedNotes([...selectedNotes, note])
    }

    if (selectedChord != null) {
      setSelectedChord(null)
    }
  }

  const [intervalLabel, setIntervalLabel] = useState<string | null>(null)

  // Add state for dragging and drag angle
  const [dragging, setDragging] = useState(false)
  const [dragStartAngle, setDragStartAngle] = useState<number | null>(null)
  const [dragCurrentAngle, setDragCurrentAngle] = useState<number | null>(null)
  const [dragStartX, setDragStartX] = useState<number | null>(null)
  const [dragCurrentX, setDragCurrentX] = useState<number | null>(null)

  // Chord visualization logic
  let chordNotes: string[] = []
  if (selectedChord) {
    const chordType = chords.get(selectedChord) || selectedChord
    for (const note of notes) {
      const chord = Chord.getChord(chordType, note)
      if (!chord.empty) {
        let curChordNotes = Chord.notes(chord.type, note)
        if (curChordNotes.every(n => allNotes.includes(n))) {
          chordNotes = curChordNotes
          break
        }
      }
    }
    if (chordNotes.length === 0) {
//      alert(`Could not build ${selectedChord} in ${key} scale within 1 octave (switch to linear mode?)`)
    }
  }

  // Handler for starting drag on a line segment
  const handleLineDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    if (selectedNotes.length < 2 && chordNotes.length === 0) {
      return
    }

    setDragging(true)
    if (mode === "linear") {
      setDragStartX(e.clientX)
      setDragCurrentX(e.clientX)
    } else {
      const svg = getOuterSVG()
      if (!svg) return
      const angle = getAngle(svg, e.clientX, e.clientY)
      setDragStartAngle(angle)
      setDragCurrentAngle(angle)
    }
  }

  // Handler for dragging
  const handleLineDragMove = (e: React.MouseEvent) => {
    if (!dragging) return
    if (mode === "linear") {
      if (dragStartX === null) return
      setDragCurrentX(e.clientX)
    } else {
      if (dragStartAngle === null) return
      const svg = getOuterSVG()
      if (!svg) return
      const angle = getAngle(svg, e.clientX, e.clientY)
      setDragCurrentAngle(angle)
    }
  }

  const handleLineDragEnd = () => {
    setDragging(false)
    setDragStartAngle(null)
    setDragCurrentAngle(null)
    setDragStartX(null)
    setDragCurrentX(null)
  }

  /**
   * Highlight selected notes green
   */
  const getClass = (note: string) => {
    if (selectedNotes[0] === note) return "bg-green-200"
    if (selectedNotes[1] === note) return "bg-green-400 text-white"
    return "bg-gray-200"
  }

  useEffect(() => {
    let chain: string[] = []
    if (selectedChord && chordNotes.length > 0) {
      chain = chordNotes
    } else if (selectedNotes.length === 2) {
      chain = getNoteChain(selectedNotes[0], selectedNotes[1], allNotes)
    }
    if (chain.length >= 2) {
      setIntervalLabel(chain[0] + " to " + chain[chain.length - 1] + ": " + Interval.distance(chain[0], chain[chain.length - 1]))
    } else {
      setIntervalLabel(null)
    }
  }, [selectedNotes, selectedChord, mode, key, dragging, dragStartAngle, dragCurrentAngle])

  return (
    <div className="p-6 space-y-6">
      <VisualizerControls
        selectedKey={key}
        mode={mode}
        selectedChord={selectedChord}
        onKeyChange={setKey}
        onModeToggle={() => setMode(mode === "circle" ? "linear" : "circle")}
        onChordChange={c => {
          setSelectedChord(c || null)
          if (c != null) {
            setSelectedNotes([])
          }
        }}
      />

      {intervalLabel && (
        <div className="text-center text-lg font-semibold text-blue-600">
          Interval: {intervalLabel}
        </div>
      )}

      {mode === "linear" ? (
        <div className="relative" style={{ minHeight: '120px' }}
            onMouseMove={handleLineDragMove}
            onMouseUp={handleLineDragEnd}
            onMouseLeave={handleLineDragEnd}
            >
          {/* SVG for green line and chain nodes */}
          <svg
            className="absolute top-0 left-0 w-full h-24 pointer-events-auto"
            width="100%"
            height="96"
            viewBox={`0 0 ${window.innerWidth} 96`}
            style={{ width: '100vw', left: 0 }}
          >
            {/* Draw green line for chain */}
            {(() => {
              const chain = selectedChord ? chordNotes : selectedNotes
              if (chain.length < 2) return null
              // Calculate positions for all notes in chain
              const totalWidth = window.innerWidth
              const margin = 40
              const step = (totalWidth - 2 * margin) / (allNotes.length - 1)
              let xOffset = 0
              if (dragging && dragStartX !== null && dragCurrentX !== null) {
                xOffset = dragCurrentX - dragStartX
              }
              const positions = chain.map(note => {
                const idx = allNotes.findIndex(n => n === note)
                return {
                  x: margin + idx * step + xOffset,
                  y: 60,
                }
              })
              // Draw green line
              const path = positions.length > 1
                ? `M ${positions[0].x} ${positions[0].y} ` + positions.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
                : null
              return path ? (
                <path
                  d={path}
                  stroke="green"
                  strokeWidth={6}
                  fill="none"
                  onMouseDown={handleLineDragStart}
                />
              ) : null
            })()}
            {/* Draw chain nodes as circles */}
            {(() => {
              const chain = selectedChord ? chordNotes : selectedNotes
              if (chain.length < 2) return null
              
              const totalWidth = window.innerWidth
              const margin = 40
              const step = (totalWidth - 2 * margin) / (allNotes.length - 1)
              let xOffset = 0
              if (dragging && dragStartX !== null && dragCurrentX !== null) {
                xOffset = dragCurrentX - dragStartX
              }
              return chain.map((note, i) => {
                const idx = allNotes.findIndex(n => n === note)
                const x = margin + idx * step + xOffset
                const y = 60
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
                  return (
                    <circle
                      key={note}
                      cx={x}
                      cy={y}
                      r={26}
                      stroke="gray"
                      strokeWidth={4}
                      fill="#eee"
                    />
                  )
                }
              })
            })()}
          </svg>
          {/* Draw notes above chain nodes */}
          <div className="flex gap-4 justify-center mt-4" style={{ position: 'relative', width: '100vw' }}>
            {allNotes.map((note, i) => {
              const totalWidth = window.innerWidth
              const margin = 40
              const step = (totalWidth - 2 * margin) / (allNotes.length - 1)
              let xOffset = 0
              const x = margin + i * step + xOffset
              return (
                <div
                  key={i}
                  ref={el => { noteRefs.current[note] = el }}
                  onClick={() => handleNoteClick(note)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer ${getClass(note)}`}
                  style={{ position: 'absolute', left: x - 24, top: 36, zIndex: 2 }}
                >
                  {note}
                </div>
              )
            })}
          </div>
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
            {/* Draw chain as a continuous arc */}
            {(() => {
              const chain = selectedChord ? chordNotes : selectedNotes
              if (chain.length < 2) return null

              const r = cirleRadius
              const centerX = cirleCenter

              // Get start and end angles
              let offset = 0
              if (dragging && dragStartAngle !== null && dragCurrentAngle !== null) {
                offset = dragCurrentAngle - dragStartAngle
              }
              const idxStart = allNotes.findIndex(n => n === chain[0])
              const idxEnd = allNotes.findIndex(n => n === chain[chain.length - 1])
              if (idxStart === -1 || idxEnd === -1) return null
              const semitoneIdxStart = idxStart % semitones.length
              const semitoneIdxEnd = idxEnd % semitones.length
              const angleStart = (360 / 12 * semitones[semitoneIdxStart] - 90) * Math.PI / 180 + offset
              let angleEnd = (360 / 12 * semitones[semitoneIdxEnd] - 90) * Math.PI / 180 + offset
              if (idxEnd / semitones.length > 0) {
                // end is in the next octave
                angleEnd += 2 * Math.PI
              }

              // Large arc flag: always 0 for minor arc, 1 for major arc
              const arcSweep = Math.abs(angleEnd - angleStart) > Math.PI ? 1 : 0
              // SVG arc path
              const x1 = r * Math.cos(angleStart) + centerX
              const y1 = r * Math.sin(angleStart) + centerX
              const x2 = r * Math.cos(angleEnd) + centerX
              const y2 = r * Math.sin(angleEnd) + centerX
              const path = `M ${x1} ${y1} A ${r} ${r} 0 ${arcSweep} 1 ${x2} ${y2}`
              return (
                <path
                  d={path}
                  stroke="green"
                  strokeWidth={6}
                  fill="none"
                  onMouseDown={handleLineDragStart}
                />
              )
            })()}
            {/* Draw chain nodes as circles */}
            {(() => {
              const chain = selectedChord ? chordNotes : selectedNotes
              if (chain.length < 2) return null

              const r = cirleRadius
              const centerX = cirleCenter
              return chain.map((note, i) => {
                const idx = allNotes.findIndex(n => n === note)
                if (idx === -1) return null
                let offset = 0
                if (dragging && dragStartAngle !== null && dragCurrentAngle !== null) {
                  offset = dragCurrentAngle - dragStartAngle
                }
                const semitoneIdx = idx % semitones.length
                const angle = (360 / 12 * semitones[semitoneIdx] - 90) * Math.PI / 180 + offset
                const x = r * Math.cos(angle) + centerX
                const y = r * Math.sin(angle) + centerX
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
                  return (
                    <circle
                      key={note}
                      cx={x}
                      cy={y}
                      r={26}
                      stroke="gray"
                      strokeWidth={4}
                      fill="#eee"
                    />
                  )
                }
              })
            })()}
          </svg>
          {/* Draw notes above chain nodes */}
          {visibleNotes.map((note, i) => {
            const angle = (360 / 12 * semitones[i] - 90) * Math.PI / 180
            const r = cirleRadius
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
