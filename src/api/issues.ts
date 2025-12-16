import { supabase } from '@/integrations/supabase/client';

export type Issue = {
  Issue_ID: number;
  Book_ID: number;
  Student_ID: string; // FK -> STUDENT.student_id
  Librarian_ID?: number | null;
  Issue_Date: string; // ISO date
  Due_Date?: string | null;
  Return_Date?: string | null;
  Renewal_Count: number;
};

export async function createIssue(payload: Issue) {
  return await supabase.from('ISSUE').insert([payload]).select().single();
}

export async function getIssues() {
  return await supabase
    .from('ISSUE')
    .select('*, BOOK(Title), STUDENT(name, student_id), LIBRARIAN(Name)')
    .order('Issue_Date', { ascending: false });
}

export async function updateIssue(id: number, updates: Partial<Issue>) {
  return await supabase.from('ISSUE').update(updates).eq('Issue_ID', id).select().single();
}

export async function deleteIssue(id: number) {
  return await supabase.from('ISSUE').delete().eq('Issue_ID', id);
}

export function subscribeIssues(onChange: () => void) {
  const channel = supabase
    .channel('realtime:ISSUE')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ISSUE' }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}
