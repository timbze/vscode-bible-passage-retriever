import initSqlJs from 'sql.js'
import * as fs from 'fs'
import path from 'path'
import { osisToMyBible } from './mapping/osis-to-mybible'

interface VerseRow {
  text: string
  verse: number
  chapter: number
}

export async function getBiblePassage(osisReferences: string, separator: string = '\n', showVerseNumbers: boolean = true): Promise<string> {
  try {
    const SQL = await initSqlJs({
      locateFile: () => path.join(__dirname, 'sql-wasm.wasm')
    })
    const dbPath = path.join(__dirname, './bibles/KJV+.SQLite3')
    const buffer = fs.readFileSync(dbPath)
    const db = new SQL.Database(buffer)
    const references = osisReferences.split(',').map(ref => ref.trim())
    const allPassages: string[] = []
    for (const ref of references) {
      const { sql, params } = getSql(ref)
      const stmt = db.prepare(sql)
      stmt.bind(params)
      const passages: string[] = []
      let firstDone = false
      while (stmt.step()) {
        const row = stmt.getAsObject() as unknown as VerseRow
        let txt = cleanPassage(row.text)
        let prefix = ''
        if (firstDone && showVerseNumbers) {
          const chapter = (row.verse === 1) ? `${row.chapter}:` : ''
          prefix = `${chapter}${row.verse} `
        }
        txt = prefix + txt
        passages.push(txt)
        firstDone = true
      }
      stmt.free()
      allPassages.push(...passages)
    }
    db.close()
    return allPassages.join(separator)
  } catch (err) {
    throw err
  }
}

function getSql(ref: string): { sql: string, params: any[] } {
  const parseReference = (ref: string) => {
    const [book, chapter, verse] = ref.split('.')
    return {
      book: osisToMyBible[book],
      chapter: Number(chapter),
      verse: verse ? Number(verse) : undefined
    }
  }

  let start, end
  if (ref.includes('-')) {
    const [startRef, endRef] = ref.split('-').map(r => r.trim())
    start = parseReference(startRef)
    end = parseReference(endRef)
  } else {
    start = parseReference(ref)
    end = start
  }

  let sql = 'SELECT text, verse, chapter FROM verses WHERE book_number = ?'
  const params: (number | undefined)[] = [start.book]

  if (start.chapter === end.chapter) {
    sql += ' AND chapter = ? AND verse >= ? AND verse <= ?'
    params.push(start.chapter, start.verse || 1, end.verse || 999)
  } else {
    sql += ' AND ((chapter = ? AND verse >= ?) OR (chapter = ? AND verse <= ?))'
    params.push(
      start.chapter, start.verse || 1,
      end.chapter, end.verse || 999
    )
  }

  sql += ' ORDER BY book_number, chapter, verse'

  return { sql, params }
}

function cleanPassage(passage: string): string {
  return passage
    // Remove content within <S> tags (strongs numbers) including the tags themselves
    .replace(/<S>.*?<\/S>/g, '')
    // Remove content within <n> tags (notes) including the tags themselves
    .replace(/<n>.*?<\/n>/g, '')
    // Remove all remaining XML tags
    .replace(/<[^>]*>/g, '')
    // Clean up any double spaces and trim
    .replace(/\s+/g, ' ')
    .trim()
}
