# Bible Passage Retriever VS Code Extension

This is a VS Code extension that helps you retrieve Bible passages directly within your editor. It currently provides the King James Version (1769) Bible text. The text is stored in a local SQLite database (in MyBible format) for fast retrieval.

## Features

- Retrieve single verse, verse range, or multiple verses / verse ranges
- Support for almost any Bible reference format (in English). E.g. `Gen.1.1`, `Genesis 1:1`, `Genesis 1:1-3`, `Gen 1:1-3`, `Titus 2:14-3:4`
- Uses either selected text or if no text is selected then the full line of text where the cursor is located.

## Usage

1. Enter `Genesis 1:1-3` and from the command palette select `Get Bible Passage`.
2. Passage gets added after your entered reference:
```
Genesis 1:1-3 In the beginning God created the heaven and the earth.
2 And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.
3 And God said, Let there be light: and there was light.
```

## How it works

- Bible references are parsed using the [Bible Passage Reference Parser](https://github.com/openbibleinfo/Bible-Passage-Reference-Parser) library. It's stored locally in the extension, slightly modified to work with ES5 which was done by someone in the [AndBible](https://github.com/AndBible/and-bible) team.
- The parsed references are then used to query the local SQLite database of MyBible format. The extension uses the [sql.js](https://www.npmjs.com/package/sql.js) npm package to access the database.
