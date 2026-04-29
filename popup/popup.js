document.addEventListener("DOMContentLoaded", () => {
    const srcLang = document.getElementById("src-lang");
    const tgtLang = document.getElementById("tgt-lang");
    const saveBtn = document.getElementById("save-btn");
    const status = document.getElementById("status");
    const toggleEnabled = document.getElementById("toggle-enabled");
    const toggleStatus = document.getElementById("toggle-status");

    // Load saved settings
    browser.storage.local.get(["src_lang", "tgt_lang", "enabled"], (result) => {
        if (result.src_lang) srcLang.value = result.src_lang;
        if (result.tgt_lang) tgtLang.value = result.tgt_lang;

        // Default to enabled if never set
        const isEnabled = result.enabled !== false;
        toggleEnabled.checked = isEnabled;
        updateToggleStatus(isEnabled);
    });

    // Toggle enable/disable
    toggleEnabled.addEventListener("change", () => {
        const isEnabled = toggleEnabled.checked;
        browser.storage.local.set({ enabled: isEnabled });
        updateToggleStatus(isEnabled);
    });

    function updateToggleStatus(isEnabled) {
        if (isEnabled) {
            toggleStatus.textContent = "Enabled";
            toggleStatus.style.color = "#4caf50";
        } else {
            toggleStatus.textContent = "Disabled";
            toggleStatus.style.color = "#e74c3c";
        }
    }

    // Save settings
    saveBtn.addEventListener("click", () => {
        const src = srcLang.value;
        const tgt = tgtLang.value;

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

        browser.storage.local.set({ src_lang: src, tgt_lang: tgt }, () => {
            status.textContent = "Settings saved!";
            status.classList.remove("hidden");
            setTimeout(() => {
                status.classList.add("hidden");
            }, 2000);
        });
    });
});
