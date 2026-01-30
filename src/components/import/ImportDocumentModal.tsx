/**
 * ImportDocumentModal - Document import with file upload and local parsing
 * 
 * All parsing runs client-side - no server required.
 */

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocalDocuments } from '@/hooks/useLocalDocuments';
import { parseDocument, ParsedNode } from '@/lib/parser/documentParser';
import { toast } from '@/hooks/use-toast';
import { Loader2, Upload, AlertCircle } from 'lucide-react';
import { DocumentCategory, SourceType } from '@/lib/db';
import { DocumentNode } from '@/types/document';

interface ImportDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type ImportStep = 'upload' | 'configure' | 'preview';

const CATEGORY_OPTIONS: { value: DocumentCategory; label: string }[] = [
  { value: 'scripture', label: 'Scripture' },
  { value: 'catechism', label: 'Catechism' },
  { value: 'patristic', label: 'Patristic' },
  { value: 'commentary', label: 'Commentary' },
  { value: 'custom', label: 'Custom' },
];

const SOURCE_TYPE_OPTIONS: { value: SourceType; label: string; description: string }[] = [
  { value: 'catechism', label: 'Catechism', description: 'Numbered paragraphs 1-2865' },
  { value: 'scripture', label: 'Scripture', description: 'Book:chapter:verse format' },
  { value: 'patristic', label: 'Patristic', description: 'Chapter titles, numbered prose' },
  { value: 'treatise', label: 'Treatise', description: 'Theological works with sections' },
  { value: 'generic', label: 'Generic', description: 'General numbered paragraphs' },
];

export function ImportDocumentModal({ open, onOpenChange, onSuccess }: ImportDocumentModalProps) {
  const { saveDocument } = useLocalDocuments();
  const [step, setStep] = useState<ImportStep>('upload');
  const [loading, setLoading] = useState(false);
  
  // File state
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  
  // Metadata state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('custom');
  const [sourceType, setSourceType] = useState<SourceType>('generic');
  
  // Parsed result
  const [parsedNodes, setParsedNodes] = useState<DocumentNode[]>([]);
  const [parseStats, setParseStats] = useState<{ total: number; structural: number; citable: number } | null>(null);

  const resetState = () => {
    setStep('upload');
    setRawText('');
    setFileName('');
    setTitle('');
    setAuthor('');
    setCategory('custom');
    setSourceType('generic');
    setParsedNodes([]);
    setParseStats(null);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setFileName(file.name);
    
    // Extract title from filename
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    setTitle(baseName);

    try {
      const fileType = file.name.split('.').pop()?.toLowerCase();
      
      if (fileType === 'txt' || fileType === 'md') {
        // Direct text reading
        const text = await file.text();
        setRawText(text);
        setStep('configure');
      } else {
        toast({
          title: 'Unsupported format',
          description: 'Please use TXT or MD files, or paste text directly.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error reading file',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawText(e.target.value);
    if (e.target.value.length > 100) {
      setStep('configure');
    }
  };

  const handleParse = async () => {
    if (!rawText.trim()) {
      toast({
        title: 'No content',
        description: 'Please upload a file or paste text to import.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Parse locally - no server required
      const result = parseDocument(rawText, sourceType);

      const nodes: DocumentNode[] = result.nodes.map((n: ParsedNode, index: number) => ({
        ...n,
        id: `temp-${index}`,
      })) as DocumentNode[];

      setParsedNodes(nodes);
      setParseStats(result.stats);
      setStep('preview');
    } catch (err: any) {
      console.error('Parse error:', err);
      toast({
        title: 'Parsing failed',
        description: err.message || 'Could not parse document.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a document title.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await saveDocument(
        title.trim(),
        author.trim() || undefined,
        category,
        sourceType,
        parsedNodes,
        rawText
      );

      toast({
        title: 'Document imported',
        description: `"${title}" has been added to your library.`,
      });

      handleClose();
      onSuccess?.();
    } catch (err: any) {
      toast({
        title: 'Save failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {step === 'upload' && 'Import Document'}
            {step === 'configure' && 'Configure Import'}
            {step === 'preview' && 'Preview & Save'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-1">
          {step === 'upload' && (
            <div className="space-y-6 py-4">
              {/* File Upload */}
              <div className="space-y-2">
                <Label>Upload File</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept=".txt,.md"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                    ) : (
                      <Upload className="h-10 w-10 text-muted-foreground" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {fileName || 'Click to upload TXT or MD files'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Or Paste */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or paste text</span>
                </div>
              </div>

              <div className="space-y-2">
                <Textarea
                  placeholder="Paste your document text here..."
                  className="min-h-[200px] font-mono text-sm"
                  value={rawText}
                  onChange={handlePaste}
                />
              </div>

              {rawText.length > 0 && (
                <Button onClick={() => setStep('configure')} className="w-full">
                  Continue with pasted text
                </Button>
              )}
            </div>
          )}

          {step === 'configure' && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Document title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Author name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Source Type (for parsing)</Label>
                  <Select value={sourceType} onValueChange={(v) => setSourceType(v as SourceType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div>
                            <span>{opt.label}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({opt.description})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Text Preview</Label>
                <div className="bg-muted/50 rounded-md p-4 max-h-48 overflow-auto">
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {rawText.substring(0, 1000)}
                    {rawText.length > 1000 && '...'}
                  </pre>
                </div>
                <p className="text-xs text-muted-foreground">
                  {rawText.length.toLocaleString()} characters
                </p>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4 py-4">
              {parseStats && (
                <div className="flex gap-4 p-4 bg-muted/50 rounded-md">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{parseStats.total}</div>
                    <div className="text-xs text-muted-foreground">Total Nodes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{parseStats.structural}</div>
                    <div className="text-xs text-muted-foreground">Structural</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{parseStats.citable}</div>
                    <div className="text-xs text-muted-foreground">Citable</div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Parsed Structure Preview</Label>
                <div className="bg-muted/50 rounded-md p-4 max-h-64 overflow-auto space-y-2">
                  {parsedNodes.slice(0, 20).map((node, i) => (
                    <div
                      key={i}
                      className={`text-sm ${
                        node.nodeType === 'structural'
                          ? 'font-bold text-primary'
                          : 'text-foreground'
                      }`}
                    >
                      {node.nodeType === 'structural' ? (
                        <span className="flex items-center gap-2">
                          <span className="text-xs bg-primary/20 px-1 rounded">
                            {(node as any).level}
                          </span>
                          {node.content.substring(0, 80)}
                        </span>
                      ) : (
                        <span className="flex gap-2">
                          <span className="text-primary font-semibold w-8 text-right flex-shrink-0">
                            {(node as any).displayNumber}
                          </span>
                          <span className="truncate">
                            {node.content.substring(0, 100)}...
                          </span>
                        </span>
                      )}
                    </div>
                  ))}
                  {parsedNodes.length > 20 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      ... and {parsedNodes.length - 20} more nodes
                    </p>
                  )}
                </div>
              </div>

              {parsedNodes.length === 0 && (
                <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-md">
                  <AlertCircle className="h-5 w-5" />
                  <span>No content could be parsed. Check your source type selection.</span>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2">
          {step !== 'upload' && (
            <Button
              variant="outline"
              onClick={() => setStep(step === 'preview' ? 'configure' : 'upload')}
              disabled={loading}
            >
              Back
            </Button>
          )}
          
          {step === 'configure' && (
            <Button onClick={handleParse} disabled={loading || !rawText.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Parse Document
            </Button>
          )}
          
          {step === 'preview' && (
            <Button onClick={handleSave} disabled={loading || parsedNodes.length === 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save to Library
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
