import { supabase } from "./supabase";

// All run persistence lives here so features don't talk to Supabase directly.
export type GameMode = "daily" | "roguelike";

export type LeaderboardRow = {
  id: number;
  score: number;
  created_at: string;
  username: string | null;
};

export type SharedRun = {
  id: number;
  mode: GameMode;
  score: number;
  created_at: string;
  username: string | null;
  run_data: unknown;
};

// Pull the embedded profile username out of a Supabase join (object or array).
function usernameFrom(profiles: unknown): string | null {
  if (Array.isArray(profiles)) return profiles[0]?.username ?? null;
  if (profiles && typeof profiles === "object") {
    return (profiles as { username?: string }).username ?? null;
  }
  return null;
}

// Save a completed run for the logged-in user. Returns the new run id.
export async function saveRun(
  mode: GameMode,
  score: number,
  runData: unknown,
  isShared = false,
): Promise<{ id: number | null; error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { id: null, error: "You must be logged in to save." };

  const { data, error } = await supabase
    .from("runs")
    .insert({
      user_id: user.id,
      score,
      run_data: runData,
      is_shared: isShared,
      mode,
    })
    .select("id")
    .single();

  return { id: data?.id ?? null, error: error?.message ?? null };
}

export type MyRun = {
  id: number;
  mode: GameMode;
  score: number;
  is_shared: boolean;
  created_at: string;
};

// The logged-in user's own runs, newest first.
export async function getMyRuns(): Promise<{ rows: MyRun[]; error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { rows: [], error: "You must be logged in." };

  const { data, error } = await supabase
    .from("runs")
    .select("id, mode, score, is_shared, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { rows: [], error: error.message };
  return { rows: (data ?? []) as MyRun[], error: null };
}

// Top scores for one mode.
export async function getLeaderboard(
  mode: GameMode,
  limit = 10,
): Promise<{ rows: LeaderboardRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("runs")
    .select("id, score, created_at, profiles(username)")
    .eq("mode", mode)
    .order("score", { ascending: false })
    .limit(limit);

  if (error) return { rows: [], error: error.message };

  const rows = (data ?? []).map((r) => ({
    id: r.id as number,
    score: r.score as number,
    created_at: r.created_at as string,
    username: usernameFrom((r as { profiles?: unknown }).profiles),
  }));
  return { rows, error: null };
}

// Mark a run public so it can be shared.
export async function shareRun(id: number): Promise<{ error: string | null }> {
  const { error } = await supabase.from("runs").update({ is_shared: true }).eq("id", id);
  return { error: error?.message ?? null };
}

// Load a single shared run for the public share page.
export async function getSharedRun(
  id: number,
): Promise<{ run: SharedRun | null; error: string | null }> {
  const { data, error } = await supabase
    .from("runs")
    .select("id, mode, score, created_at, run_data, is_shared, profiles(username)")
    .eq("id", id)
    .maybeSingle();

  if (error) return { run: null, error: error.message };
  if (!data || !data.is_shared) return { run: null, error: "Run not found or not shared." };

  return {
    run: {
      id: data.id as number,
      mode: data.mode as GameMode,
      score: data.score as number,
      created_at: data.created_at as string,
      username: usernameFrom((data as { profiles?: unknown }).profiles),
      run_data: data.run_data,
    },
    error: null,
  };
}
