import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

type LogsPayload = {
    console: string[];
    unhandledRejections: string[];
    domLength: number;
    domExcerpt: string;
    networkSummary: Array<{ method: string; url: string; status: number; durationMs: number; timestamp: string }>;
};

type Rect = { x: number; y: number; width: number; height: number; dpr: number };

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
    const data = event.data as { type?: string; payload?: LogsPayload } | undefined;
    if (data && data.type === 'SEND_METADATA' && data.payload) {
        latestMetadata = data.payload;
    }
});

function requestMetadata(): Promise<LogsPayload> {
    return new Promise((resolve) => {
        const handler = (event: MessageEvent) => {
            if (event.source !== window) return;
            const data = event.data as { type?: string; payload?: LogsPayload } | undefined;
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
                }
            );
        }, 500);
    });
}

function dataUrlToBlob(dataUrl: string): Promise<Blob> {
    return fetch(dataUrl).then((r) => r.blob());
}

function showToast(message: string, kind: 'success' | 'error' = 'success') {
    let toastContainer = document.getElementById('ai-feedback-toast-overlay');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'ai-feedback-toast-overlay';
        document.body.appendChild(toastContainer);
    }
    const root = createRoot(toastContainer);
    root.render(
        <div style={{
            position: 'fixed', top: 20, right: 20, zIndex: 2147483647,
            background: kind === 'success' ? '#87ae73' : '#c0392b', color: 'white',
            padding: '14px 22px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontFamily: 'system-ui, sans-serif', fontWeight: 600, fontSize: 14
        }}>
            {message}
        </div>
    );
    setTimeout(() => {
        root.unmount();
        toastContainer?.remove();
    }, 3000);
}

function SelectionOverlay({ onClose, onCapture }: { onClose: () => void; onCapture: (rect: Rect) => void }) {
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
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                zIndex: 2147483647, cursor: 'crosshair', backgroundColor: 'rgba(0,0,0,0.3)',
                userSelect: 'none'
            }}
            onMouseDown={(e) => setStart({ x: e.clientX, y: e.clientY })}
            onMouseMove={(e) => start && setCurrent({ x: e.clientX, y: e.clientY })}
            onMouseUp={() => {
                if (start && current && Math.abs(current.x - start.x) > 10 && Math.abs(current.y - start.y) > 10) {
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
                <div style={{
                    position: 'absolute',
                    left: Math.min(start.x, current.x),
                    top: Math.min(start.y, current.y),
                    width: Math.abs(current.x - start.x),
                    height: Math.abs(current.y - start.y),
                    border: '2px solid red',
                    backgroundColor: 'rgba(255,0,0,0.1)'
                }} />
            )}
        </div>
    );
}

function SubmitDialog({
    imageBlob,
    logs,
    slug,
    siteBaseUrl,
    onClose,
}: {
    imageBlob: Blob;
    logs: LogsPayload;
    slug: string;
    siteBaseUrl: string;
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
                throw new Error(`HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`);
            }
            onClose();
            showToast('Feedback submitted', 'success');
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            setErrorMsg(`Submit failed: ${msg}`);
            setSubmitting(false);
        }
    };

    const domKb = (logs.domLength / 1024).toFixed(1);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            zIndex: 2147483647, backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'system-ui, sans-serif'
        }}>
            <div style={{
                background: '#fff', padding: 24, borderRadius: 12, width: 460,
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
                <h2 style={{ marginTop: 0, marginBottom: 12, color: '#000', fontSize: 18 }}>Review &amp; Submit Feedback</h2>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
                    Project: <code>{slug}</code> &middot; {logs.console.length} console lines &middot; {logs.networkSummary.length} requests &middot; {domKb} KB DOM
                </div>
                {previewUrl.current && (
                    <div style={{ marginBottom: 12, maxHeight: 180, overflow: 'hidden', border: '1px solid #eee', borderRadius: 6 }}>
                        <img src={previewUrl.current} style={{ width: '100%', display: 'block' }} alt="preview" />
                    </div>
                )}
                <textarea
                    ref={textareaRef}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the bug or feature request..."
                    style={{ width: '100%', height: 100, padding: 12, boxSizing: 'border-box', borderRadius: 6, border: '1px solid #ccc', marginBottom: 12, fontSize: 14, fontFamily: 'inherit' }}
                />
                {errorMsg && (
                    <div style={{ fontSize: 12, color: '#c0392b', marginBottom: 12 }}>{errorMsg}</div>
                )}
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={() => { if (!submitting) onClose(); }}
                        disabled={submitting}
                        style={{ flex: 1, padding: 10, background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 6, cursor: submitting ? 'not-allowed' : 'pointer', color: '#333', fontWeight: 600 }}
                    >Cancel</button>
                    <button
                        onClick={submit}
                        disabled={!description.trim() || submitting}
                        style={{ flex: 1, padding: 10, background: '#87ae73', color: '#fff', border: 'none', borderRadius: 6, cursor: (!description.trim() || submitting) ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: (!description.trim() || submitting) ? 0.6 : 1 }}
                    >
                        {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function mountSelection(slug: string, siteBaseUrl: string) {
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
            onClose={cleanup}
            onCapture={async (rect) => {
                cleanup();
                try {
                    const logs = await requestMetadata();
                    const response: CaptureResponse | undefined = await chrome.runtime.sendMessage({
                        action: 'CAPTURE_AND_CROP',
                        rect,
                    });
                    if (!response || !response.ok || !response.dataUrl) {
                        showToast(`Capture failed: ${response?.error || 'unknown error'}`, 'error');
                        return;
                    }
                    const blob = await dataUrlToBlob(response.dataUrl);
                    mountSubmitDialog(blob, logs, slug, siteBaseUrl);
                } catch (e) {
                    const msg = e instanceof Error ? e.message : String(e);
                    showToast(`Capture failed: ${msg}`, 'error');
                }
            }}
        />
    );
}

function mountSubmitDialog(imageBlob: Blob, logs: LogsPayload, slug: string, siteBaseUrl: string) {
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
            onClose={cleanup}
        />
    );
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request && request.action === 'START_SELECTION') {
        if (typeof request.slug === 'string') currentSlug = request.slug;
        if (typeof request.siteBaseUrl === 'string') currentSiteBase = request.siteBaseUrl;
        sendResponse({ success: true });
        if (!currentSlug || !currentSiteBase) {
            showToast('Missing project info from popup.', 'error');
            return false;
        }
        window.postMessage({ type: 'GET_METADATA' }, '*');
        mountSelection(currentSlug, currentSiteBase);
        return false;
    }
    return false;
});
