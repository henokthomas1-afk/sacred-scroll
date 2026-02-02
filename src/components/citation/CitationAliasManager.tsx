/**
 * CitationAliasManager - UI for adding/editing/removing document citation aliases
 * 
 * Used in:
 * - Import modal (Step: Configure Aliases)
 * - Document settings panel
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CitationAlias, CITATION_PRESETS, CitationPreset } from '@/types/citationAlias';
import { Plus, Trash2, Edit2, Tag, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CitationAliasManagerProps {
  documentId: string;
  documentTitle: string;
  aliases: CitationAlias[];
  onAddAlias: (
    prefix: string,
    pattern: string,
    numberExtractor: CitationAlias['numberExtractor'],
    displayFormat: string,
    priority?: number
  ) => Promise<string | null>;
  onAddFromPreset: (preset: CitationPreset, customPrefix?: string) => Promise<string | null>;
  onUpdateAlias: (
    id: string,
    updates: Partial<Pick<CitationAlias, 'prefix' | 'pattern' | 'displayFormat' | 'priority'>>
  ) => Promise<boolean>;
  onRemoveAlias: (id: string) => Promise<boolean>;
  checkPrefixAvailable: (prefix: string, excludeId?: string) => Promise<boolean>;
  className?: string;
}

export function CitationAliasManager({
  documentId,
  documentTitle,
  aliases,
  onAddAlias,
  onAddFromPreset,
  onUpdateAlias,
  onRemoveAlias,
  checkPrefixAvailable,
  className,
}: CitationAliasManagerProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingAlias, setEditingAlias] = useState<CitationAlias | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<CitationPreset | ''>('');
  const [customPrefix, setCustomPrefix] = useState('');
  const [prefixError, setPrefixError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handlePresetChange = useCallback(async (preset: CitationPreset) => {
    setSelectedPreset(preset);
    const presetConfig = CITATION_PRESETS.find(p => p.id === preset);
    if (presetConfig) {
      setCustomPrefix(presetConfig.defaultPrefix);
      // Check if prefix is available
      const available = await checkPrefixAvailable(presetConfig.defaultPrefix);
      if (!available) {
        setPrefixError(`"${presetConfig.defaultPrefix}" is already in use`);
      } else {
        setPrefixError(null);
      }
    }
  }, [checkPrefixAvailable]);

  const handlePrefixChange = useCallback(async (value: string) => {
    setCustomPrefix(value);
    if (value.trim()) {
      const available = await checkPrefixAvailable(value.trim(), editingAlias?.id);
      if (!available) {
        setPrefixError(`"${value}" is already in use`);
      } else {
        setPrefixError(null);
      }
    } else {
      setPrefixError(null);
    }
  }, [checkPrefixAvailable, editingAlias]);

  const handleAddFromPreset = useCallback(async () => {
    if (!selectedPreset || !customPrefix.trim() || prefixError) return;

    setSaving(true);
    try {
      const id = await onAddFromPreset(selectedPreset, customPrefix.trim());
      if (id) {
        setAddDialogOpen(false);
        setSelectedPreset('');
        setCustomPrefix('');
      }
    } finally {
      setSaving(false);
    }
  }, [selectedPreset, customPrefix, prefixError, onAddFromPreset]);

  const handleRemoveAlias = useCallback(async (id: string) => {
    await onRemoveAlias(id);
  }, [onRemoveAlias]);

  const handleEditAlias = useCallback((alias: CitationAlias) => {
    setEditingAlias(alias);
    setCustomPrefix(alias.prefix);
    setPrefixError(null);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingAlias || !customPrefix.trim() || prefixError) return;

    setSaving(true);
    try {
      const success = await onUpdateAlias(editingAlias.id, {
        prefix: customPrefix.trim(),
      });
      if (success) {
        setEditingAlias(null);
        setCustomPrefix('');
      }
    } finally {
      setSaving(false);
    }
  }, [editingAlias, customPrefix, prefixError, onUpdateAlias]);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Citation Aliases</h3>
          <p className="text-xs text-muted-foreground">
            Define shortcuts like "CCC 17" that auto-link to this document
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAddDialogOpen(true)}
          className="gap-1"
        >
          <Plus className="h-3 w-3" />
          Add Alias
        </Button>
      </div>

      {aliases.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center">
            <Tag className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No citation aliases defined
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add an alias to enable typing "CCC 17" in notes
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {aliases.map((alias) => (
            <div
              key={alias.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-md group"
            >
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="font-mono">
                  {alias.prefix}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {alias.displayFormat.replace('{prefix}', alias.prefix).replace('{number}', '§')}
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleEditAlias(alias)}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleRemoveAlias(alias.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Alias Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Citation Alias</DialogTitle>
            <DialogDescription>
              Choose a preset or create a custom alias for "{documentTitle}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Preset Type</Label>
              <Select
                value={selectedPreset}
                onValueChange={(v) => handlePresetChange(v as CitationPreset)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a citation style..." />
                </SelectTrigger>
                <SelectContent>
                  {CITATION_PRESETS.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      <div className="flex flex-col items-start">
                        <span>{preset.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {preset.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPreset && (
              <div className="space-y-2">
                <Label>Prefix</Label>
                <Input
                  value={customPrefix}
                  onChange={(e) => handlePrefixChange(e.target.value)}
                  placeholder="e.g., CCC, ST, Conf."
                />
                {prefixError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {prefixError}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Typing "{customPrefix || 'PREFIX'} 17" in notes will link to paragraph 17
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddFromPreset}
              disabled={!selectedPreset || !customPrefix.trim() || !!prefixError || saving}
            >
              Add Alias
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Alias Dialog */}
      <Dialog open={!!editingAlias} onOpenChange={(open) => !open && setEditingAlias(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Citation Alias</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Prefix</Label>
              <Input
                value={customPrefix}
                onChange={(e) => handlePrefixChange(e.target.value)}
                placeholder="e.g., CCC, ST, Conf."
              />
              {prefixError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {prefixError}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAlias(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!customPrefix.trim() || !!prefixError || saving}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
