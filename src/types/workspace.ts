/**
 * Workspace Types - Panel state management
 * 
 * Defines the possible states for primary and secondary panels
 * in the flexible split-view workspace.
 */

export type PrimaryViewType = 'home' | 'document' | 'bible' | 'note';
export type SecondaryViewType = 'none' | 'document' | 'bible' | 'note';

export interface WorkspaceState {
  primaryView: PrimaryViewType;
  primaryDocumentId: string | null;
  primaryNoteId: string | null;
  secondaryView: SecondaryViewType;
  secondaryDocumentId: string | null;
  secondaryNoteId: string | null;
  bibleNavigation?: {
    translation: string;
    book: string;
    chapter: number;
    verse?: number;
  };
}

export const initialWorkspaceState: WorkspaceState = {
  primaryView: 'home',
  primaryDocumentId: null,
  primaryNoteId: null,
  secondaryView: 'none',
  secondaryDocumentId: null,
  secondaryNoteId: null,
};
