import * as assert from 'assert'
import * as vscode from 'vscode'

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.')

  test('Bible passage insertion for selection', async () => {
    // Create and show a new document
    const document = await vscode.workspace.openTextDocument({
      content: 'John 3:16',
      language: 'plaintext'
    })
    const editor = await vscode.window.showTextDocument(document)

    // Select the text
    const position = new vscode.Position(0, 0)
    editor.selection = new vscode.Selection(position, position.translate(0, 9))

    // Run getPassage command
    await vscode.commands.executeCommand('bible-passage-retriever.getPassage')

    // Assert the result
    const text = document.getText()
    assert.strictEqual(
      text,
      'John 3:16 For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'
    )
  })

  test('Bible passage insertion for no selection cursor at end', async () => {
    // Create and show a new document
    const document = await vscode.workspace.openTextDocument({
      content: 'John 3:16',
      language: 'plaintext'
    })
    const editor = await vscode.window.showTextDocument(document)

    // Set cursor to the end of the text
    const position = new vscode.Position(0, 9)
    editor.selection = new vscode.Selection(position, position)

    // Run getPassage command
    await vscode.commands.executeCommand('bible-passage-retriever.getPassage')

    // Assert the result
    const text = document.getText()
    assert.strictEqual(
      text,
      'John 3:16 For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'
    )
  })

  test('Bible passage insertion for no selection cursor at beginning', async () => {
    // Create and show a new document
    const document = await vscode.workspace.openTextDocument({
      content: 'John 3:16',
      language: 'plaintext'
    })
    const editor = await vscode.window.showTextDocument(document)

    // Set cursor to the beginning of the text
    const position = new vscode.Position(0, 0)
    editor.selection = new vscode.Selection(position, position)

    // Run getPassage command
    await vscode.commands.executeCommand('bible-passage-retriever.getPassage')

    // Assert the result
    const text = document.getText()
    assert.strictEqual(
      text,
      'John 3:16 For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'
    )
  })

  test('Multi-verse passage with default newline separator', async () => {
    // Ensure default (newline) separator is active
    const config = vscode.workspace.getConfiguration('bible-passage-retriever')
    await config.update('verseSeparator', 'newline', vscode.ConfigurationTarget.Global)

    // Create and show a new document
    const document = await vscode.workspace.openTextDocument({
      content: 'John 3:16-17',
      language: 'plaintext'
    })
    const editor = await vscode.window.showTextDocument(document)

    // Select the text
    const position = new vscode.Position(0, 0)
    editor.selection = new vscode.Selection(position, position.translate(0, 12))

    // Run getPassage command
    await vscode.commands.executeCommand('bible-passage-retriever.getPassage')

    // Assert the result - verses separated by newline
    const text = document.getText()
    assert.strictEqual(
      text,
      'John 3:16-17 For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.\n17 For God sent not his Son into the world to condemn the world; but that the world through him might be saved.'
    )
  })

  test('Multi-verse passage with space separator', async () => {
    // Set separator to space
    const config = vscode.workspace.getConfiguration('bible-passage-retriever')
    await config.update('verseSeparator', 'space', vscode.ConfigurationTarget.Global)

    // Create and show a new document
    const document = await vscode.workspace.openTextDocument({
      content: 'John 3:16-17',
      language: 'plaintext'
    })
    const editor = await vscode.window.showTextDocument(document)

    // Select the text
    const position = new vscode.Position(0, 0)
    editor.selection = new vscode.Selection(position, position.translate(0, 12))

    // Run getPassage command
    await vscode.commands.executeCommand('bible-passage-retriever.getPassage')

    // Assert the result - verses separated by space
    const text = document.getText()
    assert.strictEqual(
      text,
      'John 3:16-17 For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. 17 For God sent not his Son into the world to condemn the world; but that the world through him might be saved.'
    )

    // Reset to default
    await config.update('verseSeparator', undefined, vscode.ConfigurationTarget.Global)
  })

  test('Bible passage does not show extra note bug from 1769+ version', async () => {
    // Create and show a new document
    const document = await vscode.workspace.openTextDocument({
      content: 'John 1:38',
      language: 'plaintext'
    })
    const editor = await vscode.window.showTextDocument(document)

    // Select the text
    const position = new vscode.Position(0, 0)
    editor.selection = new vscode.Selection(position, position.translate(0, 9))

    // Run getPassage command
    await vscode.commands.executeCommand('bible-passage-retriever.getPassage')

    // Assert the result
    const text = document.getText()
    assert.strictEqual(
      text,
      'John 1:38 Then Jesus turned, and saw them following, and saith unto them, What seek ye? They said unto him, Rabbi, (which is to say, being interpreted, Master,) where dwellest thou?'
    )
  })

})
