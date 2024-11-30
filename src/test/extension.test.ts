import * as assert from 'assert'
import * as vscode from 'vscode'

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.')

  test('Bible passage insertion', async () => {
    // Create and show a new document
    const document = await vscode.workspace.openTextDocument({
      content: 'John 3:16',
      language: 'plaintext'
    })
    const editor = await vscode.window.showTextDocument(document)

    // Select the text
    const position = new vscode.Position(0, 0)
    editor.selection = new vscode.Selection(position, position.translate(0, 9))

    // Execute your command (replace with your actual command name)
    await vscode.commands.executeCommand('bible-passage-retriever.getPassage')

    // Assert the result
    const text = document.getText()
    assert.strictEqual(
      text,
      'John 3:16 For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'
    )
  })
})
