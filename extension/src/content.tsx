import { useState } from 'react';
import { createRoot } from 'react-dom/client';

// Inject the injected.ts
const script = document.createElement('script');
script.src = chrome.runtime.getURL('src/injected.js');
script.onload = function () {
    (this as any).remove();
};
if (document.head || document.documentElement) {
    (document.head || document.documentElement).appendChild(script);
}

let logs: string[] = [];

window.addEventListener('message', (event) => {
    if (event.data.type === 'SEND_METADATA') {
        logs = event.data.logs;
    }
});

function SelectionOverlay({ onClose, onCapture }: { onClose: () => void, onCapture: (rect: any) => void }) {
    const [start, setStart] = useState<{ x: number, y: number } | null>(null);
    const [current, setCurrent] = useState<{ x: number, y: number } | null>(null);

    const dpr = window.devicePixelRatio || 1;

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
                if (start && current && Math.abs(current.x - start.x) > 10) {
                    const rect = {
                        x: Math.min(start.x, current.x) * dpr,
                        y: Math.min(start.y, current.y) * dpr,
                        width: Math.abs(current.x - start.x) * dpr,
                        height: Math.abs(current.y - start.y) * dpr
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

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'START_SELECTION') {
        sendResponse({ success: true });
        window.postMessage({ type: 'GET_METADATA' }, '*');

        let overlayContainer = document.getElementById('ai-feedback-overlay');
        if (!overlayContainer) {
            overlayContainer = document.createElement('div');
            overlayContainer.id = 'ai-feedback-overlay';
            document.body.appendChild(overlayContainer);
        }
        const root = createRoot(overlayContainer);

        root.render(
            <SelectionOverlay
                onClose={() => {
                    root.unmount();
                    overlayContainer?.remove();
                }}
                onCapture={(rect) => {
                    root.unmount();
                    overlayContainer?.remove();

                    setTimeout(() => {
                        const clone = document.documentElement.cloneNode(true) as HTMLElement;
                        const scripts = clone.querySelectorAll('script, style, svg');
                        scripts.forEach(s => s.remove());
                        const domString = clone.outerHTML;

                        chrome.runtime.sendMessage({
                            action: 'CAPTURE_SCREENSHOT',
                            rect,
                            dom: domString,
                            logs: logs
                        });

                    }, 100);
                }}
            />
        );
    } else if (request.action === 'SHOW_SUBMIT_DIALOG') {
        const { captureData } = request;

        let overlayContainer = document.getElementById('ai-feedback-submit-overlay');
        if (!overlayContainer) {
            overlayContainer = document.createElement('div');
            overlayContainer.id = 'ai-feedback-submit-overlay';
            document.body.appendChild(overlayContainer);
        }
        const root = createRoot(overlayContainer);

        const SubmitDialog = () => {
            const [description, setDescription] = useState("");
            const [status, setStatus] = useState("");

            const submitFeedback = async () => {
                if (!description) return;
                setStatus("Submitting...");

                try {
                    // Start background submission
                    chrome.runtime.sendMessage({
                        action: 'SUBMIT_FEEDBACK_BACKGROUND',
                        description,
                        captureData
                    });

                    // We wait for the background.ts response, but we can optimistically close the center dialog
                    root.unmount();
                    overlayContainer?.remove();

                } catch (e) {
                    setStatus("Error initiating submit");
                }
            };

            return (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    zIndex: 2147483647, backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'system-ui, sans-serif'
                }}>
                    <div style={{
                        background: '#fff', padding: 24, borderRadius: 12, width: 400,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }}>
                        <h2 style={{ marginTop: 0, marginBottom: 12, color: '#000' }}>Review & Submit Bug</h2>
                        <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
                            Captured {captureData.logs?.length || 0} console logs and {(captureData.dom?.length / 1024).toFixed(1)} KB of DOM state.
                        </div>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Describe the bug or feature request in detail..."
                            style={{ width: '100%', height: 100, padding: 12, boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #ccc', marginBottom: 16, fontSize: 14 }}
                        />
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => { root.unmount(); overlayContainer?.remove(); }}
                                style={{ flex: 1, padding: 10, background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', color: '#333', fontWeight: 600 }}
                            >Cancel</button>
                            <button
                                onClick={submitFeedback}
                                disabled={!description.trim() || status === "Submitting..."}
                                style={{ flex: 1, padding: 10, background: '#87ae73', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, opacity: (!description.trim() || status === "Submitting...") ? 0.5 : 1 }}
                            >
                                {status === "Submitting..." ? "..." : "Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            );
        };

        root.render(<SubmitDialog />);
    } else if (request.action === 'SHOW_SUCCESS_TOAST') {
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
                background: '#87ae73', color: 'white', padding: '16px 24px',
                borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                fontFamily: 'system-ui, sans-serif', fontWeight: 600,
                transition: 'opacity 0.3s'
            }}>
                Feedback Submitted Successfully!
            </div>
        );

        setTimeout(() => {
            root.unmount();
            toastContainer?.remove();
        }, 3000);
    }
});
