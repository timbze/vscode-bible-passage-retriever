import * as vscode from 'vscode'
import { bcv_parser } from './parser/en_bcv_parser'
import { getBiblePassage } from './bible-reader'

export function activate(context: vscode.ExtensionContext) {

  // The command has been defined in the package.json file
  const disposable = vscode.commands.registerCommand('bible-passage-retriever.getPassage', async () => {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      vscode.window.showInformationMessage('No active editor')
      return
    }

    // Get text from selection or around cursor
    let text
    const selection = editor.selection
    if (!selection.isEmpty) {
      text = editor.document.getText(selection)
    } else {
      const cursorPosition = selection.active
      const lineText = editor.document.lineAt(cursorPosition.line).text
      text = lineText.trim()
    }

    // Parse the Bible reference
    const parser = new bcv_parser()
    parser.parse(text)
    const osisRefs = parser.osis()

    console.debug('retrieved text', text)
    console.debug('OSIS references', osisRefs)
    if (osisRefs.length > 0) {
      try {
        const config = vscode.workspace.getConfiguration('bible-passage-retriever')
        const separatorSetting = config.get<string>('verseSeparator', 'newline')
        const separator = separatorSetting === 'space' ? ' ' : '\n'
        const passage = await getBiblePassage(osisRefs, separator)

        await editor.edit(editBuilder => {
          if (!selection.isEmpty) {
            const endPosition = selection.end
            const textBeforeInsert = editor.document.getText(new vscode.Range(endPosition.translate(0, -1), endPosition))
            const prefix = textBeforeInsert.endsWith(' ') ? '' : ' '
            editBuilder.insert(endPosition, prefix + passage)
          } else {
            const line = editor.document.lineAt(selection.active.line)
            const lineEndPos = line.range.end
            const textBeforeInsert = editor.document.getText(new vscode.Range(lineEndPos.translate(0, -1), lineEndPos))
            const prefix = textBeforeInsert.endsWith(' ') ? '' : ' '
            editBuilder.insert(lineEndPos, prefix + passage)
          }
        })
      } catch (error) {
        console.error('Error fetching passage:', error)
      }
    }
  })

  context.subscriptions.push(disposable)
}

// This method is called when your extension is deactivated
export function deactivate() {}
