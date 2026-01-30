/**
 * useImportReview - Hook for managing the import review phase
 * 
 * Handles reclassification, merging, splitting, and renumbering
 * of nodes before canonicalization.
 */

import { useState, useCallback, useMemo } from 'react';
import { ParsedNode } from '@/lib/parser/documentParser';
import { 
  ReviewNode, 
  ReviewState, 
  ReviewStats, 
  NodeClassification,
} from '@/types/review';
import { StructuralLevel, StructuralAlignment } from '@/types/document';
import { getStructuralAlignment } from '@/types/document';
import { generateId } from '@/lib/db';

/**
 * Convert parsed nodes to review nodes
 */
function parsedToReviewNodes(parsedNodes: ParsedNode[]): ReviewNode[] {
  let citableCounter = 0;
  
  return parsedNodes.map((node, index) => {
    const tempId = `review-${index}-${Date.now()}`;
    
    if (node.nodeType === 'structural') {
      return {
        tempId,
        nodeType: 'structural' as const,
        content: node.content,
        level: node.level as StructuralLevel,
        alignment: node.alignment as StructuralAlignment,
        originalIndex: index,
        modified: false,
      };
    }
    
    citableCounter++;
    return {
      tempId,
      nodeType: 'citable' as const,
      content: node.content,
      displayNumber: node.displayNumber || citableCounter.toString(),
      originalIndex: index,
      modified: false,
    };
  });
}

/**
 * Recalculate citable display numbers sequentially
 */
function recalculateNumbers(nodes: ReviewNode[]): ReviewNode[] {
  let counter = 0;
  return nodes.map(node => {
    if (node.nodeType === 'citable') {
      counter++;
      return { ...node, displayNumber: counter.toString() };
    }
    return node;
  });
}

