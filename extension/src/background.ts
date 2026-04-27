type Rect = { x: number; y: number; width: number; height: number; dpr: number };

type CaptureResponse = {
    ok: boolean;
    dataUrl?: string;
    rect?: Rect;
    fallback?: boolean;
    error?: string;
};

function blobToDataUrl(blob: Blob, mime: string): Promise<string> {
    return blob.arrayBuffer().then((buffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
            const slice = bytes.subarray(i, i + chunk);
            binary += String.fromCharCode.apply(null, Array.from(slice) as number[]);
        }
        const base64 = btoa(binary);
        return `data:${mime};base64,${base64}`;
    });
}

async function captureAndCrop(windowId: number | undefined, rect: Rect): Promise<CaptureResponse> {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const cb = (url?: string) => {
            const lastError = chrome.runtime.lastError;
            if (lastError || !url) {
                reject(new Error(lastError?.message || 'captureVisibleTab failed'));
                return;
            }
            resolve(url);
        };
        if (typeof windowId === 'number') {
            chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, cb);
        } else {
            chrome.tabs.captureVisibleTab({ format: 'png' }, cb);
        }
    });

    if (typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined') {
        return { ok: true, dataUrl, rect, fallback: true };
    }

    try {
        const fullBlob = await (await fetch(dataUrl)).blob();
        const bitmap = await createImageBitmap(fullBlob);

        const sx = Math.max(0, Math.floor(rect.x));
        const sy = Math.max(0, Math.floor(rect.y));
        const sw = Math.max(1, Math.min(Math.floor(rect.width), bitmap.width - sx));
        const sh = Math.max(1, Math.min(Math.floor(rect.height), bitmap.height - sy));

        const canvas = new OffscreenCanvas(sw, sh);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            bitmap.close();
            return { ok: true, dataUrl, rect, fallback: true };
        }
        ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh);
        bitmap.close();
        const cropped = await canvas.convertToBlob({ type: 'image/png' });
        const croppedDataUrl = await blobToDataUrl(cropped, 'image/png');
        return { ok: true, dataUrl: croppedDataUrl };
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { ok: false, error: msg };
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request && request.action === 'CAPTURE_AND_CROP') {
        const rect = request.rect as Rect;
        captureAndCrop(sender.tab?.windowId, rect)
            .then((resp) => sendResponse(resp))
            .catch((e) => {
                const msg = e instanceof Error ? e.message : String(e);
                sendResponse({ ok: false, error: msg } satisfies CaptureResponse);
            });
        return true;
    }
    return false;
});
