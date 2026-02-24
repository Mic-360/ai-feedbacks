chrome.runtime.onMessage.addListener((request, sender) => {
    if (request.action === 'CAPTURE_SCREENSHOT') {
        chrome.tabs.captureVisibleTab(sender.tab?.windowId as number, { format: 'png' }, (dataUrl) => {
            const captureData = {
                image: dataUrl,
                rect: request.rect,
                dom: request.dom,
                logs: request.logs
            };

            // Immediately ask the content script to show the description dialog
            if (sender.tab?.id) {
                chrome.tabs.sendMessage(sender.tab.id, {
                    action: 'SHOW_SUBMIT_DIALOG',
                    captureData
                });
            }
        });
    } else if (request.action === 'SUBMIT_FEEDBACK_BACKGROUND') {
        const { description, captureData } = request;

        // We must crop the image in the background utilizing an offscreen document or a background canvas technique
        // Since MV3 background service workers lack DOM Canvas, we will pass the uncropped image + rect coordinates 
        // straight to the API (which can be handled there, but we will approximate it or let Next.js handle it if possible!)
        // However, a simpler workaround is to simply fetch the data uri and let the user attach the whole view. Let's do a simple 
        // fetch with the full image for now to prevent MV3 canvas limitations, OR we can execute a script in the active tab to crop it.

        // Better: let's inject a script to the sender tab to crop and upload!
        if (sender.tab?.id) {
            chrome.scripting.executeScript({
                target: { tabId: sender.tab.id },
                func: async (desc, data) => {
                    function cropImage(base64: string, rect: any): Promise<string> {
                        return new Promise((resolve) => {
                            const img = new Image();
                            img.onload = () => {
                                const canvas = document.createElement('canvas');
                                canvas.width = rect.width;
                                canvas.height = rect.height;
                                const ctx = canvas.getContext('2d');
                                ctx?.drawImage(img, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
                                resolve(canvas.toDataURL('image/png'));
                            };
                            img.src = base64;
                        });
                    }

                    try {
                        const croppedImage = await cropImage(data.image, data.rect);
                        const res = await fetch(croppedImage);
                        const blob = await res.blob();
                        const file = new File([blob], 'screenshot.png', { type: 'image/png' });

                        const formData = new FormData();
                        formData.append('image', file);

                        const fullDesc = `
User Description: ${desc}

---
Console Logs:
${data.logs.length ? data.logs.join('\n') : 'None'}

DOM Snapshot (Length): ${data.dom.length} characters
                        `.trim();

                        formData.append('description', fullDesc);

                        const response = await fetch('http://localhost:3000/api/feedback/add', {
                            method: 'POST',
                            body: formData
                        });

                        if (response.ok) {
                            return true;
                        }
                    } catch (e) {
                        return false;
                    }
                    return false;
                },
                args: [description, captureData]
            }).then((results) => {
                if (results[0].result === true && sender.tab?.id) {
                    chrome.tabs.sendMessage(sender.tab.id, {
                        action: 'SHOW_SUCCESS_TOAST'
                    });
                }
            });
        }
    }
});
