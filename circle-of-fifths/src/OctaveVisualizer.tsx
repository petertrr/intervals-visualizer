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
  
  // Add state for hover effects and magnetic attraction
  const [hoveredElement, setHoveredElement] = useState<string | null>(null)

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
    setHoveredElement(null) // Clear hover state when dragging starts
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
              const chainSemitones = chain.map(note => {
                const idx = allNotes.findIndex(n => n === note)
                let semi = semitones[idx % semitones.length]
                if (idx >= semitones.length) {
                  semi += semitones[semitones.length - 1]
                }
                return semi
              })
              // Calculate positions for all notes in chain using semitonal distances
              const totalWidth = window.innerWidth
              const margin = 40
              const widthSemi = 24 // 24 semitones in two scales
              let xOffset = 0
              if (dragging && dragStartX !== null && dragCurrentX !== null) {
                xOffset = dragCurrentX - dragStartX
              }
              const positions = chainSemitones.map((semi, _) => {
                return {
                  x: margin + semi * 1.0 / widthSemi * (totalWidth - 2 * margin) + xOffset,
                  y: 60,
                }
              })
              // Draw green line
              const path = positions.length > 1
                ? `M ${positions[0].x + 6} ${positions[0].y} ` + positions.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
                : null
              return path ? (
                <g>
                  {/* Invisible wider hit area for easier interaction */}
                  <path
                    d={path}
                    stroke="transparent"
                    strokeWidth={20}
                    fill="none"
                    onMouseDown={handleLineDragStart}
                    onMouseEnter={() => setHoveredElement("line")}
                    onMouseLeave={() => setHoveredElement(null)}
                    style={{ cursor: "grab" }}
                  />
                  {/* Visible line with hover effects */}
                  <path
                    d={path}
                    stroke="green"
                    strokeWidth={hoveredElement === "line" ? 8 : 6}
                    fill="none"
                    onMouseDown={handleLineDragStart}
                    onMouseEnter={() => setHoveredElement("line")}
                    onMouseLeave={() => setHoveredElement(null)}
                    style={{ cursor: "grab", pointerEvents: "none" }}
                  />
                </g>
              ) : null
            })()}
            {/* Draw chain nodes as circles */}
            {(() => {
              const chain = selectedChord ? chordNotes : selectedNotes
              if (chain.length < 2) return null
              // Get semitone indices for chain notes
              const chainSemitones = chain.map(note => {
                const idx = allNotes.findIndex(n => n === note)
                let semi = semitones[idx % semitones.length]
                if (idx >= semitones.length) {
                  semi += semitones[semitones.length - 1]
                }
                return semi
              })
              const totalWidth = window.innerWidth
              const margin = 40
              let xOffset = 0
              if (dragging && dragStartX !== null && dragCurrentX !== null) {
                xOffset = dragCurrentX - dragStartX
              }
              return chain.map((note, i) => {
                const x = margin + chainSemitones[i] * 1.0 / 24 * (totalWidth - 2 * margin) + xOffset
                const y = 60
                if (i === 0 || i === chain.length - 1) {
                  return (
                    <circle
                      key={note}
                      cx={x}
                      cy={y}
                      r={hoveredElement === `linear-circle-${note}` ? 28 : 26}
                      stroke="green"
                      strokeWidth={hoveredElement === `linear-circle-${note}` ? 8 : 6}
                      fill="white"
                      onMouseDown={handleLineDragStart}
                      onMouseEnter={() => setHoveredElement(`linear-circle-${note}`)}
                      onMouseLeave={() => setHoveredElement(null)}
                      style={{ cursor: "grab" }}
                    />
                  )
                } else {
                  return (
                    <circle
                      key={note}
                      cx={x}
                      cy={y}
                      r={hoveredElement === `linear-circle-${note}` ? 28 : 26}
                      stroke={hoveredElement === `linear-circle-${note}` ? "green" : "gray"}
                      strokeWidth={hoveredElement === `linear-circle-${note}` ? 6 : 4}
                      fill="#eee"
                      onMouseDown={handleLineDragStart}
                      onMouseEnter={() => setHoveredElement(`linear-circle-${note}`)}
                      onMouseLeave={() => setHoveredElement(null)}
                      style={{ cursor: "grab" }}
                    />
                  )
                }
              })
            })()}
          {/* Draw notes above chain nodes */}
            {allNotes.map((note, idx) => {
              // semitonal distance from start
              let semi = semitones[idx % semitones.length]
              if (idx >= semitones.length) {
                semi += semitones[semitones.length - 1]
              }
              const totalWidth = window.innerWidth
              const margin = 40.0
              // Find min/max for normalization
              const maxCumSemi = 24
              const x = margin + semi * 1.0 / maxCumSemi * (totalWidth - 2 * margin)
              const y = 60
              
              // Check if this note is part of the current chain
              const currentChain = selectedChord ? chordNotes : selectedNotes
              const isInChain = currentChain.includes(note)
              const isHovered = hoveredElement === `linear-note-${note}`
              
              return (
                <g key={note}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered && isInChain ? 26 : 24}
                    fill={"lightgray"} // todo: use getClass(note) to get correct colors if a note is selected
                    stroke={isHovered && isInChain ? "green" : "green"}
                    strokeWidth={isHovered && isInChain ? 3 : 0}
                    style={{ cursor: isInChain ? "grab" : "pointer" }}
                    onClick={() => handleNoteClick(note)}
                    onMouseDown={isInChain ? handleLineDragStart : undefined}
                    onMouseEnter={() => isInChain ? setHoveredElement(`linear-note-${note}`) : undefined}
                    onMouseLeave={() => isInChain ? setHoveredElement(null) : undefined}
                  />
                  <text
                    x={x}
                    y={y + 6}
                    textAnchor="middle"
                    fontSize={16}
                    fill={"gray"}
                    style={{ pointerEvents: "none", fontWeight: "bold" }}
                  >
                    {note}
                  </text>
                </g>
              )
            })}
          </svg>
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
                <g>
                  {/* Invisible wider hit area for easier interaction */}
                  <path
                    d={path}
                    stroke="transparent"
                    strokeWidth={20}
                    fill="none"
                    onMouseDown={handleLineDragStart}
                    onMouseEnter={() => setHoveredElement("arc")}
                    onMouseLeave={() => setHoveredElement(null)}
                    style={{ cursor: "grab" }}
                  />
                  {/* Visible arc with hover effects */}
                  <path
                    d={path}
                    stroke="green"
                    strokeWidth={hoveredElement === "arc" ? 8 : 6}
                    fill="none"
                    onMouseDown={handleLineDragStart}
                    onMouseEnter={() => setHoveredElement("arc")}
                    onMouseLeave={() => setHoveredElement(null)}
                    style={{ cursor: "grab", pointerEvents: "none" }}
                  />
                </g>
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
                      r={hoveredElement === `circle-circle-${note}` ? 28 : 26}
                      stroke="green"
                      strokeWidth={hoveredElement === `circle-circle-${note}` ? 8 : 6}
                      fill="white"
                      onMouseDown={handleLineDragStart}
                      onMouseEnter={() => setHoveredElement(`circle-circle-${note}`)}
                      onMouseLeave={() => setHoveredElement(null)}
                      style={{ cursor: "grab" }}
                    />
                  )
                } else {
                  return (
                    <circle
                      key={note}
                      cx={x}
                      cy={y}
                      r={hoveredElement === `circle-circle-${note}` ? 28 : 26}
                      stroke={hoveredElement === `circle-circle-${note}` ? "green" : "gray"}
                      strokeWidth={hoveredElement === `circle-circle-${note}` ? 6 : 4}
                      fill="#eee"
                      onMouseDown={handleLineDragStart}
                      onMouseEnter={() => setHoveredElement(`circle-circle-${note}`)}
                      onMouseLeave={() => setHoveredElement(null)}
                      style={{ cursor: "grab" }}
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
            
            // Check if this note is part of the current chain
            const currentChain = selectedChord ? chordNotes : selectedNotes
            const isInChain = currentChain.includes(note) || currentChain.includes(note.substring(0, note.length - 1) + "2")
            const isHovered = hoveredElement === `note-${note}`
            
            return (
              <div
                key={note}
                ref={el => { 
                  noteRefs.current[note] = el 
                  noteRefs.current[note.substring(0, note.length - 1) + "2"] = el 
                  // FixMe: handle notes from octave 3
                }}
                onClick={() => handleNoteClick(note)}
                onMouseDown={isInChain ? handleLineDragStart : undefined}
                onMouseEnter={() => isInChain ? setHoveredElement(`note-${note}`) : undefined}
                onMouseLeave={() => isInChain ? setHoveredElement(null) : undefined}
                className={`absolute w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer ${getClass(note)}`}
                style={{ 
                  left: x, 
                  top: y, 
                  transform: `translate(-50%, -50%) ${isHovered ? 'scale(1.1)' : 'scale(1)'}`, 
                  zIndex: isHovered ? 3 : 2,
                  cursor: isInChain ? "grab" : "pointer",
                  transition: "transform 0.1s ease",
                  boxShadow: isHovered && isInChain ? "0 0 8px rgba(34, 197, 94, 0.5)" : "none"
                }}
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
