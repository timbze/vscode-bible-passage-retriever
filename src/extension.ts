import * as vscode from 'vscode'
const bcv_parser = require('./parser/en_bcv_parser')

export function activate(context: vscode.ExtensionContext) {

  // The command has been defined in the package.json file
  const disposable = vscode.commands.registerCommand('bible-passage-retriever.getPassage', () => {
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
    const parser = new bcv_parser.BcvParser()
    parser.parse(text)
    const osisRefs = parser.osis()

    console.log('retrieved text', text)
    console.log('OSIS references', osisRefs)
  })

  context.subscriptions.push(disposable)
}

// This method is called when your extension is deactivated
export function deactivate() {}
