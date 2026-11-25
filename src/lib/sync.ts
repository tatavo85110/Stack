"use client";
import { createClient, type SupabaseClient, type Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useStack, publicData } from "./store";

let client: SupabaseClient | null = null;
let clientKey = "";

export function supabase(): SupabaseClient | null {
  const { supabaseUrl, supabaseKey } = useStack.getState().settings;
  if (!supabaseUrl || !supabaseKey) return null;
  const k = supabaseUrl + supabaseKey;
  if (!client || clientKey !== k) {
    client = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: true, detectSessionInUrl: true, storageKey: "stack-auth" } });
    clientKey = k;
  }
  return client;
}

export function useSession() {
  const url = useStack((s) => s.settings.supabaseUrl + s.settings.supabaseKey);
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    const sb = supabase();
    if (!sb) return setSession(null);
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, [url]);
  return session;
}

export const syncState = { last: "", status: "" as "" | "ok" | "error" | "busy", message: "" };
const listeners = new Set<() => void>();
const emit = (status: typeof syncState.status, message = "") => {
  Object.assign(syncState, { status, message, last: status === "ok" ? new Date().toISOString() : syncState.last });
  listeners.forEach((l) => l());
};
export function useSyncStatus() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  return syncState;
}

let applyingRemote = false;
/** Server time of the cloud copy this device last sent or received. */
const STAMP = "stack-sync-stamp";
/** Set while this device has edits the cloud has not received yet. */
const DIRTY = "stack-sync-dirty";
const t = (iso: string | null | undefined) => (iso ? Date.parse(iso) || 0 : 0);
const ls = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch {} },
  del: (k: string) => { try { localStorage.removeItem(k); } catch {} },
};

export async function pull(sb: SupabaseClient, userId: string) {
  const { data, error } = await sb.from("stack_state").select("data, updated_at").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data as { data: Record<string, unknown>; updated_at: string } | null;
}

function applyRemote(remote: { data: Record<string, unknown>; updated_at: string }) {
  applyingRemote = true;
  try { useStack.getState().replaceAll(remote.data); } finally { applyingRemote = false; }
  ls.set(STAMP, remote.updated_at);
  ls.del(DIRTY);
}

export async function push(sb: SupabaseClient, userId: string) {
  emit("busy");
  // The database stamps updated_at itself (server clock), so devices with a wrong clock can't win by mistake.
  const { data, error } = await sb.from("stack_state").upsert({ user_id: userId, data: publicData(useStack.getState()) }).select("updated_at").single();
  if (error) return emit("error", error.message);
  ls.set(STAMP, (data as { updated_at: string }).updated_at);
  ls.del(DIRTY);
  emit("ok");
}

/** Keeps this device and the cloud copy in step while signed in. */
export function useCloudSync() {
  const session = useSession();
  useEffect(() => {
    const sb = supabase();
    if (!sb || !session) return;
    const uid = session.user.id;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let alive = true;
    let ready = false;
    let running: Promise<void> | null = null;

    /** A newer cloud copy always wins; otherwise this device sends its unsent edits. */
    const refresh = () => {
      if (running) return running;
      running = (async () => {
        try {
          const remote = await pull(sb, uid);
          if (!alive) return;
          if (remote && t(remote.updated_at) > t(ls.get(STAMP))) { applyRemote(remote); emit("ok"); }
          else if (!remote || ls.get(DIRTY) === "1") await push(sb, uid);
          else emit("ok");
          ready = true;
          await importInbox(sb);
        } catch (e) {
          emit("error", e instanceof Error ? e.message : "Synchro impossible");
        } finally {
          running = null;
        }
      })();
      return running;
    };

    const send = async () => {
      if (!alive) return;
      await running;
      try {
        // Another device saved in the meantime: take its copy instead of overwriting it.
        const remote = await pull(sb, uid);
        if (remote && t(remote.updated_at) > t(ls.get(STAMP))) { applyRemote(remote); return emit("ok"); }
        await push(sb, uid);
      } catch (e) {
        emit("error", e instanceof Error ? e.message : "Synchro impossible");
      }
    };

    refresh();
    const unsub = useStack.subscribe(() => {
      // Ignore changes made before the first pull (loading, automatic checks): they must not overwrite the cloud.
      if (applyingRemote || !alive || !ready) return;
      ls.set(DIRTY, "1");
      clearTimeout(timer);
      timer = setTimeout(send, 1500);
    });
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("online", onVisible);
    // While the app is open, look for changes from the other device every 20 seconds.
    const poll = setInterval(() => document.visibilityState === "visible" && refresh(), 20000);
    return () => {
      alive = false;
      clearTimeout(timer);
      clearInterval(poll);
      unsub();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("online", onVisible);
    };
  }, [session]);
  return session;
}

