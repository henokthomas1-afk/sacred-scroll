/**
 * Document Settings Modal - Configuration for document metadata and citation aliases
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CitationAliasManager } from '@/components/citation/CitationAliasManager';
import { useDocumentAliases, useCitationAliases } from '@/hooks/useCitationAliases';
import { ParsedDocument } from '@/types/document';
import { CitationPreset, CitationAlias } from '@/types/citationAlias';
import { Settings, Tag } from 'lucide-react';

interface DocumentSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: ParsedDocument;
}

export function DocumentSettingsModal({
  open,
  onOpenChange,
  document,
}: DocumentSettingsModalProps) {
  const { aliases, refresh } = useDocumentAliases(document.metadata.id);
  const {
    addAlias,
    addAliasFromPreset,
    modifyAlias,
    removeAlias,
    checkPrefixAvailable,
  } = useCitationAliases();

  const handleAddAlias = useCallback(async (
    prefix: string,
    pattern: string,
    numberExtractor: CitationAlias['numberExtractor'],
    displayFormat: string,
    priority?: number
  ) => {
    const id = await addAlias(document.metadata.id, prefix, pattern, numberExtractor, displayFormat, priority);
    await refresh();
    return id;
  }, [document.metadata.id, addAlias, refresh]);

  const handleAddFromPreset = useCallback(async (preset: CitationPreset, customPrefix?: string) => {
    const id = await addAliasFromPreset(document.metadata.id, preset, customPrefix);
    await refresh();
    return id;
  }, [document.metadata.id, addAliasFromPreset, refresh]);

  const handleUpdateAlias = useCallback(async (
    id: string,
    updates: Partial<Pick<CitationAlias, 'prefix' | 'pattern' | 'displayFormat' | 'priority'>>
  ) => {
    const success = await modifyAlias(id, updates);
    await refresh();
    return success;
  }, [modifyAlias, refresh]);

  const handleRemoveAlias = useCallback(async (id: string) => {
    const success = await removeAlias(id);
    await refresh();
    return success;
  }, [removeAlias, refresh]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Document Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="aliases" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="aliases" className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Citation Aliases
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={document.metadata.title} readOnly className="bg-muted" />
            </div>
            {document.metadata.author && (
              <div className="space-y-2">
                <Label>Author</Label>
                <Input value={document.metadata.author} readOnly className="bg-muted" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Source Type</Label>
              <Input value={document.metadata.sourceType} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Imported</Label>
              <Input 
                value={new Date(document.metadata.importedAt).toLocaleDateString()} 
                readOnly 
                className="bg-muted" 
              />
            </div>
            <div className="space-y-2">
              <Label>Citable Paragraphs</Label>
              <Input 
                value={document.metadata.totalCitableNodes.toString()} 
                readOnly 
                className="bg-muted" 
              />
            </div>
          </TabsContent>
          
          <TabsContent value="aliases" className="pt-4">
            <ScrollArea className="h-[300px]">
              <CitationAliasManager
                documentId={document.metadata.id}
                documentTitle={document.metadata.title}
                aliases={aliases}
                onAddAlias={handleAddAlias}
                onAddFromPreset={handleAddFromPreset}
                onUpdateAlias={handleUpdateAlias}
                onRemoveAlias={handleRemoveAlias}
                checkPrefixAvailable={checkPrefixAvailable}
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
