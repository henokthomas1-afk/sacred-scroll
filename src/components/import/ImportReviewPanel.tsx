/**
 * ImportReviewPanel - Review and edit parsed nodes before saving
 *
 * Allows users to:
 * - Reclassify nodes (structural, citable, ignored)
 * - Merge or split paragraphs
 * - Edit display numbers
 * - Confirm final structure before canonicalization
 */

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ReviewNode, ReviewStats } from "@/types/review";
import { StructuralLevel } from "@/types/document";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Type,
  AlignLeft,
  AlignCenter,
  Hash,
  Merge,
  Split,
  EyeOff,
  Eye,
  Pencil,
  RotateCcw,
} from "lucide-react";

interface ImportReviewPanelProps {
  nodes: ReviewNode[];
  stats: ReviewStats;
  selectedNodeId: string | null;
  onSelectNode: (tempId: string | null) => void;
  onMakeCenteredTitle: (tempId: string, level?: StructuralLevel) => void;
  onMakeLeftSubtitle: (tempId: string, level?: StructuralLevel) => void;
  onMakeCitable: (tempId: string) => void;
  onIgnoreNode: (tempId: string) => void;
  onRestoreNode: (tempId: string) => void;
  onMergeWithPrevious: (tempId: string) => void;
  onMergeWithNext: (tempId: string) => void;
  onSplitNode: (tempId: string, position: number) => void;
  onEditContent: (tempId: string, content: string) => void;
  onEditDisplayNumber: (tempId: string, number: string) => void;
  onResequence: () => void;
  onReset: () => void;
}

const CENTERED_LEVELS: { level: StructuralLevel; label: string }[] = [
  { level: "book", label: "Book" },
  { level: "part", label: "Part" },
  { level: "chapter", label: "Chapter" },
  { level: "section", label: "Section" },
  { level: "article", label: "Article" },
];

const LEFT_LEVELS: { level: StructuralLevel; label: string }[] = [
  { level: "roman", label: "Roman Numeral (I., II.)" },
  { level: "subsection", label: "Subsection" },
  { level: "brief", label: "IN BRIEF" },
  { level: "preface", label: "Preface/Greeting" },
  { level: "heading", label: "Generic Heading" },
];

