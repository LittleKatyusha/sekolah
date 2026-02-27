import { useEffect, useCallback, useState, useRef } from 'react'
import { clsx } from 'clsx'
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  KEY_MODIFIER_COMMAND,
} from 'lexical'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import { HeadingNode, QuoteNode, $createHeadingNode, $createQuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { CodeNode, CodeHighlightNode } from '@lexical/code'
import { LinkNode } from '@lexical/link'
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list'
import { $setBlocksType } from '@lexical/selection'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo2,
  Redo2,
} from 'lucide-react'

import './LexicalEditor.css'

// Theme for Lexical editor
const editorTheme = {
  paragraph: 'mb-1',
  heading: {
    h1: 'text-3xl font-bold mb-2',
    h2: 'text-2xl font-semibold mb-2',
    h3: 'text-xl font-semibold mb-2',
  },
  list: {
    ul: 'list-disc pl-6 mb-2',
    ol: 'list-decimal pl-6 mb-2',
    listitem: 'mb-1',
    nested: {
      listitem: 'list-none',
    },
  },
  quote: 'border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-500 dark:text-gray-400 mb-2',
  code: 'bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono',
  codeHighlight: {},
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono',
  },
  link: 'text-blue-600 dark:text-blue-400 underline',
}

// ─── Toolbar Button ───
function ToolbarButton({ active, onClick, children, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={clsx(
        'p-1.5 rounded transition-colors duration-150',
        active
          ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
      )}
    >
      {children}
    </button>
  )
}

// ─── Toolbar Divider ───
function ToolbarDivider() {
  return <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
}

// ─── Toolbar Plugin ───
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext()
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  })
  const [blockType, setBlockType] = useState('paragraph')

  const updateToolbar = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      setActiveFormats({
        bold: selection.hasFormat('bold'),
        italic: selection.hasFormat('italic'),
        underline: selection.hasFormat('underline'),
        strikethrough: selection.hasFormat('strikethrough'),
      })

      const anchorNode = selection.anchor.getNode()
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow()

      const elementKey = element.getKey()
      const elementDOM = editor.getElementByKey(elementKey)

      if (elementDOM !== null) {
        const type = element.getType()
        if (type === 'heading') {
          setBlockType(element.getTag())
        } else if (type === 'list') {
          const listType = element.getListType()
          setBlockType(listType === 'number' ? 'ol' : 'ul')
        } else if (type === 'quote') {
          setBlockType('quote')
        } else if (type === 'code') {
          setBlockType('code')
        } else {
          setBlockType('paragraph')
        }
      }
    })
  }, [editor])

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar()
      })
    })
  }, [editor, updateToolbar])

  const formatText = (format) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
  }

  const formatHeading = (headingTag) => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        if (blockType === headingTag) {
          $setBlocksType(selection, () => $createParagraphNode())
        } else {
          $setBlocksType(selection, () => $createHeadingNode(headingTag))
        }
      }
    })
  }

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        if (blockType === 'quote') {
          $setBlocksType(selection, () => $createParagraphNode())
        } else {
          $setBlocksType(selection, () => $createQuoteNode())
        }
      }
    })
  }

  const formatCode = () => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        if (blockType === 'code') {
          $setBlocksType(selection, () => $createParagraphNode())
        } else {
          $setBlocksType(selection, () => {
            const codeNode = new CodeNode()
            return codeNode
          })
        }
      }
    })
  }

  const formatBulletList = () => {
    if (blockType !== 'ul') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
    } else {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createParagraphNode())
        }
      })
    }
  }

  const formatNumberedList = () => {
    if (blockType !== 'ol') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
    } else {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createParagraphNode())
        }
      })
    }
  }

  const iconSize = 18

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 rounded-t-lg">
      <ToolbarButton
        active={activeFormats.bold}
        onClick={() => formatText('bold')}
        title="Bold (Ctrl+B)"
      >
        <Bold size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        active={activeFormats.italic}
        onClick={() => formatText('italic')}
        title="Italic (Ctrl+I)"
      >
        <Italic size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        active={activeFormats.underline}
        onClick={() => formatText('underline')}
        title="Underline (Ctrl+U)"
      >
        <Underline size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        active={activeFormats.strikethrough}
        onClick={() => formatText('strikethrough')}
        title="Strikethrough"
      >
        <Strikethrough size={iconSize} />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        active={blockType === 'h1'}
        onClick={() => formatHeading('h1')}
        title="Heading 1"
      >
        <Heading1 size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        active={blockType === 'h2'}
        onClick={() => formatHeading('h2')}
        title="Heading 2"
      >
        <Heading2 size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        active={blockType === 'h3'}
        onClick={() => formatHeading('h3')}
        title="Heading 3"
      >
        <Heading3 size={iconSize} />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        active={blockType === 'ul'}
        onClick={formatBulletList}
        title="Bullet List"
      >
        <List size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        active={blockType === 'ol'}
        onClick={formatNumberedList}
        title="Numbered List"
      >
        <ListOrdered size={iconSize} />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        active={blockType === 'quote'}
        onClick={formatQuote}
        title="Quote"
      >
        <Quote size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        active={blockType === 'code'}
        onClick={formatCode}
        title="Code Block"
      >
        <Code size={iconSize} />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        title="Redo (Ctrl+Y)"
      >
        <Redo2 size={iconSize} />
      </ToolbarButton>
    </div>
  )
}

