import sqlite3 from 'sqlite3'
import path from 'path'
import { osisToMyBible } from './mapping/osis-to-mybible'

interface VerseRow {
  text: string
}

export function getBiblePassage(osisReferences: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(__dirname, './bibles/KJV1769+.SQLite3')
    console.log('dbPath', dbPath)
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err)
        return
      }
    })
    const references = osisReferences.split(',').map(ref => ref.trim())
    const passages: string[] = []

    db.serialize(() => {
      references.forEach(ref => {
        const [book, chapter, verse] = ref.split('.')
        const bookNumber = osisToMyBible[book]
        const chapterNumber = Number(chapter)
        const verseNumber = verse ? Number(verse) : undefined
        console.log('reference (book, chapter, verse)', bookNumber, chapterNumber, verseNumber)

        let sql = 'SELECT text FROM verses WHERE book_number = ? AND chapter = ?'
        const params = [bookNumber, chapterNumber]

        if (verseNumber) {
          sql += ' AND verse = ?'
          params.push(verseNumber)
        }

        let completed = false
        function success(passage: string) {
          completed = true
          resolve(passage)
        }

        db.each(sql, params, function(err: Error | null, row: VerseRow) {
          if (err) {
            console.error('Error fetching verse:', err)
            reject(err)
            return
          }
          const txt = cleanPassage(row ? row.text : `Reference not found: ${ref}`)
          passages.push(txt)

          if (passages.length === references.length) {
            db.close()
            success(passages.join('\n'))
          }
        })

        setTimeout(() => {
          if (completed) {
            return
          }

          try {
            db.close()
          } finally {
            if (passages.length > 0) {
              console.warn(`Timeout after 3 seconds, returning ${passages.length} passages`)
              success(passages.join('\n'))
            } else {
              reject(new Error('Timeout after 3 seconds'))
            }
          }
        }, 1500)
      })
    })
  })
}

function cleanPassage(passage: string): string {
  return passage
    // Remove content within <S> tags (strongs numbers) including the tags themselves
    .replace(/<S>.*?<\/S>/g, '')
    // Remove all remaining XML tags
    .replace(/<[^>]*>/g, '')
    // Clean up any double spaces and trim
    .replace(/\s+/g, ' ')
    .trim()
}
