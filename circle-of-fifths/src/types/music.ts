export interface Note {
  name: string;
  octave: number;
  semitone: number;
}

export interface Scale {
  key: string;
  mode: 'major' | 'minor';
  notes: Note[];
  intervals: string[];
  semitones: number[];
}

export interface Chord {
  name: string;
  type: string;
  notes: Note[];
  intervals: string[];
}

export interface Interval {
  from: Note;
  to: Note;
  distance: string;
  semitones: number;
}

export type VisualizationMode = 'circle' | 'linear'

export const VisualizationMode = {
  CIRCLE: 'circle' as VisualizationMode,
  LINEAR: 'linear' as VisualizationMode,
}

export interface Position {
  x: number;
  y: number;
}

export interface CircleGeometry {
  radius: number;
  center: Position;
  angleOffset: number;
}

export interface LinearGeometry {
  width: number;
  height: number;
  margin: number;
}

export interface DragState {
  isDragging: boolean;
  startAngle: number | null;
  currentAngle: number | null;
  startX: number | null;
  currentX: number | null;
}

export interface HoverState {
  element: string | null;
  note: Note | null;
}

export interface VisualizerState {
  key: string;
  mode: VisualizationMode;
  selectedNotes: Note[];
  selectedChord: string | null;
  intervalLabel: string | null;
  dragState: DragState;
  hoverState: HoverState;
}
