/**
 * NoteEditor - Create and edit notes with citation support
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoteEditorProps {
  initialContent?: string;
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
  placeholder?: string;
  className?: string;
}

export function NoteEditor({
  initialContent = "",
  onSave,
  onCancel,
  placeholder = "Write your note here...",
  className,
}: NoteEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    
    setSaving(true);
    try {
      await onSave(content.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="min-h-[100px] text-sm"
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={saving}
        >
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || !content.trim()}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          Save
        </Button>
      </div>
    </div>
  );
}
