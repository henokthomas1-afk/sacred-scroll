/**
 * UnifiedSidebar - Obsidian-style unified navigation sidebar
 * 
 * Combines Library and Notes into a single persistent left sidebar
 * with collapsible sections and focus mode support.
 */

import { useState, useCallback, useRef } from 'react';
import { useGlobalNotes, TreeNode } from '@/hooks/useGlobalNotes';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { NoteTree } from '@/components/notes/obsidian/NoteTree';
import { CreateDialog } from '@/components/notes/obsidian/CreateDialog';
import { RenameDialog } from '@/components/notes/obsidian/RenameDialog';
import { DeleteConfirmDialog } from '@/components/notes/obsidian/DeleteConfirmDialog';
import { ParsedDocument } from '@/types/document';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  FolderPlus, 
  FileText, 
  Loader2,
  StickyNote,
  Book,
  ChevronDown,
  ChevronRight,
  Menu,
  Upload,
  Download,
  X,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface UnifiedSidebarProps {
  documents: ParsedDocument[];
  selectedDocumentId: string | null;
  onSelectDocument: (doc: ParsedDocument) => void;
  selectedNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  onImportDocument: () => void;
  onExportLibrary: () => void;
  onImportLibrary: () => void;
  className?: string;
}

export function UnifiedSidebar({
  documents,
  selectedDocumentId,
  onSelectDocument,
  selectedNoteId,
  onSelectNote,
  onImportDocument,
  onExportLibrary,
  onImportLibrary,
  className,
}: UnifiedSidebarProps) {
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
  } = useGlobalNotes();

  // Persistent section collapse states
  const [libraryOpen, setLibraryOpen] = useLocalStorage('sacredScroll.libraryOpen', true);
  const [notesOpen, setNotesOpen] = useLocalStorage('sacredScroll.notesOpen', true);
  
  // Inline creation states
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const newItemInputRef = useRef<HTMLInputElement>(null);
  
  // Dialog states (for nested creation via context menu)
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

  // Instant note creation (at root level)
  const handleInstantCreateNote = useCallback(() => {
    setIsCreatingNote(true);
    setNewItemName('Untitled');
    setTimeout(() => {
      newItemInputRef.current?.focus();
      newItemInputRef.current?.select();
    }, 0);
  }, []);

  const handleInstantCreateFolder = useCallback(() => {
    setIsCreatingFolder(true);
    setNewItemName('New Folder');
    setTimeout(() => {
      newItemInputRef.current?.focus();
      newItemInputRef.current?.select();
    }, 0);
  }, []);

  const handleConfirmInlineCreate = async () => {
    const name = newItemName.trim() || (isCreatingNote ? 'Untitled' : 'New Folder');
    try {
      if (isCreatingNote) {
        const id = await createNote(name, '', null);
        onSelectNote(id);
        toast({ title: 'Note created' });
      } else if (isCreatingFolder) {
        await createFolder(name, null);
        toast({ title: 'Folder created' });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsCreatingNote(false);
      setIsCreatingFolder(false);
      setNewItemName('');
    }
  };

  const handleCancelInlineCreate = () => {
    setIsCreatingNote(false);
    setIsCreatingFolder(false);
    setNewItemName('');
  };

  const handleInlineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirmInlineCreate();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelInlineCreate();
    }
  };

  // Create handlers for nested items (via context menu)
  const handleCreateNote = useCallback((parentId: string | null) => {
    if (parentId === null) {
      handleInstantCreateNote();
    } else {
      setCreateType('note');
      setCreateParentId(parentId);
      const parent = folders.find(f => f.id === parentId);
      setCreateParentName(parent?.name);
      setCreateDialogOpen(true);
    }
  }, [folders, handleInstantCreateNote]);

  const handleCreateFolder = useCallback((parentId: string | null) => {
    if (parentId === null) {
      handleInstantCreateFolder();
    } else {
      setCreateType('folder');
      setCreateParentId(parentId);
      const parent = folders.find(f => f.id === parentId);
      setCreateParentName(parent?.name);
      setCreateDialogOpen(true);
    }
  }, [folders, handleInstantCreateFolder]);

  const handleCreate = async (name: string) => {
    try {
      if (createType === 'folder') {
        await createFolder(name, createParentId);
        toast({ title: 'Folder created' });
      } else {
        const id = await createNote(name, '', createParentId);
        onSelectNote(id);
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
          onSelectNote('');
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

  const getDocumentIcon = (sourceType: ParsedDocument["metadata"]["sourceType"]) => {
    return Book;
  };

  return (
    <div className={cn('flex flex-col h-full bg-sidebar', className)}>
      {/* Header with app controls */}
      <div className="shrink-0 p-3 border-b border-sidebar-border flex items-center justify-between">
        <span className="font-display font-semibold text-sidebar-foreground">Library</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onImportDocument}
            title="Import document"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onExportLibrary}>
                <Download className="h-4 w-4 mr-2" />
                Export Library
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onImportLibrary}>
                <Upload className="h-4 w-4 mr-2" />
                Import Library
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                {documents.length} documents
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Library Section */}
          <Collapsible open={libraryOpen} onOpenChange={setLibraryOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 h-8 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                {libraryOpen ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                <Book className="h-3 w-3" />
                Documents
                <span className="ml-auto text-xs opacity-60">{documents.length}</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-0.5 mt-1">
                {documents.map((doc) => {
                  const isSelected = doc.metadata.id === selectedDocumentId;
                  return (
                    <Button
                      key={doc.metadata.id}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start h-8 px-3 text-sm font-normal",
                        isSelected && "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                      onClick={() => onSelectDocument(doc)}
                    >
                      <FileText className="h-3.5 w-3.5 mr-2 flex-shrink-0 text-muted-foreground" />
                      <span className="truncate">{doc.metadata.title}</span>
                    </Button>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Divider */}
          <div className="h-px bg-sidebar-border my-2" />

          {/* Notes Section */}
          <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
            <div className="flex items-center">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 justify-start gap-2 h-8 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  {notesOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  <StickyNote className="h-3 w-3" />
                  Notes
                  <span className="ml-auto text-xs opacity-60">{notes.length}</span>
                </Button>
              </CollapsibleTrigger>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 mr-1">
                    <Plus className="h-3 w-3" />
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
            <CollapsibleContent>
              {/* Inline creation input */}
              {(isCreatingNote || isCreatingFolder) && (
                <div className="flex items-center gap-1 px-2 py-1 mt-1">
                  <div className="w-4 flex-shrink-0">
                    {isCreatingNote ? (
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <FolderPlus className="h-3.5 w-3.5 text-primary" />
                    )}
                  </div>
                  <Input
                    ref={newItemInputRef}
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={handleInlineKeyDown}
                    onBlur={handleConfirmInlineCreate}
                    className="h-6 text-sm px-2 py-0"
                    placeholder={isCreatingNote ? 'Note name...' : 'Folder name...'}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0"
                    onClick={handleConfirmInlineCreate}
                  >
                    <Check className="h-3 w-3 text-primary" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0"
                    onClick={handleCancelInlineCreate}
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : tree.length === 0 && !isCreatingNote && !isCreatingFolder ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-xs text-muted-foreground mb-2">No notes yet</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => handleCreateNote(null)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Create note
                  </Button>
                </div>
              ) : (
                <NoteTree
                  tree={tree}
                  selectedNoteId={selectedNoteId}
                  onSelectNote={onSelectNote}
                  onMoveItem={moveItem}
                  onRename={handleRename}
                  onDelete={handleDelete}
                  onCreateNote={handleCreateNote}
                  onCreateFolder={handleCreateFolder}
                  className="mt-1"
                />
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>

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
