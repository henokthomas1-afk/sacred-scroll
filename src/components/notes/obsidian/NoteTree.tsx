/**
 * NoteTree - Recursive folder tree with drag & drop
 */

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TreeNode } from '@/hooks/useGlobalNotes';
import { NoteTreeItem } from './NoteTreeItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Folder, FileText } from 'lucide-react';

interface NoteTreeProps {
  tree: TreeNode[];
  selectedNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  onMoveItem: (
    itemId: string,
    itemType: 'folder' | 'note',
    newParentId: string | null,
    beforeId: string | null,
    afterId: string | null
  ) => Promise<void>;
  onRename: (id: string, type: 'folder' | 'note') => void;
  onDelete: (id: string, type: 'folder' | 'note') => void;
  onCreateNote: (parentId: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  className?: string;
}

export function NoteTree({
  tree,
  selectedNoteId,
  onSelectNote,
  onMoveItem,
  onRename,
  onDelete,
  onCreateNote,
  onCreateFolder,
  className,
}: NoteTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeNode, setActiveNode] = useState<TreeNode | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  // Flatten tree for sortable context
  const flattenTree = (nodes: TreeNode[], parentId: string | null = null): string[] => {
    const result: string[] = [];
    for (const node of nodes) {
      result.push(node.id);
      if (node.type === 'folder' && node.children && expandedFolders.has(node.id)) {
        result.push(...flattenTree(node.children, node.id));
      }
    }
    return result;
  };

  const flatIds = flattenTree(tree);

  // Find node by id
  const findNode = (id: string, nodes: TreeNode[] = tree): TreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(id, node.children);
        if (found) return found;
      }
    }
    return null;
  };

  // Get siblings for a parent
  const getSiblings = (parentId: string | null): TreeNode[] => {
    if (parentId === null) return tree;
    const parent = findNode(parentId);
    return parent?.children || [];
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    setActiveNode(findNode(active.id as string));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id as string ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setActiveNode(null);
    setOverId(null);

    if (!over || active.id === over.id) return;

    const activeNode = findNode(active.id as string);
    const overNode = findNode(over.id as string);

    if (!activeNode || !overNode) return;

    // Determine new parent and position
    let newParentId: string | null;
    let beforeId: string | null = null;
    let afterId: string | null = null;

    if (overNode.type === 'folder') {
      // Dropping on a folder - move into it
      newParentId = overNode.id;
      // Expand the folder
      setExpandedFolders((prev) => new Set([...prev, overNode.id]));
    } else {
      // Dropping near a note - reorder
      newParentId = overNode.parentId;
      
      const siblings = getSiblings(newParentId);
      const overIndex = siblings.findIndex(s => s.id === over.id);
      
      if (overIndex > 0) {
        beforeId = siblings[overIndex - 1].id;
      }
      afterId = over.id as string;
    }

    // Prevent dropping folder into itself
    if (activeNode.type === 'folder') {
      const isDescendant = (folderId: string, targetId: string): boolean => {
        const folder = findNode(folderId);
        if (!folder?.children) return false;
        for (const child of folder.children) {
          if (child.id === targetId) return true;
          if (child.type === 'folder' && isDescendant(child.id, targetId)) return true;
        }
        return false;
      };
      
      if (activeNode.id === newParentId || isDescendant(activeNode.id, newParentId as string)) {
        return;
      }
    }

    await onMoveItem(
      active.id as string,
      activeNode.type,
      newParentId,
      beforeId,
      afterId
    );
  };

  return (
    <ScrollArea className={cn('h-full', className)}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={flatIds} strategy={verticalListSortingStrategy}>
          <div className="p-2 space-y-0.5">
            {tree.map((node) => (
              <NoteTreeItem
                key={node.id}
                node={node}
                depth={0}
                isSelected={selectedNoteId === node.id}
                expandedFolders={expandedFolders}
                onToggleFolder={toggleFolder}
                onSelectNote={onSelectNote}
                onRename={onRename}
                onDelete={onDelete}
                onCreateNote={onCreateNote}
                onCreateFolder={onCreateFolder}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeNode && (
            <div className="flex items-center gap-2 py-1 px-2 bg-card border border-border rounded-md shadow-lg">
              {activeNode.type === 'folder' ? (
                <Folder className="h-4 w-4 text-primary" />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm">{activeNode.name}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </ScrollArea>
  );
}
