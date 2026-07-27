import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Copy,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { experimentCategories } from '../data/experimentsData';
import {
  neon,
  fetchExperiments,
  fetchProjects,
  insertExperiment,
  updateExperiment,
  deleteExperiment,
  insertProject,
  updateProject,
  deleteProject,
  getSessionUser,
  isRegisteredAdmin,
} from '../lib/neonClient';

const STATUSES = ['live', 'wip', 'archived'];
const ICONS = ['TelegramLogo', 'DiscordLogo', 'WhatsappLogo', 'InstagramLogo', 'TwitterLogo', 'Robot'];

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

const emptyExperiment = () => ({
  dbId: null,
  slug: '',
  title: '',
  category: 'design',
  status: 'wip',
  year: String(new Date().getFullYear()),
  tags: '',
  desc_id: '',
  desc_en: '',
  preview: '',
  previewUrl: '',
  downloadUrl: '',
  prompt: '',
  sortOrder: 0,
});

const emptyProject = () => ({
  dbId: null,
  slug: '',
  title: '',
  company: '',
  icon_name: 'Robot',
  type: '',
  desc: '',
  features: '',
  project_link: '',
  sortOrder: 0,
});

function Field({ label, hint, children }) {
  return (
    <label className="dash-field">
      <span className="dash-field-label">
        {label}
        {hint ? <em>{hint}</em> : null}
      </span>
      {children}
    </label>
  );
}

/**
 * Dashboard — konten situs (experiments & projects) dikelola dari sini.
 * Auth: Neon Managed Better Auth. Tulisan dijaga RLS — hanya akun yang
 * terdaftar di tabel admins yang bisa menyimpan perubahan.
 */
