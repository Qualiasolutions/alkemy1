import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Heading1, Heading2, Italic } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ScriptEditorProps {
  content: string | null
  onUpdate: (content: string) => void
  isSaving?: boolean
}

export function ScriptEditor({ content, onUpdate, isSaving }: ScriptEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing your screenplay...',
      }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class:
          'prose prose-invert max-w-none focus:outline-none min-h-[500px] p-8 bg-black/20 rounded-xl border border-white/10',
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML())
    },
  })

  // Update content if it changes externally (e.g. initial load)
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      // Only set content if it's significantly different to avoid cursor jumps
      // For now, we trust the initial load.
      // A better approach for real-time collab is needed later, but for now:
      if (editor.getText() === '' && content) {
        editor.commands.setContent(content)
      }
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10 sticky top-0 z-10 backdrop-blur-md">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            'text-white/60 hover:text-white',
            editor.isActive('bold') && 'bg-white/10 text-white'
          )}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            'text-white/60 hover:text-white',
            editor.isActive('italic') && 'bg-white/10 text-white'
          )}
        >
          <Italic className="w-4 h-4" />
        </Button>
        <div className="w-px h-4 bg-white/10 mx-2" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(
            'text-white/60 hover:text-white',
            editor.isActive('heading', { level: 1 }) && 'bg-white/10 text-white'
          )}
          title="Scene Heading"
        >
          <Heading1 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(
            'text-white/60 hover:text-white',
            editor.isActive('heading', { level: 3 }) && 'bg-white/10 text-white'
          )}
          title="Character"
        >
          <Heading2 className="w-4 h-4" />
        </Button>

        <div className="flex-1" />

        {isSaving && <span className="text-xs text-white/40 animate-pulse">Saving...</span>}
      </div>

      <EditorContent editor={editor} />

      <style>{`
        .ProseMirror h1 {
            font-family: 'Courier Prime', monospace;
            text-transform: uppercase;
            font-size: 1.2em;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            color: #fff;
        }
        .ProseMirror h3 {
            font-family: 'Courier Prime', monospace;
            text-transform: uppercase;
            text-align: center;
            font-size: 1em;
            margin-top: 1em;
            color: #ddd;
            width: 60%;
            margin-left: auto;
            margin-right: auto;
        }
        .ProseMirror p {
            font-family: 'Courier Prime', monospace;
            font-size: 1em;
            line-height: 1.5;
            color: #ccc;
            margin-bottom: 1em;
        }
      `}</style>
    </div>
  )
}
