import { supabase } from '@/integrations/supabase/client';

export type Author = { Author_ID: number; Author_Name: string };

export async function createAuthor(payload: Author) {
  return await supabase.from('AUTHOR').insert([payload]).select().single();
}

export async function getAuthors() {
  return await supabase.from('AUTHOR').select('*').order('Author_Name');
}

export async function updateAuthor(id: number, updates: Partial<Author>) {
  return await supabase.from('AUTHOR').update(updates).eq('Author_ID', id).select().single();
}

export async function deleteAuthor(id: number) {
  return await supabase.from('AUTHOR').delete().eq('Author_ID', id);
}

export function subscribeAuthors(onChange: () => void) {
  const channel = supabase
    .channel('realtime:AUTHOR')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'AUTHOR' }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}
