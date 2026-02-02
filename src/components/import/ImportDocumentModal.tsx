/**
 * ImportDocumentModal - Document import with file upload, parsing, review, and save
 *
 * Supports: TXT, MD, PDF, DOC, DOCX
 * All text extraction and parsing runs client-side - no server required.
 *
 * Pipeline: File → Text Extraction → Initial Parse → Review UI → Aliases → Canonicalization → Save
 */

import { useState, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocalDocuments } from "@/hooks/useLocalDocuments";
import { useImportReview } from "@/hooks/useImportReview";
import { useCitationAliases } from "@/hooks/useCitationAliases";
import { ImportReviewPanel } from "@/components/import/ImportReviewPanel";
import { CitationAliasManager } from "@/components/citation/CitationAliasManager";
import { parseDocument, ParsedNode } from "@/lib/parser/documentParser";
import { extractTextFromFile, getAcceptedFileTypes } from "@/lib/textExtractor";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload, AlertCircle, CheckCircle2, Tag } from "lucide-react";
import { DocumentCategory, SourceType, generateId } from "@/lib/db";
import { DocumentNode, StructuralNode, CitableNode } from "@/types/document";
import { ReviewNode } from "@/types/review";
import { CitationPreset, CitationAlias } from "@/types/citationAlias";

interface ImportDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type ImportStep = "upload" | "configure" | "review" | "aliases" | "confirm";

const CATEGORY_OPTIONS: { value: DocumentCategory; label: string }[] = [
  { value: "scripture", label: "Scripture" },
  { value: "catechism", label: "Catechism" },
  { value: "patristic", label: "Patristic" },
  { value: "commentary", label: "Commentary" },
  { value: "custom", label: "Custom" },
];

const SOURCE_TYPE_OPTIONS: { value: SourceType; label: string; description: string }[] = [
  { value: "catechism", label: "Catechism", description: "Numbered paragraphs 1-2865" },
  { value: "scripture", label: "Scripture", description: "Book:chapter:verse format" },
  { value: "patristic", label: "Patristic", description: "Chapter titles, numbered prose" },
  { value: "treatise", label: "Treatise", description: "Theological works with sections" },
  { value: "generic", label: "Generic", description: "General numbered paragraphs" },
];

/**
 * Convert review nodes to final document nodes with canonical IDs
 */
function canonicalizeNodes(reviewNodes: ReviewNode[]): DocumentNode[] {
  const nodes: DocumentNode[] = [];

  for (const node of reviewNodes) {
    // Skip ignored nodes
    if (node.nodeType === "ignored") continue;

    // Generate immutable canonical ID
    const canonicalId = generateId();

    if (node.nodeType === "structural") {
      nodes.push({
        nodeType: "structural",
        id: canonicalId,
        level: node.level || "heading",
        content: node.content,
        alignment: node.alignment || "left",
      } as StructuralNode);
    } else if (node.nodeType === "citable") {
      nodes.push({
        nodeType: "citable",
        id: canonicalId,
        number: parseInt(node.displayNumber || "0", 10),
        displayNumber: node.displayNumber || "0",
        content: node.content,
      } as CitableNode);
    }
  }

  return nodes;
}

