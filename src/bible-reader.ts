import sqlite3 from 'sqlite3'
import path from 'path'
import { osisToMyBible } from './mapping/osis-to-mybible'

interface VerseRow {
  text: string
  verse: number
  chapter: number
}

export function getBiblePassage(osisReferences: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(__dirname, './bibles/KJV1769+.SQLite3')
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err)
        return
      }
    })
    
    const references = osisReferences.split(',').map(ref => ref.trim())
    
    let referencePromises: Promise<string[]>[] = []
    db.serialize(() => {
      referencePromises = references.map(ref => {
        return new Promise<string[]>((resolveRef, rejectRef) => {
          const { sql, params } = getSql(ref)
          const passages: string[] = []
          let firstDone = false
          
          db.each(sql, params, 
            (err: Error | null, row: VerseRow) => {
              if (err) {
                rejectRef(err)
                return
              }
              let txt = cleanPassage(row ? row.text : `Reference not found: ${ref}`)
              if (firstDone && row) {
                const chapter = firstDone && row.verse === 1 ? row.chapter + ':' : ''
                txt = `${chapter}${row.verse} ${txt}`
              }
              passages.push(txt)
              firstDone = true
            },
            // runs after all verses are handled
            (err: Error | null, count: number) => {
              if (err) {
                rejectRef(err)
              } else {
                resolveRef(passages)
              }
            }
          )
        })
      })
    })

    // Wait for all references to be processed
    Promise.all(referencePromises)
      .then(allPassages => {
        resolve(allPassages.flat().join('\n'))
      })
      .catch(err => {
        reject(err)
      })
      .finally(() => db.close())
  })
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
