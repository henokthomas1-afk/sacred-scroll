/**
 * GlobalAliasManager - Manage citation aliases across all documents
 * 
 * Allows viewing, creating, editing, and deleting aliases for any document.
 */

import { useState, useCallback } from 'react';
import { ParsedDocument } from '@/types/document';
import { CitationAlias, CitationPreset } from '@/types/citationAlias';
import { useCitationAliases, useDocumentAliases } from '@/hooks/useCitationAliases';
import { CitationAliasManager } from '@/components/citation/CitationAliasManager';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Tag,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface GlobalAliasManagerProps {
  documents: ParsedDocument[];
}

export function GlobalAliasManager({ documents }: GlobalAliasManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  
  const {
    aliases: allAliases,
    addAlias,
    addAliasFromPreset,
    modifyAlias,
    removeAlias,
    checkPrefixAvailable,
    refresh,
  } = useCitationAliases();

  // Filter documents based on search
  const filteredDocs = documents.filter(doc => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;
    
    // Match document title
    if (doc.metadata.title.toLowerCase().includes(query)) return true;
    
    // Match aliases for this document
    const docAliases = allAliases.filter(a => a.documentId === doc.metadata.id);
    return docAliases.some(a => a.prefix.toLowerCase().includes(query));
  });

  // Get aliases grouped by document
  const getAliasesForDoc = useCallback((docId: string) => {
    return allAliases.filter(a => a.documentId === docId);
  }, [allAliases]);

  // Count total aliases for display
  const totalAliasCount = allAliases.length;
  const docsWithAliases = new Set(allAliases.map(a => a.documentId)).size;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Search and stats */}
      <div className="shrink-0 space-y-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents or aliases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{documents.length} documents</span>
          <span>•</span>
          <span>{totalAliasCount} aliases defined</span>
          <span>•</span>
          <span>{docsWithAliases} with aliases</span>
        </div>
      </div>

      {/* Document list */}
      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="space-y-1 pb-4">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No documents match your search
            </div>
          ) : (
            filteredDocs.map(doc => {
              const docAliases = getAliasesForDoc(doc.metadata.id);
              const isExpanded = expandedDocId === doc.metadata.id;
              
              return (
                <DocumentAliasRow
                  key={doc.metadata.id}
                  document={doc}
                  aliases={docAliases}
                  isExpanded={isExpanded}
                  onToggle={() => setExpandedDocId(isExpanded ? null : doc.metadata.id)}
                  onAddAlias={async (prefix, pattern, numberExtractor, displayFormat, priority) => {
                    const id = await addAlias(doc.metadata.id, prefix, pattern, numberExtractor, displayFormat, priority);
                    await refresh();
                    return id;
                  }}
                  onAddFromPreset={async (preset, customPrefix) => {
                    const id = await addAliasFromPreset(doc.metadata.id, preset, customPrefix);
                    await refresh();
                    return id;
                  }}
                  onUpdateAlias={async (id, updates) => {
                    const success = await modifyAlias(id, updates);
                    await refresh();
                    return success;
                  }}
                  onRemoveAlias={async (id) => {
                    const success = await removeAlias(id);
                    await refresh();
                    return success;
                  }}
                  checkPrefixAvailable={checkPrefixAvailable}
                />
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface DocumentAliasRowProps {
  document: ParsedDocument;
  aliases: CitationAlias[];
  isExpanded: boolean;
  onToggle: () => void;
  onAddAlias: (
    prefix: string,
    pattern: string,
    numberExtractor: CitationAlias['numberExtractor'],
    displayFormat: string,
    priority?: number
  ) => Promise<string | null>;
  onAddFromPreset: (preset: CitationPreset, customPrefix?: string) => Promise<string | null>;
  onUpdateAlias: (
    id: string,
    updates: Partial<Pick<CitationAlias, 'prefix' | 'pattern' | 'displayFormat' | 'priority'>>
  ) => Promise<boolean>;
  onRemoveAlias: (id: string) => Promise<boolean>;
  checkPrefixAvailable: (prefix: string, excludeId?: string) => Promise<boolean>;
}

function DocumentAliasRow({
  document,
  aliases,
  isExpanded,
  onToggle,
  onAddAlias,
  onAddFromPreset,
  onUpdateAlias,
  onRemoveAlias,
  checkPrefixAvailable,
}: DocumentAliasRowProps) {
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-2 h-auto py-2 px-3",
            isExpanded && "bg-muted"
          )}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-left truncate font-medium">
            {document.metadata.title}
          </span>
          {aliases.length > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              {aliases.slice(0, 3).map(alias => (
                <Badge 
                  key={alias.id} 
                  variant="secondary" 
                  className="text-xs px-1.5 py-0"
                >
                  {alias.prefix}
                </Badge>
              ))}
              {aliases.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{aliases.length - 3}
                </span>
              )}
            </div>
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-6 pr-2 py-2 border-l-2 border-muted ml-4">
          <CitationAliasManager
            documentId={document.metadata.id}
            documentTitle={document.metadata.title}
            aliases={aliases}
            onAddAlias={onAddAlias}
            onAddFromPreset={onAddFromPreset}
            onUpdateAlias={onUpdateAlias}
            onRemoveAlias={onRemoveAlias}
            checkPrefixAvailable={checkPrefixAvailable}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
