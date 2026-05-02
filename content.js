const BASE_URL = "http://localhost:3000";
let tooltip = null;

// ─── HIGHLIGHT TRANSLATION ───────────────────────────────────────

document.addEventListener("mouseup", async (e) => {
    const selectedText = window.getSelection().toString().trim();

    removeTooltip();

    if (!selectedText) return;

    const settings = await browser.storage.local.get(["src_lang", "tgt_lang", "enabled"]);

    if (settings.enabled === false) return;

    const src_lang = settings.src_lang || "en";
    const tgt_lang = settings.tgt_lang || "ne";

    if (src_lang === tgt_lang) return;

    // Split into sentences
    const sentences = selectedText
        .match(/[^।\.!\?]+[।\.!\?]*/g)
        ?.map((s) => s.trim())
        .filter((s) => s.length > 0) || [selectedText];

    // Too long check
    if (sentences.length > 10) {
        showTooltip(e.clientX, e.clientY, "⚠️ Text too long. Please select 10 sentences or fewer.");
        return;
    }

    // Single sentence — original behavior
    if (sentences.length === 1) {
        showTooltip(e.clientX, e.clientY, "Translating...");

        browser.runtime
            .sendMessage({
                action: "translate",
                text: selectedText,
                src_lang,
                tgt_lang,
            })
            .then((response) => {
                if (response.success) {
                    showTooltip(e.clientX, e.clientY, response.translation);
                } else {
                    showTooltip(e.clientX, e.clientY, "Translation failed.");
                }
            })
            .catch(() => {
                showTooltip(e.clientX, e.clientY, "Error contacting translator.");
            });

        return;
    }

    // Multiple sentences
    const total = sentences.length;
    const translated = [];

    for (let i = 0; i < total; i++) {
        // Update progress in tooltip
        showTooltip(e.clientX, e.clientY, `Translating sentence ${i + 1}/${total}...`);

        try {
            const response = await browser.runtime.sendMessage({
                action: "translate",
                text: sentences[i],
                src_lang,
                tgt_lang,
            });

            if (response.success) {
                translated.push(response.translation);
            } else {
                translated.push("[Translation failed]");
            }
        } catch {
            translated.push("[Error]");
        }
    }

    // Show full combined result
    showTooltip(e.clientX, e.clientY, translated.join(" "));
});

document.addEventListener("mousedown", () => {
    removeTooltip();
});

function showTooltip(x, y, text) {
    removeTooltip();

    tooltip = document.createElement("div");
    tooltip.id = "tmt-tooltip";
    tooltip.textContent = text;

    Object.assign(tooltip.style, {
        position: "fixed",
        top: `${y + 15}px`,
        left: `${x}px`,
        backgroundColor: "#1a1a2e",
        color: "#eaeaea",
        padding: "16px 20px",
        borderRadius: "8px",
        fontSize: "16px",
        maxWidth: "500px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
        border: "1px solid #7b8cde",
        zIndex: "999999",
        lineHeight: "1.5",
        fontFamily: "Segoe UI, sans-serif",
        wordBreak: "break-word",
    });

    document.body.appendChild(tooltip);
}

function removeTooltip() {
    if (tooltip) {
        tooltip.remove();
        tooltip = null;
    }
}

// ─── TEXT BOX TRANSLATION ───────────────────────────────────────

function getInputText(el) {
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
        return el.value.trim();
    }
    return el.innerText.trim();
}

function setInputText(el, text) {
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
        el.value = text;
        el.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
        el.innerText = text;
        el.dispatchEvent(new Event("input", { bubbles: true }));
    }
}