export default function Dashboard() {
  const { t, language } = useLanguage();

  // ── sesi ──
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // ── login form (login-only — pendaftaran akun dikelola di luar UI) ──
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');

  // ── data ──
  const [tab, setTab] = useState('experiments');
  const [experiments, setExperiments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // ── editor ──
  const [editing, setEditing] = useState(null); // null | form object
  const [saveBusy, setSaveBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  const flash = (msg) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(''), 2600);
  };

  const refreshSession = useCallback(async () => {
    const u = await getSessionUser();
    setUser(u);
    setIsAdmin(u ? await isRegisteredAdmin() : false);
    setBooting(false);
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    setErrorMsg('');
    try {
      const [exps, projs] = await Promise.all([fetchExperiments(), fetchProjects()]);
      setExperiments(exps);
      setProjects(projs);
    } catch (e) {
      setErrorMsg(e.message || String(e));
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (user && isAdmin) loadData();
  }, [user, isAdmin, loadData]);

  // ── auth handlers ──
  const submitAuth = async (ev) => {
    ev.preventDefault();
    setAuthBusy(true);
    setAuthError('');
    try {
      const { error } = await neon.auth.signIn.email({ email, password });
      if (error) throw new Error(error.message || 'Auth error');
      setPassword('');
      await refreshSession();
    } catch (e) {
      setAuthError(e.message || String(e));
    } finally {
      setAuthBusy(false);
    }
  };

  const signOut = async () => {
    try {
      await neon.auth.signOut();
    } catch {
      /* abaikan */
    }
    setUser(null);
    setIsAdmin(false);
    setEditing(null);
  };

  const copyUserId = async () => {
    try {
      await navigator.clipboard.writeText(user?.id || '');
      setCopiedId(true);
      window.setTimeout(() => setCopiedId(false), 1600);
    } catch {
      /* abaikan */
    }
  };

  // ── editor handlers ──
  const startNew = () => {
    setErrorMsg('');
    setEditing(tab === 'experiments' ? emptyExperiment() : emptyProject());
  };

  const startEdit = (item) => {
    setErrorMsg('');
    if (tab === 'experiments') {
      setEditing({
        dbId: item.dbId,
        slug: item.slug,
        title: item.title,
        category: item.category,
        status: item.status,
        year: item.year,
        tags: (item.tags || []).join(', '),
        desc_id: item.desc_id || '',
        desc_en: item.desc_en || '',
        preview: item.preview || '',
        previewUrl: item.previewUrl || '',
        downloadUrl: item.downloadUrl || '',
        prompt: item.prompt || '',
        sortOrder: item.sortOrder ?? 0,
      });
    } else {
      setEditing({
        dbId: item.dbId,
        slug: item.slug,
        title: item.title,
        company: item.company || '',
        icon_name: item.icon_name || 'Robot',
        type: item.type || '',
        desc: item.desc || '',
        features: (item.features || []).join(', '),
        project_link: item.project_link || '',
        sortOrder: item.sortOrder ?? 0,
      });
    }
  };

  const setF = (key, value) => setEditing((cur) => ({ ...cur, [key]: value }));

  const splitList = (s) =>
    String(s || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);

  const saveEditing = async (ev) => {
    ev.preventDefault();
    if (!editing) return;
    setSaveBusy(true);
    setErrorMsg('');
    try {
      const slug = editing.slug || slugify(editing.title);
      if (!slug || !editing.title) throw new Error(t('dash.needTitleSlug'));
      if (tab === 'experiments') {
        const payload = {
          ...editing,
          slug,
          tags: splitList(editing.tags),
          sortOrder: Number(editing.sortOrder) || 0,
        };
        if (editing.dbId) await updateExperiment(editing.dbId, payload);
        else await insertExperiment(payload);
      } else {
        const payload = {
          ...editing,
          slug,
          features: splitList(editing.features),
          sortOrder: Number(editing.sortOrder) || 0,
        };
        if (editing.dbId) await updateProject(editing.dbId, payload);
        else await insertProject(payload);
      }
      setEditing(null);
      flash(t('dash.saved'));
      await loadData();
    } catch (e) {
      setErrorMsg(e.message || String(e));
    } finally {
      setSaveBusy(false);
    }
  };

  const removeItem = async (item) => {
    if (!window.confirm(`${t('dash.confirmDelete')} — ${item.title}`)) return;
    setErrorMsg('');
    try {
      if (tab === 'experiments') await deleteExperiment(item.dbId);
      else await deleteProject(item.dbId);
      flash(t('dash.deleted'));
      await loadData();
    } catch (e) {
      setErrorMsg(e.message || String(e));
    }
  };

  const items = tab === 'experiments' ? experiments : projects;

  const heading = useMemo(
    () => (
      <div className="dash-head">
        <div>
          <div className="products-kicker">
            <LayoutDashboard size={12} strokeWidth={1.8} aria-hidden="true" />
            {t('dash.kicker')}
          </div>
          <h1>{t('dash.headline')}</h1>
        </div>
        {user && (
          <div className="dash-user">
            <span>{user.email}</span>
            <button type="button" className="dash-ghost-btn" onClick={signOut}>
              <LogOut size={13} strokeWidth={1.8} aria-hidden="true" />
              {t('dash.signOut')}
            </button>
          </div>
        )}
      </div>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, language],
  );

  // ── render: booting ──
  if (booting) {
    return (
      <main className="dash-page page-content" aria-busy="true">
        <div className="exp-empty">{t('dash.loading')}</div>
      </main>
    );
  }

  // ── render: belum login ──
  if (!user) {
    return (
      <main className="dash-page page-content animate-fade-in">
        {heading}
        <form className="dash-login" onSubmit={submitAuth}>
          <Field label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </Field>
          {authError && <p className="dash-error" role="alert">{authError}</p>}
          <button className="k-btn k-btn--primary dash-submit" type="submit" disabled={authBusy}>
            {authBusy ? t('dash.working') : t('dash.signIn')}
            <ArrowUpRight size={16} aria-hidden="true" />
          </button>
          <p className="dash-login-note">{t('dash.loginNote')}</p>
        </form>
      </main>
    );
  }

  // ── render: login tapi belum admin ──
  if (!isAdmin) {
    return (
      <main className="dash-page page-content animate-fade-in">
        {heading}
        <div className="dash-not-admin">
          <ShieldAlert size={26} strokeWidth={1.6} aria-hidden="true" />
          <h2>{t('dash.notAdminTitle')}</h2>
          <p>{t('dash.notAdminDesc')}</p>
          <div className="dash-userid">
            <code>{user.id}</code>
            <button type="button" className="dash-ghost-btn" onClick={copyUserId}>
              {copiedId ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
              {copiedId ? t('dash.copied') : t('dash.copyId')}
            </button>
          </div>
          <button type="button" className="dash-ghost-btn" onClick={refreshSession}>
            <RefreshCw size={13} strokeWidth={1.8} aria-hidden="true" />
            {t('dash.recheck')}
          </button>
        </div>
      </main>
    );
  }

  // ── render: dashboard ──
  return (
    <main className="dash-page page-content animate-fade-in">
      {heading}

      <div className="dash-toolbar">
        <div className="exp-filters" role="tablist" aria-label={t('dash.tabsLabel')}>
          <button
            type="button"
            className={`exp-filter ${tab === 'experiments' ? 'is-active' : ''}`}
            onClick={() => {
              setTab('experiments');
              setEditing(null);
            }}
          >
            <FlaskConical size={11} strokeWidth={1.8} aria-hidden="true" /> {t('dash.tabExperiments')}
          </button>
          <button
            type="button"
            className={`exp-filter ${tab === 'projects' ? 'is-active' : ''}`}
            onClick={() => {
              setTab('projects');
              setEditing(null);
            }}
          >
            <Package size={11} strokeWidth={1.8} aria-hidden="true" /> {t('dash.tabProjects')}
          </button>
        </div>
        <div className="dash-toolbar-right">
          <button type="button" className="dash-ghost-btn" onClick={loadData}>
            <RefreshCw size={13} strokeWidth={1.8} aria-hidden="true" />
            {t('dash.refresh')}
          </button>
          <button type="button" className="k-btn k-btn--primary dash-add-btn" onClick={startNew}>
            <Plus size={15} strokeWidth={2} aria-hidden="true" /> {t('dash.add')}
          </button>
        </div>
      </div>

      {notice && <div className="dash-notice" role="status">{notice}</div>}
      {errorMsg && <p className="dash-error" role="alert">{errorMsg}</p>}

      {/* Editor */}
      {editing && (
        <form className="dash-editor" onSubmit={saveEditing}>
          <header className="dash-editor-head">
            <h2>
              {editing.dbId ? t('dash.editEntry') : t('dash.newEntry')} ·{' '}
              {tab === 'experiments' ? t('dash.tabExperiments') : t('dash.tabProjects')}
            </h2>
            <button type="button" className="dash-ghost-btn" onClick={() => setEditing(null)}>
              <X size={13} aria-hidden="true" /> {t('dash.cancel')}
            </button>
          </header>

          <div className="dash-grid">
            <Field label={t('dash.fTitle')}>
              <input
                required
                value={editing.title}
                onChange={(e) => {
                  const v = e.target.value;
                  setEditing((cur) => ({
                    ...cur,
                    title: v,
                    slug: cur.dbId || cur.slugTouched ? cur.slug : slugify(v),
                  }));
                }}
              />
            </Field>
            <Field label="Slug" hint={t('dash.fSlugHint')}>
              <input
                required
                value={editing.slug}
                onChange={(e) => setEditing((cur) => ({ ...cur, slug: slugify(e.target.value) || e.target.value, slugTouched: true }))}
              />
            </Field>

            {tab === 'experiments' ? (
              <>
                <Field label={t('dash.fCategory')}>
                  <select value={editing.category} onChange={(e) => setF('category', e.target.value)}>
                    {experimentCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {t(`lab.category.${c.id}`)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Status">
                  <select value={editing.status} onChange={(e) => setF('status', e.target.value)}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {t(`lab.status.${s}`)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t('dash.fYear')}>
                  <input value={editing.year} onChange={(e) => setF('year', e.target.value)} />
                </Field>
                <Field label="Tags" hint={t('dash.fCommaHint')}>
                  <input value={editing.tags} onChange={(e) => setF('tags', e.target.value)} />
                </Field>
                <Field label={t('dash.fDescId')}>
                  <textarea rows={3} value={editing.desc_id} onChange={(e) => setF('desc_id', e.target.value)} />
                </Field>
                <Field label={t('dash.fDescEn')}>
                  <textarea rows={3} value={editing.desc_en} onChange={(e) => setF('desc_en', e.target.value)} />
                </Field>
                <Field label={t('dash.fPreviewImg')} hint={t('dash.fPreviewImgHint')}>
                  <input value={editing.preview} onChange={(e) => setF('preview', e.target.value)} />
                </Field>
                <Field label="Live preview URL">
                  <input value={editing.previewUrl} onChange={(e) => setF('previewUrl', e.target.value)} />
                </Field>
                <Field label="Download URL">
                  <input value={editing.downloadUrl} onChange={(e) => setF('downloadUrl', e.target.value)} />
                </Field>
                <Field label={t('dash.fSort')}>
                  <input type="number" value={editing.sortOrder} onChange={(e) => setF('sortOrder', e.target.value)} />
                </Field>
                <Field label="Prompt" hint={t('dash.fPromptHint')}>
                  <textarea rows={5} className="dash-span2" value={editing.prompt} onChange={(e) => setF('prompt', e.target.value)} />
                </Field>
              </>
            ) : (
              <>
                <Field label={t('dash.fCompany')}>
                  <input value={editing.company} onChange={(e) => setF('company', e.target.value)} />
                </Field>
                <Field label={t('dash.fType')}>
                  <input value={editing.type} onChange={(e) => setF('type', e.target.value)} />
                </Field>
                <Field label={t('dash.fIcon')}>
                  <select value={editing.icon_name} onChange={(e) => setF('icon_name', e.target.value)}>
                    {ICONS.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t('dash.fSort')}>
                  <input type="number" value={editing.sortOrder} onChange={(e) => setF('sortOrder', e.target.value)} />
                </Field>
                <Field label={t('dash.fDesc')}>
                  <textarea rows={3} className="dash-span2" value={editing.desc} onChange={(e) => setF('desc', e.target.value)} />
                </Field>
                <Field label={t('dash.fFeatures')} hint={t('dash.fCommaHint')}>
                  <textarea rows={2} className="dash-span2" value={editing.features} onChange={(e) => setF('features', e.target.value)} />
                </Field>
                <Field label={t('dash.fLink')}>
                  <input value={editing.project_link} onChange={(e) => setF('project_link', e.target.value)} />
                </Field>
              </>
            )}
          </div>

          <footer className="dash-editor-foot">
            <button className="k-btn k-btn--primary" type="submit" disabled={saveBusy}>
              {saveBusy ? t('dash.working') : t('dash.save')}
              <Check size={15} strokeWidth={2} aria-hidden="true" />
            </button>
          </footer>
        </form>
      )}

      {/* List */}
      <section className="dash-list" aria-busy={loadingData}>
        {loadingData && <div className="exp-empty">{t('dash.loading')}</div>}
        {!loadingData && items.length === 0 && <div className="exp-empty">{t('dash.empty')}</div>}
        {!loadingData &&
          items.map((item, i) => (
            <article key={item.dbId} className="dash-row">
              <span className="dash-row-index">{String(i + 1).padStart(2, '0')}</span>
              <div className="dash-row-main">
                <strong>{item.title}</strong>
                <span className="dash-row-meta">
                  {tab === 'experiments'
                    ? `${t(`lab.category.${item.category}`)} · ${item.year} · /${item.slug}`
                    : `${item.type || '—'} · ${item.company || '—'} · /${item.slug}`}
                </span>
              </div>
              {tab === 'experiments' ? (
                <span className={`exp-status exp-status--${item.status}`}>
                  <i aria-hidden="true" />
                  {t(`lab.status.${item.status}`)}
                </span>
              ) : (
                <span className="dash-row-icon" aria-hidden="true">
                  {item.icon_name}
                </span>
              )}
              <div className="dash-row-actions">
                <button type="button" className="dash-ghost-btn" onClick={() => startEdit(item)}>
                  <Pencil size={13} strokeWidth={1.8} aria-hidden="true" />
                  {t('dash.edit')}
                </button>
                <button
                  type="button"
                  className="dash-ghost-btn dash-danger"
                  onClick={() => removeItem(item)}
                >
                  <Trash2 size={13} strokeWidth={1.8} aria-hidden="true" />
                  {t('dash.delete')}
                </button>
              </div>
            </article>
          ))}
      </section>
    </main>
  );
}
