/**
 * GlobalNoteEditor - Full note editor with title, rich content, and citations
 * 
 * Now uses RichTextEditor for document-style formatting:
 * - Bold, Underline, Highlight
 * - Text alignment
 * - Per-note font size
 */

import { useState, useEffect, useCallback } from 'react';
import { GlobalNote, NoteCitation, updateGlobalNoteFontSize } from '@/lib/db/notesDb';
import { getGlobalNote, getCitationsForGlobalNote } from '@/lib/db/notesDb';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RichTextEditor } from './RichTextEditor';
import { CitationAnchorList } from './CitationAnchorList';
import { 
  Link, 
  ExternalLink, 
  X, 
  Loader2,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface GlobalNoteEditorProps {
  noteId: string;
  onUpdate: (id: string, updates: Partial<Pick<GlobalNote, 'title' | 'content'>>) => Promise<void>;
  onFontSizeUpdate?: (id: string, fontSize: number) => Promise<void>;
  onCitationClick?: (documentId: string, nodeId?: string) => void;
  onRemoveCitation?: (citationId: string) => Promise<void>;
  className?: string;
}

export function GlobalNoteEditor({
  noteId,
  onUpdate,
  onFontSizeUpdate,
  onCitationClick,
  onRemoveCitation,
  className,
}: GlobalNoteEditorProps) {
  const [note, setNote] = useState<GlobalNote | null>(null);
  const [citations, setCitations] = useState<NoteCitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [hasChanges, setHasChanges] = useState(false);

  // Load note data
  useEffect(() => {
    const loadNote = async () => {
      try {
        setLoading(true);
        const [noteData, citationsData] = await Promise.all([
          getGlobalNote(noteId),
          getCitationsForGlobalNote(noteId),
        ]);
        
        if (noteData) {
          setNote(noteData);
          setTitle(noteData.title);
          setContent(noteData.content);
          setFontSize(noteData.fontSize || 16);
          setCitations(citationsData);
        }
      } catch (err: any) {
        console.error('Error loading note:', err);
        toast({
          title: 'Error loading note',
          description: err.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadNote();
  }, [noteId]);

  // Track changes
  useEffect(() => {
    if (note) {
      setHasChanges(title !== note.title || content !== note.content);
    }
  }, [title, content, note]);

  const handleSave = useCallback(async () => {
    if (!hasChanges) return;
    
    try {
      setSaving(true);
      await onUpdate(noteId, { title, content });
      setNote((prev) => prev ? { ...prev, title, content } : null);
      setHasChanges(false);
      toast({ title: 'Note saved' });
    } catch (err: any) {
      toast({
        title: 'Error saving note',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [noteId, title, content, hasChanges, onUpdate]);

  // Handle font size change
  const handleFontSizeChange = useCallback(async (newFontSize: number) => {
    setFontSize(newFontSize);
    if (onFontSizeUpdate) {
      try {
        await onFontSizeUpdate(noteId, newFontSize);
      } catch (err: any) {
        console.error('Error saving font size:', err);
      }
    }
  }, [noteId, onFontSizeUpdate]);

  // Auto-save on blur - now handled by RichTextEditor
  const handleTitleBlur = useCallback(() => {
    if (hasChanges) {
      handleSave();
    }
  }, [hasChanges, handleSave]);

  // Keyboard shortcut to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const handleRemoveCitation = async (citationId: string) => {
    if (!onRemoveCitation) return;
    
    try {
      await onRemoveCitation(citationId);
      setCitations((prev) => prev.filter(c => c.id !== citationId));
      toast({ title: 'Citation removed' });
    } catch (err: any) {
      toast({
        title: 'Error removing citation',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground', className)}>
        Note not found
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full min-h-0 overflow-hidden', className)}>
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-border space-y-2">
        <div className="flex items-center gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="Untitled Note"
            className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0"
          />
          {hasChanges && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSave}
              disabled={saving}
              className="shrink-0"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Created {new Date(note.createdAt).toLocaleDateString()}</span>
          {note.updatedAt !== note.createdAt && (
            <>
              <span>•</span>
              <span>Updated {new Date(note.updatedAt).toLocaleDateString()}</span>
            </>
          )}
        </div>
      </div>

      {/* Content - Rich Text Editor */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <RichTextEditor
          content={content}
          fontSize={fontSize}
          onChange={(html) => {
            setContent(html);
          }}
          onFontSizeChange={handleFontSizeChange}
          placeholder="Write your thoughts here..."
        />
      </div>

      {/* Citation Anchors (paragraph references) */}
      <CitationAnchorList
        noteId={noteId}
        onNavigate={onCitationClick}
      />
      {citations.length > 0 && (
        <div className="shrink-0 p-4 border-t border-border">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Link className="h-4 w-4" />
            Citations ({citations.length})
          </h3>
          <ScrollArea className="max-h-32">
            <div className="space-y-2">
              {citations.map((citation) => (
                <div
                  key={citation.id}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-md group"
                >
                  <button
                    className="flex items-center gap-2 text-sm text-left hover:text-primary transition-colors"
                    onClick={() => onCitationClick?.(citation.targetDocumentId, citation.targetNodeId || undefined)}
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate">{citation.citationText}</span>
                  </button>
                  {onRemoveCitation && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveCitation(citation.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
