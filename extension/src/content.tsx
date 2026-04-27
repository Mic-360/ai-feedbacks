import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  getStoredThemePreference,
  getThemeTokens,
  type ExtensionThemeTokens,
} from './theme';

type LogsPayload = {
  console: string[];
  unhandledRejections: string[];
  domLength: number;
  domExcerpt: string;
  networkSummary: Array<{
    method: string;
    url: string;
    status: number;
    durationMs: number;
    timestamp: string;
  }>;
};

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
  dpr: number;
};

type CaptureResponse = {
  ok: boolean;
  dataUrl?: string;
  rect?: Rect;
  fallback?: boolean;
  error?: string;
};

const script = document.createElement('script');
script.src = chrome.runtime.getURL('src/injected.js');
script.onload = function () {
  (this as HTMLScriptElement).remove();
};
if (document.head || document.documentElement) {
  (document.head || document.documentElement).appendChild(script);
}

let currentSlug: string | null = null;
let currentSiteBase: string | null = null;
let latestMetadata: LogsPayload | null = null;

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  const data = event.data as
    | { type?: string; payload?: LogsPayload }
    | undefined;
  if (data && data.type === 'SEND_METADATA' && data.payload) {
    latestMetadata = data.payload;
  }
});

function requestMetadata(): Promise<LogsPayload> {
  return new Promise((resolve) => {
    const handler = (event: MessageEvent) => {
      if (event.source !== window) return;
      const data = event.data as
        | { type?: string; payload?: LogsPayload }
        | undefined;
      if (data && data.type === 'SEND_METADATA' && data.payload) {
        window.removeEventListener('message', handler);
        latestMetadata = data.payload;
        resolve(data.payload);
      }
    };
    window.addEventListener('message', handler);
    window.postMessage({ type: 'GET_METADATA' }, '*');
    setTimeout(() => {
      window.removeEventListener('message', handler);
      resolve(
        latestMetadata || {
          console: [],
          unhandledRejections: [],
          domLength: 0,
          domExcerpt: '',
          networkSummary: [],
        },
      );
    }, 500);
  });
}

function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return fetch(dataUrl).then((r) => r.blob());
}

async function resolveContentTheme(): Promise<ExtensionThemeTokens> {
  const preference = await getStoredThemePreference();
  return getThemeTokens(preference);
}

async function showToast(
  message: string,
  kind: 'success' | 'error' = 'success',
) {
  const theme = await resolveContentTheme();
  let toastContainer = document.getElementById('ai-feedback-toast-overlay');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'ai-feedback-toast-overlay';
    document.body.appendChild(toastContainer);
  }
  const root = createRoot(toastContainer);
  root.render(
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 2147483647,
        background: kind === 'success' ? theme.success : theme.danger,
        color: kind === 'success' ? theme.successText : '#ffffff',
        padding: '14px 22px',
        borderRadius: 12,
        boxShadow: theme.shadowStrong,
        border: `1px solid ${kind === 'success' ? theme.brandStrong : theme.danger}`,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: '-0.01em',
      }}
    >
      {message}
    </div>,
  );
  setTimeout(() => {
    root.unmount();
    toastContainer?.remove();
  }, 3000);
}

function SelectionOverlay({
  theme,
  onClose,
  onCapture,
}: {
  theme: ExtensionThemeTokens;
  onClose: () => void;
  onCapture: (rect: Rect) => void;
}) {
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [current, setCurrent] = useState<{ x: number; y: number } | null>(null);

  const dpr = window.devicePixelRatio || 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 2147483647,
        cursor: 'crosshair',
        backgroundColor: theme.overlay,
        userSelect: 'none',
        colorScheme: theme.colorScheme,
      }}
      onMouseDown={(e) => setStart({ x: e.clientX, y: e.clientY })}
      onMouseMove={(e) => start && setCurrent({ x: e.clientX, y: e.clientY })}
      onMouseUp={() => {
        if (
          start &&
          current &&
          Math.abs(current.x - start.x) > 10 &&
          Math.abs(current.y - start.y) > 10
        ) {
          const rect: Rect = {
            x: Math.min(start.x, current.x) * dpr,
            y: Math.min(start.y, current.y) * dpr,
            width: Math.abs(current.x - start.x) * dpr,
            height: Math.abs(current.y - start.y) * dpr,
            dpr,
          };
          onCapture(rect);
        } else {
          onClose();
        }
      }}
    >
      {start && current && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(start.x, current.x),
            top: Math.min(start.y, current.y),
            width: Math.abs(current.x - start.x),
            height: Math.abs(current.y - start.y),
            border: `2px solid ${theme.selectionBorder}`,
            backgroundColor: theme.selectionFill,
            boxShadow: `0 0 0 9999px ${theme.overlay}`,
            borderRadius: 8,
          }}
        />
      )}
    </div>
  );
}

