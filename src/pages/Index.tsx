/**
 * Sacred Text Reader - Main Page
 * 
 * A scholarly document reader for religious texts with
 * correct structural parsing and reliable citations.
 */

import { useState } from "react";
import { ParsedDocument } from "@/types/document";
import { DocumentReader, DocumentLibrary } from "@/components/reader";
import { sampleDocuments } from "@/lib/sampleDocuments";
import { Button } from "@/components/ui/button";
import { BookOpen, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Index() {
  const [selectedDocument, setSelectedDocument] = useState<ParsedDocument | null>(
    sampleDocuments[0] || null
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleSelectDocument = (doc: ParsedDocument) => {
    setSelectedDocument(doc);
    setSidebarOpen(false);
  };

  // Desktop layout with permanent sidebar
  if (!isMobile) {
    return (
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <aside className="w-72 flex-shrink-0 border-r border-border">
          <DocumentLibrary
            documents={sampleDocuments}
            selectedDocumentId={selectedDocument?.metadata.id || null}
            onSelectDocument={handleSelectDocument}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0">
          {selectedDocument ? (
            <DocumentReader document={selectedDocument} />
          ) : (
            <EmptyState />
          )}
        </main>
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
            <DocumentLibrary
              documents={sampleDocuments}
              selectedDocumentId={selectedDocument?.metadata.id || null}
              onSelectDocument={handleSelectDocument}
            />
          </SheetContent>
        </Sheet>

        <h1 className="font-display font-semibold text-lg truncate">
          {selectedDocument?.metadata.title || "Sacred Text Reader"}
        </h1>

        <div className="w-10" /> {/* Spacer for balance */}
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0">
        {selectedDocument ? (
          <DocumentReader document={selectedDocument} />
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <BookOpen className="h-8 w-8 text-primary" />
      </div>
      <h2 className="font-display text-xl font-semibold text-foreground mb-2">
        Select a Document
      </h2>
      <p className="text-muted-foreground max-w-md">
        Choose a document from the library to begin reading. 
        Click on paragraphs to select them for citation.
      </p>
    </div>
  );
}
