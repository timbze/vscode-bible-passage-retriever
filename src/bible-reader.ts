import path from 'path'
import createSword from './sword/sword'

// The bundled module; see src/bibles/sword.
const MODULE = 'KJV'

interface Verse {
  book: string
  chapter: number
  verse: number
  text: string
}

type Passage = (module: string, osisRef: string) => string

// libsword (built to WebAssembly) reads SWORD modules from a directory that is
// mounted into its own file system. Loading it takes a few ms, so do it once.
let sword: Promise<Passage> | undefined

function loadSword(): Promise<Passage> {
  sword ??= createSword({
    locateFile: (file) => path.join(__dirname, file)
  }).then(M => {
    M.FS.mkdir('/sword')
    M.FS.mount(M.NODEFS, { root: path.join(__dirname, 'bibles', 'sword') }, '/sword')
    M.cwrap('sw_open', 'number', ['string'])('/sword/')
    return M.cwrap('sw_passage', 'string', ['string', 'string'])
  }).catch(err => {
    sword = undefined // try again next time
    throw err
  })
  return sword
}

export async function getBiblePassage(osisReferences: string, separator: string = '\n', showVerseNumbers: boolean = true): Promise<string> {
  const passage = await loadSword()
  // SWORD misreads a comma-separated list of OSIS refs, so ask for each one.
  const references = osisReferences.split(',').map(ref => ref.trim())
  const allPassages: string[] = []
  for (const ref of references) {
    const result = JSON.parse(passage(MODULE, ref)) as Verse[] | { error: string }
    if (!Array.isArray(result)) {
      throw new Error(`${MODULE} ${ref}: ${result.error}`)
    }
    result.forEach((row, i) => {
      let prefix = ''
      if (i > 0 && showVerseNumbers) {
        const chapter = (row.verse === 1) ? `${row.chapter}:` : ''
        prefix = `${chapter}${row.verse} `
      }
      allPassages.push(prefix + cleanPassage(row.text))
    })
  }
  return allPassages.join(separator)
}

// SWORD's plain text keeps the line breaks and spaces around paragraph marks.
function cleanPassage(passage: string): string {
  return passage.replace(/\s+/g, ' ').trim()
}
