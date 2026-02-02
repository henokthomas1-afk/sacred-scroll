/**
 * RichTextEditor - Document-style editor with formatting toolbar
 * 
 * Features:
 * - Bold, Underline, Highlight
 * - Text alignment (left, center, right)
 * - Font size (increase/decrease)
 * - Auto-linking of citation patterns (CCC 17, ST I.2.3, etc.)
 * - No markdown - stores as HTML
 * - Autosave on blur
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Underline,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Minus,
  Link,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { autoLinkCitations, extractCitationFromLink, isCitationLink } from '@/lib/citationAutoLinker';
import { toast } from '@/hooks/use-toast';

interface RichTextEditorProps {
  content: string;
  fontSize?: number;
  onChange: (content: string) => void;
  onFontSizeChange?: (fontSize: number) => void;
  onCitationClick?: (citationId: string, nodeId?: string) => void;
  placeholder?: string;
  className?: string;
}

const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 24;
const DEFAULT_FONT_SIZE = 16;

export function RichTextEditor({
  content,
  fontSize = DEFAULT_FONT_SIZE,
  onChange,
  onFontSizeChange,
  onCitationClick,
  placeholder = 'Write your thoughts here...',
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [currentFontSize, setCurrentFontSize] = useState(fontSize);
  const [isAutoLinking, setIsAutoLinking] = useState(false);
  const isInitialMount = useRef(true);
  const autoLinkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync content on mount or when content changes externally
  useEffect(() => {
    if (editorRef.current && isInitialMount.current) {
      editorRef.current.innerHTML = content || '';
      isInitialMount.current = false;
    }
  }, [content]);

  // Update font size when prop changes
  useEffect(() => {
    setCurrentFontSize(fontSize);
  }, [fontSize]);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handleBold = useCallback(() => {
    execCommand('bold');
  }, [execCommand]);

  const handleUnderline = useCallback(() => {
    execCommand('underline');
  }, [execCommand]);

  const handleHighlight = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    
    // Check if already highlighted
    const range = selection.getRangeAt(0);
    const parentEl = range.commonAncestorContainer.parentElement;
    
    if (parentEl?.style.backgroundColor === 'rgb(254, 240, 138)') {
      execCommand('removeFormat');
    } else {
      execCommand('backColor', '#fef08a'); // Tailwind yellow-200
    }
  }, [execCommand]);

  const handleAlign = useCallback((alignment: 'left' | 'center' | 'right') => {
    const commands = {
      left: 'justifyLeft',
      center: 'justifyCenter',
      right: 'justifyRight',
    };
    execCommand(commands[alignment]);
  }, [execCommand]);

  const handleFontSizeIncrease = useCallback(() => {
    const newSize = Math.min(currentFontSize + 2, MAX_FONT_SIZE);
    setCurrentFontSize(newSize);
    onFontSizeChange?.(newSize);
  }, [currentFontSize, onFontSizeChange]);

  const handleFontSizeDecrease = useCallback(() => {
    const newSize = Math.max(currentFontSize - 2, MIN_FONT_SIZE);
    setCurrentFontSize(newSize);
    onFontSizeChange?.(newSize);
  }, [currentFontSize, onFontSizeChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleBlur = useCallback(async () => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      onChange(currentHtml);
      
      // Auto-link citations on blur (with debounce to avoid too many calls)
      if (autoLinkTimeoutRef.current) {
        clearTimeout(autoLinkTimeoutRef.current);
      }
      
      autoLinkTimeoutRef.current = setTimeout(async () => {
        setIsAutoLinking(true);
        try {
          const result = await autoLinkCitations(currentHtml);
          if (result.linkedCount > 0 && editorRef.current) {
            editorRef.current.innerHTML = result.html;
            onChange(result.html);
            toast({
              title: `${result.linkedCount} citation(s) linked`,
              description: 'Click on linked citations to navigate to source.',
            });
          }
        } catch (err) {
          console.error('Auto-linking error:', err);
        } finally {
          setIsAutoLinking(false);
        }
      }, 500);
    }
  }, [onChange]);

  // Handle clicks on citation links
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A' && isCitationLink(target)) {
      e.preventDefault();
      const citationData = extractCitationFromLink(target);
      if (citationData && onCitationClick) {
        if (citationData.type === 'document' && citationData.documentId) {
          onCitationClick(citationData.documentId, citationData.nodeId);
        } else if (citationData.type === 'bible' && citationData.translation && citationData.book) {
          // Reconstruct Bible citation ID
          const bibleId = `bible:${citationData.translation}:${citationData.book}:${citationData.chapter}:${citationData.verse}`;
          onCitationClick(bibleId);
        }
      }
    }
  }, [onCitationClick]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Toolbar */}
      <div className="shrink-0 flex items-center gap-1 p-2 border-b border-border bg-muted/30 flex-wrap">
        {/* Font size controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleFontSizeDecrease}
            disabled={currentFontSize <= MIN_FONT_SIZE}
            title="Decrease font size"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-8 text-center">
            {currentFontSize}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleFontSizeIncrease}
            disabled={currentFontSize >= MAX_FONT_SIZE}
            title="Increase font size"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Text formatting */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleBold}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleUnderline}
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleHighlight}
          title="Highlight"
        >
          <Highlighter className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Alignment */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleAlign('left')}
          title="Align left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleAlign('center')}
          title="Align center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleAlign('right')}
          title="Align right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div
          ref={editorRef}
          contentEditable
          className={cn(
            'min-h-full p-4 outline-none',
            'prose prose-sm max-w-none',
            '[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground [&:empty]:before:pointer-events-none',
            '[&_.citation-link]:text-primary [&_.citation-link]:underline [&_.citation-link]:cursor-pointer'
          )}
          style={{ fontSize: `${currentFontSize}px` }}
          data-placeholder={placeholder}
          onInput={handleInput}
          onBlur={handleBlur}
          onClick={handleClick}
          onPaste={handlePaste}
          suppressContentEditableWarning
        />
      </div>
    </div>
  );
}
