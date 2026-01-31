/**
 * CitationAnchorMenu - Popover menu for creating citation anchors
 * 
 * Shown when clicking the citation icon on a paragraph.
 * Allows adding to existing note or creating new note with citation.
 */

import { useState, useEffect, useCallback } from 'react';
import { CitableNode } from '@/types/document';
import { GlobalNote, getAllGlobalNotes, createGlobalNote } from '@/lib/db/notesDb';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Link, 
  Plus, 
  FileText,
  Search,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CitationAnchorMenuProps {
  node: CitableNode;
  documentId: string;
  documentTitle: string;
  onAddToNote: (noteId: string, noteTitle: string) => void;
  onCreateNote: (noteId: string, noteTitle: string) => void;
  className?: string;
}

export function CitationAnchorMenu({
  node,
  documentId,
  documentTitle,
  onAddToNote,
  onCreateNote,
  className,
}: CitationAnchorMenuProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<GlobalNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');

  // Load notes when popover opens
  useEffect(() => {
    if (open) {
      setLoading(true);
      getAllGlobalNotes()
        .then(setNotes)
        .finally(() => setLoading(false));
    }
  }, [open]);

  // Filter notes by search
  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectNote = useCallback((note: GlobalNote) => {
    onAddToNote(note.id, note.title);
    setOpen(false);
    setSearch('');
  }, [onAddToNote]);

  const handleCreateNote = useCallback(async () => {
    if (!newNoteTitle.trim()) return;

    setCreating(true);
    try {
      const noteId = await createGlobalNote(newNoteTitle.trim());
      onCreateNote(noteId, newNoteTitle.trim());
      setOpen(false);
      setNewNoteTitle('');
    } finally {
      setCreating(false);
    }
  }, [newNoteTitle, onCreateNote]);

  const displayLabel = `${documentTitle} §${node.displayNumber}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
            "text-muted-foreground hover:text-primary",
            className
          )}
          title="Add citation to note"
        >
          <Link className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-72 p-0" 
        align="start"
        side="right"
        sideOffset={8}
      >
        <div className="p-3 border-b border-border">
          <p className="text-xs text-muted-foreground mb-1">Cite paragraph</p>
          <p className="text-sm font-medium truncate">{displayLabel}</p>
        </div>

        {/* Search */}
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>

        {/* Notes list */}
        <ScrollArea className="max-h-48">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {search ? 'No matching notes' : 'No notes yet'}
            </div>
          ) : (
            <div className="p-1">
              {filteredNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-left",
                    "hover:bg-accent text-sm transition-colors"
                  )}
                >
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{note.title}</span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Create new note */}
        <div className="p-2 border-t border-border space-y-2">
          <div className="flex gap-2">
            <Input
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="New note title..."
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateNote();
                }
              }}
            />
            <Button
              size="sm"
              className="h-8 shrink-0"
              onClick={handleCreateNote}
              disabled={!newNoteTitle.trim() || creating}
            >
              {creating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
