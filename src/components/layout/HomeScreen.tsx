/**
 * HomeScreen - Obsidian-style welcome screen
 * 
 * Displays when no document or note is active.
 * Provides quick actions for common workflows.
 */

import { Book, FileText, Upload, FolderOpen, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface HomeScreenProps {
  onOpenLibrary: () => void;
  onImportDocument: () => void;
  onCreateNote: () => void;
  recentDocuments?: { id: string; title: string }[];
  recentNotes?: { id: string; title: string }[];
  onSelectDocument?: (id: string) => void;
  onSelectNote?: (id: string) => void;
  className?: string;
}

export function HomeScreen({
  onOpenLibrary,
  onImportDocument,
  onCreateNote,
  recentDocuments = [],
  recentNotes = [],
  onSelectDocument,
  onSelectNote,
  className,
}: HomeScreenProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center h-full p-8 text-center bg-background", className)}>
      {/* Welcome Header */}
      <div className="mb-10">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 mx-auto">
          <Book className="h-10 w-10 text-primary" />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Sacred Library
        </h1>
        <p className="text-muted-foreground text-lg max-w-lg">
          A contemplative workspace for theological study, scholarly reading, and reflective note-taking.
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full mb-10">
        <ActionCard
          icon={FolderOpen}
          title="Open Library"
          description="Browse your document collection"
          onClick={onOpenLibrary}
        />
        <ActionCard
          icon={Upload}
          title="Import Document"
          description="Add PDF, DOCX, or text files"
          onClick={onImportDocument}
        />
        <ActionCard
          icon={FileText}
          title="Create Note"
          description="Start a new research note"
          onClick={onCreateNote}
        />
      </div>

      {/* Recent Items (Optional) */}
      {(recentDocuments.length > 0 || recentNotes.length > 0) && (
        <div className="w-full max-w-2xl space-y-4">
          {recentDocuments.length > 0 && (
            <RecentSection
              icon={Clock}
              title="Recent Documents"
              items={recentDocuments}
              onSelect={onSelectDocument}
            />
          )}
          {recentNotes.length > 0 && (
            <RecentSection
              icon={Clock}
              title="Recent Notes"
              items={recentNotes}
              onSelect={onSelectNote}
            />
          )}
        </div>
      )}

      {/* Footer hint */}
      <p className="text-xs text-muted-foreground mt-8">
        Use the sidebar to navigate your library and notes
      </p>
    </div>
  );
}

interface ActionCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
}

function ActionCard({ icon: Icon, title, description, onClick }: ActionCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:bg-accent/50 transition-colors border-muted"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

interface RecentSectionProps {
  icon: React.ElementType;
  title: string;
  items: { id: string; title: string }[];
  onSelect?: (id: string) => void;
}

function RecentSection({ icon: Icon, title, items, onSelect }: RecentSectionProps) {
  return (
    <div className="text-left">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect?.(item.id)}
            className="px-3 py-1.5 text-sm rounded-md bg-muted/50 hover:bg-muted transition-colors truncate max-w-[200px]"
          >
            {item.title}
          </button>
        ))}
      </div>
    </div>
  );
}
