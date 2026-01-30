/**
 * NotesPanel - Sidebar panel for viewing and managing notes
 */

import { useState } from "react";
import { useNotes, NoteWithCitations } from "@/hooks/useNotes";
import { useAuth } from "@/hooks/useAuth";
import { NoteCard } from "./NoteCard";
import { NoteEditor } from "./NoteEditor";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText, Layers, BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NoteType } from "@/types/database";
import { toast } from "@/hooks/use-toast";

interface NotesPanelProps {
  documentId: string | null;
  documentTitle?: string;
  selectedNodeId?: string | null;
  onCitationClick?: (documentId: string, nodeId?: string) => void;
  className?: string;
}

export function NotesPanel({
  documentId,
  documentTitle,
  selectedNodeId,
  onCitationClick,
  className,
}: NotesPanelProps) {
  const { isAuthenticated } = useAuth();
  const { notes, loading, createNote, updateNote, deleteNote } = useNotes(documentId);
  const [creatingNote, setCreatingNote] = useState<NoteType | null>(null);

  const handleCreateNote = async (content: string) => {
    if (!creatingNote) return;

    try {
      await createNote(
        creatingNote,
        content,
        creatingNote === "paragraph" ? selectedNodeId || undefined : undefined
      );
      setCreatingNote(null);
      toast({
        title: "Note saved",
        description: "Your note has been added.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateNote = async (noteId: string, content: string) => {
    const success = await updateNote(noteId, content);
    if (success) {
      toast({ title: "Note updated" });
    }
    return success;
  };

  const handleDeleteNote = async (noteId: string) => {
    const success = await deleteNote(noteId);
    if (success) {
      toast({ title: "Note deleted" });
    }
    return success;
  };

  // Group notes by type
  const documentNotes = notes.filter((n) => n.note_type === "document");
  const sectionNotes = notes.filter((n) => n.note_type === "section");
  const paragraphNotes = notes.filter((n) => n.note_type === "paragraph");

  if (!documentId) {
    return (
      <div className={cn("flex items-center justify-center h-full text-muted-foreground", className)}>
        <p>Select a document to view notes</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full text-center p-4", className)}>
        <FileText className="h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">Sign in to create and view notes</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="p-4 border-b border-border">
        <h2 className="font-display font-semibold">Notes</h2>
        {documentTitle && (
          <p className="text-xs text-muted-foreground truncate">{documentTitle}</p>
        )}
      </div>

      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b px-4">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          <TabsTrigger value="document" className="text-xs">Document</TabsTrigger>
          <TabsTrigger value="section" className="text-xs">Section</TabsTrigger>
          <TabsTrigger value="paragraph" className="text-xs">Paragraph</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <TabsContent value="all" className="p-4 space-y-3 mt-0">
                {notes.length === 0 ? (
                  <EmptyNotes onAdd={() => setCreatingNote("document")} />
                ) : (
                  notes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onUpdate={handleUpdateNote}
                      onDelete={handleDeleteNote}
                      onCitationClick={onCitationClick}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="document" className="p-4 space-y-3 mt-0">
                <NoteTypeSection
                  notes={documentNotes}
                  type="document"
                  icon={<BookOpen className="h-4 w-4" />}
                  creatingNote={creatingNote}
                  setCreatingNote={setCreatingNote}
                  onCreateNote={handleCreateNote}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                  onCitationClick={onCitationClick}
                />
              </TabsContent>

              <TabsContent value="section" className="p-4 space-y-3 mt-0">
                <NoteTypeSection
                  notes={sectionNotes}
                  type="section"
                  icon={<Layers className="h-4 w-4" />}
                  creatingNote={creatingNote}
                  setCreatingNote={setCreatingNote}
                  onCreateNote={handleCreateNote}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                  onCitationClick={onCitationClick}
                />
              </TabsContent>

              <TabsContent value="paragraph" className="p-4 space-y-3 mt-0">
                <NoteTypeSection
                  notes={paragraphNotes}
                  type="paragraph"
                  icon={<FileText className="h-4 w-4" />}
                  creatingNote={creatingNote}
                  setCreatingNote={setCreatingNote}
                  onCreateNote={handleCreateNote}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                  onCitationClick={onCitationClick}
                  requiresSelection
                  hasSelection={!!selectedNodeId}
                />
              </TabsContent>
            </>
          )}
        </ScrollArea>
      </Tabs>
    </div>
  );
}

interface NoteTypeSectionProps {
  notes: NoteWithCitations[];
  type: NoteType;
  icon: React.ReactNode;
  creatingNote: NoteType | null;
  setCreatingNote: (type: NoteType | null) => void;
  onCreateNote: (content: string) => Promise<void>;
  onUpdateNote: (noteId: string, content: string) => Promise<boolean>;
  onDeleteNote: (noteId: string) => Promise<boolean>;
  onCitationClick?: (documentId: string, nodeId?: string) => void;
  requiresSelection?: boolean;
  hasSelection?: boolean;
}

function NoteTypeSection({
  notes,
  type,
  icon,
  creatingNote,
  setCreatingNote,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onCitationClick,
  requiresSelection,
  hasSelection,
}: NoteTypeSectionProps) {
  const canCreate = !requiresSelection || hasSelection;

  return (
    <div className="space-y-3">
      {creatingNote === type ? (
        <NoteEditor
          onSave={onCreateNote}
          onCancel={() => setCreatingNote(null)}
          placeholder={`Add a ${type} note...`}
        />
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={() => setCreatingNote(type)}
          disabled={!canCreate}
        >
          <Plus className="h-4 w-4" />
          Add {type} note
          {requiresSelection && !hasSelection && (
            <span className="text-xs text-muted-foreground">(select a paragraph first)</span>
          )}
        </Button>
      )}

      {notes.length === 0 && creatingNote !== type ? (
        <p className="text-center text-sm text-muted-foreground py-4">
          No {type} notes yet
        </p>
      ) : (
        notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onUpdate={onUpdateNote}
            onDelete={onDeleteNote}
            onCitationClick={onCitationClick}
          />
        ))
      )}
    </div>
  );
}

function EmptyNotes({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-8">
      <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
      <p className="text-muted-foreground mb-4">No notes yet</p>
      <Button variant="outline" size="sm" onClick={onAdd}>
        <Plus className="h-4 w-4 mr-2" />
        Add your first note
      </Button>
    </div>
  );
}
