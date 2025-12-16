import { supabase } from '@/integrations/supabase/client';

export type Book = {
  Book_ID: number;
  Title: string;
  Author_ID?: number | null;
  Publisher?: string | null;
  Year_of_Publication?: number | null;
  Available_Copies: number;
};

export async function createBook(payload: Book) {
  return await supabase.from('BOOK').insert([payload]).select().single();
}

export async function getBooks() {
  return await supabase.from('BOOK').select('*, AUTHOR(Author_Name)').order('Book_ID');
}

export async function updateBook(id: number, updates: Partial<Book>) {
  return await supabase.from('BOOK').update(updates).eq('Book_ID', id).select().single();
}

export async function deleteBook(id: number) {
  return await supabase.from('BOOK').delete().eq('Book_ID', id);
}

export function subscribeBooks(onChange: () => void) {
  const channel = supabase
    .channel('realtime:BOOK')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'BOOK' }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}
