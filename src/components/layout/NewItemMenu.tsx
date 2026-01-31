/**
 * NewItemMenu - Inline dropdown for creating notes and folders
 * 
 * Obsidian-style minimal entry point for creation.
 */

import { useState, useRef, useEffect } from 'react';
import { Plus, FileText, FolderPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface NewItemMenuProps {
  onCreateNote: () => void;
  onCreateFolder: () => void;
  className?: string;
}

export function NewItemMenu({
  onCreateNote,
  onCreateFolder,
  className,
}: NewItemMenuProps) {
  const [open, setOpen] = useState(false);

  const handleCreateNote = () => {
    setOpen(false);
    onCreateNote();
  };

  const handleCreateFolder = () => {
    setOpen(false);
    onCreateFolder();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      handleCreateNote();
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      handleCreateFolder();
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
        className="w-40 p-1" 
        align="start"
        sideOffset={4}
        onKeyDown={handleKeyDown}
      >
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-8 px-2 text-sm font-normal"
          onClick={handleCreateNote}
        >
          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
          New Note
          <span className="ml-auto text-xs text-muted-foreground">N</span>
        </Button>
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
      </PopoverContent>
    </Popover>
  );
}
