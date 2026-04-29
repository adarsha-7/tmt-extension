// When the popup opens, load saved settings
document.addEventListener("DOMContentLoaded", () => {
    const srcLang = document.getElementById("src-lang");
    const tgtLang = document.getElementById("tgt-lang");
    const saveBtn = document.getElementById("save-btn");
    const status = document.getElementById("status");

    // Load previously saved settings from Firefox storage
    browser.storage.local.get(["src_lang", "tgt_lang"], (result) => {
        if (result.src_lang) srcLang.value = result.src_lang;
        if (result.tgt_lang) tgtLang.value = result.tgt_lang;
    });

    // Save settings when button is clicked
    saveBtn.addEventListener("click", () => {
        const src = srcLang.value;
        const tgt = tgtLang.value;

        // Prevent same language on both sides
        if (src === tgt) {
            status.textContent = "Source and target can't be the same!";
            status.style.color = "#e74c3c";
            status.style.backgroundColor = "#3a1e1e";
            status.classList.remove("hidden");

            setTimeout(() => {
                status.classList.add("hidden");
                status.style.color = "#4caf50";
                status.style.backgroundColor = "#1e3a1e";
            }, 2000);
            return;
        }

        // Save to Firefox storage
        browser.storage.local.set({ src_lang: src, tgt_lang: tgt }, () => {
            status.textContent = "Settings saved!";
            status.classList.remove("hidden");

            setTimeout(() => {
                status.classList.add("hidden");
            }, 2000);
        });
    });
});
