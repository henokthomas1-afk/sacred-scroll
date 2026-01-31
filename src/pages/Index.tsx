/**
 * Sacred Text Reader - Main Page
 * 
 * A local-first, offline-capable scholarly document reader
 * for religious texts with citation-safe parsing.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { ParsedDocument } from '@/types/document';
import { DocumentLibrary, SplitScreenReader, DocumentSelector } from '@/components/reader';
import { NotesPanel, GlobalNotesPanel } from '@/components/notes';
import { sampleDocuments } from '@/lib/sampleDocuments';
import { Button } from '@/components/ui/button';
import { BookOpen, Menu, Plus, PanelRightOpen, PanelRightClose, Download, Upload, StickyNote, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocalDocuments } from '@/hooks/useLocalDocuments';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ImportDocumentModal } from '@/components/import/ImportDocumentModal';
import { exportToFile, importFromFile } from '@/lib/sync/syncManager';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ViewMode = 'reader' | 'notes';

const SIDEBAR_COLLAPSED_KEY = 'sacredScroll.sidebarCollapsed';

export default function Index() {
  const { documents: userDocuments, loading: docsLoading, refreshDocuments } = useLocalDocuments();
  
  const [selectedDocument, setSelectedDocument] = useState<ParsedDocument | null>(null);
  const [secondaryDocument, setSecondaryDocument] = useState<ParsedDocument | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [documentSelectorOpen, setDocumentSelectorOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('reader');
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage(SIDEBAR_COLLAPSED_KEY, false);
  
  const isMobile = useIsMobile();

  // Combine user documents with sample documents
  const allDocuments = useMemo(() => {
    return [...userDocuments, ...sampleDocuments];
  }, [userDocuments]);

  // Set initial document
  useMemo(() => {
    if (!selectedDocument && allDocuments.length > 0) {
      setSelectedDocument(allDocuments[0]);
    }
  }, [allDocuments, selectedDocument]);

  const handleSelectDocument = useCallback((doc: ParsedDocument) => {
    setSelectedDocument(doc);
    setSecondaryDocument(null);
    setSelectedNodeId(null);
    setSidebarOpen(false);
  }, []);

  const handleOpenSplitView = useCallback(() => {
    setDocumentSelectorOpen(true);
  }, []);

  const handleSelectSecondaryDocument = useCallback((doc: ParsedDocument) => {
    setSecondaryDocument(doc);
  }, []);

  const handleCloseSplitView = useCallback(() => {
    setSecondaryDocument(null);
  }, []);

  const handleImportSuccess = useCallback(() => {
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

  // Handle citation navigation - find document and scroll to node
  const handleCitationClick = useCallback((documentId: string, nodeId?: string) => {
    const targetDoc = allDocuments.find((d) => d.metadata.id === documentId);
    
    if (!targetDoc) {
      toast({
        title: 'Document not found',
        description: 'The referenced document is not in your library.',
        variant: 'destructive',
      });
      return;
    }

    // If we have split view, open in secondary
    if (secondaryDocument) {
      setSecondaryDocument(targetDoc);
    } else if (selectedDocument?.metadata.id !== documentId) {
      // Open in split view
      setSecondaryDocument(targetDoc);
    }

    // Scroll to node after a short delay
    if (nodeId) {
      setTimeout(() => {
        const element = document.querySelector(`[data-paragraph-id="${nodeId}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [allDocuments, selectedDocument, secondaryDocument]);

  // Handle navigation to a note (e.g., after creating citation)
  const handleNavigateToNote = useCallback((noteId: string) => {
    // Switch to notes view mode
    setViewMode('notes');
    // Note: The GlobalNotesPanel will need to handle selecting the note
    // For now, just switching view mode is sufficient
    toast({ title: 'Note created', description: 'Switched to Notes view' });
  }, []);

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  // Header actions component
  const HeaderActions = () => (
    <div className="flex items-center gap-2">
      {/* Sidebar toggle */}
      {!isMobile && !sidebarCollapsed && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(true)}
          title="Collapse sidebar"
        >
          <PanelLeftClose className="h-5 w-5" />
        </Button>
      )}
      
      {!isMobile && selectedDocument && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setNotesPanelOpen(!notesPanelOpen)}
          title={notesPanelOpen ? 'Hide notes' : 'Show notes'}
        >
          {notesPanelOpen ? (
            <PanelRightClose className="h-5 w-5" />
          ) : (
            <PanelRightOpen className="h-5 w-5" />
          )}
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => setImportModalOpen(true)}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Import</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExportLibrary}>
            <Download className="h-4 w-4 mr-2" />
            Export Library
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleImportLibrary}>
            <Upload className="h-4 w-4 mr-2" />
            Import Library
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            {userDocuments.length} documents stored locally
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  // Desktop layout with permanent sidebar
  if (!isMobile) {
    return (
      <div className="flex h-screen bg-background">
        {/* Collapsed sidebar toggle */}
        {sidebarCollapsed && (
          <div className="flex-shrink-0 w-12 border-r border-border flex flex-col items-center py-4 gap-2">
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
              onClick={() => setImportModalOpen(true)}
              title="Import document"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Sidebar with tabs (when not collapsed) */}
        <aside 
          className={cn(
            "flex-shrink-0 border-r border-border flex flex-col transition-all duration-300",
            sidebarCollapsed ? "w-0 overflow-hidden opacity-0" : "w-72"
          )}
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="flex-1">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="reader" className="text-xs gap-1">
                  <BookOpen className="h-3 w-3" />
                  Library
                </TabsTrigger>
                <TabsTrigger value="notes" className="text-xs gap-1">
                  <StickyNote className="h-3 w-3" />
                  Notes
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <HeaderActions />
          </div>
          
          {viewMode === 'reader' ? (
            <div className="flex-1 overflow-hidden">
              <DocumentLibrary
                documents={allDocuments}
                selectedDocumentId={selectedDocument?.metadata.id || null}
                onSelectDocument={handleSelectDocument}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-hidden text-sm text-muted-foreground p-4">
              <p>Switch to full Notes view →</p>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex min-w-0">
          {viewMode === 'notes' ? (
            <GlobalNotesPanel
              onCitationClick={handleCitationClick}
              className="flex-1"
            />
          ) : notesPanelOpen ? (
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={75} minSize={50}>
                <main className="h-full">
                  {selectedDocument ? (
                    <SplitScreenReader
                      primaryDocument={selectedDocument}
                      secondaryDocument={secondaryDocument}
                      onOpenSecondary={handleOpenSplitView}
                      onCloseSecondary={handleCloseSplitView}
                      onNavigateToNode={handleCitationClick}
                      onNavigateToNote={handleNavigateToNote}
                    />
                  ) : (
                    <EmptyState onImport={() => setImportModalOpen(true)} />
                  )}
                </main>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
                <NotesPanel
                  documentId={selectedDocument?.metadata.id || null}
                  documentTitle={selectedDocument?.metadata.title}
                  selectedNodeId={selectedNodeId}
                  onCitationClick={handleCitationClick}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <main className="flex-1 flex flex-col min-w-0">
              {selectedDocument ? (
                <SplitScreenReader
                  primaryDocument={selectedDocument}
                  secondaryDocument={secondaryDocument}
                  onOpenSecondary={handleOpenSplitView}
                  onCloseSecondary={handleCloseSplitView}
                  onNavigateToNode={handleCitationClick}
                  onNavigateToNote={handleNavigateToNote}
                />
              ) : (
                <EmptyState onImport={() => setImportModalOpen(true)} />
              )}
            </main>
          )}
        </div>

        {/* Modals */}
        <ImportDocumentModal
          open={importModalOpen}
          onOpenChange={setImportModalOpen}
          onSuccess={handleImportSuccess}
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
    <div className="flex flex-col h-screen bg-background">
      {/* Mobile Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <div className="p-4 border-b border-border">
              <h1 className="font-display font-semibold text-lg">Library</h1>
            </div>
            <DocumentLibrary
              documents={allDocuments}
              selectedDocumentId={selectedDocument?.metadata.id || null}
              onSelectDocument={handleSelectDocument}
            />
          </SheetContent>
        </Sheet>

        <h1 className="font-display font-semibold text-lg truncate flex-1 text-center">
          {selectedDocument?.metadata.title || 'Sacred Text Reader'}
        </h1>

        <HeaderActions />
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0">
        {selectedDocument ? (
          <SplitScreenReader
            primaryDocument={selectedDocument}
            secondaryDocument={null}
            onNavigateToNode={handleCitationClick}
            onNavigateToNote={handleNavigateToNote}
          />
        ) : (
          <EmptyState onImport={() => setImportModalOpen(true)} />
        )}
      </main>

      {/* Modals */}
      <ImportDocumentModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}

interface EmptyStateProps {
  onImport: () => void;
}

function EmptyState({ onImport }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <BookOpen className="h-8 w-8 text-primary" />
      </div>
      <h2 className="font-display text-xl font-semibold text-foreground mb-2">
        Select a Document
      </h2>
      <p className="text-muted-foreground max-w-md mb-6">
        Choose a document from the library to begin reading. 
        Click on paragraphs to select them for citation.
      </p>
      <Button onClick={onImport} className="gap-2">
        <Plus className="h-4 w-4" />
        Import Document
      </Button>
    </div>
  );
}
