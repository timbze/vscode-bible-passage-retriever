# Change Log

All notable changes to the "bible-passage-retriever" extension will be documented in this file.

## 0.9.7
- Revert v0.9.6 `<J>` content removal because it also removes words of Jesus.

## 0.9.6
- Remove `<J>` content from verses, which is some kind of note.

## 0.9.5
- Switch sqlite3 library to sql.js to fix processor [architecture issue](https://github.com/timbze/vscode-bible-passage-retriever/issues/6).

## 0.9.4
- Fixed inserting Bible passage correctly when cursor is not at the end of the line.

## 0.9.3
- Added support for verse ranges

## 0.9.2
- Initial beta release
