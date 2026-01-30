/**
 * Sacred Text Reader - Main Page
 * 
 * A scholarly document reader for religious texts with
 * correct structural parsing and reliable citations.
 */

import { useState, useMemo, useCallback } from "react";
import { ParsedDocument } from "@/types/document";
import { DocumentLibrary, SplitScreenReader, DocumentSelector } from "@/components/reader";
import { NotesPanel } from "@/components/notes";
import { sampleDocuments } from "@/lib/sampleDocuments";
import { Button } from "@/components/ui/button";
import { BookOpen, Menu, Plus, User, LogOut, PanelRightOpen, PanelRightClose } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useDocuments } from "@/hooks/useDocuments";
import { AuthModal } from "@/components/auth/AuthModal";
import { ImportDocumentModal } from "@/components/import/ImportDocumentModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { toast } from "@/hooks/use-toast";

export default function Index() {
  const { user, isAuthenticated, signOut, loading: authLoading } = useAuth();
  const { documents: userDocuments, loading: docsLoading, refreshDocuments } = useDocuments();
  
  const [selectedDocument, setSelectedDocument] = useState<ParsedDocument | null>(null);
  const [secondaryDocument, setSecondaryDocument] = useState<ParsedDocument | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [documentSelectorOpen, setDocumentSelectorOpen] = useState(false);
  
  const isMobile = useIsMobile();

  // Combine sample documents with user documents
  const allDocuments = useMemo(() => {
    if (isAuthenticated) {
      return [...userDocuments, ...sampleDocuments];
    }
    return sampleDocuments;
  }, [isAuthenticated, userDocuments]);

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

  const handleImportClick = useCallback(() => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
    } else {
      setImportModalOpen(true);
    }
  }, [isAuthenticated]);

  const handleImportSuccess = useCallback(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  // Handle citation navigation - find document and scroll to node
  const handleCitationClick = useCallback((documentId: string, nodeId?: string) => {
    const targetDoc = allDocuments.find((d) => d.metadata.id === documentId);
    
    if (!targetDoc) {
      toast({
        title: "Document not found",
        description: "The referenced document is not in your library.",
        variant: "destructive",
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
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [allDocuments, selectedDocument, secondaryDocument]);

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  // Header actions component
  const HeaderActions = () => (
    <div className="flex items-center gap-2">
      {!isMobile && isAuthenticated && selectedDocument && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setNotesPanelOpen(!notesPanelOpen)}
          title={notesPanelOpen ? "Hide notes" : "Show notes"}
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
        onClick={handleImportClick}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Import</span>
      </Button>

      {authLoading ? null : isAuthenticated ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setAuthModalOpen(true)}>
          Sign In
        </Button>
      )}
    </div>
  );

  // Desktop layout with permanent sidebar
  if (!isMobile) {
    return (
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <aside className="w-72 flex-shrink-0 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h1 className="font-display font-semibold text-lg">Library</h1>
            <HeaderActions />
          </div>
          <div className="flex-1 overflow-hidden">
            <DocumentLibrary
              documents={allDocuments}
              selectedDocumentId={selectedDocument?.metadata.id || null}
              onSelectDocument={handleSelectDocument}
            />
          </div>
        </aside>

        {/* Main Content with optional Notes Panel */}
        <div className="flex-1 flex min-w-0">
          {notesPanelOpen && isAuthenticated ? (
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
                    />
                  ) : (
                    <EmptyState onImport={handleImportClick} isAuthenticated={isAuthenticated} />
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
                />
              ) : (
                <EmptyState onImport={handleImportClick} isAuthenticated={isAuthenticated} />
              )}
            </main>
          )}
        </div>

        {/* Modals */}
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
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
          {selectedDocument?.metadata.title || "Sacred Text Reader"}
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
          />
        ) : (
          <EmptyState onImport={handleImportClick} isAuthenticated={isAuthenticated} />
        )}
      </main>

      {/* Modals */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
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
  isAuthenticated: boolean;
}

function EmptyState({ onImport, isAuthenticated }: EmptyStateProps) {
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
        {isAuthenticated ? "Import Document" : "Sign in to Import"}
      </Button>
    </div>
  );
}