function SubmitDialog({
  imageBlob,
  logs,
  slug,
  siteBaseUrl,
  theme,
  onClose,
}: {
  imageBlob: Blob;
  logs: LogsPayload;
  slug: string;
  siteBaseUrl: string;
  theme: ExtensionThemeTokens;
  onClose: () => void;
}) {
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewUrl = useRef<string>('');

  useEffect(() => {
    previewUrl.current = URL.createObjectURL(imageBlob);
    textareaRef.current?.focus();
    return () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    };
  }, [imageBlob]);

  const submit = async () => {
    if (!description.trim() || submitting) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('image', imageBlob, 'screenshot.png');
      formData.append('description', description.trim());
      formData.append('logs', JSON.stringify(logs));
      formData.append('projectSlug', slug);

      const res = await fetch(`${siteBaseUrl}/api/feedback/add`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(
          `HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`,
        );
      }
      onClose();
      void showToast('Feedback submitted', 'success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMsg(`Submit failed: ${msg}`);
      setSubmitting(false);
    }
  };

  const domKb = (logs.domLength / 1024).toFixed(1);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 2147483647,
        backgroundColor: theme.overlayStrong,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        colorScheme: theme.colorScheme,
      }}
    >
      <div
        style={{
          background: theme.surfaceElevated,
          color: theme.text,
          padding: 24,
          borderRadius: 18,
          width: 480,
          maxWidth: '100%',
          border: `1px solid ${theme.border}`,
          boxShadow: theme.shadowStrong,
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: 10,
            color: theme.text,
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: '-0.03em',
          }}
        >
          Review &amp; Submit Feedback
        </h2>
        <div
          style={{
            fontSize: 12,
            color: theme.textMuted,
            marginBottom: 14,
            lineHeight: 1.5,
          }}
        >
          Project:{' '}
          <code
            style={{
              padding: '2px 6px',
              borderRadius: 6,
              background: theme.brandSoft,
              color: theme.brandStrong,
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            }}
          >
            {slug}
          </code>{' '}
          &middot; {logs.console.length} console lines &middot;{' '}
          {logs.networkSummary.length} requests &middot; {domKb} KB DOM
        </div>
        {previewUrl.current && (
          <div
            style={{
              marginBottom: 14,
              maxHeight: 180,
              overflow: 'hidden',
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
              background: theme.surfaceMuted,
            }}
          >
            <img
              src={previewUrl.current}
              style={{ width: '100%', display: 'block' }}
              alt='preview'
            />
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder='Describe the bug or feature request...'
          style={{
            width: '100%',
            height: 108,
            padding: 12,
            boxSizing: 'border-box',
            borderRadius: 12,
            border: `1px solid ${theme.inputBorder}`,
            background: theme.inputBackground,
            color: theme.text,
            marginBottom: 12,
            fontSize: 14,
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
          }}
        />
        {errorMsg && (
          <div
            style={{
              fontSize: 12,
              color: theme.danger,
              background: theme.dangerBackground,
              border: `1px solid ${theme.danger}`,
              borderRadius: 10,
              padding: '9px 10px',
              marginBottom: 12,
              lineHeight: 1.4,
            }}
          >
            {errorMsg}
          </div>
        )}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => {
              if (!submitting) onClose();
            }}
            disabled={submitting}
            style={{
              flex: 1,
              padding: 11,
              background: theme.secondaryBackground,
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
              cursor: submitting ? 'not-allowed' : 'pointer',
              color: theme.secondaryText,
              fontWeight: 800,
              opacity: submitting ? 0.62 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!description.trim() || submitting}
            style={{
              flex: 1,
              padding: 11,
              background: theme.primaryBackground,
              color: theme.primaryText,
              border: 'none',
              borderRadius: 12,
              cursor:
                !description.trim() || submitting ? 'not-allowed' : 'pointer',
              fontWeight: 800,
              opacity: !description.trim() || submitting ? 0.62 : 1,
            }}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

async function mountSelection(slug: string, siteBaseUrl: string) {
  const theme = await resolveContentTheme();
  let overlayContainer = document.getElementById('ai-feedback-overlay');
  if (!overlayContainer) {
    overlayContainer = document.createElement('div');
    overlayContainer.id = 'ai-feedback-overlay';
    document.body.appendChild(overlayContainer);
  }
  const root = createRoot(overlayContainer);

  const cleanup = () => {
    root.unmount();
    overlayContainer?.remove();
  };

  root.render(
    <SelectionOverlay
      theme={theme}
      onClose={cleanup}
      onCapture={async (rect) => {
        cleanup();
        try {
          const logs = await requestMetadata();
          const response: CaptureResponse | undefined =
            await chrome.runtime.sendMessage({
              action: 'CAPTURE_AND_CROP',
              rect,
            });
          if (!response || !response.ok || !response.dataUrl) {
            void showToast(
              `Capture failed: ${response?.error || 'unknown error'}`,
              'error',
            );
            return;
          }
          const blob = await dataUrlToBlob(response.dataUrl);
          await mountSubmitDialog(blob, logs, slug, siteBaseUrl);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          void showToast(`Capture failed: ${msg}`, 'error');
        }
      }}
    />,
  );
}

async function mountSubmitDialog(
  imageBlob: Blob,
  logs: LogsPayload,
  slug: string,
  siteBaseUrl: string,
) {
  const theme = await resolveContentTheme();
  let overlayContainer = document.getElementById('ai-feedback-submit-overlay');
  if (!overlayContainer) {
    overlayContainer = document.createElement('div');
    overlayContainer.id = 'ai-feedback-submit-overlay';
    document.body.appendChild(overlayContainer);
  }
  const root = createRoot(overlayContainer);
  const cleanup = () => {
    root.unmount();
    overlayContainer?.remove();
  };
  root.render(
    <SubmitDialog
      imageBlob={imageBlob}
      logs={logs}
      slug={slug}
      siteBaseUrl={siteBaseUrl}
      theme={theme}
      onClose={cleanup}
    />,
  );
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request && request.action === 'START_SELECTION') {
    if (typeof request.slug === 'string') currentSlug = request.slug;
    if (typeof request.siteBaseUrl === 'string')
      currentSiteBase = request.siteBaseUrl;
    sendResponse({ success: true });
    if (!currentSlug || !currentSiteBase) {
      void showToast('Missing project info from popup.', 'error');
      return false;
    }
    window.postMessage({ type: 'GET_METADATA' }, '*');
    void mountSelection(currentSlug, currentSiteBase);
    return false;
  }
  return false;
});
