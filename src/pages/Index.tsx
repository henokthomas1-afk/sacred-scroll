/**
 * Sacred Text Reader - Main Page
 * 
 * Obsidian-style layout with unified sidebar (Library + Notes) on the left
 * and main content area on the right that supports split view.
 * Shows Home screen when no content is active.
 * Includes first-class Bible reader integration.
 */

import { useState, useMemo, useCallback } from 'react';
import { ParsedDocument } from '@/types/document';
import { BibleNavigationState, parseBibleCitationId, isBibleCitationId } from '@/types/bible';
import { DocumentSelector, SplitScreenReader } from '@/components/reader';
import { BibleReader } from '@/components/bible';
import { GlobalNoteEditor } from '@/components/notes/obsidian/GlobalNoteEditor';
import { UnifiedSidebar } from '@/components/layout/UnifiedSidebar';
import { HomeScreen } from '@/components/layout/HomeScreen';
import { sampleDocuments } from '@/lib/sampleDocuments';
import { Button } from '@/components/ui/button';
import { 
  PanelLeftOpen, 
  PanelLeftClose, 
  BookOpen, 
  Settings,
  SplitSquareHorizontal,
  X,
  Home,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocalDocuments } from '@/hooks/useLocalDocuments';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useGlobalNotes } from '@/hooks/useGlobalNotes';
import { ImportDocumentModal } from '@/components/import/ImportDocumentModal';
import { SettingsPanel } from '@/components/settings';
import { exportToFile, importFromFile } from '@/lib/sync/syncManager';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const SIDEBAR_COLLAPSED_KEY = 'sacredScroll.sidebarCollapsed';

