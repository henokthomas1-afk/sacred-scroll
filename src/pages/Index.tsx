/**
 * Sacred Text Reader - Main Page
 * 
 * Obsidian-style layout with unified sidebar (Library + Notes) on the left
 * and main content area on the right that supports flexible split view.
 * Notes can be primary workspace content with any secondary content.
 */

import { useState, useMemo, useCallback } from 'react';
import { ParsedDocument } from '@/types/document';
import { BibleNavigationState } from '@/types/bible';
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
import { useWorkspace } from '@/hooks/useWorkspace';
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
  
  // Combine user documents with sample documents
  const allDocuments = useMemo(() => {
    return [...userDocuments, ...sampleDocuments];
  }, [userDocuments]);

  // Workspace state management (flexible primary/secondary panels)
  const workspace = useWorkspace({ documents: allDocuments });
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [documentSelectorOpen, setDocumentSelectorOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage(SIDEBAR_COLLAPSED_KEY, false);
  
  const isMobile = useIsMobile();

  // ============= Sidebar Actions =============

  const handleSelectDocument = useCallback((doc: ParsedDocument) => {
    workspace.openDocumentPrimary(doc.metadata.id);
    setSidebarOpen(false);
  }, [workspace]);

  const handleSelectNote = useCallback((noteId: string) => {
    if (!noteId) return;
    
    // If there's already primary content, open note in secondary
    if (workspace.state.primaryView !== 'home') {
      workspace.openNoteSecondary(noteId);
    } else {
      // Open as primary
      workspace.openNotePrimary(noteId);
    }
  }, [workspace]);

  const handleOpenDocumentInSplit = useCallback((docId: string) => {
    workspace.openDocumentSecondary(docId);
  }, [workspace]);

  const handleOpenNoteInSplit = useCallback((noteId: string) => {
    workspace.openNoteSecondary(noteId);
  }, [workspace]);

  const handleOpenBibleInSplit = useCallback(() => {
    workspace.openBibleSecondary();
  }, [workspace]);

  // Bible handlers
  const handleOpenBible = useCallback(() => {
    workspace.openBiblePrimary();
  }, [workspace]);

  const handleReturnToHome = useCallback(() => {
    workspace.returnToHome();
  }, [workspace]);

  const handleBibleCiteVerse = useCallback((verseId: string, verseText: string) => {
    toast({
      title: 'Verse cited',
      description: `${verseText} - Citation saved to clipboard`,
    });
    navigator.clipboard.writeText(`[[${verseId}|${verseText}]]`);
  }, []);

  // ============= Home Screen Actions =============

  const handleHomeOpenLibrary = useCallback(() => {
    setSidebarCollapsed(false);
  }, [setSidebarCollapsed]);

  const handleHomeCreateNote = useCallback(async () => {
    try {
      const id = await createNote('Untitled', '', null);
      workspace.openNotePrimary(id);
      toast({ title: 'Note created' });
    } catch (err: any) {
      toast({
        title: 'Error creating note',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [createNote, workspace]);

  const handleHomeSelectDocument = useCallback((docId: string) => {
    workspace.openDocumentPrimary(docId);
  }, [workspace]);

  const handleHomeSelectNote = useCallback((noteId: string) => {
    workspace.openNotePrimary(noteId);
  }, [workspace]);

  // ============= Split View Actions =============

  const handleOpenDocumentSplitView = useCallback(() => {
    setDocumentSelectorOpen(true);
  }, []);

  const handleSelectSecondaryDocument = useCallback((doc: ParsedDocument) => {
    workspace.openDocumentSecondary(doc.metadata.id);
    setDocumentSelectorOpen(false);
  }, [workspace]);

  const handleCloseSplitView = useCallback(() => {
    workspace.closeSecondary();
  }, [workspace]);

  // ============= Document Management =============

  const handleImportSuccess = useCallback(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  const handleDeleteDocument = useCallback(async (docId: string): Promise<boolean> => {
    const { deleteDocument: deleteDocFromDb } = await import('@/lib/db');
    const { removeDocumentAssignment } = await import('@/lib/db/documentsDb');
    try {
      await removeDocumentAssignment(docId);
      await deleteDocFromDb(docId);
      
      // Clear workspace if needed
      if (workspace.state.primaryDocumentId === docId) {
        workspace.returnToHome();
      } else if (workspace.state.secondaryDocumentId === docId) {
        workspace.closeSecondary();
      }
      
      refreshDocuments();
      return true;
    } catch (err) {
      console.error('Error deleting document:', err);
      return false;
    }
  }, [workspace, refreshDocuments]);

  const handleRenameDocument = useCallback(async (docId: string, newName: string): Promise<void> => {
    const { renameDocument } = await import('@/lib/db');
    await renameDocument(docId, newName);
    refreshDocuments();
  }, [refreshDocuments]);

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

  // ============= Citation Navigation =============

  const handleCitationClick = useCallback((citationId: string, nodeId?: string) => {
    workspace.handleCitationNavigation(citationId, nodeId);
  }, [workspace]);

  const handleNavigateToNote = useCallback((noteId: string) => {
    // Open note in secondary panel when navigating from a citation
    if (workspace.state.primaryView !== 'home') {
      workspace.openNoteSecondary(noteId);
    } else {
      workspace.openNotePrimary(noteId);
    }
    toast({ title: 'Note opened' });
  }, [workspace]);

  // ============= Note Operations =============

  const handleUpdateNote = useCallback(async (id: string, updates: Partial<{ title: string; content: string }>) => {
    await updateNote(id, updates);
  }, [updateNote]);

  const handleUpdateNoteFontSize = useCallback(async (id: string, fontSize: number) => {
    await updateNoteFontSize(id, fontSize);
  }, [updateNoteFontSize]);

  const handleRemoveCitation = useCallback(async (citationId: string) => {
    await removeCitation(citationId);
  }, [removeCitation]);

  // ============= Render Helpers =============

  const getPrimaryTitle = () => {
    switch (workspace.state.primaryView) {
      case 'document':
        return workspace.primaryDocument?.metadata.title || 'Document';
      case 'bible':
        return 'Bible';
      case 'note':
        const note = notes.find(n => n.id === workspace.state.primaryNoteId);
        return note?.title || 'Note';
      default:
        return '';
    }
  };

  const renderPrimaryContent = () => {
    switch (workspace.state.primaryView) {
      case 'home':
        return (
          <HomeScreen
            onOpenLibrary={handleHomeOpenLibrary}
            onImportDocument={() => setImportModalOpen(true)}
            onCreateNote={handleHomeCreateNote}
            recentDocuments={allDocuments.slice(0, 5).map(d => ({ id: d.metadata.id, title: d.metadata.title }))}
            recentNotes={notes.slice(0, 5).map(n => ({ id: n.id, title: n.title }))}
            onSelectDocument={handleHomeSelectDocument}
            onSelectNote={handleHomeSelectNote}
          />
        );
      
      case 'document':
        if (!workspace.primaryDocument) return null;
        return (
          <SplitScreenReader
            primaryDocument={workspace.primaryDocument}
            secondaryDocument={null}
            onNavigateToNode={handleCitationClick}
            onNavigateToNote={handleNavigateToNote}
          />
        );
      
      case 'bible':
        return (
          <BibleReader
            initialNavigation={workspace.state.bibleNavigation}
            onCiteVerse={handleBibleCiteVerse}
          />
        );
      
      case 'note':
        if (!workspace.state.primaryNoteId) return null;
        return (
          <GlobalNoteEditor
            noteId={workspace.state.primaryNoteId}
            onUpdate={handleUpdateNote}
            onFontSizeUpdate={handleUpdateNoteFontSize}
            onCitationClick={handleCitationClick}
            onRemoveCitation={handleRemoveCitation}
          />
        );
      
      default:
        return null;
    }
  };

  const renderSecondaryContent = () => {
    switch (workspace.state.secondaryView) {
      case 'document':
        if (!workspace.secondaryDocument) return null;
        return (
          <SplitScreenReader
            primaryDocument={workspace.secondaryDocument}
            secondaryDocument={null}
            onNavigateToNode={handleCitationClick}
            onNavigateToNote={handleNavigateToNote}
          />
        );
      
      case 'bible':
        return (
          <BibleReader
            initialNavigation={workspace.state.bibleNavigation}
            onCiteVerse={handleBibleCiteVerse}
          />
        );
      
      case 'note':
        if (!workspace.state.secondaryNoteId) return null;
        return (
          <GlobalNoteEditor
            noteId={workspace.state.secondaryNoteId}
            onUpdate={handleUpdateNote}
            onFontSizeUpdate={handleUpdateNoteFontSize}
            onCitationClick={handleCitationClick}
            onRemoveCitation={handleRemoveCitation}
          />
        );
      
      default:
        return null;
    }
  };

  // ============= Desktop Layout =============

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
            selectedDocumentId={workspace.state.primaryDocumentId}
            onSelectDocument={handleSelectDocument}
            selectedNoteId={workspace.state.primaryNoteId || workspace.state.secondaryNoteId}
            onSelectNote={handleSelectNote}
            onOpenSettings={() => setSettingsOpen(true)}
            onImportDocument={() => setImportModalOpen(true)}
            onExportLibrary={handleExportLibrary}
            onImportLibrary={handleImportLibrary}
            onOpenBible={handleOpenBible}
            onDeleteDocument={handleDeleteDocument}
            onRenameDocument={handleRenameDocument}
            onOpenDocumentInSplit={handleOpenDocumentInSplit}
            onOpenNoteInSplit={handleOpenNoteInSplit}
            onOpenBibleInSplit={handleOpenBibleInSplit}
            isBibleActive={workspace.state.primaryView === 'bible' || workspace.state.secondaryView === 'bible'}
            className="flex-1"
          />
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Content header with split view toggle */}
          {workspace.state.primaryView !== 'home' && (
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
                  {getPrimaryTitle()}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                {workspace.isSplitViewActive ? (
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
                    onClick={handleOpenDocumentSplitView}
                    className="gap-2"
                    title="Open split view"
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
            {workspace.state.primaryView === 'home' ? (
              renderPrimaryContent()
            ) : workspace.isSplitViewActive ? (
              <ResizablePanelGroup direction="horizontal" className="h-full">
                <ResizablePanel defaultSize={50} minSize={25}>
                  <div className="h-full">
                    {renderPrimaryContent()}
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50} minSize={25}>
                  <div className="h-full border-l border-border">
                    {renderSecondaryContent()}
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              renderPrimaryContent()
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
          currentDocumentId={workspace.state.primaryDocumentId}
          onSelect={handleSelectSecondaryDocument}
          title="Select content for split view"
        />
      </div>
    );
  }

  // ============= Mobile Layout =============

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
              selectedDocumentId={workspace.state.primaryDocumentId}
              onSelectDocument={(doc) => {
                handleSelectDocument(doc);
                setSidebarOpen(false);
              }}
              selectedNoteId={workspace.state.primaryNoteId}
              onSelectNote={(noteId) => {
                handleSelectNote(noteId);
                setSidebarOpen(false);
              }}
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
              onRenameDocument={handleRenameDocument}
              isBibleActive={workspace.state.primaryView === 'bible'}
            />
          </SheetContent>
        </Sheet>

        {workspace.state.primaryView !== 'home' ? (
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
              {getPrimaryTitle()}
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
        {renderPrimaryContent()}
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
