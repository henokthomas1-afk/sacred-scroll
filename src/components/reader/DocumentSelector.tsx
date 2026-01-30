/**
 * DocumentSelector - Modal for selecting documents for split view
 */

import { ParsedDocument } from "@/types/document";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: ParsedDocument[];
  currentDocumentId?: string;
  onSelect: (document: ParsedDocument) => void;
  title?: string;
}

export function DocumentSelector({
  open,
  onOpenChange,
  documents,
  currentDocumentId,
  onSelect,
  title = "Select Document",
}: DocumentSelectorProps) {
  const handleSelect = (doc: ParsedDocument) => {
    onSelect(doc);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-96">
          <div className="space-y-1 pr-4">
            {documents.map((doc) => (
              <button
                key={doc.metadata.id}
                onClick={() => handleSelect(doc)}
                disabled={doc.metadata.id === currentDocumentId}
                className={cn(
                  "w-full text-left p-3 rounded-md transition-colors",
                  "hover:bg-accent/50",
                  doc.metadata.id === currentDocumentId
                    ? "opacity-50 cursor-not-allowed bg-muted"
                    : "cursor-pointer"
                )}
              >
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{doc.metadata.title}</p>
                    {doc.metadata.author && (
                      <p className="text-sm text-muted-foreground truncate italic">
                        {doc.metadata.author}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {doc.metadata.totalCitableNodes} paragraphs
                    </p>
                  </div>
                </div>
              </button>
            ))}

            {documents.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No documents available
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
