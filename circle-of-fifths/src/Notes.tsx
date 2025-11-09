import type { Note } from './types/music'

export function getNoteChain(start: Note, end: Note, noteList: Note[]): Note[] {
  const iStart = noteList.findIndex(n => n.name === start.name)
  const iEnd = noteList.findIndex(n => n.name === end.name)
  if (iStart === -1 || iEnd === -1) return []
  if (iStart <= iEnd) return noteList.slice(iStart, iEnd + 1)
  return noteList.slice(iEnd, iStart + 1).reverse()
}