/** Turns the messages from the site's contact form and from client portals into prospects and requests. */
export async function importInbox(sb: SupabaseClient) {
  const { data, error } = await sb.from("stack_inbox").select("*").order("created_at", { ascending: true }).limit(100);
  if (error || !data?.length) return 0;
  const st = useStack.getState();
  for (const m of data as { id: number; kind: string; name: string; email: string; message: string; client_ref: string | null; created_at: string }[]) {
    const date = m.created_at.slice(0, 10);
    if (m.kind === "demande") {
      const c = st.clients.find((x) => x.name === m.client_ref);
      st.addRequest({ clientId: c?.id, from: m.name || m.client_ref || "Client", date, text: m.message, status: "Nouvelle" });
    } else {
      const id = st.addClient({ name: m.name || m.email, contact: m.name, email: m.email, phone: "", sector: "", source: "Site web", stage: "Prospect" });
      st.addHistory(id, `Message du formulaire du site : ${m.message.slice(0, 300)}`);
    }
  }
  await sb.from("stack_inbox").delete().in("id", (data as { id: number }[]).map((m) => m.id));
  return data.length;
}

/**
 * SQL to paste once in Supabase. Sign-ups must be turned off in Supabase (Authentication > Sign In / Providers),
 * so the only account is the one created by the owner in the dashboard: "authenticated" then means the owner.
 */
export function schemaSql() {
  return `-- Stack : à coller dans Supabase > SQL Editor > New query, puis « Run ».
create table if not exists public.stack_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.stack_state enable row level security;
drop policy if exists "stack_state_owner" on public.stack_state;
create policy "stack_state_owner" on public.stack_state for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Boîte de réception : formulaire de contact du site et demandes des portails clients.
create table if not exists public.stack_inbox (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('contact', 'demande')),
  name text not null default '' check (length(name) < 200),
  email text not null default '' check (length(email) < 200),
  message text not null check (length(message) between 1 and 5000),
  client_ref text check (length(client_ref) < 200),
  created_at timestamptz not null default now()
);
alter table public.stack_inbox enable row level security;
drop policy if exists "inbox_depot" on public.stack_inbox;
drop policy if exists "inbox_lecture" on public.stack_inbox;
drop policy if exists "inbox_suppression" on public.stack_inbox;
create policy "inbox_depot" on public.stack_inbox for insert to anon with check (true);
create policy "inbox_lecture" on public.stack_inbox for select to authenticated using (true);
create policy "inbox_suppression" on public.stack_inbox for delete to authenticated using (true);

-- La date de mise à jour vient du serveur, pas de l'horloge de l'appareil.
create or replace function public.stack_touch() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists stack_state_touch on public.stack_state;
create trigger stack_state_touch before insert or update on public.stack_state for each row execute function public.stack_touch();

-- Droits d'accès (les règles ci-dessus filtrent ensuite les lignes).
grant select, insert, update, delete on public.stack_state to authenticated;
grant select, delete on public.stack_inbox to authenticated;
grant insert on public.stack_inbox to anon;
`;
}

/** HTML form to paste on the website: each message becomes a prospect in Stack. */
export function contactSnippet(url: string, key: string) {
  return `<form id="contact-stack">
  <input name="name" placeholder="Votre nom" required>
  <input name="email" type="email" placeholder="Votre email" required>
  <textarea name="message" placeholder="Votre projet" required></textarea>
  <button>Envoyer</button>
  <p id="contact-stack-ok" hidden>Merci, je vous réponds très vite.</p>
</form>
<script>
document.getElementById("contact-stack").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const r = await fetch("${url.replace(/\/$/, "")}/rest/v1/stack_inbox", {
    method: "POST",
    headers: { apikey: "${key}", "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ kind: "contact", name: f.get("name"), email: f.get("email"), message: f.get("message") }),
  });
  if (r.ok) { e.target.reset(); document.getElementById("contact-stack-ok").hidden = false; }
});
</script>`;
}