function getOrCreateButton(el) {
    const existingBtn = document.querySelector(`[data-tmt-for="${el.dataset.tmtId}"]`);
    if (existingBtn) return existingBtn;

    const btn = document.createElement("button");
    btn.dataset.tmtFor = el.dataset.tmtId;
    btn.textContent = "TMT";
    btn.title = "Translate this text";

    Object.assign(btn.style, {
        position: "fixed",
        backgroundColor: "#7b8cde",
        color: "white",
        border: "none",
        borderRadius: "6px",
        padding: "4px 10px",
        fontSize: "11px",
        fontWeight: "700",
        cursor: "pointer",
        zIndex: "999999999",
        fontFamily: "Segoe UI, sans-serif",
        letterSpacing: "1px",
        opacity: "0.9",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        transition: "opacity 0.2s, background-color 0.2s",
        pointerEvents: "auto",
    });

    btn.addEventListener("mouseover", () => (btn.style.opacity = "1"));
    btn.addEventListener("mouseout", () => (btn.style.opacity = "0.9"));

    document.body.appendChild(btn);
    return btn;
}

function positionButton(btn, el) {
    const rect = el.getBoundingClientRect();
    btn.style.top = `${rect.bottom - 32}px`;
    btn.style.left = `${rect.right - 52}px`;
}

function injectTranslateButton(el) {
    if (el.dataset.tmtInjected) return;
    el.dataset.tmtInjected = "true";
    el.dataset.tmtId = Math.random().toString(36).slice(2);

    let originalText = null;

    const btn = getOrCreateButton(el);
    positionButton(btn, el);

    window.addEventListener("scroll", () => positionButton(btn, el), true);
    window.addEventListener("resize", () => positionButton(btn, el));

    el.addEventListener("focus", async () => {
        const settings = await browser.storage.local.get("enabled");
        if (settings.enabled === false) return;
        positionButton(btn, el);
        btn.style.display = "block";
    });

    el.addEventListener("blur", () => {
        setTimeout(() => {
            if (!btn.matches(":hover")) {
                btn.style.display = "none";
            }
        }, 200);
    });

    el.addEventListener("input", () => {
        if (btn.dataset.tmtMode === "reverse") {
            originalText = null;
            btn.dataset.tmtMode = "";
            btn.textContent = "TMT";
            btn.style.backgroundColor = "#7b8cde";
        }
    });

    btn.style.display = "none";

    btn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // If in reverse mode, restore original
        if (btn.dataset.tmtMode === "reverse") {
            setInputText(el, originalText);
            originalText = null;
            btn.dataset.tmtMode = "";
            btn.textContent = "TMT";
            btn.style.backgroundColor = "#7b8cde";
            return;
        }

        const text = getInputText(el);
        if (!text) return;

        // Split into sentences
        const sentences = text
            .match(/[^।\.!\?]+[।\.!\?]*/g)
            ?.map((s) => s.trim())
            .filter((s) => s.length > 0) || [text];

        // Too long check
        if (sentences.length > 10) {
            btn.textContent = "Too long";
            btn.style.backgroundColor = "#e74c3c";
            btn.style.fontSize = "9px";
            setTimeout(() => {
                btn.textContent = "TMT";
                btn.style.backgroundColor = "#7b8cde";
                btn.style.fontSize = "11px";
            }, 2000);
            return;
        }

        const settings = await browser.storage.local.get(["src_lang", "tgt_lang"]);
        const src_lang = settings.src_lang || "en";
        const tgt_lang = settings.tgt_lang || "ne";

        const total = sentences.length;
        const translated = [];

        for (let i = 0; i < total; i++) {
            // Show progress on button
            btn.textContent = `${i + 1}/${total}`;
            btn.style.backgroundColor = "#888";

            try {
                const response = await browser.runtime.sendMessage({
                    action: "translate",
                    text: sentences[i],
                    src_lang,
                    tgt_lang,
                });

                if (response.success) {
                    translated.push(response.translation);
                } else {
                    translated.push(sentences[i]);
                }
            } catch {
                translated.push(sentences[i]);
            }
        }

        // Replace text in box with full translation
        originalText = text;
        setInputText(el, translated.join(" "));
        btn.textContent = "↩";
        btn.style.backgroundColor = "#4caf50";
        btn.dataset.tmtMode = "reverse";
    });
}

function injectAll() {
    document
        .querySelectorAll(
            "textarea, input[type='text'], input[type='search'], div[contenteditable='true'], div[contenteditable='plaintext-only']",
        )
        .forEach(injectTranslateButton);
}

