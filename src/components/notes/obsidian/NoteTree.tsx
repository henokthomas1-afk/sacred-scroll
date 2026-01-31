/**
 * NoteTree - Recursive folder tree with drag & drop and keyboard navigation
 */

import { useState, useCallback, useRef, useEffect } from 'react';
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
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Flatten tree for sortable context and keyboard navigation
  const flattenTree = (nodes: TreeNode[], parentId: string | null = null): TreeNode[] => {
    const result: TreeNode[] = [];
    for (const node of nodes) {
      result.push(node);
      if (node.type === 'folder' && node.children && expandedFolders.has(node.id)) {
        result.push(...flattenTree(node.children, node.id));
      }
    }
    return result;
  };

  const flatNodes = flattenTree(tree);
  const flatIds = flatNodes.map(n => n.id);

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

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!flatNodes.length) return;

    const currentId = focusedId || selectedNoteId;
    const currentIndex = currentId ? flatNodes.findIndex(n => n.id === currentId) : -1;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const nextIndex = currentIndex < flatNodes.length - 1 ? currentIndex + 1 : 0;
        setFocusedId(flatNodes[nextIndex].id);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : flatNodes.length - 1;
        setFocusedId(flatNodes[prevIndex].id);
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        const currentNode = currentId ? findNode(currentId) : null;
        if (currentNode?.type === 'folder' && !expandedFolders.has(currentNode.id)) {
          toggleFolder(currentNode.id);
        }
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        const currentNode = currentId ? findNode(currentId) : null;
        if (currentNode?.type === 'folder' && expandedFolders.has(currentNode.id)) {
          toggleFolder(currentNode.id);
        } else if (currentNode?.parentId) {
          // Move to parent folder
          setFocusedId(currentNode.parentId);
        }
        break;
      }
      case 'Enter': {
        e.preventDefault();
        const currentNode = currentId ? findNode(currentId) : null;
        if (currentNode) {
          if (currentNode.type === 'folder') {
            toggleFolder(currentNode.id);
          } else {
            onSelectNote(currentNode.id);
          }
        }
        break;
      }
      case 'F2': {
        e.preventDefault();
        const currentNode = currentId ? findNode(currentId) : null;
        if (currentNode) {
          onRename(currentNode.id, currentNode.type);
        }
        break;
      }
      case 'Delete': {
        e.preventDefault();
        const currentNode = currentId ? findNode(currentId) : null;
        if (currentNode) {
          onDelete(currentNode.id, currentNode.type);
        }
        break;
      }
    }
  }, [flatNodes, focusedId, selectedNoteId, expandedFolders, toggleFolder, onSelectNote, onRename, onDelete, findNode]);

  // Focus management
  useEffect(() => {
    if (focusedId) {
      const element = document.querySelector(`[data-tree-id="${focusedId}"]`);
      element?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedId]);

  return (
    <ScrollArea className={cn('flex-1 min-h-0', className)}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={flatIds} strategy={verticalListSortingStrategy}>
          <div 
            ref={containerRef}
            className="p-2 space-y-0.5 outline-none"
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            {tree.map((node) => (
              <NoteTreeItem
                key={node.id}
                node={node}
                depth={0}
                isSelected={selectedNoteId === node.id}
                isFocused={focusedId === node.id}
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
