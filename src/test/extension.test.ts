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
    // Normalize line endings so the test passes on Windows (\r\n) and Unix (\n)
    const text = document.getText().replace(/\r\n/g, '\n')
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

  test('Multi-verse passage with verse numbers shown (default)', async () => {
    // Ensure default settings
    const config = vscode.workspace.getConfiguration('bible-passage-retriever')
    await config.update('showVerseNumbers', true, vscode.ConfigurationTarget.Global)
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

    // Assert the result - verse numbers are present
    const text = document.getText()
    assert.strictEqual(
      text,
      'John 3:16-17 For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. 17 For God sent not his Son into the world to condemn the world; but that the world through him might be saved.'
    )

    // Reset
    await config.update('verseSeparator', undefined, vscode.ConfigurationTarget.Global)
    await config.update('showVerseNumbers', undefined, vscode.ConfigurationTarget.Global)
  })

  test('Multi-verse passage with verse numbers hidden', async () => {
    // Disable verse numbers
    const config = vscode.workspace.getConfiguration('bible-passage-retriever')
    await config.update('showVerseNumbers', false, vscode.ConfigurationTarget.Global)
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

    // Assert the result - no verse numbers between verses
    const text = document.getText()
    assert.strictEqual(
      text,
      'John 3:16-17 For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. For God sent not his Son into the world to condemn the world; but that the world through him might be saved.'
    )

    // Reset
    await config.update('showVerseNumbers', undefined, vscode.ConfigurationTarget.Global)
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

  // Runs getPassage on a line with the cursor at its end, using the default
  // settings (newline separator, verse numbers shown).
  async function getPassageFor(reference: string): Promise<string> {
    const document = await vscode.workspace.openTextDocument({
      content: reference,
      language: 'plaintext'
    })
    const editor = await vscode.window.showTextDocument(document)
    const position = new vscode.Position(0, reference.length)
    editor.selection = new vscode.Selection(position, position)
    await vscode.commands.executeCommand('bible-passage-retriever.getPassage')
    return document.getText().replace(/\r\n/g, '\n')
  }

  test('Psalm title is not part of verse 1', async () => {
    assert.strictEqual(
      await getPassageFor('Psalm 3:1'),
      'Psalm 3:1 LORD, how are they increased that trouble me! many are they that rise up against me.'
    )
    assert.strictEqual(
      await getPassageFor('Psalm 51:1'),
      'Psalm 51:1 Have mercy upon me, O God, according to thy lovingkindness: according unto the multitude of thy tender mercies blot out my transgressions.'
    )
  })

  test('Psalm title is left out of a whole Psalm', async () => {
    assert.strictEqual(
      await getPassageFor('Psalm 23'),
      'Psalm 23 The LORD is my shepherd; I shall not want.\n' +
      '2 He maketh me to lie down in green pastures: he leadeth me beside the still waters.\n' +
      '3 He restoreth my soul: he leadeth me in the paths of righteousness for his name’s sake.\n' +
      '4 Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.\n' +
      '5 Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.\n' +
      '6 Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.'
    )
  })

  test('Psalm 119 section heading is not part of the verse', async () => {
    assert.strictEqual(
      await getPassageFor('Psalm 119:1'),
      'Psalm 119:1 Blessed are the undefiled in the way, who walk in the law of the LORD.'
    )
  })

  test('Last verse of a Psalm has nothing after it', async () => {
    assert.strictEqual(
      await getPassageFor('Psalm 3:8'),
      'Psalm 3:8 Salvation belongeth unto the LORD: thy blessing is upon thy people. Selah.'
    )
  })

  test('Range across Psalms has no titles and numbers the new chapter', async () => {
    assert.strictEqual(
      await getPassageFor('Psalm 3:8-4:1'),
      'Psalm 3:8-4:1 Salvation belongeth unto the LORD: thy blessing is upon thy people. Selah.\n' +
      '4:1 Hear me when I call, O God of my righteousness: thou hast enlarged me when I was in distress; have mercy upon me, and hear my prayer.'
    )
  })

  test('Epistle subscription is not part of the last verse', async () => {
    assert.strictEqual(
      await getPassageFor('Romans 16:27'),
      'Romans 16:27 To God only wise, be glory through Jesus Christ for ever. Amen.'
    )
    assert.strictEqual(
      await getPassageFor('Hebrews 13:25'),
      'Hebrews 13:25 Grace be with you all. Amen.'
    )
  })

  test('Worshipped is spelled with double p', async () => {
    assert.strictEqual(
      await getPassageFor('John 9:38'),
      'John 9:38 And he said, Lord, I believe. And he worshipped him.'
    )
  })

  test('Several references on one line', async () => {
    assert.strictEqual(
      await getPassageFor('John 11:35, Romans 8:28'),
      'John 11:35, Romans 8:28 Jesus wept.\n' +
      'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.'
    )
  })

})
