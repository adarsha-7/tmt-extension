const LANG_PAIRS = [
  { id: "translate_en_ne",  label: "English → Nepali",  src: "en",  tgt: "ne"  },
  { id: "translate_ne_en",  label: "Nepali → English",  src: "ne",  tgt: "en"  },
  { id: "translate_en_tmg", label: "English → Tamang",  src: "en",  tgt: "tmg" },
  { id: "translate_tmg_en", label: "Tamang → English",  src: "tmg", tgt: "en"  },
  { id: "translate_ne_tmg", label: "Nepali → Tamang",   src: "ne",  tgt: "tmg" },
  { id: "translate_tmg_ne", label: "Tamang → Nepali",   src: "tmg", tgt: "ne"  },
];

function buildMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "translate_parent",
      title: "Translate Image Text",
      contexts: ["image"],
    });
    for (const pair of LANG_PAIRS) {
      chrome.contextMenus.create({
        id: pair.id,
        parentId: "translate_parent",
        title: pair.label,
        contexts: ["image"],
      });
    }
  });
}

chrome.runtime.onInstalled.addListener(buildMenus);
chrome.runtime.onStartup.addListener(buildMenus);

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const pair = LANG_PAIRS.find(p => p.id === info.menuItemId);
  if (!pair || !tab?.id) return;
  chrome.tabs.sendMessage(tab.id, {
    type: "TRANSLATE_IMAGE",
    src: info.srcUrl,
    sourceLang: pair.src,
    targetLang: pair.tgt,
  });
});
