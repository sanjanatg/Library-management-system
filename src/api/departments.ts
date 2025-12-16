import { supabase } from '@/integrations/supabase/client';

export type Department = { Department_ID: string; Dept_Name: string };

export async function getDepartments() {
  return await supabase.from('DEPARTMENT').select('*').order('Department_ID');
}

export async function createDepartment(payload: Department) {
  return await supabase.from('DEPARTMENT').insert([payload]).select().single();
}

export async function updateDepartment(id: string, updates: Partial<Department>) {
  return await supabase.from('DEPARTMENT').update(updates).eq('Department_ID', id).select().single();
}

export async function deleteDepartment(id: string) {
  return await supabase.from('DEPARTMENT').delete().eq('Department_ID', id);
}

export function subscribeDepartments(onChange: () => void) {
  const channel = supabase
    .channel('realtime:DEPARTMENT')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'DEPARTMENT' }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}
