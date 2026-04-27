import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './popup.css';
import {
  DEFAULT_SITE_BASE_URL_CONST,
  getSiteBaseUrl,
  setSiteBaseUrlOverride,
} from './site-base';

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

  useEffect(() => {
    (async () => {
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
    <div
      style={{ padding: 20, width: 340, fontFamily: 'system-ui, sans-serif' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <img
          src='/logo.png'
          style={{ width: 32, height: 32, borderRadius: 8 }}
        />
        <h2 style={{ margin: 0, fontSize: 18 }}>AI Feedback Capturer</h2>
      </div>
      <p
        style={{
          fontSize: 13,
          color: '#666',
          lineHeight: 1.5,
          margin: '0 0 12px 0',
        }}
      >
        Capture a region of this page and send it to your registered project.
      </p>

      <div
        style={{
          fontSize: 12,
          color: '#444',
          background: '#f7f7f7',
          padding: 10,
          borderRadius: 6,
          marginBottom: 12,
          wordBreak: 'break-all',
        }}
      >
        <div style={{ marginBottom: 4 }}>
          <strong>Tab URL:</strong> {tabUrl || '(unknown)'}
        </div>
        <div>
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
                style={{ color: '#3366cc', fontSize: 12 }}
              >
                edit
              </a>
            </>
          )}
          {editingBase && (
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <input
                value={baseDraft}
                onChange={(e) => setBaseDraft(e.target.value)}
                placeholder={DEFAULT_SITE_BASE_URL_CONST}
                style={{
                  flex: 1,
                  padding: 6,
                  fontSize: 12,
                  border: '1px solid #ccc',
                  borderRadius: 4,
                }}
              />
              <button
                onClick={saveBase}
                style={{
                  padding: '6px 10px',
                  fontSize: 12,
                  background: '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setBaseDraft(siteBaseUrl);
                  setEditingBase(false);
                }}
                style={{
                  padding: '6px 10px',
                  fontSize: 12,
                  background: '#eee',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
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
        style={{
          width: '100%',
          padding: '12px',
          background: '#000',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: busy ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          fontSize: 14,
          opacity: busy ? 0.6 : 1,
        }}
      >
        Capture from this page
      </button>
      {status && (
        <p
          style={{
            marginTop: 12,
            fontSize: 13,
            color: '#555',
            textAlign: 'center',
          }}
        >
          {status}
        </p>
      )}
      {errorMsg && (
        <p
          style={{
            marginTop: 12,
            fontSize: 13,
            color: '#c0392b',
            textAlign: 'center',
          }}
        >
          {errorMsg}
        </p>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
