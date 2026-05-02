const API_URL = "https://tmt-extension-production.up.railway.app";
const OCR_URL = `${API_URL}/ocr/ocr-reading`;
const XLAT_URL = `${API_URL}/ocr/translate`;

const overlayMap = new WeakMap();

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "TRANSLATE_IMAGE") {
        handleTranslation(msg.src, msg.sourceLang, msg.targetLang);
    }
});
async function imageToBase64(imgEl) {
    await waitForImage(imgEl);
    try {
        const canvas = document.createElement("canvas");
        canvas.width = imgEl.naturalWidth;
        canvas.height = imgEl.naturalHeight;
        canvas.getContext("2d").drawImage(imgEl, 0, 0);
        console.log(canvas.toDataURL("image/png"));
        return canvas.toDataURL("image/png");
    } catch (e) {
        console.warn("[ImageTranslator] Canvas tainted, falling back to URL", e);
        return imgEl.src;
    }
}

async function handleTranslation(src, sourceLang, targetLang) {
    const imgEl = findImageBySrc(src);
    if (!imgEl) {
        showToast("Could not locate the image on the page.", "error");
        return;
    }
    const base64 = await imageToBase64(imgEl);
    removeOverlay(imgEl);
    const loader = showLoader(imgEl);

    try {
        await waitForImage(imgEl);
	console.log("iamge is being shown")
        const ocrRes = await fetch(OCR_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ src: base64, sourceLang }),
        });
        if (!ocrRes.ok) throw new Error(`OCR failed: ${ocrRes.status}`);
        const ocrData = await ocrRes.json();

        if (!ocrData.lines || ocrData.lines.length === 0) {
            removeLoader(loader);
            showToast("No text detected in this image.", "info");
            return;
        }

        const xlRes = await fetch(XLAT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lines: ocrData.lines, sourceLang, targetLang }),
        });
        if (!xlRes.ok) throw new Error(`Translation failed: ${xlRes.status}`);
        const xlData = await xlRes.json();

        removeLoader(loader);
        drawOverlays(imgEl, xlData.lines);
    } catch (err) {
        removeLoader(loader);
        console.error("[ImageTranslator]", err);
        showToast(`Error: ${err.message}`, "error");
    }
}

function findImageBySrc(src) {
    for (const img of document.querySelectorAll("img")) {
        if (img.src === src || img.currentSrc === src) return img;
    }
    const decoded = decodeURIComponent(src);
    for (const img of document.querySelectorAll("img")) {
        if (decodeURIComponent(img.src) === decoded) return img;
    }
    return null;
}

function waitForImage(imgEl) {
    return new Promise((resolve) => {
        if (imgEl.complete && imgEl.naturalWidth > 0) return resolve();
        imgEl.addEventListener("load", resolve, { once: true });
    });
}

function fitTextToBbox(span, boxWidth, boxHeight) {
    const maxWidth = boxWidth - 4;
    const maxHeight = boxHeight - 2;

    let lo = 14,
        hi = Math.min(boxHeight, 72);

    for (let i = 0; i < 12; i++) {
        // more iterations = more accurate
        const mid = (lo + hi) / 2;
        span.style.fontSize = mid + "px";
        if (span.scrollWidth <= maxWidth && span.scrollHeight <= maxHeight) {
            lo = mid; // fits, try bigger
        } else {
            hi = mid; // too big, go smaller
        }
    }

    span.style.fontSize = lo + "px";
}

function drawOverlays(imgEl, lines) {
    const scaleX = imgEl.clientWidth / imgEl.naturalWidth;
    const scaleY = imgEl.clientHeight / imgEl.naturalHeight;

    const wrapper = document.createElement("div");
    wrapper.style.cssText = `position:relative;display:inline-block;width:${imgEl.clientWidth}px;height:${imgEl.clientHeight}px`;
    imgEl.parentNode.insertBefore(wrapper, imgEl);
    wrapper.appendChild(imgEl);
    overlayMap.set(imgEl, wrapper);

    const dismissBtn = document.createElement("button");
    dismissBtn.textContent = "✕ Clear";
    dismissBtn.style.cssText =
        "position:absolute;top:6px;right:6px;z-index:10000;background:rgba(0,0,0,0.7);color:white;border:none;border-radius:4px;padding:3px 8px;font-size:11px;cursor:pointer;font-family:sans-serif";
    dismissBtn.addEventListener("click", () => removeOverlay(imgEl));
    wrapper.appendChild(dismissBtn);

    for (const line of lines) {
        const { x0, y0, x1, y1 } = line.bbox;
        const left = x0 * scaleX;
        const top = y0 * scaleY;
        const width = (x1 - x0) * scaleX;
        const height = (y1 - y0) * scaleY;

        const box = document.createElement("div");
        box.style.cssText = `position:absolute;left:${left}px;top:${top}px;width:${width}px;height:${height}px;background:rgba(0,0,0,0.82);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;border-radius:3px;padding:1px 3px;box-sizing:border-box;pointer-events:none;z-index:9999`;

        const span = document.createElement("span");
        span.style.cssText = `color:white;font-family:sans-serif;line-height:1.2;text-align:center;white-space:nowrap;display:block;max-width:100%;overflow:hidden;word-break:break-word;white-space:normal;`;
        span.textContent = line.translated;
        box.appendChild(span);
        wrapper.appendChild(box);

        // Must be appended to DOM first before measuring
        fitTextToBbox(span, width, height);
    }
}

function removeOverlay(imgEl) {
    const wrapper = overlayMap.get(imgEl);
    if (!wrapper) return;
    const parent = wrapper.parentNode;
    if (parent) {
        parent.insertBefore(imgEl, wrapper);
        parent.removeChild(wrapper);
    }
    overlayMap.delete(imgEl);
}

function showLoader(imgEl) {
    const rect = imgEl.getBoundingClientRect();
    const loader = document.createElement("div");
    loader.style.cssText = `position:fixed;top:${rect.top + rect.height / 2 - 20}px;left:${rect.left + rect.width / 2 - 80}px;z-index:99999;background:rgba(0,0,0,0.8);color:white;padding:8px 16px;border-radius:20px;font-size:13px;font-family:sans-serif;display:flex;align-items:center;gap:8px;pointer-events:none`;
    loader.innerHTML = `<span style="width:14px;height:14px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:_spin 0.7s linear infinite;display:inline-block"></span> Translating…`;
    if (!document.getElementById("_it_spin")) {
        const style = document.createElement("style");
        style.id = "_it_spin";
        style.textContent = "@keyframes _spin{to{transform:rotate(360deg)}}";
        document.head.appendChild(style);
    }
    document.body.appendChild(loader);
    return loader;
}

function removeLoader(loader) {
    loader?.remove();
}

function showToast(message, type = "info") {
    const bg = type === "error" ? "rgba(180,30,30,0.9)" : "rgba(30,120,220,0.9)";
    const toast = document.createElement("div");
    toast.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:99999;background:${bg};color:white;padding:10px 18px;border-radius:8px;font-size:13px;font-family:sans-serif;max-width:320px;box-shadow:0 4px 12px rgba(0,0,0,0.3);transition:opacity 0.4s`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
    }, 3000);
    setTimeout(() => toast.remove(), 3500);
}
