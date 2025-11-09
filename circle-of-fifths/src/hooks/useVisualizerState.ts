import { useState, useCallback } from 'react';
import type { Note, DragState, HoverState } from '../types/music';
import { VisualizationMode } from '../types/music';

const initialDragState: DragState = {
  isDragging: false,
  startAngle: null,
  currentAngle: null,
  startX: null,
  currentX: null,
};

const initialHoverState: HoverState = {
  element: null,
  note: null,
};

export function useVisualizerState() {
  const [key, setKey] = useState("C1 major");
  const [mode, setMode] = useState<VisualizationMode>(VisualizationMode.CIRCLE);
  const [selectedNotes, setSelectedNotes] = useState<Note[]>([]);
  const [selectedChord, setSelectedChord] = useState<string | null>(null);
  const [intervalLabel, setIntervalLabel] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>(initialDragState);
  const [hoverState, setHoverState] = useState<HoverState>(initialHoverState);

  const handleNoteClick = useCallback((note: Note) => {
    setSelectedNotes(prev => {
      if (prev.length >= 2) {
        return [];
      } else if (prev.some(n => n.name === note.name)) {
        return prev.filter(n => n.name !== note.name);
      } else {
        return [...prev, note];
      }
    });

    if (selectedChord) {
      setSelectedChord(null);
    }
  }, [selectedChord]);

  const toggleMode = useCallback(() => {
    setMode(prev => prev === VisualizationMode.CIRCLE
      ? VisualizationMode.LINEAR
      : VisualizationMode.CIRCLE
    );
  }, []);

  const resetDragState = useCallback(() => {
    setDragState(initialDragState);
  }, []);

  const resetHoverState = useCallback(() => {
    setHoverState(initialHoverState);
  }, []);

  return {
    key,
    mode,
    selectedNotes,
    selectedChord,
    intervalLabel,
    dragState,
    hoverState,

    setKey,
    setSelectedChord,
    setIntervalLabel,
    setDragState,
    setHoverState,
    handleNoteClick,
    toggleMode,
    resetDragState,
    resetHoverState,
  };
}