injectAll();

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType !== 1) return;
            const tags = ["TEXTAREA", "INPUT"];
            if (tags.includes(node.tagName) || node.contentEditable === "true") {
                injectTranslateButton(node);
            }
            if (node.querySelectorAll) {
                node.querySelectorAll(
                    "textarea, input[type='text'], input[type='search'], div[contenteditable='true'], div[contenteditable='plaintext-only']",
                ).forEach(injectTranslateButton);
            }
        });
    });
});

observer.observe(document.body, { childList: true, subtree: true });
//youtube-part
let lastVideoId = null;
let currentListener = null;

// OBSERVER — watch for URL changes
new MutationObserver(() => {
    const url = new URL(location.href);
    const videoId = url.searchParams.get("v");
    if (videoId && videoId !== lastVideoId) {
        lastVideoId = videoId;
        setTimeout(() => init(videoId), 1500); // give YT time to settle
    }
}).observe(document, { subtree: true, childList: true });

// Initial load
const _initialId = new URL(location.href).searchParams.get("v");
if (_initialId) {
    lastVideoId = _initialId;
    init(_initialId);
}

function createOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "yt-translation-overlay";
    overlay.style.cssText = `
    position: absolute;
    bottom: 10%;
    width: 100%;
    text-align: center;
    font-size: 20px;
    font-weight: bold;
    color: #fff;
    text-shadow: 2px 2px 6px rgba(0,0,0,0.8);
    z-index: 9999;
    pointer-events: none;
  `;
    return overlay;
}

function injectOverlay() {
    const player = document.querySelector(".html5-video-player");
    if (!player) return;

    // Always remove stale overlay and re-inject fresh
    const existing = document.getElementById("yt-translation-overlay");
    if (existing) existing.remove();

    const overlay = createOverlay();
    player.appendChild(overlay);
}

function syncSubtitles(transcripts) {
    const video = document.querySelector("video");
    const overlay = document.getElementById("yt-translation-overlay");
    if (!video || !overlay) return;

    if (currentListener) {
        video.removeEventListener("timeupdate", currentListener);
        currentListener = null;
    }

    currentListener = () => {
        const currentTime = video.currentTime * 1000;
        const t = transcripts.find((seg) => currentTime >= seg.offset && currentTime <= seg.offset + seg.duration);
        overlay.innerHTML = t
            ? `<div style="opacity:0.8,font-size:14px">${t.text}</div><div style="font-size:18px;opacity:1;">${t.translatedText}</div>`
            : "";
    };
    {
    }
    video.addEventListener("timeupdate", currentListener);
}

// ─── TRANSLATION BANNER ─────────────────────────────────────────

function removeBanner() {
    const existing = document.getElementById("yt-translate-banner");
    if (existing) existing.remove();
}

