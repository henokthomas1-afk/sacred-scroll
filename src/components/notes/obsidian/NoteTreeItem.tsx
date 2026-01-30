/**
 * NoteTreeItem - Draggable tree item for folders and notes
 */

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TreeNode } from '@/hooks/useGlobalNotes';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  ChevronRight, 
  ChevronDown,
  MoreHorizontal,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface NoteTreeItemProps {
  node: TreeNode;
  depth: number;
  isSelected?: boolean;
  expandedFolders: Set<string>;
  onToggleFolder: (folderId: string) => void;
  onSelectNote: (noteId: string) => void;
  onRename: (id: string, type: 'folder' | 'note') => void;
  onDelete: (id: string, type: 'folder' | 'note') => void;
  onCreateNote: (parentId: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
}

export function NoteTreeItem({
  node,
  depth,
  isSelected,
  expandedFolders,
  onToggleFolder,
  onSelectNote,
  onRename,
  onDelete,
  onCreateNote,
  onCreateFolder,
}: NoteTreeItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: node.id,
    data: {
      type: node.type,
      parentId: node.parentId,
      node,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isExpanded = expandedFolders.has(node.id);
  const hasChildren = node.children && node.children.length > 0;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'folder') {
      onToggleFolder(node.id);
    } else {
      onSelectNote(node.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Context menu is handled via dropdown
  };

  if (node.type === 'folder') {
    return (
      <Collapsible open={isExpanded} onOpenChange={() => onToggleFolder(node.id)}>
        <div
          ref={setNodeRef}
          style={style}
          className={cn(
            'group flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer',
            'hover:bg-muted/50 transition-colors',
            isDragging && 'opacity-50 bg-muted'
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onContextMenu={handleContextMenu}
        >
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-100 cursor-grab"
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>

          {/* Indent spacer */}
          <div style={{ width: depth * 16 }} />

          {/* Expand/collapse */}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )
              ) : (
                <span className="w-3" />
              )}
            </Button>
          </CollapsibleTrigger>

          {/* Icon */}
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-primary shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-primary shrink-0" />
          )}

          {/* Name */}
          <span
            className="flex-1 text-sm truncate"
            onClick={handleClick}
          >
            {node.name}
          </span>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-6 w-6 shrink-0',
                  isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onCreateNote(node.id)}>
                New Note
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreateFolder(node.id)}>
                New Folder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onRename(node.id, 'folder')}>
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onDelete(node.id, 'folder')}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CollapsibleContent>
          {node.children?.map((child) => (
            <NoteTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              isSelected={isSelected}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              onSelectNote={onSelectNote}
              onRename={onRename}
              onDelete={onDelete}
              onCreateNote={onCreateNote}
              onCreateFolder={onCreateFolder}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // Note item
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer',
        'hover:bg-muted/50 transition-colors',
        isSelected && 'bg-primary/10 text-primary',
        isDragging && 'opacity-50 bg-muted'
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={handleContextMenu}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-100 cursor-grab"
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>

      {/* Indent spacer */}
      <div style={{ width: depth * 16 + 20 }} />

      {/* Icon */}
      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />

      {/* Name */}
      <span className="flex-1 text-sm truncate">{node.name}</span>

      {/* Actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-6 w-6 shrink-0',
              isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onRename(node.id, 'note')}>
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-destructive"
            onClick={() => onDelete(node.id, 'note')}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
