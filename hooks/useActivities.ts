import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import { ACTIVITIES } from '@/types';

export interface Activity {
  id: string;
  label: string;
  emoji: string;
  custom: boolean;
}

export function useActivities() {
  const { session } = useAuth();
  const [customActivities, setCustomActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustom = useCallback(async () => {
    if (!session?.user) { setLoading(false); return; }
    const { data } = await supabase
      .from('custom_activities')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });
    if (data) {
      setCustomActivities(data.map((d) => ({ id: d.id, label: d.label, emoji: d.emoji, custom: true })));
    }
    setLoading(false);
  }, [session]);

  useEffect(() => { fetchCustom(); }, [fetchCustom]);

  const addActivity = async (label: string, emoji: string): Promise<string | null> => {
    if (!session?.user) return 'Not signed in';
    const { data, error } = await supabase
      .from('custom_activities')
      .insert({ user_id: session.user.id, label: label.trim(), emoji: emoji.trim() })
      .select()
      .single();
    if (error) return error.message;
    if (data) setCustomActivities((prev) => [...prev, { id: data.id, label: data.label, emoji: data.emoji, custom: true }]);
    return null;
  };

  const deleteActivity = async (id: string) => {
    await supabase.from('custom_activities').delete().eq('id', id);
    setCustomActivities((prev) => prev.filter((a) => a.id !== id));
  };

  const activities: Activity[] = [
    ...ACTIVITIES.map((a) => ({ ...a, custom: false })),
    ...customActivities,
  ];

  return { activities, customActivities, addActivity, deleteActivity, loading, refresh: fetchCustom };
}
