/**
 * LibraryItemMenu - Inline dropdown for creating document folders and importing
 * 
 * Obsidian-style minimal entry point for document library actions.
 */

import { useState } from 'react';
import { Plus, FolderPlus, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface LibraryItemMenuProps {
  onCreateFolder: () => void;
  onImportDocument: () => void;
  className?: string;
}

export function LibraryItemMenu({
  onCreateFolder,
  onImportDocument,
  className,
}: LibraryItemMenuProps) {
  const [open, setOpen] = useState(false);

  const handleCreateFolder = () => {
    setOpen(false);
    onCreateFolder();
  };

  const handleImportDocument = () => {
    setOpen(false);
    onImportDocument();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      handleCreateFolder();
    } else if (e.key === 'i' || e.key === 'I') {
      e.preventDefault();
      handleImportDocument();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start h-7 px-3 text-sm font-normal text-muted-foreground hover:text-foreground hover:bg-sidebar-accent",
            className
          )}
        >
          <Plus className="h-3.5 w-3.5 mr-2" />
          New...
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-44 p-1" 
        align="start"
        sideOffset={4}
        onKeyDown={handleKeyDown}
      >
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-8 px-2 text-sm font-normal"
          onClick={handleCreateFolder}
        >
          <FolderPlus className="h-4 w-4 mr-2 text-muted-foreground" />
          New Folder
          <span className="ml-auto text-xs text-muted-foreground">F</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-8 px-2 text-sm font-normal"
          onClick={handleImportDocument}
        >
          <Upload className="h-4 w-4 mr-2 text-muted-foreground" />
          Import Document
          <span className="ml-auto text-xs text-muted-foreground">I</span>
        </Button>
      </PopoverContent>
    </Popover>
  );
}
