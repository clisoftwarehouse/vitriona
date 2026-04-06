'use client';

import { useRef } from 'react';
import { Extension } from '@tiptap/core';
import Color from '@tiptap/extension-color';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { useEditor, EditorContent } from '@tiptap/react';
import {
  Bold,
  List,
  Redo,
  Undo,
  Italic,
  Palette,
  AlignLeft,
  AlignRight,
  AlignCenter,
  ListOrdered,
  Underline as UnderlineIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize || null,
            renderHTML: (attributes: Record<string, string>) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
});

const FONT_SIZES = [
  { label: 'Pequeño', value: '12px' },
  { label: 'Normal', value: '' },
  { label: 'Mediano', value: '18px' },
  { label: 'Grande', value: '24px' },
  { label: 'XL', value: '32px' },
  { label: 'XXL', value: '40px' },
];

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const colorRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      TextStyle,
      Color,
      FontSize,
      Underline,
      TextAlign.configure({
        types: ['paragraph'],
      }),
    ],
    content: value,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none min-h-[80px] px-3 py-2 focus:outline-none [&_p]:m-0 [&_ul]:my-1 [&_ol]:my-1',
      },
    },
    immediatelyRender: false,
  });

  if (!editor) return null;

  const currentColor = (editor.getAttributes('textStyle').color as string) || '#000000';

  return (
    <div className={cn('rounded-lg border', className)}>
      {/* Toolbar */}
      <div className='flex flex-wrap items-center gap-0.5 border-b px-1.5 py-1'>
        {/* Font size */}
        <select
          title='Tamaño de fuente'
          value={editor.getAttributes('textStyle').fontSize || ''}
          onChange={(e) => {
            const size = e.target.value;
            if (size) {
              editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
            } else {
              editor.chain().focus().unsetMark('textStyle').run();
            }
          }}
          className='text-muted-foreground hover:text-foreground h-7 rounded border-none bg-transparent px-1 text-xs outline-none'
        >
          {FONT_SIZES.map((s) => (
            <option key={s.label} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <div className='bg-border mx-0.5 h-4 w-px' />

        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title='Negrita'
        >
          <Bold className='size-3.5' />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title='Cursiva'
        >
          <Italic className='size-3.5' />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title='Subrayado'
        >
          <UnderlineIcon className='size-3.5' />
        </ToolbarButton>

        {/* Color picker */}
        <div className='relative'>
          <ToolbarButton active={false} onClick={() => colorRef.current?.click()} title='Color de texto'>
            <Palette className='size-3.5' />
            <span
              className='absolute right-1 bottom-0.5 h-0.5 w-3 rounded-full'
              style={{ backgroundColor: currentColor }}
            />
          </ToolbarButton>
          <input
            ref={colorRef}
            type='color'
            value={currentColor}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            className='invisible absolute top-full left-0 size-0'
            tabIndex={-1}
          />
        </div>

        <div className='bg-border mx-0.5 h-4 w-px' />

        <ToolbarButton
          active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          title='Alinear izquierda'
        >
          <AlignLeft className='size-3.5' />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          title='Centrar'
        >
          <AlignCenter className='size-3.5' />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          title='Alinear derecha'
        >
          <AlignRight className='size-3.5' />
        </ToolbarButton>

        <div className='bg-border mx-0.5 h-4 w-px' />

        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title='Lista'
        >
          <List className='size-3.5' />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title='Lista numerada'
        >
          <ListOrdered className='size-3.5' />
        </ToolbarButton>

        <div className='bg-border mx-0.5 h-4 w-px' />

        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title='Deshacer'
        >
          <Undo className='size-3.5' />
        </ToolbarButton>
        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title='Rehacer'
        >
          <Redo className='size-3.5' />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <div className='relative'>
        {editor.isEmpty && placeholder && (
          <p className='text-muted-foreground pointer-events-none absolute top-2 left-3 text-sm'>{placeholder}</p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  disabled,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'rounded p-1.5 transition-colors disabled:opacity-30',
        active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}
