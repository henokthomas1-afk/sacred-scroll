/**
 * CitationAnchorList - Displays citation anchors attached to a note
 * 
 * Shows paragraph references with navigation and removal.
 * Clicking navigates to the paragraph in the reader.
 */

import { CitationAnchor, removeCitationAnchor } from '@/lib/db/notesDb';
import { useNoteAnchors } from '@/hooks/useCitationAnchors';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bookmark, 
  ExternalLink, 
  X, 
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface CitationAnchorListProps {
  noteId: string;
  onNavigate?: (documentId: string, nodeId: string) => void;
  className?: string;
}

export function CitationAnchorList({
  noteId,
  onNavigate,
  className,
}: CitationAnchorListProps) {
  const { anchors, loading, refresh } = useNoteAnchors(noteId);

  const handleRemove = async (anchor: CitationAnchor) => {
    try {
      await removeCitationAnchor(anchor.id);
      refresh();
      toast({ title: 'Citation removed' });
    } catch (err: any) {
      toast({
        title: 'Error removing citation',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleNavigate = (anchor: CitationAnchor) => {
    onNavigate?.(anchor.documentId, anchor.nodeId);
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-2', className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (anchors.length === 0) {
    return null;
  }

  return (
    <div className={cn('border-t border-border', className)}>
      <div className="px-4 py-3">
        <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
          <Bookmark className="h-4 w-4" />
          Cited Paragraphs ({anchors.length})
        </h3>
        <ScrollArea className="max-h-40">
          <div className="space-y-1.5">
            {anchors.map((anchor) => (
              <div
                key={anchor.id}
                className="flex items-center justify-between p-2 bg-muted/50 rounded-md group"
              >
                <button
                  className="flex items-center gap-2 text-sm text-left hover:text-primary transition-colors min-w-0"
                  onClick={() => handleNavigate(anchor)}
                  title="Navigate to paragraph"
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <span className="truncate">{anchor.displayLabel}</span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => handleRemove(anchor)}
                  title="Remove citation"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
