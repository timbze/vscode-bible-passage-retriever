import Database from 'better-sqlite3'

export function getBiblePassage(osisReferences: string): string {
  const db = new Database('./bibles/KJV1769+.SQLite3')
  const references = osisReferences.split(',').map(ref => ref.trim())

  try {
    const passages = references.map(ref => {
      const [book, chapter, verse] = ref.split('.').map(Number)
      let sql = 'SELECT text FROM verses WHERE book_number = ? AND chapter = ?'
      if (verse) {
        sql += ' AND verse = ?'
      }

      const stmt = db.prepare(sql)

      const result = stmt.get(book, chapter, verse)
      return result ? (result as any).text : `Reference not found: ${ref}`
    })

    return passages.join('\n')
  } finally {
    db.close()
  }
}
