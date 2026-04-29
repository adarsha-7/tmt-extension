let tooltip = null;

// Listen for text selection
document.addEventListener("mouseup", async (e) => {
    const selectedText = window.getSelection().toString().trim();

    // Remove existing tooltip
    removeTooltip();

    // If no text selected, stop
    if (!selectedText) return;

    // Get saved language settings
    const settings = await browser.storage.local.get(["src_lang", "tgt_lang"]);
    const src_lang = settings.src_lang || "en";
    const tgt_lang = settings.tgt_lang || "ne";

    // Don't translate if same language
    if (src_lang === tgt_lang) return;

    // Show loading tooltip
    showTooltip(e.clientX, e.clientY, "Translating...");

    // Send message to background.js
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

// Remove tooltip when clicking elsewhere
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
        padding: "10px 14px",
        borderRadius: "8px",
        fontSize: "14px",
        maxWidth: "300px",
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
