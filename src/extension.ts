import * as vscode from 'vscode'
import { bcv_parser } from './parser/en_bcv_parser'
import { getBiblePassage } from './bible-reader'

function getTextAndSelection(editor: vscode.TextEditor): { text: string; selection: vscode.Selection, osisRefs: string } {
  const selection = editor.selection
  let text
  if (!selection.isEmpty) {
    text = editor.document.getText(selection)
  } else {
    const cursorPosition = selection.active
    const lineText = editor.document.lineAt(cursorPosition.line).text
    text = lineText.trim()
  }

  const parser = new bcv_parser()
  parser.parse(text)
  const osisRefs = parser.osis()

  return { text, selection, osisRefs }
}

async function insertPassage(editor: vscode.TextEditor, selection: vscode.Selection, passage: string) {
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
}

export function activate(context: vscode.ExtensionContext) {

  const getPassage = vscode.commands.registerCommand('bible-passage-retriever.getPassage', async () => {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      vscode.window.showInformationMessage('No active editor')
      return
    }

    const { text, selection, osisRefs } = getTextAndSelection(editor)

    console.debug('retrieved text', text)
    console.debug('OSIS references', osisRefs)
    if (osisRefs.length > 0) {
      try {
        const config = vscode.workspace.getConfiguration('bible-passage-retriever')
        const separatorSetting = config.get<string>('verseSeparator', 'newline')
        const separator = separatorSetting === 'space' ? ' ' : '\n'
        const showVerseNumbers = config.get<boolean>('showVerseNumbers', true)
        const passage = await getBiblePassage(osisRefs, separator, showVerseNumbers)
        await insertPassage(editor, selection, passage)
      } catch (error) {
        console.error('Error fetching passage:', error)
      }
    }
  })

  const getPassageCustom = vscode.commands.registerCommand('bible-passage-retriever.getPassageCustom', async () => {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      vscode.window.showInformationMessage('No active editor')
      return
    }

    const { text, selection, osisRefs } = getTextAndSelection(editor)

    console.debug('retrieved text', text)
    console.debug('OSIS references', osisRefs)
    if (osisRefs.length === 0) {
      return
    }

    const options = await vscode.window.showQuickPick(
      [
        { label: 'Use space separator', description: '(default: newline)', picked: false },
        { label: 'Show verse numbers', description: '(default: on)', picked: true }
      ],
      {
        canPickMany: true,
        placeHolder: 'Configure passage options, then press Enter'
      }
    )
    if (!options) {
      return
    }

    const useSpace = options.some(o => o.label === 'Use space separator')
    const showVerseNumbers = options.some(o => o.label === 'Show verse numbers')
    const separator = useSpace ? ' ' : '\n'

    try {
      const passage = await getBiblePassage(osisRefs, separator, showVerseNumbers)
      await insertPassage(editor, selection, passage)
    } catch (error) {
      console.error('Error fetching passage:', error)
    }
  })

  context.subscriptions.push(getPassage, getPassageCustom)
}

// This method is called when your extension is deactivated
export function deactivate() {}