export default function Index() {
  const { documents: userDocuments, loading: docsLoading, refreshDocuments } = useLocalDocuments();
  const {
    notes,
    createNote,
    updateNote,
    updateNoteFontSize,
    removeCitation,
  } = useGlobalNotes();
  
  const [selectedDocument, setSelectedDocument] = useState<ParsedDocument | null>(null);
  const [secondaryDocument, setSecondaryDocument] = useState<ParsedDocument | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [documentSelectorOpen, setDocumentSelectorOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage(SIDEBAR_COLLAPSED_KEY, false);
  const [splitViewEnabled, setSplitViewEnabled] = useState(false);
  
  // Bible state
  const [showBible, setShowBible] = useState(false);
  const [bibleNavigation, setBibleNavigation] = useState<BibleNavigationState | undefined>();
  
  const isMobile = useIsMobile();

  // Combine user documents with sample documents
  const allDocuments = useMemo(() => {
    return [...userDocuments, ...sampleDocuments];
  }, [userDocuments]);

  // Do NOT auto-select a document - start with Home screen
  // (Removed the previous useMemo that auto-selected first document)

  const handleSelectDocument = useCallback((doc: ParsedDocument) => {
    setSelectedDocument(doc);
    setSecondaryDocument(null);
    setShowBible(false); // Close Bible when selecting a document
    setSidebarOpen(false);
  }, []);

  const handleSelectNote = useCallback((noteId: string) => {
    setSelectedNoteId(noteId || null);
    // Auto-enable split view when selecting a note
    if (noteId && (selectedDocument || showBible)) {
      setSplitViewEnabled(true);
    }
  }, [selectedDocument, showBible]);

  // Bible handlers
  const handleOpenBible = useCallback(() => {
    setShowBible(true);
    setSelectedDocument(null);
    setSecondaryDocument(null);
    setBibleNavigation(undefined);
  }, []);

  const handleCloseBible = useCallback(() => {
    setShowBible(false);
    setBibleNavigation(undefined);
  }, []);

  // Return to Home handler
  const handleReturnToHome = useCallback(() => {
    setSelectedDocument(null);
    setSecondaryDocument(null);
    setShowBible(false);
    setBibleNavigation(undefined);
    setSplitViewEnabled(false);
    setSelectedNoteId(null);
  }, []);

  const handleBibleCiteVerse = useCallback((verseId: string, verseText: string) => {
    // This would integrate with the notes system to insert a citation
    toast({
      title: 'Verse cited',
      description: `${verseText} - Citation saved to clipboard`,
    });
    // Copy to clipboard for easy pasting
    navigator.clipboard.writeText(`[[${verseId}|${verseText}]]`);
  }, []);

  // Home screen action handlers
  const handleHomeOpenLibrary = useCallback(() => {
    // Focus the library section - just expand sidebar if collapsed
    setSidebarCollapsed(false);
  }, [setSidebarCollapsed]);

  const handleHomeCreateNote = useCallback(async () => {
    try {
      const id = await createNote('Untitled', '', null);
      setSelectedNoteId(id);
      setSplitViewEnabled(true);
      toast({ title: 'Note created' });
    } catch (err: any) {
      toast({
        title: 'Error creating note',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [createNote]);

  const handleHomeSelectDocument = useCallback((docId: string) => {
    const doc = allDocuments.find(d => d.metadata.id === docId);
    if (doc) {
      setSelectedDocument(doc);
    }
  }, [allDocuments]);

  const handleHomeSelectNote = useCallback((noteId: string) => {
    setSelectedNoteId(noteId);
    setSplitViewEnabled(true);
  }, []);

  const handleOpenDocumentSplitView = useCallback(() => {
    setDocumentSelectorOpen(true);
  }, []);

  const handleSelectSecondaryDocument = useCallback((doc: ParsedDocument) => {
    setSecondaryDocument(doc);
  }, []);

  const handleCloseSplitView = useCallback(() => {
    setSplitViewEnabled(false);
    setSecondaryDocument(null);
  }, []);

  const handleImportSuccess = useCallback(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  // Delete document handler
  const handleDeleteDocument = useCallback(async (docId: string): Promise<boolean> => {
    // Import the db functions dynamically
    const { deleteDocument: deleteDocFromDb } = await import('@/lib/db');
    const { removeDocumentAssignment } = await import('@/lib/db/documentsDb');
    try {
      // Clear the folder assignment first
      await removeDocumentAssignment(docId);
      // Then delete the document itself
      await deleteDocFromDb(docId);
      // Clear selection if deleted document was selected
      if (selectedDocument?.metadata.id === docId) {
        setSelectedDocument(null);
        setSplitViewEnabled(false);
      }
      if (secondaryDocument?.metadata.id === docId) {
        setSecondaryDocument(null);
      }
      refreshDocuments();
      return true;
    } catch (err) {
      console.error('Error deleting document:', err);
      return false;
    }
  }, [selectedDocument, secondaryDocument, refreshDocuments]);

  const handleExportLibrary = useCallback(async () => {
    try {
      await exportToFile();
      toast({
        title: 'Library exported',
        description: 'Your library has been downloaded as library.json',
      });
    } catch (err: any) {
      toast({
        title: 'Export failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, []);

  const handleImportLibrary = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const result = await importFromFile(file);
      if (result.success) {
        toast({
          title: 'Library imported',
          description: `Added ${result.added} documents, updated ${result.updated}`,
        });
        refreshDocuments();
      } else {
        toast({
          title: 'Import failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    };
    input.click();
  }, [refreshDocuments]);

  // Handle citation navigation - find document and scroll to node
  // Also handles Bible citations (bible:translation:book:chapter:verse)
  const handleCitationClick = useCallback((citationId: string, nodeId?: string) => {
    // Check if this is a Bible citation
    if (isBibleCitationId(citationId)) {
      const bibleCitation = parseBibleCitationId(citationId);
      if (bibleCitation) {
        setBibleNavigation({
          translation: bibleCitation.translation,
          book: bibleCitation.book,
          chapter: bibleCitation.chapter,
          verse: bibleCitation.verse,
        });
        setShowBible(true);
        setSelectedDocument(null);
        return;
      }
    }

    // Regular document citation
    const targetDoc = allDocuments.find((d) => d.metadata.id === citationId);
    
    if (!targetDoc) {
      toast({
        title: 'Document not found',
        description: 'The referenced document is not in your library.',
        variant: 'destructive',
      });
      return;
    }

    // Close Bible if navigating to a document
    setShowBible(false);

    // If different document, open in secondary or switch primary
    if (selectedDocument?.metadata.id !== citationId) {
      if (splitViewEnabled) {
        setSecondaryDocument(targetDoc);
      } else {
        setSelectedDocument(targetDoc);
      }
    }

    // Scroll to node after a short delay
    if (nodeId) {
      setTimeout(() => {
        const element = document.querySelector(`[data-paragraph-id="${nodeId}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add highlight effect
        element?.classList.add('citation-highlight');
        setTimeout(() => element?.classList.remove('citation-highlight'), 2000);
      }, 100);
    }
  }, [allDocuments, selectedDocument, splitViewEnabled]);

  // Handle navigation to a note (e.g., after creating citation)
  const handleNavigateToNote = useCallback((noteId: string) => {
    setSelectedNoteId(noteId);
    setSplitViewEnabled(true);
    toast({ title: 'Note created' });
  }, []);

  const handleUpdateNote = useCallback(async (id: string, updates: Partial<{ title: string; content: string }>) => {
    await updateNote(id, updates);
  }, [updateNote]);

  const handleUpdateNoteFontSize = useCallback(async (id: string, fontSize: number) => {
    await updateNoteFontSize(id, fontSize);
  }, [updateNoteFontSize]);

  // Desktop layout with permanent sidebar
  if (!isMobile) {
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Collapsed sidebar toggle */}
        {sidebarCollapsed && (
          <div className="flex-shrink-0 w-12 border-r border-border flex flex-col items-center py-4 gap-2 bg-sidebar">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(false)}
              title="Expand sidebar"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Unified Sidebar */}
        <aside 
          className={cn(
            "flex-shrink-0 border-r border-border flex flex-col transition-all duration-300 overflow-hidden",
            sidebarCollapsed ? "w-0 opacity-0" : "w-64"
          )}
        >
          {/* Collapse button */}
          <div className="absolute top-3 left-[232px] z-10">
            {!sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSidebarCollapsed(true)}
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <UnifiedSidebar
            documents={allDocuments}
            selectedDocumentId={selectedDocument?.metadata.id || null}
            onSelectDocument={handleSelectDocument}
            selectedNoteId={selectedNoteId}
            onSelectNote={handleSelectNote}
            onOpenSettings={() => setSettingsOpen(true)}
            onImportDocument={() => setImportModalOpen(true)}
            onExportLibrary={handleExportLibrary}
            onImportLibrary={handleImportLibrary}
            onOpenBible={handleOpenBible}
            onDeleteDocument={handleDeleteDocument}
            isBibleActive={showBible}
            className="flex-1"
          />
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Content header with split view toggle */}
          {(selectedDocument || showBible) && (
            <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-border bg-card">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleReturnToHome}
                  title="Return to Home"
                >
                  <Home className="h-4 w-4" />
                </Button>
                <h1 className="font-display font-semibold text-lg truncate">
                  {showBible ? 'Bible' : selectedDocument?.metadata.title}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                {splitViewEnabled ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCloseSplitView}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    <span className="hidden sm:inline">Close Split</span>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSplitViewEnabled(true)}
                    className="gap-2"
                    disabled={!selectedNoteId}
                    title={selectedNoteId ? "Open split view with note editor" : "Select a note first"}
                  >
                    <SplitSquareHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline">Split View</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 min-h-0">
            {/* Home screen - no content active */}
            {!selectedDocument && !showBible ? (
              <HomeScreen
                onOpenLibrary={handleHomeOpenLibrary}
                onImportDocument={() => setImportModalOpen(true)}
                onCreateNote={handleHomeCreateNote}
                recentDocuments={allDocuments.slice(0, 5).map(d => ({ id: d.metadata.id, title: d.metadata.title }))}
                recentNotes={notes.slice(0, 5).map(n => ({ id: n.id, title: n.title }))}
                onSelectDocument={handleHomeSelectDocument}
                onSelectNote={handleHomeSelectNote}
              />
            ) : showBible ? (
              /* Bible reader view */
              splitViewEnabled && selectedNoteId ? (
                <ResizablePanelGroup direction="horizontal" className="h-full">
                  <ResizablePanel defaultSize={60} minSize={30}>
                    <BibleReader
                      initialNavigation={bibleNavigation}
                      onCiteVerse={handleBibleCiteVerse}
                      onClose={handleCloseBible}
                    />
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={40} minSize={25}>
                    <div className="h-full flex flex-col border-l border-border">
                      <GlobalNoteEditor
                        noteId={selectedNoteId}
                        onUpdate={handleUpdateNote}
                        onFontSizeUpdate={handleUpdateNoteFontSize}
                        onCitationClick={handleCitationClick}
                        onRemoveCitation={removeCitation}
                      />
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              ) : (
                <BibleReader
                  initialNavigation={bibleNavigation}
                  onCiteVerse={handleBibleCiteVerse}
                  onClose={handleCloseBible}
                />
              )
            ) : splitViewEnabled && selectedNoteId ? (
              /* Document reader with split note editor */
              <ResizablePanelGroup direction="horizontal" className="h-full">
                <ResizablePanel defaultSize={60} minSize={30}>
                  <SplitScreenReader
                    primaryDocument={selectedDocument!}
                    secondaryDocument={secondaryDocument}
                    onOpenSecondary={handleOpenDocumentSplitView}
                    onCloseSecondary={() => setSecondaryDocument(null)}
                    onNavigateToNode={handleCitationClick}
                    onNavigateToNote={handleNavigateToNote}
                  />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={40} minSize={25}>
                  <div className="h-full flex flex-col border-l border-border">
                    <GlobalNoteEditor
                      noteId={selectedNoteId}
                      onUpdate={handleUpdateNote}
                      onFontSizeUpdate={handleUpdateNoteFontSize}
                      onCitationClick={handleCitationClick}
                      onRemoveCitation={removeCitation}
                    />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              /* Document reader only */
              <SplitScreenReader
                primaryDocument={selectedDocument!}
                secondaryDocument={secondaryDocument}
                onOpenSecondary={handleOpenDocumentSplitView}
                onCloseSecondary={() => setSecondaryDocument(null)}
                onNavigateToNode={handleCitationClick}
                onNavigateToNote={handleNavigateToNote}
              />
            )}
          </div>
        </div>

        {/* Modals */}
        <ImportDocumentModal
          open={importModalOpen}
          onOpenChange={setImportModalOpen}
          onSuccess={handleImportSuccess}
        />
        <SettingsPanel
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          onOpenImport={() => setImportModalOpen(true)}
        />
        <DocumentSelector
          open={documentSelectorOpen}
          onOpenChange={setDocumentSelectorOpen}
          documents={allDocuments}
          currentDocumentId={selectedDocument?.metadata.id}
          onSelect={handleSelectSecondaryDocument}
          title="Select document for split view"
        />
      </div>
    );
  }

  // Mobile layout with sheet sidebar
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Mobile Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <PanelLeftOpen className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <UnifiedSidebar
              documents={allDocuments}
              selectedDocumentId={selectedDocument?.metadata.id || null}
              onSelectDocument={handleSelectDocument}
              selectedNoteId={selectedNoteId}
              onSelectNote={handleSelectNote}
              onOpenSettings={() => {
                setSidebarOpen(false);
                setSettingsOpen(true);
              }}
              onImportDocument={() => {
                setSidebarOpen(false);
                setImportModalOpen(true);
              }}
              onExportLibrary={handleExportLibrary}
              onImportLibrary={handleImportLibrary}
              onOpenBible={() => {
                setSidebarOpen(false);
                handleOpenBible();
              }}
              onDeleteDocument={handleDeleteDocument}
              isBibleActive={showBible}
            />
          </SheetContent>
        </Sheet>

        {/* Mobile header content - changes based on view */}
        {(selectedDocument || showBible) ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReturnToHome}
              title="Return to Home"
            >
              <Home className="h-5 w-5" />
            </Button>
            <h1 className="font-display font-semibold text-lg truncate flex-1 text-center">
              {showBible ? 'Bible' : selectedDocument?.metadata.title}
            </h1>
          </>
        ) : (
          <h1 className="font-display font-semibold text-lg truncate flex-1 text-center">
            Sacred Library
          </h1>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0">
        {showBible ? (
          <BibleReader
            initialNavigation={bibleNavigation}
            onCiteVerse={handleBibleCiteVerse}
            onClose={handleCloseBible}
          />
        ) : selectedDocument ? (
          <SplitScreenReader
            primaryDocument={selectedDocument}
            secondaryDocument={null}
            onNavigateToNode={handleCitationClick}
            onNavigateToNote={handleNavigateToNote}
          />
        ) : (
          <HomeScreen
            onOpenLibrary={() => setSidebarOpen(true)}
            onImportDocument={() => setImportModalOpen(true)}
            onCreateNote={handleHomeCreateNote}
            recentDocuments={allDocuments.slice(0, 3).map(d => ({ id: d.metadata.id, title: d.metadata.title }))}
            recentNotes={notes.slice(0, 3).map(n => ({ id: n.id, title: n.title }))}
            onSelectDocument={handleHomeSelectDocument}
            onSelectNote={handleHomeSelectNote}
          />
        )}
      </main>

      {/* Modals */}
      <ImportDocumentModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onSuccess={handleImportSuccess}
      />
      <SettingsPanel
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onOpenImport={() => setImportModalOpen(true)}
      />
    </div>
  );
}

// EmptyState removed - replaced by HomeScreen
