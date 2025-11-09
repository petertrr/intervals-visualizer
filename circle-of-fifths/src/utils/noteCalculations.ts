import type { Note, Position, CircleGeometry, LinearGeometry } from '../types/music';
import { CIRCLE_GEOMETRY, LINEAR_GEOMETRY, SEMITONES_PER_OCTAVE, TOTAL_SEMITONES_TWO_OCTAVES } from '../constants/music';

export function calculateCirclePosition(
  note: Note,
  geometry: CircleGeometry = CIRCLE_GEOMETRY,
  offset = 0
): Position {
  const angle = (SEMITONES_PER_OCTAVE / SEMITONES_PER_OCTAVE * 360 * note.semitone / SEMITONES_PER_OCTAVE + geometry.angleOffset) * Math.PI / 180 + offset;
  return {
    x: geometry.radius * Math.cos(angle) + geometry.center.x,
    y: geometry.radius * Math.sin(angle) + geometry.center.y,
  };
}

export function calculateLinearPosition(
  note: Note,
  containerWidth: number,
  geometry?: Omit<LinearGeometry, 'width'>,
  offset = 0
): Position {
  const margin = geometry?.margin ?? LINEAR_GEOMETRY.margin;
  const x = margin +
    (note.semitone / TOTAL_SEMITONES_TWO_OCTAVES) * (containerWidth - 2 * margin) +
    offset;

  const height = geometry?.height ?? LINEAR_GEOMETRY.height;
  return {
    x,
    y: height / 2,
  };
}

export function calculateAngleFromEvent(
  svg: SVGElement,
  clientX: number,
  clientY: number
): number {
  const rect = svg.getBoundingClientRect();
  const mouseX = clientX - rect.left;
  const mouseY = clientY - rect.top;
  return Math.atan2(mouseY - CIRCLE_GEOMETRY.center.y, mouseX - CIRCLE_GEOMETRY.center.x);
}

export function getNoteChain(start: Note, end: Note, allNotes: Note[]): Note[] {
  const startIndex = allNotes.findIndex(n => n.name === start.name);
  const endIndex = allNotes.findIndex(n => n.name === end.name);

  if (startIndex === -1 || endIndex === -1) return [];

  if (startIndex <= endIndex) {
    return allNotes.slice(startIndex, endIndex + 1);
  }
  return allNotes.slice(endIndex, startIndex + 1).reverse();
}
