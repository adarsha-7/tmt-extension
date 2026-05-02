let tooltip = null;

// ─── HIGHLIGHT TRANSLATION ───────────────────────────────────────

document.addEventListener("mouseup", async (e) => {
  const selectedText = window.getSelection().toString().trim();

  removeTooltip();

  if (!selectedText) return;

  const settings = await browser.storage.local.get([
    "src_lang",
    "tgt_lang",
    "enabled",
  ]);

  if (settings.enabled === false) return;

  const src_lang = settings.src_lang || "en";
  const tgt_lang = settings.tgt_lang || "ne";

  if (src_lang === tgt_lang) return;

  showTooltip(e.clientX, e.clientY, "Translating...");

  browser.runtime
    .sendMessage({
      action: "translate",
      text: selectedText,
      src_lang: src_lang,
      tgt_lang: tgt_lang,
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
  const existingBtn = document.querySelector(
    `[data-tmt-for="${el.dataset.tmtId}"]`,
  );
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

    btn.textContent = "...";
    btn.style.backgroundColor = "#888";

    const settings = await browser.storage.local.get(["src_lang", "tgt_lang"]);
    const src_lang = settings.src_lang || "en";
    const tgt_lang = settings.tgt_lang || "ne";

    browser.runtime
      .sendMessage({
        action: "translate",
        text,
        src_lang,
        tgt_lang,
      })
      .then((response) => {
        if (response.success) {
          originalText = text;
          setInputText(el, response.translation);
          btn.textContent = "↩";
          btn.style.backgroundColor = "#4caf50";
          btn.dataset.tmtMode = "reverse";
        } else {
          btn.textContent = "✗";
          btn.style.backgroundColor = "#e74c3c";
          setTimeout(() => {
            btn.textContent = "TMT";
            btn.style.backgroundColor = "#7b8cde";
          }, 2000);
        }
      })
      .catch(() => {
        btn.textContent = "✗";
        btn.style.backgroundColor = "#e74c3c";
        setTimeout(() => {
          btn.textContent = "TMT";
          btn.style.backgroundColor = "#7b8cde";
        }, 2000);
      });
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
        node
          .querySelectorAll(
            "textarea, input[type='text'], input[type='search'], div[contenteditable='true'], div[contenteditable='plaintext-only']",
          )
          .forEach(injectTranslateButton);
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
    const t = transcripts.find(
      (seg) =>
        currentTime >= seg.offset && currentTime <= seg.offset + seg.duration,
    );
    overlay.innerHTML = t
      ? `<div>${t.text}</div><div style="font-size:16px;opacity:0.8;">${t.translatedText}</div>`
      : "";
  };
  {
  }
  video.addEventListener("timeupdate", currentListener);
}

async function init(videoId) {
  try {
    if (!videoId) return;

    injectOverlay(); // fresh overlay, clears stale content immediately

    const res = await fetch(
      `http://localhost:3000/api/translate/yt?videoId=${videoId}&targetedLang=en`,
    );
    if (!res.ok) throw new Error("API failed");

    const data = await res.json();
    if (!data.success) return;

    console.log(data.transcript);
    syncSubtitles(data.transcript);
  } catch (err) {
    console.error("Init error:", err);
  }
}
