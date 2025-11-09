import { useEffect } from "react"
import { Scale, Interval, Chord } from "tonal"
import VisualizerControls from "./VisualizerControls"
import { getNoteChain } from "./Notes"
import { useVisualizerState } from "./hooks/useVisualizerState"
import { calculateAngleFromEvent } from "./utils/noteCalculations"
import type { Note } from "./types/music"
import { VisualizationMode } from "./types/music"
import { CIRCLE_GEOMETRY, LINEAR_GEOMETRY, CHORD_TYPES, SIZES } from "./constants/music"

function getOuterSVG(): SVGElement | null {
  return document.querySelector('.circle-svg');
}

export default function OctaveVisualizer() {
  const visualizerState = useVisualizerState()
  const { key, mode, selectedNotes, selectedChord, intervalLabel, dragState, hoverState } = visualizerState
  const { setIntervalLabel, setDragState, setHoverState, handleNoteClick: onNoteClick } = visualizerState

  const scale = Scale.get(key)
  const notes = scale.notes
  const semitones = scale.intervals.map(i => Interval.get(i).semitones)

  const visibleNotes = notes
  const invisibleNotes = Scale.get(key.replace("1", "2")).notes
  const allNotes = [...visibleNotes, ...invisibleNotes]

  const allNotesWithType: Note[] = allNotes.map((name, idx) => ({
    name,
    octave: idx >= notes.length ? 2 : 1,
    semitone: semitones[idx % semitones.length] + (idx >= notes.length ? 12 : 0),
  }))

  let chordNotes: string[] = []
  if (selectedChord) {
    const chordType = CHORD_TYPES.get(selectedChord) || selectedChord
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
  }

  const handleLineDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    if (selectedNotes.length < 2 && chordNotes.length === 0) {
      return
    }

    setHoverState({ element: null, note: null })
    if (mode === VisualizationMode.LINEAR) {
      setDragState({
        isDragging: true,
        startX: e.clientX,
        currentX: e.clientX,
        startAngle: null,
        currentAngle: null,
      })
    } else {
      const svg = getOuterSVG()
      if (!svg) return
      const angle = calculateAngleFromEvent(svg, e.clientX, e.clientY)
      setDragState({
        isDragging: true,
        startAngle: angle,
        currentAngle: angle,
        startX: null,
        currentX: null,
      })
    }
  }

  const handleLineDragMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging) return
    if (mode === VisualizationMode.LINEAR) {
      if (dragState.startX === null) return
      setDragState({
        ...dragState,
        currentX: e.clientX,
      })
    } else {
      if (dragState.startAngle === null) return
      const svg = getOuterSVG()
      if (!svg) return
      const angle = calculateAngleFromEvent(svg, e.clientX, e.clientY)
      setDragState({
        ...dragState,
        currentAngle: angle,
      })
    }
  }

  const handleLineDragEnd = () => {
    setDragState({
      isDragging: false,
      startAngle: null,
      currentAngle: null,
      startX: null,
      currentX: null,
    })
  }

  const getClass = (note: string) => {
    const selectedNoteNames = selectedNotes.map(n => n.name)
    if (selectedNoteNames[0] === note) return "bg-green-200"
    if (selectedNoteNames[1] === note) return "bg-green-400 text-white"
    return "bg-gray-200"
  }

  useEffect(() => {
    let chain: string[] = []
    if (selectedChord && chordNotes.length > 0) {
      chain = chordNotes
    } else if (selectedNotes.length === 2) {
      chain = getNoteChain(selectedNotes[0], selectedNotes[1], allNotesWithType).map(it => it.name)
    }
    if (chain.length >= 2) {
      setIntervalLabel(chain[0] + " to " + chain[chain.length - 1] + ": " + Interval.distance(chain[0], chain[chain.length - 1]))
    } else {
      setIntervalLabel(null)
    }
  }, [selectedNotes, selectedChord, mode, key, dragState])

  return (
    <div className="p-6 space-y-6">
      <VisualizerControls
        selectedKey={key}
        mode={mode}
        selectedChord={selectedChord}
        onKeyChange={visualizerState.setKey}
        onModeToggle={visualizerState.toggleMode}
        onChordChange={c => {
          visualizerState.setSelectedChord(c || null)
        }}
      />

      {intervalLabel && (
        <div className="text-center text-lg font-semibold text-blue-600">
          Interval: {intervalLabel}
        </div>
      )}

      {mode === VisualizationMode.LINEAR ? (
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
            {(() => {
              const chain = selectedChord ? chordNotes : selectedNotes.map(n => n.name)
              if (chain.length < 2) return null
              const chainSemitones = chain.map(note => {
                const idx = allNotes.findIndex(n => n === note)
                let semi = semitones[idx % semitones.length]
                if (idx >= semitones.length) {
                  semi += semitones[semitones.length - 1]
                }
                return semi
              })
              const totalWidth = window.innerWidth
              const margin = LINEAR_GEOMETRY.margin
              const widthSemi = 24
              let xOffset = 0
              if (dragState.isDragging && dragState.startX !== null && dragState.currentX !== null) {
                xOffset = dragState.currentX - dragState.startX
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
                <g key="line">
                  <path
                    d={path}
                    stroke="transparent"
                    strokeWidth={SIZES.hitAreaWidth}
                    fill="none"
                    onMouseDown={handleLineDragStart}
                    onMouseEnter={() => setHoverState({ element: "line", note: null })}
                    onMouseLeave={() => setHoverState({ element: null, note: null })}
                    style={{ cursor: "grab" }}
                  />
                  <path
                    d={path}
                    stroke="green"
                    strokeWidth={hoverState.element === "line" ? SIZES.lineWidthHover : SIZES.lineWidth}
                    fill="none"
                    onMouseDown={handleLineDragStart}
                    onMouseEnter={() => setHoverState({ element: "line", note: null })}
                    onMouseLeave={() => setHoverState({ element: null, note: null })}
                    style={{ cursor: "grab", pointerEvents: "none" }}
                  />
                </g>
              ) : null
            })()}
            {(() => {
              const chain = selectedChord ? chordNotes : selectedNotes.map(n => n.name)
              if (chain.length < 2) return null
              const chainSemitones = chain.map(note => {
                const idx = allNotes.findIndex(n => n === note)
                let semi = semitones[idx % semitones.length]
                if (idx >= semitones.length) {
                  semi += semitones[semitones.length - 1]
                }
                return semi
              })
              const totalWidth = window.innerWidth
              const margin = LINEAR_GEOMETRY.margin
              let xOffset = 0
              if (dragState.isDragging && dragState.startX !== null && dragState.currentX !== null) {
                xOffset = dragState.currentX - dragState.startX
              }
              return chain.map((note, i) => {
                const x = margin + chainSemitones[i] * 1.0 / 24 * (totalWidth - 2 * margin) + xOffset
                const y = 60
                const isHovered = hoverState.element === `linear-circle-${note}`
                const isEndpoint = i === 0 || i === chain.length - 1
                if (isEndpoint) {
                  return (
                    <circle
                      key={note}
                      cx={x}
                      cy={y}
                      r={isHovered ? SIZES.noteRadiusHover + 2 : SIZES.noteRadius + 2}
                      stroke="green"
                      strokeWidth={isHovered ? 8 : 6}
                      fill="white"
                      onMouseDown={handleLineDragStart}
                      onMouseEnter={() => setHoverState({ element: `linear-circle-${note}`, note: null })}
                      onMouseLeave={() => setHoverState({ element: null, note: null })}
                      style={{ cursor: "grab" }}
                    />
                  )
                } else {
                  return (
                    <circle
                      key={note}
                      cx={x}
                      cy={y}
                      r={isHovered ? SIZES.noteRadiusHover + 2 : SIZES.noteRadius + 2}
                      stroke={isHovered ? "green" : "gray"}
                      strokeWidth={isHovered ? 6 : 4}
                      fill="#eee"
                      onMouseDown={handleLineDragStart}
                      onMouseEnter={() => setHoverState({ element: `linear-circle-${note}`, note: null })}
                      onMouseLeave={() => setHoverState({ element: null, note: null })}
                      style={{ cursor: "grab" }}
                    />
                  )
                }
              })
            })()}
            {allNotes.map((note, idx) => {
              let semi = semitones[idx % semitones.length]
              if (idx >= semitones.length) {
                semi += semitones[semitones.length - 1]
              }
              const totalWidth = window.innerWidth
              const margin = LINEAR_GEOMETRY.margin
              const maxCumSemi = 24
              const x = margin + semi * 1.0 / maxCumSemi * (totalWidth - 2 * margin)
              const y = 60

              const currentChain = selectedChord ? chordNotes : selectedNotes.map(n => n.name)
              const isInChain = currentChain.includes(note)
              const isHovered = hoverState.element === `linear-note-${note}`

              return (
                <g key={note}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered && isInChain ? SIZES.noteRadius + 2 : SIZES.noteRadius}
                    fill={"lightgray"}
                    stroke={isHovered && isInChain ? "green" : "green"}
                    strokeWidth={isHovered && isInChain ? 3 : 0}
                    style={{ cursor: isInChain ? "grab" : "pointer" }}
                    onClick={() => onNoteClick(allNotesWithType[idx])}
                    onMouseDown={isInChain ? handleLineDragStart : undefined}
                    onMouseEnter={() => isInChain && setHoverState({ element: `linear-note-${note}`, note: null })}
                    onMouseLeave={() => isInChain && setHoverState({ element: null, note: null })}
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
            {(() => {
              const chain = selectedChord ? chordNotes : selectedNotes.map(n => n.name)
              if (chain.length < 2) return null

              const r = CIRCLE_GEOMETRY.radius
              const centerX = CIRCLE_GEOMETRY.center.x

              let offset = 0
              if (dragState.isDragging && dragState.startAngle !== null && dragState.currentAngle !== null) {
                offset = dragState.currentAngle - dragState.startAngle
              }
              const idxStart = allNotes.findIndex(n => n === chain[0])
              const idxEnd = allNotes.findIndex(n => n === chain[chain.length - 1])
              if (idxStart === -1 || idxEnd === -1) return null
              const semitoneIdxStart = idxStart % semitones.length
              const semitoneIdxEnd = idxEnd % semitones.length
              const angleStart = (360 / 12 * semitones[semitoneIdxStart] - 90) * Math.PI / 180 + offset
              let angleEnd = (360 / 12 * semitones[semitoneIdxEnd] - 90) * Math.PI / 180 + offset
              if (idxEnd / semitones.length > 0) {
                angleEnd += 2 * Math.PI
              }

              const arcSweep = Math.abs(angleEnd - angleStart) > Math.PI ? 1 : 0
              const x1 = r * Math.cos(angleStart) + centerX
              const y1 = r * Math.sin(angleStart) + CIRCLE_GEOMETRY.center.y
              const x2 = r * Math.cos(angleEnd) + centerX
              const y2 = r * Math.sin(angleEnd) + CIRCLE_GEOMETRY.center.y
              const path = `M ${x1} ${y1} A ${r} ${r} 0 ${arcSweep} 1 ${x2} ${y2}`
              return (
                <g key="arc">
                  <path
                    d={path}
                    stroke="transparent"
                    strokeWidth={SIZES.hitAreaWidth}
                    fill="none"
                    onMouseDown={handleLineDragStart}
                    onMouseEnter={() => setHoverState({ element: "arc", note: null })}
                    onMouseLeave={() => setHoverState({ element: null, note: null })}
                    style={{ cursor: "grab" }}
                  />
                  <path
                    d={path}
                    stroke="green"
                    strokeWidth={hoverState.element === "arc" ? SIZES.lineWidthHover : SIZES.lineWidth}
                    fill="none"
                    onMouseDown={handleLineDragStart}
                    onMouseEnter={() => setHoverState({ element: "arc", note: null })}
                    onMouseLeave={() => setHoverState({ element: null, note: null })}
                    style={{ cursor: "grab", pointerEvents: "none" }}
                  />
                </g>
              )
            })()}
            {(() => {
              const chain = selectedChord ? chordNotes : selectedNotes.map(n => n.name)
              if (chain.length < 2) return null

              const r = CIRCLE_GEOMETRY.radius
              const centerX = CIRCLE_GEOMETRY.center.x
              return chain.map((note, i) => {
                const idx = allNotes.findIndex(n => n === note)
                if (idx === -1) return null
                let offset = 0
                if (dragState.isDragging && dragState.startAngle !== null && dragState.currentAngle !== null) {
                  offset = dragState.currentAngle - dragState.startAngle
                }
                const semitoneIdx = idx % semitones.length
                const angle = (360 / 12 * semitones[semitoneIdx] - 90) * Math.PI / 180 + offset
                const x = r * Math.cos(angle) + centerX
                const y = r * Math.sin(angle) + CIRCLE_GEOMETRY.center.y
                const isHovered = hoverState.element === `circle-circle-${note}`
                const isEndpoint = i === 0 || i === chain.length - 1
                if (isEndpoint) {
                  return (
                    <circle
                      key={note}
                      cx={x}
                      cy={y}
                      r={isHovered ? SIZES.noteRadiusHover + 2 : SIZES.noteRadius + 2}
                      stroke="green"
                      strokeWidth={isHovered ? 8 : 6}
                      fill="white"
                      onMouseDown={handleLineDragStart}
                      onMouseEnter={() => setHoverState({ element: `circle-circle-${note}`, note: null })}
                      onMouseLeave={() => setHoverState({ element: null, note: null })}
                      style={{ cursor: "grab" }}
                    />
                  )
                } else {
                  return (
                    <circle
                      key={note}
                      cx={x}
                      cy={y}
                      r={isHovered ? SIZES.noteRadiusHover + 2 : SIZES.noteRadius + 2}
                      stroke={isHovered ? "green" : "gray"}
                      strokeWidth={isHovered ? 6 : 4}
                      fill="#eee"
                      onMouseDown={handleLineDragStart}
                      onMouseEnter={() => setHoverState({ element: `circle-circle-${note}`, note: null })}
                      onMouseLeave={() => setHoverState({ element: null, note: null })}
                      style={{ cursor: "grab" }}
                    />
                  )
                }
              })
            })()}
          </svg>
          {visibleNotes.map((note, i) => {
            const angle = (360 / 12 * semitones[i] - 90) * Math.PI / 180
            const r = CIRCLE_GEOMETRY.radius
            const x = r * Math.cos(angle) + CIRCLE_GEOMETRY.center.x
            const y = r * Math.sin(angle) + CIRCLE_GEOMETRY.center.y

            const currentChain = selectedChord ? chordNotes : selectedNotes.map(n => n.name)
            const isInChain = currentChain.includes(note) || currentChain.includes(note.substring(0, note.length - 1) + "2")
            const isHovered = hoverState.element === `note-${note}`

            return (
              <div
                key={note}
                onClick={() => onNoteClick(allNotesWithType[i])}
                onMouseDown={isInChain ? handleLineDragStart : undefined}
                onMouseEnter={() => isInChain && setHoverState({ element: `note-${note}`, note: null })}
                onMouseLeave={() => isInChain && setHoverState({ element: null, note: null })}
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
