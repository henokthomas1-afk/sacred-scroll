/**
 * SettingsPanel - Central settings modal with Import and Citation Aliases sections
 * 
 * Reorganizes access to import workflow and provides global alias management.
 */

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  Tag, 
  FileText,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCitationAliases } from '@/hooks/useCitationAliases';
import { useLocalDocuments } from '@/hooks/useLocalDocuments';
import { GlobalAliasManager } from './GlobalAliasManager';

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenImport: () => void;
}

export function SettingsPanel({
  open,
  onOpenChange,
  onOpenImport,
}: SettingsPanelProps) {
  const { documents, loading: docsLoading } = useLocalDocuments();
  const { aliases, loading: aliasesLoading } = useCitationAliases();

  const handleImportClick = useCallback(() => {
    onOpenChange(false);
    // Small delay to let the settings modal close before opening import
    setTimeout(() => {
      onOpenImport();
    }, 150);
  }, [onOpenChange, onOpenImport]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="import" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 shrink-0">
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
            </TabsTrigger>
            <TabsTrigger value="aliases" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Citation Aliases
            </TabsTrigger>
          </TabsList>

          {/* Import Section */}
          <TabsContent value="import" className="flex-1 mt-4">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Import documents into your library. Supported formats: TXT, MD, PDF, DOC, DOCX.
              </div>
              
              <Button 
                onClick={handleImportClick}
                className="w-full gap-2"
              >
                <Upload className="h-4 w-4" />
                Import Document
              </Button>

              <div className="text-xs text-muted-foreground mt-4">
                After importing, you can configure citation aliases for your documents 
                to enable automatic linking in notes.
              </div>
            </div>
          </TabsContent>

          {/* Citation Aliases Section */}
          <TabsContent value="aliases" className="flex-1 mt-4 min-h-0 flex flex-col">
            {docsLoading || aliasesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  No documents in your library yet.
                </p>
                <Button variant="outline" onClick={handleImportClick} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Import a Document
                </Button>
              </div>
            ) : (
              <GlobalAliasManager documents={documents} />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
