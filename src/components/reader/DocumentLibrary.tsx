/**
 * DocumentLibrary - Sidebar showing available documents
 */

import { ParsedDocument } from "@/types/document";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Book, FileText, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentLibraryProps {
  documents: ParsedDocument[];
  selectedDocumentId: string | null;
  onSelectDocument: (document: ParsedDocument) => void;
  className?: string;
}

export function DocumentLibrary({
  documents,
  selectedDocumentId,
  onSelectDocument,
  className,
}: DocumentLibraryProps) {
  const getIcon = (sourceType: ParsedDocument["metadata"]["sourceType"]) => {
    switch (sourceType) {
      case "catechism":
        return Book;
      case "scripture":
        return ScrollText;
      case "patristic":
      case "treatise":
      default:
        return FileText;
    }
  };

  const getSourceLabel = (sourceType: ParsedDocument["metadata"]["sourceType"]) => {
    switch (sourceType) {
      case "catechism":
        return "Catechism";
      case "scripture":
        return "Scripture";
      case "patristic":
        return "Patristic";
      case "treatise":
        return "Treatise";
      default:
        return "Document";
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-sidebar", className)}>
      <div className="flex-shrink-0 px-4 py-4 border-b border-sidebar-border">
        <h2 className="font-display text-lg font-semibold text-sidebar-foreground">
          Library
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {documents.length} document{documents.length !== 1 ? 's' : ''}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {documents.map((doc) => {
            const Icon = getIcon(doc.metadata.sourceType);
            const isSelected = doc.metadata.id === selectedDocumentId;

            return (
              <Button
                key={doc.metadata.id}
                variant={isSelected ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-auto py-3 px-3",
                  isSelected && "bg-sidebar-accent"
                )}
                onClick={() => onSelectDocument(doc)}
              >
                <Icon className="h-5 w-5 mr-3 flex-shrink-0 text-primary" />
                <div className="flex flex-col items-start text-left min-w-0">
                  <span className="font-medium text-sm truncate w-full">
                    {doc.metadata.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {getSourceLabel(doc.metadata.sourceType)} • {doc.metadata.totalCitableNodes} ¶
                  </span>
                </div>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
