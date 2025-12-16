import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Options = {
  table: string;
  schema?: string;
  onChange: () => void;
};

export function useRealtime({ table, schema = 'public', onChange }: Options) {
  useEffect(() => {
    const channel = supabase
      .channel(`realtime:${table}`)
      .on('postgres_changes', { event: '*', schema, table }, onChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, schema, onChange]);
}