export function ImportReviewPanel({
  nodes,
  stats,
  selectedNodeId,
  onSelectNode,
  onMakeCenteredTitle,
  onMakeLeftSubtitle,
  onMakeCitable,
  onIgnoreNode,
  onRestoreNode,
  onMergeWithPrevious,
  onMergeWithNext,
  onSplitNode,
  onEditContent,
  onEditDisplayNumber,
  onResequence,
  onReset,
}: ImportReviewPanelProps) {
  const [editingNode, setEditingNode] = useState<ReviewNode | null>(null);
  const [editContent, setEditContent] = useState("");
  const [splitDialogNode, setSplitDialogNode] = useState<ReviewNode | null>(null);
  const [splitPosition, setSplitPosition] = useState(0);

  const handleEditClick = (node: ReviewNode) => {
    setEditingNode(node);
    setEditContent(node.content);
  };

  const handleSaveEdit = () => {
    if (editingNode) {
      onEditContent(editingNode.tempId, editContent);
      setEditingNode(null);
    }
  };

  const handleSplitClick = (node: ReviewNode) => {
    setSplitDialogNode(node);
    setSplitPosition(Math.floor(node.content.length / 2));
  };

  const handleConfirmSplit = () => {
    if (splitDialogNode) {
      onSplitNode(splitDialogNode.tempId, splitPosition);
      setSplitDialogNode(null);
    }
  };

  const getNodeIndex = (tempId: string) => nodes.findIndex((n) => n.tempId === tempId);

  return (
    <div className="flex flex-col min-h-0">
      {/* Stats Bar - Fixed header */}
      <div className="shrink-0 flex items-center justify-between p-3 bg-muted/50 border-b">
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="text-muted-foreground">
            Total: <span className="font-medium text-foreground">{stats.total}</span>
          </span>
          <span className="text-muted-foreground">
            Structural: <span className="font-medium text-foreground">{stats.structural}</span>
          </span>
          <span className="text-muted-foreground">
            Citable: <span className="font-medium text-primary">{stats.citable}</span>
          </span>
          {stats.ignored > 0 && (
            <span className="text-muted-foreground">
              Ignored: <span className="font-medium text-muted-foreground">{stats.ignored}</span>
            </span>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={onResequence}>
            <Hash className="h-4 w-4 mr-1" />
            Resequence
          </Button>
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Node List - Scrollable content area */}
      <ScrollArea className="flex-1 min-h-0 h-full">
        <div className="p-2 space-y-1">
          {nodes.map((node, index) => (
            <ReviewNodeItem
              key={node.tempId}
              node={node}
              index={index}
              isFirst={index === 0}
              isLast={index === nodes.length - 1}
              isSelected={node.tempId === selectedNodeId}
              prevNodeType={index > 0 ? nodes[index - 1].nodeType : null}
              nextNodeType={index < nodes.length - 1 ? nodes[index + 1].nodeType : null}
              onSelect={() => onSelectNode(node.tempId === selectedNodeId ? null : node.tempId)}
              onMakeCenteredTitle={(level) => onMakeCenteredTitle(node.tempId, level)}
              onMakeLeftSubtitle={(level) => onMakeLeftSubtitle(node.tempId, level)}
              onMakeCitable={() => onMakeCitable(node.tempId)}
              onIgnore={() => onIgnoreNode(node.tempId)}
              onRestore={() => onRestoreNode(node.tempId)}
              onMergeWithPrevious={() => onMergeWithPrevious(node.tempId)}
              onMergeWithNext={() => onMergeWithNext(node.tempId)}
              onSplit={() => handleSplitClick(node)}
              onEdit={() => handleEditClick(node)}
              onEditNumber={(num) => onEditDisplayNumber(node.tempId, num)}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Edit Content Dialog */}
      <Dialog open={!!editingNode} onOpenChange={() => setEditingNode(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Content</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingNode(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Split Dialog */}
      <Dialog open={!!splitDialogNode} onOpenChange={() => setSplitDialogNode(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Split Paragraph</DialogTitle>
          </DialogHeader>
          {splitDialogNode && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Move the slider to choose where to split the paragraph.
              </div>
              <div className="relative">
                <input
                  type="range"
                  min={1}
                  max={splitDialogNode.content.length - 1}
                  value={splitPosition}
                  onChange={(e) => setSplitPosition(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-md">
                  <div className="text-xs text-muted-foreground mb-1">First part:</div>
                  <p className="text-sm">
                    {splitDialogNode.content.substring(0, splitPosition)}
                    <span className="text-primary font-bold">|</span>
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-md">
                  <div className="text-xs text-muted-foreground mb-1">Second part:</div>
                  <p className="text-sm">{splitDialogNode.content.substring(splitPosition)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSplitDialogNode(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSplit}>
              <Split className="h-4 w-4 mr-2" />
              Split Here
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============= Node Item Component =============

interface ReviewNodeItemProps {
  node: ReviewNode;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isSelected: boolean;
  prevNodeType: ReviewNode["nodeType"] | null;
  nextNodeType: ReviewNode["nodeType"] | null;
  onSelect: () => void;
  onMakeCenteredTitle: (level?: StructuralLevel) => void;
  onMakeLeftSubtitle: (level?: StructuralLevel) => void;
  onMakeCitable: () => void;
  onIgnore: () => void;
  onRestore: () => void;
  onMergeWithPrevious: () => void;
  onMergeWithNext: () => void;
  onSplit: () => void;
  onEdit: () => void;
  onEditNumber: (num: string) => void;
}

function ReviewNodeItem({
  node,
  index,
  isFirst,
  isLast,
  isSelected,
  prevNodeType,
  nextNodeType,
  onSelect,
  onMakeCenteredTitle,
  onMakeLeftSubtitle,
  onMakeCitable,
  onIgnore,
  onRestore,
  onMergeWithPrevious,
  onMergeWithNext,
  onSplit,
  onEdit,
  onEditNumber,
}: ReviewNodeItemProps) {
  const [isEditingNumber, setIsEditingNumber] = useState(false);
  const [tempNumber, setTempNumber] = useState(node.displayNumber || "");

  const handleNumberSubmit = () => {
    onEditNumber(tempNumber);
    setIsEditingNumber(false);
  };

  const canMergeWithPrev = !isFirst && prevNodeType === "citable" && node.nodeType === "citable";
  const canMergeWithNext = !isLast && nextNodeType === "citable" && node.nodeType === "citable";
  const canSplit = node.nodeType === "citable" && node.content.length > 10;

  return (
    <div
      className={cn(
        "group relative flex items-start gap-2 p-2 rounded-md border transition-colors",
        isSelected && "border-primary bg-primary/5",
        !isSelected && "border-transparent hover:bg-muted/50",
        node.nodeType === "ignored" && "opacity-50",
        node.modified && "ring-1 ring-amber-500/30",
      )}
      onClick={onSelect}
    >
      {/* Type Badge */}
      <div className="flex-shrink-0 w-20 pt-0.5">
        {node.nodeType === "structural" && (
          <Badge
            variant="outline"
            className={cn("text-xs", node.alignment === "center" && "bg-primary/10 text-primary border-primary/30")}
          >
            {node.alignment === "center" ? (
              <AlignCenter className="h-3 w-3 mr-1" />
            ) : (
              <AlignLeft className="h-3 w-3 mr-1" />
            )}
            {node.level}
          </Badge>
        )}
        {node.nodeType === "citable" && (
          <div className="flex items-center gap-1">
            {isEditingNumber ? (
              <Input
                value={tempNumber}
                onChange={(e) => setTempNumber(e.target.value)}
                onBlur={handleNumberSubmit}
                onKeyDown={(e) => e.key === "Enter" && handleNumberSubmit()}
                className="h-6 w-12 text-xs text-center"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80"
                onClick={(e) => {
                  e.stopPropagation();
                  setTempNumber(node.displayNumber || "");
                  setIsEditingNumber(true);
                }}
              >
                <Hash className="h-3 w-3 mr-0.5" />
                {node.displayNumber}
              </Badge>
            )}
          </div>
        )}
        {node.nodeType === "ignored" && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            <EyeOff className="h-3 w-3 mr-1" />
            Ignored
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm line-clamp-2",
            node.nodeType === "structural" && "font-semibold",
            node.nodeType === "structural" && node.alignment === "center" && "text-center",
            node.nodeType === "ignored" && "line-through text-muted-foreground",
          )}
        >
          {node.content}
        </p>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-7 px-2">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {/* Classification */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <AlignCenter className="h-4 w-4 mr-2" />
                Centered Title
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {CENTERED_LEVELS.map(({ level, label }) => (
                  <DropdownMenuItem key={level} onClick={() => onMakeCenteredTitle(level)}>
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <AlignLeft className="h-4 w-4 mr-2" />
                Left Subtitle
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {LEFT_LEVELS.map(({ level, label }) => (
                  <DropdownMenuItem key={level} onClick={() => onMakeLeftSubtitle(level)}>
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuItem onClick={onMakeCitable}>
              <Type className="h-4 w-4 mr-2" />
              Citable Paragraph
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Merge/Split */}
            {canMergeWithPrev && (
              <DropdownMenuItem onClick={onMergeWithPrevious}>
                <Merge className="h-4 w-4 mr-2 rotate-180" />
                Merge with Previous
              </DropdownMenuItem>
            )}
            {canMergeWithNext && (
              <DropdownMenuItem onClick={onMergeWithNext}>
                <Merge className="h-4 w-4 mr-2" />
                Merge with Next
              </DropdownMenuItem>
            )}
            {canSplit && (
              <DropdownMenuItem onClick={onSplit}>
                <Split className="h-4 w-4 mr-2" />
                Split Paragraph
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {/* Edit */}
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Content
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Ignore/Restore */}
            {node.nodeType !== "ignored" ? (
              <DropdownMenuItem onClick={onIgnore} className="text-muted-foreground">
                <EyeOff className="h-4 w-4 mr-2" />
                Ignore
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onRestore}>
                <Eye className="h-4 w-4 mr-2" />
                Restore
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
