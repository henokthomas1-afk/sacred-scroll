/**
 * UnifiedSidebar - Obsidian-style unified navigation sidebar
 * 
 * Combines Library and Notes into a single persistent left sidebar
 * with collapsible sections and focus mode support.
 */

import { useState, useCallback, useRef } from 'react';
import { useGlobalNotes, TreeNode } from '@/hooks/useGlobalNotes';
import { useDocumentFolders, DocTreeNode } from '@/hooks/useDocumentFolders';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { NoteTree } from '@/components/notes/obsidian/NoteTree';
import { DocumentTree } from '@/components/layout/DocumentTree';
import { NewItemMenu } from '@/components/layout/NewItemMenu';
import { LibraryItemMenu } from '@/components/layout/LibraryItemMenu';
import { CreateDialog } from '@/components/notes/obsidian/CreateDialog';
import { RenameDialog } from '@/components/notes/obsidian/RenameDialog';
import { DeleteConfirmDialog } from '@/components/notes/obsidian/DeleteConfirmDialog';
import { DocumentSettingsModal } from '@/components/reader/DocumentSettingsModal';
import { ParsedDocument } from '@/types/document';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  FolderPlus, 
  FileText, 
  Loader2,
  StickyNote,
  Book,
  BookOpen,
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
  onOpenBible?: () => void;
  isBibleActive?: boolean;
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
  onOpenBible,
  isBibleActive = false,
  className,
}: UnifiedSidebarProps) {
  const {
    folders: noteFolders,
    notes,
    tree: noteTree,
    loading: notesLoading,
    createFolder: createNoteFolder,
    renameFolder: renameNoteFolder,
    deleteFolder: deleteNoteFolder,
    createNote,
    updateNote,
    deleteNote,
    moveItem: moveNoteItem,
  } = useGlobalNotes();

  const {
    folders: docFolders,
    tree: docTree,
    loading: docsLoading,
    createFolder: createDocFolder,
    renameFolder: renameDocFolder,
    deleteFolder: deleteDocFolder,
    moveItem: moveDocItem,
  } = useDocumentFolders(documents);

  // Persistent section collapse states
  const [libraryOpen, setLibraryOpen] = useLocalStorage('sacredScroll.libraryOpen', true);
  const [notesOpen, setNotesOpen] = useLocalStorage('sacredScroll.notesOpen', true);
  
  // Inline creation states for Notes
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [isCreatingNoteFolder, setIsCreatingNoteFolder] = useState(false);
  const [newNoteItemName, setNewNoteItemName] = useState('');
  const newNoteInputRef = useRef<HTMLInputElement>(null);

  // Inline creation states for Documents
  const [isCreatingDocFolder, setIsCreatingDocFolder] = useState(false);
  const [newDocFolderName, setNewDocFolderName] = useState('');
  const newDocInputRef = useRef<HTMLInputElement>(null);
  
  // Dialog states (for nested creation via context menu)
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<'folder' | 'note'>('note');
  const [createContext, setCreateContext] = useState<'notes' | 'documents'>('notes');
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [createParentName, setCreateParentName] = useState<string | undefined>();

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameId, setRenameId] = useState<string>('');
  const [renameType, setRenameType] = useState<'folder' | 'note' | 'document'>('note');
  const [renameContext, setRenameContext] = useState<'notes' | 'documents'>('notes');
  const [renameName, setRenameName] = useState('');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>('');
  const [deleteType, setDeleteType] = useState<'folder' | 'note'>('note');
  const [deleteContext, setDeleteContext] = useState<'notes' | 'documents'>('notes');
  const [deleteName, setDeleteName] = useState('');
  const [deleteHasChildren, setDeleteHasChildren] = useState(false);

  // Document settings modal state
  const [settingsDocId, setSettingsDocId] = useState<string | null>(null);
  const settingsDoc = settingsDocId ? documents.find(d => d.metadata.id === settingsDocId) : null;
  const findNoteNode = useCallback((id: string, nodes: TreeNode[] = noteTree): TreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNoteNode(id, node.children);
        if (found) return found;
      }
    }
    return null;
  }, [noteTree]);

  // Find node helper for documents
  const findDocNode = useCallback((id: string, nodes: DocTreeNode[] = docTree): DocTreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findDocNode(id, node.children);
        if (found) return found;
      }
    }
    return null;
  }, [docTree]);

  // ============= Notes Inline Creation =============

  const handleInstantCreateNote = useCallback(() => {
    setIsCreatingNote(true);
    setNewNoteItemName('Untitled');
    setTimeout(() => {
      newNoteInputRef.current?.focus();
      newNoteInputRef.current?.select();
    }, 0);
  }, []);

  const handleInstantCreateNoteFolder = useCallback(() => {
    setIsCreatingNoteFolder(true);
    setNewNoteItemName('New Folder');
    setTimeout(() => {
      newNoteInputRef.current?.focus();
      newNoteInputRef.current?.select();
    }, 0);
  }, []);

  const handleConfirmNoteInlineCreate = async () => {
    const name = newNoteItemName.trim() || (isCreatingNote ? 'Untitled' : 'New Folder');
    try {
      if (isCreatingNote) {
        const id = await createNote(name, '', null);
        onSelectNote(id);
        toast({ title: 'Note created' });
      } else if (isCreatingNoteFolder) {
        await createNoteFolder(name, null);
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
      setIsCreatingNoteFolder(false);
      setNewNoteItemName('');
    }
  };

  const handleCancelNoteInlineCreate = () => {
    setIsCreatingNote(false);
    setIsCreatingNoteFolder(false);
    setNewNoteItemName('');
  };

  const handleNoteInlineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirmNoteInlineCreate();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelNoteInlineCreate();
    }
  };

  // ============= Documents Inline Creation =============

  const handleInstantCreateDocFolder = useCallback(() => {
    setIsCreatingDocFolder(true);
    setNewDocFolderName('New Folder');
    setTimeout(() => {
      newDocInputRef.current?.focus();
      newDocInputRef.current?.select();
    }, 0);
  }, []);

  const handleConfirmDocInlineCreate = async () => {
    const name = newDocFolderName.trim() || 'New Folder';
    try {
      await createDocFolder(name, null);
      toast({ title: 'Folder created' });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsCreatingDocFolder(false);
      setNewDocFolderName('');
    }
  };

  const handleCancelDocInlineCreate = () => {
    setIsCreatingDocFolder(false);
    setNewDocFolderName('');
  };

  const handleDocInlineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirmDocInlineCreate();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelDocInlineCreate();
    }
  };

  // ============= Create handlers for nested items (via context menu) =============

  const handleCreateNoteInFolder = useCallback((parentId: string | null) => {
    if (parentId === null) {
      handleInstantCreateNote();
    } else {
      setCreateContext('notes');
      setCreateType('note');
      setCreateParentId(parentId);
      const parent = noteFolders.find(f => f.id === parentId);
      setCreateParentName(parent?.name);
      setCreateDialogOpen(true);
    }
  }, [noteFolders, handleInstantCreateNote]);

  const handleCreateNoteFolderInFolder = useCallback((parentId: string | null) => {
    if (parentId === null) {
      handleInstantCreateNoteFolder();
    } else {
      setCreateContext('notes');
      setCreateType('folder');
      setCreateParentId(parentId);
      const parent = noteFolders.find(f => f.id === parentId);
      setCreateParentName(parent?.name);
      setCreateDialogOpen(true);
    }
  }, [noteFolders, handleInstantCreateNoteFolder]);

  const handleCreateDocFolderInFolder = useCallback((parentId: string | null) => {
    if (parentId === null) {
      handleInstantCreateDocFolder();
    } else {
      setCreateContext('documents');
      setCreateType('folder');
      setCreateParentId(parentId);
      const parent = docFolders.find(f => f.id === parentId);
      setCreateParentName(parent?.name);
      setCreateDialogOpen(true);
    }
  }, [docFolders, handleInstantCreateDocFolder]);

  const handleCreate = async (name: string) => {
    try {
      if (createContext === 'notes') {
        if (createType === 'folder') {
          await createNoteFolder(name, createParentId);
          toast({ title: 'Folder created' });
        } else {
          const id = await createNote(name, '', createParentId);
          onSelectNote(id);
          toast({ title: 'Note created' });
        }
      } else {
        await createDocFolder(name, createParentId);
        toast({ title: 'Folder created' });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  // ============= Rename handlers =============

  const handleRenameNote = useCallback((id: string, type: 'folder' | 'note') => {
    setRenameId(id);
    setRenameType(type);
    setRenameContext('notes');
    
    if (type === 'folder') {
      const folder = noteFolders.find(f => f.id === id);
      setRenameName(folder?.name || '');
    } else {
      const note = notes.find(n => n.id === id);
      setRenameName(note?.title || '');
    }
    
    setRenameDialogOpen(true);
  }, [noteFolders, notes]);

  const handleRenameDoc = useCallback((id: string, type: 'folder' | 'document') => {
    setRenameId(id);
    setRenameType(type);
    setRenameContext('documents');
    
    if (type === 'folder') {
      const folder = docFolders.find(f => f.id === id);
      setRenameName(folder?.name || '');
    } else {
      // Documents have titles from metadata, renaming would need different logic
      const doc = documents.find(d => d.metadata.id === id);
      setRenameName(doc?.metadata.title || '');
    }
    
    setRenameDialogOpen(true);
  }, [docFolders, documents]);

  const handleRenameSubmit = async (newName: string) => {
    try {
      if (renameContext === 'notes') {
        if (renameType === 'folder') {
          await renameNoteFolder(renameId, newName);
        } else {
          await updateNote(renameId, { title: newName });
        }
      } else {
        if (renameType === 'folder') {
          await renameDocFolder(renameId, newName);
        }
        // Document renaming would require updating the document title in db.ts
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

  // ============= Delete handlers =============

  const handleDeleteNote = useCallback((id: string, type: 'folder' | 'note') => {
    setDeleteId(id);
    setDeleteType(type);
    setDeleteContext('notes');
    
    if (type === 'folder') {
      const folder = noteFolders.find(f => f.id === id);
      setDeleteName(folder?.name || '');
      const node = findNoteNode(id);
      setDeleteHasChildren(!!node?.children?.length);
    } else {
      const note = notes.find(n => n.id === id);
      setDeleteName(note?.title || '');
      setDeleteHasChildren(false);
    }
    
    setDeleteDialogOpen(true);
  }, [noteFolders, notes, findNoteNode]);

  const handleDeleteDoc = useCallback((id: string, type: 'folder') => {
    setDeleteId(id);
    setDeleteType(type);
    setDeleteContext('documents');
    
    const folder = docFolders.find(f => f.id === id);
    setDeleteName(folder?.name || '');
    const node = findDocNode(id);
    setDeleteHasChildren(!!node?.children?.length);
    
    setDeleteDialogOpen(true);
  }, [docFolders, findDocNode]);

  const handleDeleteConfirm = async () => {
    try {
      if (deleteContext === 'notes') {
        if (deleteType === 'folder') {
          await deleteNoteFolder(deleteId);
          toast({ title: 'Folder deleted' });
        } else {
          await deleteNote(deleteId);
          if (selectedNoteId === deleteId) {
            onSelectNote('');
          }
          toast({ title: 'Note deleted' });
        }
      } else {
        await deleteDocFolder(deleteId);
        toast({ title: 'Folder deleted' });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  // ============= Document Settings =============
  
  const handleOpenDocSettings = useCallback((docId: string) => {
    setSettingsDocId(docId);
  }, []);

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
            <Upload className="h-4 w-4" />
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

      {/* Bible button - prominent top-level entry */}
      {onOpenBible && (
        <div className="shrink-0 px-2 py-2 border-b border-sidebar-border">
          <Button
            variant={isBibleActive ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "w-full justify-start gap-2 h-9",
              isBibleActive && "bg-primary/10 text-primary"
            )}
            onClick={onOpenBible}
          >
            <BookOpen className="h-4 w-4" />
            <span className="font-medium">Bible</span>
          </Button>
        </div>
      )}

      {/* Scrollable content */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Library/Documents Section */}
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
              {/* Inline folder creation input */}
              {isCreatingDocFolder && (
                <div className="flex items-center gap-1 px-2 py-1 mt-1">
                  <div className="w-4 flex-shrink-0">
                    <FolderPlus className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <Input
                    ref={newDocInputRef}
                    value={newDocFolderName}
                    onChange={(e) => setNewDocFolderName(e.target.value)}
                    onKeyDown={handleDocInlineKeyDown}
                    onBlur={handleConfirmDocInlineCreate}
                    className="h-6 text-sm px-2 py-0"
                    placeholder="Folder name..."
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0"
                    onClick={handleConfirmDocInlineCreate}
                  >
                    <Check className="h-3 w-3 text-primary" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0"
                    onClick={handleCancelDocInlineCreate}
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              )}

              {docsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Single "+ New..." entry point for Documents */}
                  {!isCreatingDocFolder && (
                    <LibraryItemMenu
                      onCreateFolder={handleInstantCreateDocFolder}
                      onImportDocument={onImportDocument}
                      className="mt-1"
                    />
                  )}
                  
                  {docTree.length === 0 && !isCreatingDocFolder ? (
                    <div className="px-3 py-2 text-center">
                      <p className="text-xs text-muted-foreground">No documents yet</p>
                    </div>
                  ) : (
                    <DocumentTree
                      tree={docTree}
                      documents={documents}
                      selectedDocumentId={selectedDocumentId}
                      onSelectDocument={onSelectDocument}
                      onMoveItem={moveDocItem}
                      onRename={handleRenameDoc}
                      onDelete={handleDeleteDoc}
                      onCreateFolder={handleCreateDocFolderInFolder}
                      onOpenSettings={handleOpenDocSettings}
                      className="mt-0.5"
                    />
                  )}
                </>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Divider */}
          <div className="h-px bg-sidebar-border my-2" />

          {/* Notes Section - header is static, no action buttons */}
          <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 h-8 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
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
            <CollapsibleContent>
              {/* Inline creation input */}
              {(isCreatingNote || isCreatingNoteFolder) && (
                <div className="flex items-center gap-1 px-2 py-1 mt-1">
                  <div className="w-4 flex-shrink-0">
                    {isCreatingNote ? (
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <FolderPlus className="h-3.5 w-3.5 text-primary" />
                    )}
                  </div>
                  <Input
                    ref={newNoteInputRef}
                    value={newNoteItemName}
                    onChange={(e) => setNewNoteItemName(e.target.value)}
                    onKeyDown={handleNoteInlineKeyDown}
                    onBlur={handleConfirmNoteInlineCreate}
                    className="h-6 text-sm px-2 py-0"
                    placeholder={isCreatingNote ? 'Note name...' : 'Folder name...'}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0"
                    onClick={handleConfirmNoteInlineCreate}
                  >
                    <Check className="h-3 w-3 text-primary" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0"
                    onClick={handleCancelNoteInlineCreate}
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              )}

              {notesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Single "+ New..." entry point */}
                  {!isCreatingNote && !isCreatingNoteFolder && (
                    <NewItemMenu
                      onCreateNote={handleInstantCreateNote}
                      onCreateFolder={handleInstantCreateNoteFolder}
                      className="mt-1"
                    />
                  )}
                  
                  {noteTree.length === 0 && !isCreatingNote && !isCreatingNoteFolder ? (
                    <div className="px-3 py-2 text-center">
                      <p className="text-xs text-muted-foreground">No notes yet</p>
                    </div>
                  ) : (
                    <NoteTree
                      tree={noteTree}
                      selectedNoteId={selectedNoteId}
                      onSelectNote={onSelectNote}
                      onMoveItem={moveNoteItem}
                      onRename={handleRenameNote}
                      onDelete={handleDeleteNote}
                      onCreateNote={handleCreateNoteInFolder}
                      onCreateFolder={handleCreateNoteFolderInFolder}
                      className="mt-0.5"
                    />
                  )}
                </>
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
        itemType={renameType === 'document' ? 'note' : renameType}
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

      {/* Document Settings Modal */}
      {settingsDoc && (
        <DocumentSettingsModal
          open={!!settingsDocId}
          onOpenChange={(open) => !open && setSettingsDocId(null)}
          document={settingsDoc}
        />
      )}
    </div>
  );
}
