/**
 * DocumentTreeItem - Draggable tree item for document folders and documents
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DocTreeNode } from '@/hooks/useDocumentFolders';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  ChevronRight, 
  ChevronDown,
  GripVertical,
  FolderPlus,
  Settings,
  Columns2,
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

interface DocumentTreeItemProps {
  node: DocTreeNode;
  depth: number;
  isSelected?: boolean;
  expandedFolders: Set<string>;
  onToggleFolder: (folderId: string) => void;
  onSelectDocument: (docId: string) => void;
  onRename: (id: string, type: 'folder' | 'document') => void;
  onDelete: (id: string, type: 'folder' | 'document') => void;
  onCreateFolder: (parentId: string | null) => void;
  onOpenSettings?: (docId: string) => void;
  onOpenInSplit?: (docId: string) => void;
}

export function DocumentTreeItem({
  node,
  depth,
  isSelected,
  expandedFolders,
  onToggleFolder,
  onSelectDocument,
  onRename,
  onDelete,
  onCreateFolder,
  onOpenSettings,
  onOpenInSplit,
}: DocumentTreeItemProps) {
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
      onSelectDocument(node.id);
    }
  };

  if (node.type === 'folder') {
    return (
      <Collapsible open={isExpanded} onOpenChange={() => onToggleFolder(node.id)}>
        <div
          ref={setNodeRef}
          style={style}
          className={cn(
            'group relative flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer',
            'hover:bg-muted/50 transition-colors',
            isDragging && 'opacity-50 bg-muted'
          )}
        >
          {/* Drag handle with dropdown menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                className="opacity-0 group-hover:opacity-100 cursor-pointer hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-3 w-3 text-muted-foreground" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onCreateFolder(node.id)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Subfolder
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
          
          {/* Hidden drag handle for DnD */}
          <div
            {...attributes}
            {...listeners}
            className="absolute left-0 top-0 w-full h-full opacity-0 cursor-grab"
            style={{ pointerEvents: 'none' }}
          />

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
        </div>

        <CollapsibleContent>
          {node.children?.map((child) => (
            <DocumentTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              isSelected={isSelected}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              onSelectDocument={onSelectDocument}
              onRename={onRename}
              onDelete={onDelete}
              onCreateFolder={onCreateFolder}
              onOpenSettings={onOpenSettings}
              onOpenInSplit={onOpenInSplit}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // Document item
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer',
        'hover:bg-muted/50 transition-colors',
        isSelected && 'bg-primary/10 text-primary',
        isDragging && 'opacity-50 bg-muted'
      )}
      onClick={handleClick}
    >
      {/* Drag handle with dropdown menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div
            className="opacity-0 group-hover:opacity-100 cursor-pointer hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {onOpenInSplit && (
            <>
              <DropdownMenuItem onClick={() => onOpenInSplit(node.id)}>
                <Columns2 className="h-4 w-4 mr-2" />
                Open in Split
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={() => onRename(node.id, 'document')}>
            Rename
          </DropdownMenuItem>
          {onOpenSettings && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onOpenSettings(node.id)}>
                <Settings className="h-4 w-4 mr-2" />
                Citation Aliases
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-destructive"
            onClick={() => onDelete(node.id, 'document')}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Hidden drag handle for DnD */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-0 w-full h-full opacity-0 cursor-grab"
        style={{ pointerEvents: 'none' }}
      />

      {/* Indent spacer */}
      <div style={{ width: depth * 16 + 20 }} />

      {/* Icon */}
      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />

      {/* Name */}
      <span className="flex-1 text-sm truncate">{node.name}</span>
    </div>
  );
}
