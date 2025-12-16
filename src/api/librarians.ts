import { supabase } from '@/integrations/supabase/client';

export type Librarian = { Librarian_ID: number; Email: string; Name?: string | null; Role?: string | null };

export async function createLibrarian(payload: Librarian) {
  return await supabase.from('LIBRARIAN').insert([payload]).select().single();
}

export async function getLibrarians() {
  return await supabase.from('LIBRARIAN').select('*').order('Librarian_ID');
}

export async function updateLibrarian(id: number, updates: Partial<Librarian>) {
  return await supabase.from('LIBRARIAN').update(updates).eq('Librarian_ID', id).select().single();
}

export async function deleteLibrarian(id: number) {
  return await supabase.from('LIBRARIAN').delete().eq('Librarian_ID', id);
}

export function subscribeLibrarians(onChange: () => void) {
  const channel = supabase
    .channel('realtime:LIBRARIAN')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'LIBRARIAN' }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}
