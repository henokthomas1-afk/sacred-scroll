/**
 * SimpleNotesPane - Right pane with local-only notes management
 * 
 * Features:
 * - Create, select, edit notes
 * - Notes stored in local state (can be extended to localStorage)
 * - Independent scrolling from reader pane
 * 
 * NO cloud sync, NO Supabase, NO folders, NO drag-and-drop
 */

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Plus, FileText, ChevronLeft } from "lucide-react";

interface SimpleNote {
  id: string;
  title: string;
  content: string;
}

interface SimpleNotesPaneProps {
  className?: string;
}

export function SimpleNotesPane({ className }: SimpleNotesPaneProps) {
  const [notes, setNotes] = useState<SimpleNote[]>(() => {
    // Initialize with some sample notes for scroll testing
    return Array.from({ length: 20 }, (_, i) => ({
      id: `note-${i + 1}`,
      title: `Note ${i + 1}`,
      content: `This is the content of note ${i + 1}. You can edit this text.`,
    }));
  });
  
  const [selectedNote, setSelectedNote] = useState<SimpleNote | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingContent, setEditingContent] = useState("");

  const handleCreateNote = useCallback(() => {
    const newNote: SimpleNote = {
      id: `note-${Date.now()}`,
      title: "Untitled Note",
      content: "",
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNote(newNote);
    setEditingTitle(newNote.title);
    setEditingContent(newNote.content);
  }, []);

  const handleSelectNote = useCallback((note: SimpleNote) => {
    // Save current edits before switching
    if (selectedNote) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === selectedNote.id
            ? { ...n, title: editingTitle, content: editingContent }
            : n
        )
      );
    }
    setSelectedNote(note);
    setEditingTitle(note.title);
    setEditingContent(note.content);
  }, [selectedNote, editingTitle, editingContent]);

  const handleBackToList = useCallback(() => {
    // Save edits before going back
    if (selectedNote) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === selectedNote.id
            ? { ...n, title: editingTitle, content: editingContent }
            : n
        )
      );
    }
    setSelectedNote(null);
  }, [selectedNote, editingTitle, editingContent]);

  // Note Editor View
  if (selectedNote) {
    return (
      <div className={cn("flex flex-col h-full bg-muted/30", className)}>
        {/* Fixed Header */}
        <header className="shrink-0 border-b border-border px-4 py-3 bg-card">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToList}
              className="shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Input
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              className="flex-1 font-semibold border-none bg-transparent px-0 focus-visible:ring-0"
              placeholder="Note title..."
            />
          </div>
        </header>

        {/* Scrollable Editor */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <Textarea
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            className="min-h-[300px] w-full resize-none border-none bg-transparent focus-visible:ring-0"
            placeholder="Write your note here..."
          />
        </div>
      </div>
    );
  }

  // Notes List View
  return (
    <div className={cn("flex flex-col h-full bg-muted/30", className)}>
      {/* Fixed Header */}
      <header className="shrink-0 border-b border-border px-4 py-3 bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg text-foreground">Notes</h2>
            <p className="text-sm text-muted-foreground">
              {notes.length} notes • Scroll independently
            </p>
          </div>
          <Button size="sm" onClick={handleCreateNote} className="gap-1">
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>
      </header>

      {/* Scrollable Notes List */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-2 space-y-1">
          {notes.map((note) => (
            <button
              key={note.id}
              onClick={() => handleSelectNote(note)}
              className={cn(
                "w-full text-left p-3 rounded-lg transition-colors",
                "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring",
                "border border-transparent hover:border-border"
              )}
            >
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-sm text-foreground truncate">
                    {note.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {note.content || "Empty note"}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
        
        {/* End marker for scroll testing */}
        <div className="py-8 text-center text-muted-foreground text-xs border-t border-border mt-4 mx-4">
          — End of Notes List —
        </div>
      </div>
    </div>
  );
}
