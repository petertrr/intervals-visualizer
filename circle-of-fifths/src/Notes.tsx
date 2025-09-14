// Helper to get all notes between two notes in scale order
export function getNoteChain(start: string, end: string, noteList: string[]): string[] {
  const iStart = noteList.indexOf(start)
  const iEnd = noteList.indexOf(end)
  if (iStart === -1 || iEnd === -1) return []
  if (iStart <= iEnd) return noteList.slice(iStart, iEnd + 1)
  return noteList.slice(iEnd, iStart + 1).reverse()
}
