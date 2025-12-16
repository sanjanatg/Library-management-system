import { supabase } from '@/integrations/supabase/client';

export type Student = {
  student_id: string; // e.g., 1cd23is145
  name: string;
  email: string; // must end with @cambridge.edu.in
  contact: string; // phone number
  year: number;
  dept_id: string; // e.g., IS, CS
};

export async function createStudent(payload: Student) {
  return await supabase.from('STUDENT').insert([payload]).select().single();
}

export async function getStudents() {
  return await supabase.from('STUDENT').select('*').order('student_id');
}

export async function getStudentById(student_id: string) {
  return await supabase.from('STUDENT').select('*').eq('student_id', student_id).maybeSingle();
}

export async function updateStudent(student_id: string, updates: Partial<Student>) {
  return await supabase.from('STUDENT').update(updates).eq('student_id', student_id).select().single();
}

export async function deleteStudent(student_id: string) {
  return await supabase.from('STUDENT').delete().eq('student_id', student_id);
}

export function subscribeStudents(onChange: () => void) {
  const channel = supabase
    .channel('realtime:STUDENT')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'STUDENT' }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