export function ImportDocumentModal({ open, onOpenChange, onSuccess }: ImportDocumentModalProps) {
  const { saveDocument } = useLocalDocuments();
  const { aliases, addAlias, addAliasFromPreset, modifyAlias, removeAlias, checkPrefixAvailable, refresh: refreshAliases } = useCitationAliases();
  const [step, setStep] = useState<ImportStep>("upload");
  const [loading, setLoading] = useState(false);

  // File state
  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState("");

  // Metadata state
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("custom");
  const [sourceType, setSourceType] = useState<SourceType>("generic");

  // Initial parsed nodes (before review)
  const [initialParsedNodes, setInitialParsedNodes] = useState<ParsedNode[]>([]);
  
  // Saved document ID (for alias configuration)
  const [savedDocumentId, setSavedDocumentId] = useState<string | null>(null);

  const resetState = () => {
    setStep("upload");
    setRawText("");
    setFileName("");
    setTitle("");
    setAuthor("");
    setCategory("custom");
    setSourceType("generic");
    setInitialParsedNodes([]);
    setSavedDocumentId(null);
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
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    setTitle(baseName);

    try {
      // Use unified text extraction for all file types
      const text = await extractTextFromFile(file);
      setRawText(text);
      setStep("configure");

      toast({
        title: "File loaded",
        description: `Extracted ${text.length.toLocaleString()} characters from ${file.name}`,
      });
    } catch (err: any) {
      console.error("File extraction error:", err);
      toast({
        title: "Error reading file",
        description: err.message || "Could not extract text from file.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawText(e.target.value);
    if (e.target.value.length > 100) {
      setStep("configure");
    }
  };

  const handleParse = async () => {
    if (!rawText.trim()) {
      toast({
        title: "No content",
        description: "Please upload a file or paste text to import.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Parse locally - no server required
      const result = parseDocument(rawText, sourceType);
      setInitialParsedNodes(result.nodes);
      setStep("review");

      toast({
        title: "Document parsed",
        description: `Found ${result.stats.structural} structural and ${result.stats.citable} citable nodes.`,
      });
    } catch (err: any) {
      console.error("Parse error:", err);
      toast({
        title: "Parsing failed",
        description: err.message || "Could not parse document.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col bg-card overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {step === "upload" && "Import Document"}
            {step === "configure" && "Configure Import"}
            {step === "review" && "Review & Edit Structure"}
            {step === "aliases" && "Citation Aliases"}
            {step === "confirm" && "Confirm & Save"}
          </DialogTitle>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {["upload", "configure", "review", "aliases", "confirm"].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : ["upload", "configure", "review", "aliases", "confirm"].indexOf(step) > i
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              {i < 4 && (
                <div
                  className={`w-6 h-0.5 ${
                    ["upload", "configure", "review", "aliases", "confirm"].indexOf(step) > i ? "bg-primary/50" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {step === "upload" && (
          <UploadStep
            rawText={rawText}
            fileName={fileName}
            loading={loading}
            onFileChange={handleFileChange}
            onPaste={handlePaste}
            onContinue={() => setStep("configure")}
          />
        )}

        {step === "configure" && (
          <ConfigureStep
            title={title}
            author={author}
            category={category}
            sourceType={sourceType}
            rawText={rawText}
            loading={loading}
            onTitleChange={setTitle}
            onAuthorChange={setAuthor}
            onCategoryChange={setCategory}
            onSourceTypeChange={setSourceType}
            onBack={() => setStep("upload")}
            onParse={handleParse}
          />
        )}

        {step === "review" && (
          <div className="flex-1 min-h-0">
            <ReviewStep
              initialParsedNodes={initialParsedNodes}
              title={title}
              author={author}
              category={category}
              sourceType={sourceType}
              rawText={rawText}
              onBack={() => setStep("configure")}
              onSaveComplete={(docId) => {
                setSavedDocumentId(docId);
                refreshAliases();
                setStep("aliases");
              }}
              saveDocument={saveDocument}
            />
          </div>
        )}

        {step === "aliases" && savedDocumentId && (
          <AliasStep
            documentId={savedDocumentId}
            documentTitle={title}
            aliases={aliases.filter(a => a.documentId === savedDocumentId)}
            sourceType={sourceType}
            onAddAlias={async (prefix, pattern, extractor, format, priority) => 
              addAlias(savedDocumentId, prefix, pattern, extractor, format, priority)
            }
            onAddFromPreset={async (preset, customPrefix) =>
              addAliasFromPreset(savedDocumentId, preset, customPrefix)
            }
            onUpdateAlias={modifyAlias}
            onRemoveAlias={removeAlias}
            checkPrefixAvailable={checkPrefixAvailable}
            onDone={() => {
              handleClose();
              onSuccess?.();
            }}
            onSkip={() => {
              handleClose();
              onSuccess?.();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============= Step Components =============

interface UploadStepProps {
  rawText: string;
  fileName: string;
  loading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onContinue: () => void;
}

function UploadStep({ rawText, fileName, loading, onFileChange, onPaste, onContinue }: UploadStepProps) {
  return (
    <>
      <ScrollArea className="flex-1 px-1">
        <div className="space-y-6 py-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload File</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept={getAcceptedFileTypes()}
                onChange={onFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                {loading ? (
                  <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                ) : (
                  <Upload className="h-10 w-10 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">{fileName || "Click to upload a document"}</span>
                <span className="text-xs text-muted-foreground/70">Supports: TXT, MD, PDF, DOC, DOCX</span>
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
              onChange={onPaste}
            />
          </div>

          {rawText.length > 0 && (
            <Button onClick={onContinue} className="w-full">
              Continue with pasted text
            </Button>
          )}
        </div>
      </ScrollArea>
    </>
  );
}

interface ConfigureStepProps {
  title: string;
  author: string;
  category: DocumentCategory;
  sourceType: SourceType;
  rawText: string;
  loading: boolean;
  onTitleChange: (v: string) => void;
  onAuthorChange: (v: string) => void;
  onCategoryChange: (v: DocumentCategory) => void;
  onSourceTypeChange: (v: SourceType) => void;
  onBack: () => void;
  onParse: () => void;
}

function ConfigureStep({
  title,
  author,
  category,
  sourceType,
  rawText,
  loading,
  onTitleChange,
  onAuthorChange,
  onCategoryChange,
  onSourceTypeChange,
  onBack,
  onParse,
}: ConfigureStepProps) {
  return (
    <>
      <ScrollArea className="flex-1 px-1">
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Document title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => onAuthorChange(e.target.value)}
                placeholder="Author name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => onCategoryChange(v as DocumentCategory)}>
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
              <Select value={sourceType} onValueChange={(v) => onSourceTypeChange(v as SourceType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div>
                        <span>{opt.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">({opt.description})</span>
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
                {rawText.length > 1000 && "..."}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground">{rawText.length.toLocaleString()} characters</p>
          </div>
        </div>
      </ScrollArea>

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button onClick={onParse} disabled={loading || !rawText.trim()}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Parse & Review
        </Button>
      </DialogFooter>
    </>
  );
}

interface ReviewStepProps {
  initialParsedNodes: ParsedNode[];
  title: string;
  author: string;
  category: DocumentCategory;
  sourceType: SourceType;
  rawText: string;
  onBack: () => void;
  onSaveComplete: (docId: string) => void;
  saveDocument: (
    title: string,
    author: string | undefined,
    category: DocumentCategory,
    sourceType: SourceType,
    nodes: DocumentNode[],
    rawContent?: string,
  ) => Promise<string | null>;
}

function ReviewStep({
  initialParsedNodes,
  title,
  author,
  category,
  sourceType,
  rawText,
  onBack,
  onSaveComplete,
  saveDocument,
}: ReviewStepProps) {
  const [saving, setSaving] = useState(false);

  const review = useImportReview(initialParsedNodes);

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a document title.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Canonicalize: assign permanent UUIDs to all nodes
      const canonicalNodes = canonicalizeNodes(review.nodes);

      const docId = await saveDocument(title.trim(), author.trim() || undefined, category, sourceType, canonicalNodes, rawText);

      if (docId) {
        toast({
          title: "Document saved",
          description: `"${title}" has been added to your library.`,
        });
        onSaveComplete(docId);
      }
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* 
        Key fix: min-h-0 is critical for flex children to allow shrinking below content size
        This enables the inner ScrollArea to calculate proper scrollable height
      */}
      <div className="flex-1 min-h-0 border rounded-md overflow-hidden">
        <ImportReviewPanel
          nodes={review.nodes}
          stats={review.stats}
          selectedNodeId={review.selectedNodeId}
          onSelectNode={review.selectNode}
          onMakeCenteredTitle={review.makeCenteredTitle}
          onMakeLeftSubtitle={review.makeLeftSubtitle}
          onMakeCitable={review.makeCitable}
          onIgnoreNode={review.ignoreNode}
          onRestoreNode={review.restoreNode}
          onMergeWithPrevious={review.mergeWithPrevious}
          onMergeWithNext={review.mergeWithNext}
          onSplitNode={review.splitNode}
          onEditContent={review.editContent}
          onEditDisplayNumber={review.editDisplayNumber}
          onResequence={review.resequenceNumbers}
          onReset={review.resetToInitial}
        />
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onBack} disabled={saving}>
          Back
        </Button>
        <Button onClick={handleSave} disabled={saving || review.stats.total === 0} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Save & Configure Aliases
        </Button>
      </DialogFooter>
    </>
  );
}

// ============= Alias Step =============

interface AliasStepProps {
  documentId: string;
  documentTitle: string;
  aliases: CitationAlias[];
  sourceType: SourceType;
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
  onDone: () => void;
  onSkip: () => void;
}

function AliasStep({
  documentId,
  documentTitle,
  aliases,
  sourceType,
  onAddAlias,
  onAddFromPreset,
  onUpdateAlias,
  onRemoveAlias,
  checkPrefixAvailable,
  onDone,
  onSkip,
}: AliasStepProps) {
  // Suggest a default preset based on source type
  const suggestedPreset = sourceType === 'catechism' ? 'catechism' : 
                          sourceType === 'treatise' ? 'generic' : 
                          'generic';

  return (
    <>
      <ScrollArea className="flex-1 px-1">
        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Tag className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Configure Citation Aliases</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Set up shortcuts so typing "CCC 17" in your notes automatically links to paragraph 17 of this document.
                </p>
              </div>
            </div>
          </div>

          <CitationAliasManager
            documentId={documentId}
            documentTitle={documentTitle}
            aliases={aliases}
            onAddAlias={onAddAlias}
            onAddFromPreset={onAddFromPreset}
            onUpdateAlias={onUpdateAlias}
            onRemoveAlias={onRemoveAlias}
            checkPrefixAvailable={checkPrefixAvailable}
          />
        </div>
      </ScrollArea>

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onSkip}>
          Skip for Now
        </Button>
        <Button onClick={onDone} className="gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Done
        </Button>
      </DialogFooter>
    </>
  );
}
