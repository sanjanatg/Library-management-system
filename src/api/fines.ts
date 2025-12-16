import { supabase } from '@/integrations/supabase/client';

export type Fine = { Fine_ID: number; Issue_ID: number; Amount: number; Date_Calculated: string; Status: string };

export async function createFine(payload: Fine) {
  return await supabase.from('FINE').insert([payload]).select().single();
}

export async function getFines() {
  return await supabase.from('FINE').select('*, ISSUE(Issue_Date, Student_ID, Book_ID)').order('Date_Calculated', { ascending: false });
}

export async function updateFine(id: number, updates: Partial<Fine>) {
  return await supabase.from('FINE').update(updates).eq('Fine_ID', id).select().single();
}

export async function deleteFine(id: number) {
  return await supabase.from('FINE').delete().eq('Fine_ID', id);
}

export function subscribeFines(onChange: () => void) {
  const channel = supabase
    .channel('realtime:FINE')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'FINE' }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}
