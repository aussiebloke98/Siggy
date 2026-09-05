import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Contact, Template } from '@/types';

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to load contacts:', error.message);
      return;
    }
    setContacts((data as Contact[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const importContacts = useCallback(
    async (
      parsed: { name: string; email: string; phone: string; company: string; tags: string[] }[],
      source: string,
    ): Promise<number> => {
      const rows = parsed.map((c) => ({
        name: c.name,
        email: c.email,
        phone: c.phone,
        company: c.company,
        tags: c.tags,
        source,
      }));
      const { data, error } = await supabase
        .from('contacts')
        .insert(rows)
        .select('id');
      if (error) {
        console.error('Import failed:', error.message);
        return 0;
      }
      fetchContacts();
      return data?.length ?? 0;
    },
    [fetchContacts],
  );

  const deleteContact = useCallback(
    async (id: string) => {
      await supabase.from('contacts').delete().eq('id', id);
      fetchContacts();
    },
    [fetchContacts],
  );

  const updateContact = useCallback(
    async (id: string, updates: Partial<Contact>) => {
      await supabase.from('contacts').update(updates).eq('id', id);
      fetchContacts();
    },
    [fetchContacts],
  );

  return { contacts, loading, importContacts, deleteContact, updateContact, refreshContacts: fetchContacts };
}

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to load templates:', error.message);
      return;
    }
    setTemplates((data as Template[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = useCallback(
    async (t: Omit<Template, 'id' | 'created_at'>): Promise<string | null> => {
      const { data, error } = await supabase
        .from('templates')
        .insert(t)
        .select('id')
        .single();
      if (error) {
        console.error('Failed to create template:', error.message);
        return null;
      }
      fetchTemplates();
      return data?.id ?? null;
    },
    [fetchTemplates],
  );

  const updateTemplate = useCallback(
    async (id: string, updates: Partial<Template>) => {
      await supabase.from('templates').update(updates).eq('id', id);
      fetchTemplates();
    },
    [fetchTemplates],
  );

  const deleteTemplate = useCallback(
    async (id: string) => {
      await supabase.from('templates').delete().eq('id', id);
      fetchTemplates();
    },
    [fetchTemplates],
  );

  return {
    templates,
    loading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refreshTemplates: fetchTemplates,
  };
}
