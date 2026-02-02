/**
 * RenameDialog - Dialog for renaming folders and notes
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
import { Loader2 } from 'lucide-react';

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: 'folder' | 'note' | 'document';
  currentName: string;
  onRename: (newName: string) => Promise<void>;
}

export function RenameDialog({
  open,
  onOpenChange,
  itemType,
  currentName,
  onRename,
}: RenameDialogProps) {
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(currentName);
    }
  }, [open, currentName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onRename(name.trim());
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              Rename {itemType === 'folder' ? 'Folder' : itemType === 'document' ? 'Document' : 'Note'}
            </DialogTitle>
            <DialogDescription>
              Enter a new name for this {itemType}.
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
              placeholder={itemType === 'folder' ? 'Folder name' : itemType === 'document' ? 'Document title' : 'Note title'}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
