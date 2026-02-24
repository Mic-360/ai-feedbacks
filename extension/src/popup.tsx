import { useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
    const [status, setStatus] = useState("");

    const startSelection = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            if (currentTab?.id) {
                if (currentTab.url?.startsWith("chrome://") || currentTab.url?.startsWith("edge://") || currentTab.url?.startsWith("about:")) {
                    setStatus("Cannot capture this page. Try a normal website.");
                    return;
                }
                chrome.tabs.sendMessage(currentTab.id, { action: 'START_SELECTION' }, (_response) => {
                    if (chrome.runtime.lastError) {
                        setStatus("Error: Please refresh the page and try again.");
                        return;
                    }
                    window.close();
                });
            }
        });
    };

    return (
        <div style={{ padding: 20, width: 320, fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <img src="/logo.png" style={{ width: 32, height: 32, borderRadius: 8 }} />
                <h2 style={{ marginTop: 0, marginBottom: 0, fontSize: 18 }}>AI Feedback Capturer</h2>
            </div>
            <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5, marginBottom: 20 }}>Select an exact rectangular region on your screen to immediately generate a bug report and AI prompt.</p>
            <button
                onClick={startSelection}
                style={{ width: '100%', padding: '12px', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
            >
                Start Selection
            </button>
            {status && <p style={{ marginTop: 12, fontSize: 13, color: 'red', textAlign: 'center' }}>{status}</p>}
        </div>
    );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
