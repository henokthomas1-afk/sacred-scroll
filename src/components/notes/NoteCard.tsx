/**
 * NoteCard - Display a single note with actions
 * 
 * Works with local IndexedDB storage.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { NoteWithCitations } from '@/hooks/useLocalNotes';
import { NoteEditor } from './NoteEditor';
import { Edit2, Trash2, Link, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface NoteCardProps {
  note: NoteWithCitations;
  onUpdate: (noteId: string, content: string) => Promise<boolean>;
  onDelete: (noteId: string) => Promise<boolean>;
  onCitationClick?: (documentId: string, nodeId?: string) => void;
  className?: string;
}

export function NoteCard({
  note,
  onUpdate,
  onDelete,
  onCitationClick,
  className,
}: NoteCardProps) {
  const [editing, setEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleSave = async (content: string) => {
    await onUpdate(note.id, content);
    setEditing(false);
  };

  const handleDelete = async () => {
    await onDelete(note.id);
    setDeleteDialogOpen(false);
  };

  const noteTypeLabel = {
    document: 'Document Note',
    section: 'Section Note',
    paragraph: 'Paragraph Note',
  }[note.type];

  if (editing) {
    return (
      <div className={cn('p-3 bg-card border border-border rounded-md', className)}>
        <NoteEditor
          initialContent={note.content}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <>
      <div className={cn('p-3 bg-card border border-border rounded-md group', className)}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            <span>{noteTypeLabel}</span>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setEditing(true)}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <p className="text-sm whitespace-pre-wrap">{note.content}</p>

        {note.citations.length > 0 && (
          <div className="mt-3 pt-2 border-t border-border space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Link className="h-3 w-3" />
              Citations
            </span>
            {note.citations.map((citation) => (
              <button
                key={citation.id}
                className="block text-xs text-primary hover:underline cursor-pointer"
                onClick={() =>
                  onCitationClick?.(citation.targetDocumentId, citation.targetNodeId || undefined)
                }
              >
                {citation.citationText}
              </button>
            ))}
          </div>
        )}

        <div className="mt-2 text-xs text-muted-foreground">
          {new Date(note.createdAt).toLocaleDateString()}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this note and all its citations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
