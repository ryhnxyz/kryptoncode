// ─────────────────────────────────────────────────────────────────────────────
// Klien Neon — Managed Better Auth + Data API dalam satu client.
// Dipakai oleh: halaman publik (baca, via anonymous JWT otomatis) dan
// dashboard (tulis, wajib login + terdaftar di tabel admins — dijaga RLS).
//
// URL di bawah aman dibuka publik: semua proteksi data ada di RLS Postgres,
// bukan di kerahasiaan URL. Bisa dioverride lewat env Vite bila perlu.
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from '@neondatabase/neon-js';

const AUTH_URL =
  import.meta.env.VITE_NEON_AUTH_URL ||
  'https://ep-wispy-rice-azb8dxfh.neonauth.c-3.ap-southeast-1.aws.neon.tech/neondb/auth';
const DATA_API_URL =
  import.meta.env.VITE_NEON_DATA_API_URL ||
  'https://ep-wispy-rice-azb8dxfh.apirest.c-3.ap-southeast-1.aws.neon.tech/neondb/rest/v1';

export const neon = createClient({
  auth: { url: AUTH_URL, allowAnonymous: true },
  dataApi: { url: DATA_API_URL },
});

// ── Mapper: baris DB (snake_case) ⇄ bentuk data komponen ────────────────────

export function mapExperimentRow(row) {
  return {
    dbId: row.id,
    id: row.slug,
    slug: row.slug,
    title: row.title,
    category: row.category,
    status: row.status,
    year: row.year,
    tags: row.tags || [],
    desc_id: row.desc_id || '',
    desc_en: row.desc_en || '',
    preview: row.preview || null,
    previewUrl: row.preview_url || null,
    downloadUrl: row.download_url || null,
    prompt: row.prompt || null,
    sortOrder: row.sort_order ?? 0,
  };
}

export function experimentToRow(e) {
  return {
    slug: e.slug,
    title: e.title,
    category: e.category,
    status: e.status,
    year: e.year,
    tags: e.tags || [],
    desc_id: e.desc_id || '',
    desc_en: e.desc_en || '',
    preview: e.preview || null,
    preview_url: e.previewUrl || null,
    download_url: e.downloadUrl || null,
    prompt: e.prompt || null,
    sort_order: e.sortOrder ?? 0,
  };
}

export function mapProjectRow(row) {
  return {
    dbId: row.id,
    id: row.slug,
    slug: row.slug,
    company: row.company || '',
    icon_name: row.icon_name || 'Robot',
    type: row.type || '',
    title: row.title,
    desc: row.description || '',
    features: row.features || [],
    project_link: row.project_link || null,
    sortOrder: row.sort_order ?? 0,
  };
}

export function projectToRow(p) {
  return {
    slug: p.slug,
    company: p.company || '',
    icon_name: p.icon_name || 'Robot',
    type: p.type || '',
    title: p.title,
    description: p.desc || '',
    features: p.features || [],
    project_link: p.project_link || null,
    sort_order: p.sortOrder ?? 0,
  };
}

// ── Baca (publik) ────────────────────────────────────────────────────────────

export async function fetchExperiments() {
  const { data, error } = await neon
    .from('experiments')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw new Error(error.message || 'Data API error');
  return (data || []).map(mapExperimentRow);
}

export async function fetchProjects() {
  const { data, error } = await neon
    .from('projects')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw new Error(error.message || 'Data API error');
  return (data || []).map(mapProjectRow);
}

// ── Tulis (dashboard — RLS: hanya admin terdaftar) ──────────────────────────
// Mutasi tidak mengembalikan baris; pemanggil cukup refetch daftar.

export async function insertExperiment(e) {
  const { error } = await neon.from('experiments').insert(experimentToRow(e));
  if (error) throw new Error(error.message || 'Insert gagal');
}

export async function updateExperiment(dbId, e) {
  const { error } = await neon.from('experiments').update(experimentToRow(e)).eq('id', dbId);
  if (error) throw new Error(error.message || 'Update gagal');
}

export async function deleteExperiment(dbId) {
  const { error } = await neon.from('experiments').delete().eq('id', dbId);
  if (error) throw new Error(error.message || 'Delete gagal');
}

export async function insertProject(p) {
  const { error } = await neon.from('projects').insert(projectToRow(p));
  if (error) throw new Error(error.message || 'Insert gagal');
}

export async function updateProject(dbId, p) {
  const { error } = await neon.from('projects').update(projectToRow(p)).eq('id', dbId);
  if (error) throw new Error(error.message || 'Update gagal');
}

export async function deleteProject(dbId) {
  const { error } = await neon.from('projects').delete().eq('id', dbId);
  if (error) throw new Error(error.message || 'Delete gagal');
}

// ── Sesi & status admin ──────────────────────────────────────────────────────

export async function getSessionUser() {
  try {
    const { data } = await neon.auth.getSession();
    return data?.user || data?.session?.user || null;
  } catch {
    return null;
  }
}

/**
 * True bila user yang sedang login terdaftar di tabel admins.
 * RLS admins: tiap user hanya bisa melihat barisnya sendiri, jadi cukup
 * cek apakah SELECT mengembalikan baris.
 */
export async function isRegisteredAdmin() {
  try {
    const { data, error } = await neon.from('admins').select('user_id').limit(1);
    if (error) return false;
    return (data || []).length > 0;
  } catch {
    return false;
  }
}
