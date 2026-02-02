/**
 * DocumentTree - Obsidian-style tree for documents with folder support
 */

import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DocTreeNode } from '@/hooks/useDocumentFolders';
import { DocumentTreeItem } from './DocumentTreeItem';
import { ParsedDocument } from '@/types/document';
import { cn } from '@/lib/utils';

interface DocumentTreeProps {
  tree: DocTreeNode[];
  documents: ParsedDocument[];
  selectedDocumentId: string | null;
  onSelectDocument: (doc: ParsedDocument) => void;
  onMoveItem: (
    itemId: string,
    itemType: 'folder' | 'document',
    newParentId: string | null,
    beforeId: string | null,
    afterId: string | null
  ) => Promise<void>;
  onRename: (id: string, type: 'folder' | 'document') => void;
  onDelete: (id: string, type: 'folder' | 'document') => void;
  onCreateFolder: (parentId: string | null) => void;
  onOpenSettings?: (docId: string) => void;
  className?: string;
}

export function DocumentTree({
  tree,
  documents,
  selectedDocumentId,
  onSelectDocument,
  onMoveItem,
  onRename,
  onDelete,
  onCreateFolder,
  onOpenSettings,
  className,
}: DocumentTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleToggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setDraggedId(null);
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const activeData = active.data.current as { type: 'folder' | 'document'; parentId: string | null };
    const overData = over.data.current as { type: 'folder' | 'document'; parentId: string | null };

    // Determine new parent and ordering
    let newParentId = overData.parentId;
    let beforeId: string | null = null;
    let afterId: string | null = over.id as string;

    // If dropping on a folder, put inside it
    if (overData.type === 'folder') {
      newParentId = over.id as string;
      afterId = null;
    }

    await onMoveItem(
      active.id as string,
      activeData.type,
      newParentId,
      beforeId,
      afterId
    );
  };

  const getAllIds = (nodes: DocTreeNode[]): string[] => {
    return nodes.flatMap(n => [n.id, ...(n.children ? getAllIds(n.children) : [])]);
  };

  if (tree.length === 0 && documents.length === 0) {
    return (
      <div className={cn("px-3 py-2 text-center", className)}>
        <p className="text-xs text-muted-foreground">No documents yet</p>
      </div>
    );
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={getAllIds(tree)} strategy={verticalListSortingStrategy}>
        <div className={cn("space-y-0.5", className)}>
          {tree.map((node) => (
            <DocumentTreeItem
              key={node.id}
              node={node}
              depth={0}
              isSelected={node.type === 'document' && node.id === selectedDocumentId}
              expandedFolders={expandedFolders}
              onToggleFolder={handleToggleFolder}
              onSelectDocument={(id) => {
                const doc = documents.find(d => d.metadata.id === id);
                if (doc) onSelectDocument(doc);
              }}
              onRename={onRename}
              onDelete={onDelete}
              onCreateFolder={onCreateFolder}
              onOpenSettings={onOpenSettings}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