function showTranslationBanner(videoId) {
    removeBanner();

    const banner = document.createElement("div");
    banner.id = "yt-translate-banner";
    banner.innerHTML = `
    <div id="yt-tb-inner">
      <div id="yt-tb-top">
        <span id="yt-tb-globe">🌐</span>
        <span id="yt-tb-question">Translate this video?</span>
        <button id="yt-tb-close" title="Dismiss">✕</button>
      </div>
      <div id="yt-tb-pills">
        <button class="yt-tb-pill" data-lang="ne" data-label="Nepali">🇳🇵 Nepali</button>
        <button class="yt-tb-pill" data-lang="tam" data-label="Tamang">Tamang</button>
        <button class="yt-tb-pill" id="yt-tb-skip">Skip</button>
      </div>
      <div id="yt-tb-status">
        <span id="yt-tb-dot"></span>
        <span id="yt-tb-status-text">Choose a language to get subtitles</span>
      </div>
    </div>
  `;

    const style = document.createElement("style");
    style.id = "yt-tb-styles";
    style.textContent = `
    #yt-translate-banner {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999999;
      animation: yt-tb-slidein 0.25s ease;
    }
    @keyframes yt-tb-slidein {
      from { opacity: 0; transform: translateX(-50%) translateY(12px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    #yt-tb-inner {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 14px;
      padding: 12px 16px 10px;
      min-width: 300px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      font-family: 'Segoe UI', sans-serif;
    }
    #yt-tb-top {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }
    #yt-tb-globe { font-size: 16px; }
    #yt-tb-question {
      flex: 1;
      font-size: 13px;
      font-weight: 600;
      color: #e2e8f0;
      letter-spacing: 0.2px;
    }
    #yt-tb-close {
      background: none;
      border: none;
      color: #64748b;
      font-size: 13px;
      cursor: pointer;
      padding: 0 2px;
      line-height: 1;
    }
    #yt-tb-close:hover { color: #94a3b8; }
    #yt-tb-pills {
      display: flex;
      gap: 7px;
      margin-bottom: 10px;
    }
    .yt-tb-pill {
      flex: 1;
      padding: 7px 0;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      background: #1e293b;
      color: #94a3b8;
      border: 1px solid #334155;
      font-family: 'Segoe UI', sans-serif;
    }
    .yt-tb-pill:hover { border-color: #475569; color: #e2e8f0; }
    .yt-tb-pill.active-ne {
      background: #1e3a5f;
      color: #93c5fd;
      border-color: #3b82f6;
    }
    .yt-tb-pill.active-tam {
      background: #0f3328;
      color: #6ee7b7;
      border-color: #10b981;
    }
    #yt-tb-skip {
      flex: 0.6;
      background: none;
      color: #475569;
      border: 1px solid #1e293b;
      font-size: 11px;
    }
    #yt-tb-skip:hover { color: #64748b; border-color: #334155; }
    #yt-tb-status {
      display: flex;
      align-items: center;
      gap: 7px;
      border-top: 1px solid #1e293b;
      padding-top: 8px;
    }
    #yt-tb-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #334155;
      flex-shrink: 0;
      transition: background 0.2s;
    }
    #yt-tb-dot.active { background: #10b981; }
    #yt-tb-status-text {
      font-size: 11px;
      color: #475569;
    }
  `;

    if (!document.getElementById("yt-tb-styles")) {
        document.head.appendChild(style);
    }
    document.body.appendChild(banner);

    // Close button
    banner.querySelector("#yt-tb-close").addEventListener("click", () => {
        removeBanner();
    });

    // Skip button
    banner.querySelector("#yt-tb-skip").addEventListener("click", () => {
        removeBanner();
    });

    // Language pills
    banner.querySelectorAll(".yt-tb-pill[data-lang]").forEach((pill) => {
        pill.addEventListener("click", async () => {
            const lang = pill.dataset.lang;
            const label = pill.dataset.label;

            banner.querySelectorAll(".yt-tb-pill[data-lang]").forEach((p) => {
                p.classList.remove("active-ne", "active-tam");
            });
            pill.classList.add(lang === "ne" ? "active-ne" : "active-tam");

            const dot = banner.querySelector("#yt-tb-dot");
            const statusText = banner.querySelector("#yt-tb-status-text");
            dot.classList.remove("active");
            statusText.textContent = `Loading ${label} subtitles…`;

            try {
                await startTranslation(videoId, lang);
                dot.classList.add("active");
                statusText.textContent = `${label} subtitles active`;
                setTimeout(() => removeBanner(), 2000);
            } catch (err) {
                statusText.textContent = "Failed to load subtitles.";
                console.error("Translation error:", err);
            }
        });
    });
}

async function startTranslation(videoId, targetLang) {
    injectOverlay();
    console.log("here we are servering")
    const res = await fetch(`${BASE_URL}/api/translate/yt?videoId=${videoId}&targetedLang=${targetLang}`);
    const pre_data = await res.json()
    console.log(pre_data)
    if (!res.ok) throw new Error("API failed");

    const data = await res.json();
    if (!data.success) throw new Error("Translation unsuccessful");

    console.log(data.transcript);
    syncSubtitles(data.transcript);
}

async function init(videoId) {
    if (!videoId) return;
    removeBanner();
    showTranslationBanner(videoId);
}
