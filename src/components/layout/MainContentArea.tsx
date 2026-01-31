/**
 * MainContentArea - Content area with optional split view for Reader + Note Editor
 * 
 * Handles the main content layout independent of the sidebar.
 * Split view only affects this area.
 */

import { ParsedDocument } from '@/types/document';
import { SplitScreenReader } from '@/components/reader';
import { GlobalNoteEditor } from '@/components/notes/obsidian/GlobalNoteEditor';
import { useGlobalNotes } from '@/hooks/useGlobalNotes';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, SplitSquareHorizontal, X } from 'lucide-react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';

interface MainContentAreaProps {
  selectedDocument: ParsedDocument | null;
  secondaryDocument: ParsedDocument | null;
  selectedNoteId: string | null;
  splitViewEnabled: boolean;
  onOpenSplitView: () => void;
  onCloseSplitView: () => void;
  onNavigateToNode: (documentId: string, nodeId?: string) => void;
  onNavigateToNote: (noteId: string) => void;
  onImportDocument: () => void;
  className?: string;
}

export function MainContentArea({
  selectedDocument,
  secondaryDocument,
  selectedNoteId,
  splitViewEnabled,
  onOpenSplitView,
  onCloseSplitView,
  onNavigateToNode,
  onNavigateToNote,
  onImportDocument,
  className,
}: MainContentAreaProps) {
  const {
    updateNote,
    updateNoteFontSize,
    removeCitation,
  } = useGlobalNotes();

  const handleUpdateNote = async (id: string, updates: Partial<{ title: string; content: string }>) => {
    await updateNote(id, updates);
  };

  const handleUpdateNoteFontSize = async (id: string, fontSize: number) => {
    await updateNoteFontSize(id, fontSize);
  };

  // No document selected
  if (!selectedDocument) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full p-8 text-center", className)}>
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <h2 className="font-display text-xl font-semibold text-foreground mb-2">
          Select a Document
        </h2>
        <p className="text-muted-foreground max-w-md mb-6">
          Choose a document from the sidebar to begin reading.
        </p>
        <Button onClick={onImportDocument} className="gap-2">
          <Plus className="h-4 w-4" />
          Import Document
        </Button>
      </div>
    );
  }

  // Split view: Reader + Note Editor
  if (splitViewEnabled && selectedNoteId) {
    return (
      <ResizablePanelGroup direction="horizontal" className={cn("h-full", className)}>
        <ResizablePanel defaultSize={60} minSize={30}>
          <div className="h-full flex flex-col">
            {/* Header with close button */}
            <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
              <span className="text-sm font-medium">Reader</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onCloseSplitView}
                title="Close split view"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 min-h-0">
              <SplitScreenReader
                primaryDocument={selectedDocument}
                secondaryDocument={secondaryDocument}
                onNavigateToNode={onNavigateToNode}
                onNavigateToNote={onNavigateToNote}
              />
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={40} minSize={25}>
          <div className="h-full flex flex-col border-l border-border">
            <div className="shrink-0 flex items-center px-4 py-2 border-b border-border bg-muted/30">
              <span className="text-sm font-medium">Note Editor</span>
            </div>
            <div className="flex-1 min-h-0">
              <GlobalNoteEditor
                noteId={selectedNoteId}
                onUpdate={handleUpdateNote}
                onFontSizeUpdate={handleUpdateNoteFontSize}
                onCitationClick={onNavigateToNode}
                onRemoveCitation={removeCitation}
              />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  }

  // Reader only (with optional split view button)
  return (
    <div className={cn("h-full flex flex-col", className)}>
      <SplitScreenReader
        primaryDocument={selectedDocument}
        secondaryDocument={secondaryDocument}
        onOpenSecondary={onOpenSplitView}
        onCloseSecondary={onCloseSplitView}
        onNavigateToNode={onNavigateToNode}
        onNavigateToNote={onNavigateToNote}
      />
    </div>
  );
}