export function useImportReview(initialParsedNodes: ParsedNode[]) {
  const [state, setState] = useState<ReviewState>(() => ({
    nodes: parsedToReviewNodes(initialParsedNodes),
    selectedNodeId: null,
    isDirty: false,
  }));

  const stats = useMemo<ReviewStats>(() => {
    const nodes = state.nodes;
    return {
      total: nodes.length,
      structural: nodes.filter(n => n.nodeType === 'structural').length,
      citable: nodes.filter(n => n.nodeType === 'citable').length,
      ignored: nodes.filter(n => n.nodeType === 'ignored').length,
    };
  }, [state.nodes]);

  /**
   * Select a node for editing
   */
  const selectNode = useCallback((tempId: string | null) => {
    setState(prev => ({ ...prev, selectedNodeId: tempId }));
  }, []);

  /**
   * Reclassify a node
   */
  const reclassifyNode = useCallback((tempId: string, classification: NodeClassification) => {
    setState(prev => {
      const nodes = prev.nodes.map(node => {
        if (node.tempId !== tempId) return node;
        
        if (classification.type === 'structural') {
          return {
            ...node,
            nodeType: 'structural' as const,
            level: classification.level,
            alignment: classification.alignment,
            displayNumber: undefined,
            modified: true,
          };
        }
        
        if (classification.type === 'citable') {
          return {
            ...node,
            nodeType: 'citable' as const,
            displayNumber: classification.displayNumber,
            level: undefined,
            alignment: undefined,
            modified: true,
          };
        }
        
        // ignored
        return {
          ...node,
          nodeType: 'ignored' as const,
          modified: true,
        };
      });
      
      // Recalculate numbers after reclassification
      const renumbered = recalculateNumbers(nodes);
      
      return { ...prev, nodes: renumbered, isDirty: true };
    });
  }, []);

  /**
   * Convert structural to centered title
   */
  const makeCenteredTitle = useCallback((tempId: string, level: StructuralLevel = 'chapter') => {
    reclassifyNode(tempId, {
      type: 'structural',
      level,
      alignment: 'center',
    });
  }, [reclassifyNode]);

  /**
   * Convert to left-aligned subtitle
   */
  const makeLeftSubtitle = useCallback((tempId: string, level: StructuralLevel = 'subsection') => {
    reclassifyNode(tempId, {
      type: 'structural',
      level,
      alignment: 'left',
    });
  }, [reclassifyNode]);

  /**
   * Convert to citable paragraph
   */
  const makeCitable = useCallback((tempId: string) => {
    // Calculate what number this should get
    setState(prev => {
      const idx = prev.nodes.findIndex(n => n.tempId === tempId);
      if (idx === -1) return prev;
      
      // Count citable nodes before this position
      let count = 0;
      for (let i = 0; i < idx; i++) {
        if (prev.nodes[i].nodeType === 'citable') count++;
      }
      
      const nodes = prev.nodes.map((node, i) => {
        if (i !== idx) return node;
        return {
          ...node,
          nodeType: 'citable' as const,
          displayNumber: (count + 1).toString(),
          level: undefined,
          alignment: undefined,
          modified: true,
        };
      });
      
      const renumbered = recalculateNumbers(nodes);
      return { ...prev, nodes: renumbered, isDirty: true };
    });
  }, []);

  /**
   * Mark node as ignored
   */
  const ignoreNode = useCallback((tempId: string) => {
    reclassifyNode(tempId, { type: 'ignored' });
  }, [reclassifyNode]);

  /**
   * Restore ignored node to citable
   */
  const restoreNode = useCallback((tempId: string) => {
    makeCitable(tempId);
  }, [makeCitable]);

  /**
   * Merge node with previous
   */
  const mergeWithPrevious = useCallback((tempId: string) => {
    setState(prev => {
      const idx = prev.nodes.findIndex(n => n.tempId === tempId);
      if (idx <= 0) return prev;
      
      const prevNode = prev.nodes[idx - 1];
      const currentNode = prev.nodes[idx];
      
      // Can only merge citable nodes with other citable nodes
      if (prevNode.nodeType !== 'citable' || currentNode.nodeType !== 'citable') {
        return prev;
      }
      
      const mergedNode: ReviewNode = {
        ...prevNode,
        content: prevNode.content + '\n\n' + currentNode.content,
        modified: true,
      };
      
      const nodes = [
        ...prev.nodes.slice(0, idx - 1),
        mergedNode,
        ...prev.nodes.slice(idx + 1),
      ];
      
      const renumbered = recalculateNumbers(nodes);
      return { ...prev, nodes: renumbered, isDirty: true };
    });
  }, []);

  /**
   * Merge node with next
   */
  const mergeWithNext = useCallback((tempId: string) => {
    setState(prev => {
      const idx = prev.nodes.findIndex(n => n.tempId === tempId);
      if (idx === -1 || idx >= prev.nodes.length - 1) return prev;
      
      const currentNode = prev.nodes[idx];
      const nextNode = prev.nodes[idx + 1];
      
      // Can only merge citable nodes with other citable nodes
      if (currentNode.nodeType !== 'citable' || nextNode.nodeType !== 'citable') {
        return prev;
      }
      
      const mergedNode: ReviewNode = {
        ...currentNode,
        content: currentNode.content + '\n\n' + nextNode.content,
        modified: true,
      };
      
      const nodes = [
        ...prev.nodes.slice(0, idx),
        mergedNode,
        ...prev.nodes.slice(idx + 2),
      ];
      
      const renumbered = recalculateNumbers(nodes);
      return { ...prev, nodes: renumbered, isDirty: true };
    });
  }, []);

  /**
   * Split node at position
   */
  const splitNode = useCallback((tempId: string, splitPosition: number) => {
    setState(prev => {
      const idx = prev.nodes.findIndex(n => n.tempId === tempId);
      if (idx === -1) return prev;
      
      const node = prev.nodes[idx];
      if (node.nodeType !== 'citable') return prev;
      
      const content = node.content;
      if (splitPosition <= 0 || splitPosition >= content.length) return prev;
      
      const firstPart = content.substring(0, splitPosition).trim();
      const secondPart = content.substring(splitPosition).trim();
      
      if (!firstPart || !secondPart) return prev;
      
      const firstNode: ReviewNode = {
        ...node,
        content: firstPart,
        modified: true,
      };
      
      const secondNode: ReviewNode = {
        tempId: `review-split-${Date.now()}`,
        nodeType: 'citable',
        content: secondPart,
        displayNumber: '', // Will be set by recalculate
        originalIndex: node.originalIndex,
        modified: true,
      };
      
      const nodes = [
        ...prev.nodes.slice(0, idx),
        firstNode,
        secondNode,
        ...prev.nodes.slice(idx + 1),
      ];
      
      const renumbered = recalculateNumbers(nodes);
      return { ...prev, nodes: renumbered, isDirty: true };
    });
  }, []);

  /**
   * Edit node content
   */
  const editContent = useCallback((tempId: string, newContent: string) => {
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.tempId === tempId 
          ? { ...node, content: newContent, modified: true }
          : node
      ),
      isDirty: true,
    }));
  }, []);

  /**
   * Edit display number
   */
  const editDisplayNumber = useCallback((tempId: string, newNumber: string) => {
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.tempId === tempId && node.nodeType === 'citable'
          ? { ...node, displayNumber: newNumber, modified: true }
          : node
      ),
      isDirty: true,
    }));
  }, []);

  /**
   * Re-sequence all citable numbers
   */
  const resequenceNumbers = useCallback(() => {
    setState(prev => ({
      ...prev,
      nodes: recalculateNumbers(prev.nodes),
      isDirty: true,
    }));
  }, []);

  /**
   * Get the selected node
   */
  const selectedNode = useMemo(() => {
    if (!state.selectedNodeId) return null;
    return state.nodes.find(n => n.tempId === state.selectedNodeId) || null;
  }, [state.nodes, state.selectedNodeId]);

  /**
   * Reset to initial parsed state
   */
  const resetToInitial = useCallback(() => {
    setState({
      nodes: parsedToReviewNodes(initialParsedNodes),
      selectedNodeId: null,
      isDirty: false,
    });
  }, [initialParsedNodes]);

  return {
    // State
    nodes: state.nodes,
    selectedNode,
    selectedNodeId: state.selectedNodeId,
    isDirty: state.isDirty,
    stats,
    
    // Selection
    selectNode,
    
    // Reclassification
    reclassifyNode,
    makeCenteredTitle,
    makeLeftSubtitle,
    makeCitable,
    ignoreNode,
    restoreNode,
    
    // Merging & Splitting
    mergeWithPrevious,
    mergeWithNext,
    splitNode,
    
    // Editing
    editContent,
    editDisplayNumber,
    resequenceNumbers,
    
    // Reset
    resetToInitial,
  };
}
