/**
 * GlobalNotesPanel - Main Obsidian-style notes panel with folder tree and editor
 */

import { useState, useCallback } from 'react';
import { useGlobalNotes, TreeNode } from '@/hooks/useGlobalNotes';
import { NoteTree } from './NoteTree';
import { GlobalNoteEditor } from './GlobalNoteEditor';
import { CreateDialog } from './CreateDialog';
import { RenameDialog } from './RenameDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  FolderPlus, 
  FileText, 
  Loader2,
  StickyNote,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

interface GlobalNotesPanelProps {
  onCitationClick?: (documentId: string, nodeId?: string) => void;
  className?: string;
}

export function GlobalNotesPanel({
  onCitationClick,
  className,
}: GlobalNotesPanelProps) {
  const {
    folders,
    notes,
    tree,
    loading,
    createFolder,
    renameFolder,
    deleteFolder,
    createNote,
    updateNote,
    deleteNote,
    moveItem,
    removeCitation,
  } = useGlobalNotes();

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<'folder' | 'note'>('note');
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [createParentName, setCreateParentName] = useState<string | undefined>();

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameId, setRenameId] = useState<string>('');
  const [renameType, setRenameType] = useState<'folder' | 'note'>('note');
  const [renameName, setRenameName] = useState('');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>('');
  const [deleteType, setDeleteType] = useState<'folder' | 'note'>('note');
  const [deleteName, setDeleteName] = useState('');
  const [deleteHasChildren, setDeleteHasChildren] = useState(false);

  // Find node helper
  const findNode = useCallback((id: string, nodes: TreeNode[] = tree): TreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(id, node.children);
        if (found) return found;
      }
    }
    return null;
  }, [tree]);

  // Create handlers
  const handleCreateNote = useCallback((parentId: string | null) => {
    setCreateType('note');
    setCreateParentId(parentId);
    if (parentId) {
      const parent = folders.find(f => f.id === parentId);
      setCreateParentName(parent?.name);
    } else {
      setCreateParentName(undefined);
    }
    setCreateDialogOpen(true);
  }, [folders]);

  const handleCreateFolder = useCallback((parentId: string | null) => {
    setCreateType('folder');
    setCreateParentId(parentId);
    if (parentId) {
      const parent = folders.find(f => f.id === parentId);
      setCreateParentName(parent?.name);
    } else {
      setCreateParentName(undefined);
    }
    setCreateDialogOpen(true);
  }, [folders]);

  const handleCreate = async (name: string) => {
    try {
      if (createType === 'folder') {
        await createFolder(name, createParentId);
        toast({ title: 'Folder created' });
      } else {
        const id = await createNote(name, '', createParentId);
        setSelectedNoteId(id);
        toast({ title: 'Note created' });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  // Rename handlers
  const handleRename = useCallback((id: string, type: 'folder' | 'note') => {
    setRenameId(id);
    setRenameType(type);
    
    if (type === 'folder') {
      const folder = folders.find(f => f.id === id);
      setRenameName(folder?.name || '');
    } else {
      const note = notes.find(n => n.id === id);
      setRenameName(note?.title || '');
    }
    
    setRenameDialogOpen(true);
  }, [folders, notes]);

  const handleRenameSubmit = async (newName: string) => {
    try {
      if (renameType === 'folder') {
        await renameFolder(renameId, newName);
      } else {
        await updateNote(renameId, { title: newName });
      }
      toast({ title: 'Renamed successfully' });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  // Delete handlers
  const handleDelete = useCallback((id: string, type: 'folder' | 'note') => {
    setDeleteId(id);
    setDeleteType(type);
    
    if (type === 'folder') {
      const folder = folders.find(f => f.id === id);
      setDeleteName(folder?.name || '');
      // Check if has children
      const node = findNode(id);
      setDeleteHasChildren(!!node?.children?.length);
    } else {
      const note = notes.find(n => n.id === id);
      setDeleteName(note?.title || '');
      setDeleteHasChildren(false);
    }
    
    setDeleteDialogOpen(true);
  }, [folders, notes, findNode]);

  const handleDeleteConfirm = async () => {
    try {
      if (deleteType === 'folder') {
        await deleteFolder(deleteId);
        toast({ title: 'Folder deleted' });
      } else {
        await deleteNote(deleteId);
        if (selectedNoteId === deleteId) {
          setSelectedNoteId(null);
        }
        toast({ title: 'Note deleted' });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  // Note update handler
  const handleUpdateNote = async (id: string, updates: Partial<{ title: string; content: string }>) => {
    await updateNote(id, updates);
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Sidebar with tree */}
        <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
          <div className="flex flex-col h-full border-r border-border">
            {/* Header */}
            <div className="shrink-0 p-3 border-b border-border flex items-center justify-between">
              <h2 className="font-display font-semibold flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                Notes
              </h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleCreateNote(null)}>
                    <FileText className="h-4 w-4 mr-2" />
                    New Note
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCreateFolder(null)}>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    New Folder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Tree */}
            {tree.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <StickyNote className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  No notes yet
                </p>
                <Button
                  size="sm"
                  onClick={() => handleCreateNote(null)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first note
                </Button>
              </div>
            ) : (
              <NoteTree
                tree={tree}
                selectedNoteId={selectedNoteId}
                onSelectNote={setSelectedNoteId}
                onMoveItem={moveItem}
                onRename={handleRename}
                onDelete={handleDelete}
                onCreateNote={handleCreateNote}
                onCreateFolder={handleCreateFolder}
                className="flex-1"
              />
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Editor */}
        <ResizablePanel defaultSize={65}>
          {selectedNoteId ? (
            <GlobalNoteEditor
              noteId={selectedNoteId}
              onUpdate={handleUpdateNote}
              onCitationClick={onCitationClick}
              onRemoveCitation={removeCitation}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No note selected</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select a note from the sidebar or create a new one
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCreateNote(null)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </Button>
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Dialogs */}
      <CreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        itemType={createType}
        parentName={createParentName}
        onCreate={handleCreate}
      />

      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        itemType={renameType}
        currentName={renameName}
        onRename={handleRenameSubmit}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemType={deleteType}
        itemName={deleteName}
        hasChildren={deleteHasChildren}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
