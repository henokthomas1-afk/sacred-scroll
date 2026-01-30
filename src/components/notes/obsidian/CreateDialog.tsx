/**
 * CreateDialog - Dialog for creating new folders and notes
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Folder, FileText } from 'lucide-react';

interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: 'folder' | 'note';
  parentName?: string;
  onCreate: (name: string) => Promise<void>;
}

export function CreateDialog({
  open,
  onOpenChange,
  itemType,
  parentName,
  onCreate,
}: CreateDialogProps) {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    try {
      await onCreate(name.trim());
      onOpenChange(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {itemType === 'folder' ? (
                <Folder className="h-5 w-5 text-primary" />
              ) : (
                <FileText className="h-5 w-5 text-muted-foreground" />
              )}
              New {itemType === 'folder' ? 'Folder' : 'Note'}
            </DialogTitle>
            <DialogDescription>
              {parentName ? (
                <>Create a new {itemType} in "{parentName}"</>
              ) : (
                <>Create a new {itemType} at the root level</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="name" className="sr-only">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={itemType === 'folder' ? 'Folder name' : 'Note title'}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={creating || !name.trim()}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
