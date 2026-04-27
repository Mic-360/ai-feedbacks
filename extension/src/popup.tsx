import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './popup.css';
import {
  DEFAULT_SITE_BASE_URL_CONST,
  getSiteBaseUrl,
  setSiteBaseUrlOverride,
} from './site-base';
import {
  getStoredThemePreference,
  resolveTheme,
  setStoredThemePreference,
  THEME_PREFERENCES,
  themeLabels,
  type ThemePreference,
} from './theme';

type VerifyResponse = { match: boolean; slug?: string };

function App() {
  const [tabUrl, setTabUrl] = useState<string>('');
  const [tabId, setTabId] = useState<number | null>(null);
  const [siteBaseUrl, setSiteBaseUrl] = useState<string>(
    DEFAULT_SITE_BASE_URL_CONST,
  );
  const [editingBase, setEditingBase] = useState<boolean>(false);
  const [baseDraft, setBaseDraft] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [themePreference, setThemePreference] =
    useState<ThemePreference>('system');

  useEffect(() => {
    (async () => {
      try {
        const preference = await getStoredThemePreference();
        setThemePreference(preference);
      } catch (_e) {}
      try {
        const base = await getSiteBaseUrl();
        setSiteBaseUrl(base);
        setBaseDraft(base);
      } catch (_e) {}
      try {
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        const t = tabs[0];
        if (t) {
          setTabUrl(t.url || '');
          setTabId(typeof t.id === 'number' ? t.id : null);
        }
      } catch (_e) {}
    })();
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      const resolved = resolveTheme(themePreference);
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
    };

    applyTheme();

    if (
      themePreference !== 'system' ||
      typeof window.matchMedia !== 'function'
    ) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', applyTheme);

    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [themePreference]);

  const changeThemePreference = async (preference: ThemePreference) => {
    setThemePreference(preference);
    try {
      await setStoredThemePreference(preference);
    } catch (_e) {
      setErrorMsg('Unable to save theme preference.');
    }
  };

  const saveBase = async () => {
    const trimmed = baseDraft.trim();
    if (trimmed === '' || trimmed === DEFAULT_SITE_BASE_URL_CONST) {
      await setSiteBaseUrlOverride(null);
      const fresh = await getSiteBaseUrl();
      setSiteBaseUrl(fresh);
      setBaseDraft(fresh);
    } else {
      await setSiteBaseUrlOverride(trimmed);
      const fresh = await getSiteBaseUrl();
      setSiteBaseUrl(fresh);
      setBaseDraft(fresh);
    }
    setEditingBase(false);
  };

  const startCapture = async () => {
    setStatus('');
    setErrorMsg('');
    if (!tabId || !tabUrl) {
      setErrorMsg('No active tab found.');
      return;
    }
    if (
      tabUrl.startsWith('chrome://') ||
      tabUrl.startsWith('edge://') ||
      tabUrl.startsWith('about:')
    ) {
      setErrorMsg('Cannot capture this page. Try a normal website.');
      return;
    }
    setBusy(true);
    setStatus('Verifying URL...');
    try {
      const verifyUrl = `${siteBaseUrl}/api/extension/verify?url=${encodeURIComponent(tabUrl)}`;
      const res = await fetch(verifyUrl);
      if (!res.ok) {
        setErrorMsg(`Verification failed (HTTP ${res.status}).`);
        setStatus('');
        setBusy(false);
        return;
      }
      const data = (await res.json()) as VerifyResponse;
      if (!data.match || !data.slug) {
        setErrorMsg(
          `This URL isn't registered. Open ${siteBaseUrl} to add it.`,
        );
        setStatus('');
        setBusy(false);
        return;
      }
      await chrome.storage.session.set({ currentProjectSlug: data.slug });
      await chrome.tabs.sendMessage(tabId, {
        action: 'START_SELECTION',
        slug: data.slug,
        siteBaseUrl,
      });
      window.close();
    } catch (e) {
      setErrorMsg(`Network error contacting ${siteBaseUrl}.`);
      setStatus('');
      setBusy(false);
    }
  };

  return (
    <main className='popup-shell'>
      <section
        className='popup-card'
        aria-label='AI Feedback Capturer'
      >
        <div className='popup-card__inner'>
          <header className='popup-header'>
            <span
              className='popup-logo-wrap'
              aria-hidden='true'
            >
              <img
                className='popup-logo'
                src='/logo.png'
                alt=''
              />
            </span>
            <div className='popup-title-group'>
              <p className='popup-kicker'>Capture assistant</p>
              <h1 className='popup-title'>AI Feedback</h1>
            </div>
          </header>

          <p className='popup-description'>
            Capture a region of this page and send it to your registered
            project.
          </p>

          <label className='theme-row'>
            <span>
              <span className='theme-row__label'>Theme</span>
              <span className='theme-row__hint'>
                Use your preferred extension appearance.
              </span>
            </span>
            <select
              className='theme-select'
              value={themePreference}
              onChange={(e) =>
                changeThemePreference(e.target.value as ThemePreference)
              }
              aria-label='Theme preference'
            >
              {THEME_PREFERENCES.map((preference) => (
                <option
                  key={preference}
                  value={preference}
                >
                  {themeLabels[preference]}
                </option>
              ))}
            </select>
          </label>

          <div className='info-panel'>
            <div className='info-panel__row breakable'>
              <strong>Tab URL:</strong> {tabUrl || '(unknown)'}
            </div>
            <div className='info-panel__row breakable'>
              <strong>Site:</strong>{' '}
              {!editingBase && (
                <>
                  <span>{siteBaseUrl}</span>{' '}
                  <a
                    href='#'
                    onClick={(e) => {
                      e.preventDefault();
                      setEditingBase(true);
                    }}
                    className='inline-link'
                  >
                    edit
                  </a>
                </>
              )}
              {editingBase && (
                <div className='base-editor'>
                  <input
                    value={baseDraft}
                    onChange={(e) => setBaseDraft(e.target.value)}
                    placeholder={DEFAULT_SITE_BASE_URL_CONST}
                    className='text-input'
                  />
                  <button
                    onClick={saveBase}
                    className='button button--primary button--small'
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setBaseDraft(siteBaseUrl);
                      setEditingBase(false);
                    }}
                    className='button button--secondary button--small'
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={startCapture}
            disabled={busy}
            className='button button--primary'
          >
            {busy ? 'Preparing capture...' : 'Capture from this page'}
          </button>

          {status && <p className='status-message'>{status}</p>}
          {errorMsg && <p className='error-message'>{errorMsg}</p>}
        </div>
      </section>
    </main>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