// ─── HTML Load Plugin (loads initial HTML value) ───
function HtmlLoadPlugin({ html, lastOnChangeValueRef }) {
  const [editor] = useLexicalComposerContext()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (!html && isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    isFirstRender.current = false

    // Skip re-import if this value came from our own onChange
    if (html === lastOnChangeValueRef.current) {
      return
    }

    // External value change — update editor and track it
    lastOnChangeValueRef.current = html

    editor.update(() => {
      const root = $getRoot()

      // If html is empty, clear the editor
      if (!html || html.trim() === '') {
        root.clear()
        root.append($createParagraphNode())
        return
      }

      const parser = new DOMParser()
      const dom = parser.parseFromString(html, 'text/html')
      const nodes = $generateNodesFromDOM(editor, dom)

      root.clear()
      nodes.forEach((node) => {
        root.append(node)
      })
    })
  }, [editor, html, lastOnChangeValueRef])

  return null
}

// ─── OnChange Handler Plugin ───
function OnChangeHandlerPlugin({ onChange, lastOnChangeValueRef }) {
  const [editor] = useLexicalComposerContext()
  const timeoutRef = useRef(null)

  const handleChange = useCallback(
    (editorState) => {
      if (!onChange) return

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        editorState.read(() => {
          const htmlString = $generateHtmlFromNodes(editor)
          // Check if editor is empty
          const root = $getRoot()
          const textContent = root.getTextContent().trim()
          const outputHtml = textContent === '' ? '' : htmlString
          lastOnChangeValueRef.current = outputHtml
          onChange(outputHtml)
        })
      }, 300)
    },
    [editor, onChange, lastOnChangeValueRef]
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return <OnChangePlugin onChange={handleChange} />
}

// ─── Main LexicalEditor Component ───
function LexicalEditor({
  value = '',
  onChange,
  placeholder = 'Tulis sesuatu...',
  label,
  required,
  error,
  minHeight = '150px',
}) {
  const lastOnChangeValueRef = useRef('')
  const initialConfig = {
    namespace: 'LexicalEditor',
    theme: editorTheme,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode, LinkNode],
    onError: (err) => {
      console.error('Lexical error:', err)
    },
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        className={clsx(
          'border rounded-lg overflow-hidden transition-all duration-200',
          'focus-within:ring-2 focus-within:ring-primary-500',
          error
            ? 'border-red-500'
            : 'border-gray-300 dark:border-gray-600'
        )}
      >
        <LexicalComposer initialConfig={initialConfig}>
          <ToolbarPlugin />
          <div className="relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className={clsx(
                    'lexical-editor-content px-3 py-2',
                    'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                    'focus:outline-none'
                  )}
                  style={{ minHeight }}
                />
              }
              placeholder={
                <div
                  className="lexical-placeholder px-3 py-2 text-gray-400 dark:text-gray-500 pointer-events-none absolute top-0 left-0"
                >
                  {placeholder}
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>
          <HistoryPlugin />
          <ListPlugin />
          <HtmlLoadPlugin html={value} lastOnChangeValueRef={lastOnChangeValueRef} />
          <OnChangeHandlerPlugin onChange={onChange} lastOnChangeValueRef={lastOnChangeValueRef} />
        </LexicalComposer>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}

export default LexicalEditor