import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {

  console.log('Congratulations, your extension "bible-passage-retriever" is now active!')

  // The command has been defined in the package.json file
  const disposable = vscode.commands.registerCommand('bible-passage-retriever.getPassage', () => {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      vscode.window.showInformationMessage('No active editor')
      return
    }

    const selection = editor.selection
    const text = editor.document.getText(selection)

    console.log('selection text', text)

    vscode.window.showInformationMessage('Hello World from Bible Passage Retriever!')
  })

  context.subscriptions.push(disposable)
}

// This method is called when your extension is deactivated
export function deactivate() {}
