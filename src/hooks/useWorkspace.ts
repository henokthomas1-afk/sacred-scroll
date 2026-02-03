/**
 * useWorkspace - Flexible workspace state management
 * 
 * Manages primary and secondary panel states for the split-view workspace.
 * Supports Note, Document, and Bible as primary or secondary content.
 */

import { useState, useCallback, useMemo } from 'react';
import { ParsedDocument } from '@/types/document';
import { BibleNavigationState, parseBibleCitationId, isBibleCitationId } from '@/types/bible';
import { 
  PrimaryViewType, 
  SecondaryViewType, 
  WorkspaceState, 
  initialWorkspaceState 
} from '@/types/workspace';
import { toast } from '@/hooks/use-toast';

interface UseWorkspaceProps {
  documents: ParsedDocument[];
}

export function useWorkspace({ documents }: UseWorkspaceProps) {
  const [state, setState] = useState<WorkspaceState>(initialWorkspaceState);

  // Derived state
  const primaryDocument = useMemo(() => {
    if (state.primaryView === 'document' && state.primaryDocumentId) {
      return documents.find(d => d.metadata.id === state.primaryDocumentId) || null;
    }
    return null;
  }, [documents, state.primaryView, state.primaryDocumentId]);

  const secondaryDocument = useMemo(() => {
    if (state.secondaryView === 'document' && state.secondaryDocumentId) {
      return documents.find(d => d.metadata.id === state.secondaryDocumentId) || null;
    }
    return null;
  }, [documents, state.secondaryView, state.secondaryDocumentId]);

  const isSplitViewActive = state.secondaryView !== 'none';

  // ============= Primary Panel Actions =============

  const openDocumentPrimary = useCallback((docId: string) => {
    setState(prev => ({
      ...prev,
      primaryView: 'document',
      primaryDocumentId: docId,
      primaryNoteId: null,
      // Clear secondary if it was showing the same document
      ...(prev.secondaryDocumentId === docId ? {
        secondaryView: 'none' as SecondaryViewType,
        secondaryDocumentId: null,
      } : {}),
    }));
  }, []);

  const openNotePrimary = useCallback((noteId: string) => {
    setState(prev => ({
      ...prev,
      primaryView: 'note',
      primaryNoteId: noteId,
      primaryDocumentId: null,
      // Clear secondary if it was showing the same note
      ...(prev.secondaryNoteId === noteId ? {
        secondaryView: 'none' as SecondaryViewType,
        secondaryNoteId: null,
      } : {}),
    }));
  }, []);

  const openBiblePrimary = useCallback((navigation?: BibleNavigationState) => {
    setState(prev => ({
      ...prev,
      primaryView: 'bible',
      primaryDocumentId: null,
      primaryNoteId: null,
      bibleNavigation: navigation,
      // Clear secondary if it was showing bible
      ...(prev.secondaryView === 'bible' ? {
        secondaryView: 'none' as SecondaryViewType,
      } : {}),
    }));
  }, []);

  const returnToHome = useCallback(() => {
    setState(initialWorkspaceState);
  }, []);

  // ============= Secondary Panel Actions =============

  const openDocumentSecondary = useCallback((docId: string) => {
    // Don't open same document in both panels
    if (state.primaryView === 'document' && state.primaryDocumentId === docId) {
      return;
    }
    setState(prev => ({
      ...prev,
      secondaryView: 'document',
      secondaryDocumentId: docId,
      secondaryNoteId: null,
    }));
  }, [state.primaryView, state.primaryDocumentId]);

  const openNoteSecondary = useCallback((noteId: string) => {
    // Don't open same note in both panels
    if (state.primaryView === 'note' && state.primaryNoteId === noteId) {
      return;
    }
    setState(prev => ({
      ...prev,
      secondaryView: 'note',
      secondaryNoteId: noteId,
      secondaryDocumentId: null,
    }));
  }, [state.primaryView, state.primaryNoteId]);

  const openBibleSecondary = useCallback((navigation?: BibleNavigationState) => {
    // Don't open bible in both panels
    if (state.primaryView === 'bible') {
      return;
    }
    setState(prev => ({
      ...prev,
      secondaryView: 'bible',
      secondaryDocumentId: null,
      secondaryNoteId: null,
      bibleNavigation: navigation,
    }));
  }, [state.primaryView]);

  const closeSecondary = useCallback(() => {
    setState(prev => ({
      ...prev,
      secondaryView: 'none',
      secondaryDocumentId: null,
      secondaryNoteId: null,
    }));
  }, []);

  // ============= Smart Navigation =============

  /**
   * Opens content in the secondary panel if primary is active,
   * otherwise opens as primary.
   */
  const openInBestPanel = useCallback((
    type: 'document' | 'bible' | 'note',
    id?: string,
    navigation?: BibleNavigationState
  ) => {
    // If we're on home, open as primary
    if (state.primaryView === 'home') {
      switch (type) {
        case 'document':
          if (id) openDocumentPrimary(id);
          break;
        case 'note':
          if (id) openNotePrimary(id);
          break;
        case 'bible':
          openBiblePrimary(navigation);
          break;
      }
      return;
    }

    // Otherwise, open as secondary
    switch (type) {
      case 'document':
        if (id) openDocumentSecondary(id);
        break;
      case 'note':
        if (id) openNoteSecondary(id);
        break;
      case 'bible':
        openBibleSecondary(navigation);
        break;
    }
  }, [
    state.primaryView,
    openDocumentPrimary,
    openNotePrimary,
    openBiblePrimary,
    openDocumentSecondary,
    openNoteSecondary,
    openBibleSecondary,
  ]);

  /**
   * Handle citation clicks - opens in secondary panel when possible,
   * preserving the primary content.
   */
  const handleCitationNavigation = useCallback((citationId: string, nodeId?: string) => {
    // Check if this is a Bible citation
    if (isBibleCitationId(citationId)) {
      const bibleCitation = parseBibleCitationId(citationId);
      if (bibleCitation) {
        const navigation: BibleNavigationState = {
          translation: bibleCitation.translation,
          book: bibleCitation.book,
          chapter: bibleCitation.chapter,
          verse: bibleCitation.verse,
        };
        
        // If primary is not bible, open in secondary
        if (state.primaryView !== 'bible') {
          openBibleSecondary(navigation);
        } else {
          // Update bible navigation
          setState(prev => ({ ...prev, bibleNavigation: navigation }));
        }
        return;
      }
    }

    // Regular document citation
    const targetDoc = documents.find((d) => d.metadata.id === citationId);
    
    if (!targetDoc) {
      toast({
        title: 'Document not found',
        description: 'The referenced document is not in your library.',
        variant: 'destructive',
      });
      return;
    }

    // If the target is already in primary, just scroll
    if (state.primaryView === 'document' && state.primaryDocumentId === citationId) {
      scrollToNode(nodeId);
      return;
    }

    // If the target is already in secondary, just scroll
    if (state.secondaryView === 'document' && state.secondaryDocumentId === citationId) {
      scrollToNode(nodeId);
      return;
    }

    // Open in secondary panel (preserving primary)
    if (state.primaryView !== 'home') {
      openDocumentSecondary(citationId);
    } else {
      openDocumentPrimary(citationId);
    }

    // Scroll to node after a short delay
    scrollToNode(nodeId);
  }, [
    documents,
    state.primaryView,
    state.primaryDocumentId,
    state.secondaryView,
    state.secondaryDocumentId,
    openDocumentPrimary,
    openDocumentSecondary,
    openBibleSecondary,
  ]);

  return {
    state,
    primaryDocument,
    secondaryDocument,
    isSplitViewActive,
    
    // Primary actions
    openDocumentPrimary,
    openNotePrimary,
    openBiblePrimary,
    returnToHome,
    
    // Secondary actions
    openDocumentSecondary,
    openNoteSecondary,
    openBibleSecondary,
    closeSecondary,
    
    // Smart navigation
    openInBestPanel,
    handleCitationNavigation,
    
    // Direct state updates for special cases
    setBibleNavigation: (nav: BibleNavigationState) => 
      setState(prev => ({ ...prev, bibleNavigation: nav })),
  };
}

// Helper function to scroll to a node
function scrollToNode(nodeId?: string) {
  if (nodeId) {
    setTimeout(() => {
      const element = document.querySelector(`[data-paragraph-id="${nodeId}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element?.classList.add('citation-highlight');
      setTimeout(() => element?.classList.remove('citation-highlight'), 2000);
    }, 150);
  }
}
