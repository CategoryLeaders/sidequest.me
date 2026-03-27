'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import type { JSONContent } from '@tiptap/core'
import { generateHTML } from '@tiptap/html'
import { useCallback, useRef } from 'react'

// ─── Toolbar ──────────────────────────────────────────────────────────────────

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      disabled={disabled}
      title={title}
      className={`px-2 py-1 rounded text-sm font-mono transition-colors ${
        active
          ? 'bg-black text-white'
          : 'text-gray-600 hover:bg-gray-100 hover:text-black'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  )
}

// ─── Extensions list (shared for generateHTML) ────────────────────────────────

export const EDITOR_EXTENSIONS = [
  StarterKit,
  Image.configure({ inline: false, allowBase64: false }),
  Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
  Placeholder.configure({ placeholder: 'Start writing…' }),
  CharacterCount,
]

// ─── Main editor ─────────────────────────────────────────────────────────────

interface WritingEditorProps {
  initialContent?: JSONContent | null
  onChange: (json: JSONContent, html: string, wordCount: number) => void
  onImageUpload?: (file: File) => Promise<string> // returns CDN URL
  readOnly?: boolean
}

export default function WritingEditor({
  initialContent,
  onChange,
  onImageUpload,
  readOnly = false,
}: WritingEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: EDITOR_EXTENSIONS,
    content: initialContent ?? '',
    editable: !readOnly,
    onUpdate({ editor }) {
      const json = editor.getJSON()
      // Use editor.getHTML() rather than generateHTML() — the live editor instance
      // has all StarterKit sub-extensions (hardBreak, etc.) correctly registered,
      // whereas generateHTML() with StarterKit as a bundle can silently drop nodes.
      const html = editor.getHTML()
      const words = editor.storage.characterCount.words() as number
      onChange(json, html, words)
    },
  })

  const handleImageInsert = useCallback(
    async (file: File) => {
      if (!editor || !onImageUpload) return
      try {
        const url = await onImageUpload(file)
        editor.chain().focus().setImage({ src: url, alt: file.name }).run()
      } catch (err) {
        console.error('Image upload failed', err)
      }
    },
    [editor, onImageUpload],
  )

  const setLink = useCallback(() => {
    if (!editor) return
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL', prev ?? '')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().unsetLink().run()
    } else {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }, [editor])

  if (!editor) return null

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-bg-card">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap gap-0.5 p-2 border-b border-gray-200 bg-gray-50">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Bold"
          >B</ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italic"
          ><em>I</em></ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            title="Strikethrough"
          ><s>S</s></ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            title="Inline code"
          >`</ToolbarButton>

          <span className="w-px bg-gray-300 mx-1 self-stretch" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >H2</ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >H3</ToolbarButton>

          <span className="w-px bg-gray-300 mx-1 self-stretch" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Bullet list"
          >• list</ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Numbered list"
          >1. list</ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="Blockquote"
          >"</ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive('codeBlock')}
            title="Code block"
          >{'</>'}</ToolbarButton>

          <span className="w-px bg-gray-300 mx-1 self-stretch" />

          <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Link">
            🔗
          </ToolbarButton>

          {onImageUpload && (
            <>
              <ToolbarButton
                onClick={() => fileInputRef.current?.click()}
                title="Insert image"
              >
                🖼
              </ToolbarButton>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageInsert(file)
                  e.target.value = ''
                }}
              />
            </>
          )}

          <span className="w-px bg-gray-300 mx-1 self-stretch" />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >↩</ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >↪</ToolbarButton>

          <span className="ml-auto text-xs text-gray-400 self-center pr-1">
            {editor.storage.characterCount.words()} words
          </span>
        </div>
      )}

      {/* Content area */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[400px] focus-within:outline-none
          [&_.ProseMirror]:outline-none
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
      />
    </div>
  )
}
