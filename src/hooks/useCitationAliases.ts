/**
 * useCitationAliases - Hook for managing document citation aliases
 */

import { useState, useEffect, useCallback } from 'react';
import { CitationAlias, CitationPreset, getCitationPreset } from '@/types/citationAlias';
import {
  getAllCitationAliases,
  getAliasesForDocument,
  createCitationAlias,
  updateCitationAlias,
  deleteCitationAlias,
  isPrefixInUse,
} from '@/lib/db/citationAliasDb';
import { invalidateAliasCache } from '@/lib/citationResolver';

export function useCitationAliases() {
  const [aliases, setAliases] = useState<CitationAlias[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAliases = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllCitationAliases();
      setAliases(data);
    } catch (err) {
      console.error('Error fetching citation aliases:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAliases();
  }, [fetchAliases]);

  const addAlias = useCallback(async (
    documentId: string,
    prefix: string,
    pattern: string,
    numberExtractor: CitationAlias['numberExtractor'],
    displayFormat: string,
    priority?: number
  ): Promise<string | null> => {
    try {
      const id = await createCitationAlias(
        documentId,
        prefix,
        pattern,
        numberExtractor,
        displayFormat,
        priority
      );
      invalidateAliasCache();
      await fetchAliases();
      return id;
    } catch (err) {
      console.error('Error creating citation alias:', err);
      return null;
    }
  }, [fetchAliases]);

  const addAliasFromPreset = useCallback(async (
    documentId: string,
    preset: CitationPreset,
    customPrefix?: string
  ): Promise<string | null> => {
    const presetConfig = getCitationPreset(preset);
    if (!presetConfig) return null;

    const prefix = customPrefix || presetConfig.defaultPrefix;
    const pattern = presetConfig.defaultPattern.replace(
      presetConfig.defaultPrefix,
      prefix
    );

    return addAlias(
      documentId,
      prefix,
      pattern,
      presetConfig.numberExtractor,
      presetConfig.displayFormat.replace(presetConfig.defaultPrefix, prefix),
      100 // High priority for presets
    );
  }, [addAlias]);

  const modifyAlias = useCallback(async (
    id: string,
    updates: Partial<Pick<CitationAlias, 'prefix' | 'pattern' | 'numberExtractor' | 'displayFormat' | 'priority'>>
  ): Promise<boolean> => {
    try {
      await updateCitationAlias(id, updates);
      invalidateAliasCache();
      await fetchAliases();
      return true;
    } catch (err) {
      console.error('Error updating citation alias:', err);
      return false;
    }
  }, [fetchAliases]);

  const removeAlias = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteCitationAlias(id);
      invalidateAliasCache();
      await fetchAliases();
      return true;
    } catch (err) {
      console.error('Error deleting citation alias:', err);
      return false;
    }
  }, [fetchAliases]);

  const checkPrefixAvailable = useCallback(async (
    prefix: string,
    excludeId?: string
  ): Promise<boolean> => {
    const inUse = await isPrefixInUse(prefix, excludeId);
    return !inUse;
  }, []);

  return {
    aliases,
    loading,
    addAlias,
    addAliasFromPreset,
    modifyAlias,
    removeAlias,
    checkPrefixAvailable,
    refresh: fetchAliases,
  };
}

/**
 * Hook for getting aliases for a specific document
 */
export function useDocumentAliases(documentId: string | null) {
  const [aliases, setAliases] = useState<CitationAlias[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAliases = useCallback(async () => {
    if (!documentId) {
      setAliases([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getAliasesForDocument(documentId);
      setAliases(data);
    } catch (err) {
      console.error('Error fetching document aliases:', err);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchAliases();
  }, [fetchAliases]);

  return {
    aliases,
    loading,
    refresh: fetchAliases,
  };
}
