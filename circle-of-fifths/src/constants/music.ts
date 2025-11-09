export const SEMITONES_PER_OCTAVE = 12;
export const DEGREES_PER_SEMITONE = 30;
export const TOTAL_SEMITONES_TWO_OCTAVES = 24;

export const CIRCLE_GEOMETRY = {
  radius: 120,
  center: { x: 150, y: 150 },
  angleOffset: -90,
} as const;

export const LINEAR_GEOMETRY = {
  height: 96,
  margin: 40,
  noteRadius: 24,
} as const;

export const NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'H'] as const;
export const ACCIDENTALS = ['', '#', 'b'] as const;
export const MODES = ['major', 'minor'] as const;
export const OCTAVES = [1, 2] as const;

export const CHORD_TYPES = new Map([
  ['major triad', 'major'],
  ['minor triad', 'minor'],
  ['dominant seventh', 'maj7'],
]);

export const ALL_KEYS = NOTE_NAMES
  .flatMap(note => ACCIDENTALS.map(acc => `${note}${acc}`))
  .flatMap(key => MODES.map(mode => `${key}1 ${mode}`));

export const COLORS = {
  selectedPrimary: 'bg-green-200',
  selectedSecondary: 'bg-green-400 text-white',
  default: 'bg-gray-200',
  hover: 'rgba(34, 197, 94, 0.5)',
  line: 'green',
  lineHover: 'green',
} as const;

export const SIZES = {
  noteRadius: 24,
  noteRadiusHover: 26,
  lineWidth: 6,
  lineWidthHover: 8,
  hitAreaWidth: 20,
} as const;
