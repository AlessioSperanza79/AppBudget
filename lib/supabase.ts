import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    realtime: {
      params: { eventsPerSecond: 10 },
      // Riconnessione progressiva: 1s → 2s → 5s → 10s
      reconnectAfterMs: (tries: number) =>
        ([1000, 2000, 5000, 10000] as const)[Math.min(tries - 1, 3)],
      heartbeatIntervalMs: 20000,
      timeout: 30000,
    },
  },
);
