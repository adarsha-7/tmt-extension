const API_URL = "http://localhost:3000/translate";

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "translate") {
        translateText(request.text, request.src_lang, request.tgt_lang)
            .then((result) => sendResponse({ success: true, translation: result }))
            .catch((err) => sendResponse({ success: false, error: err.message }));

        return true;
    }
});

async function translateText(text, src_lang, tgt_lang) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, src_lang, tgt_lang }),
    });

    const data = await response.json();

    if (data.success) {
        return data.translation;
    } else {
        throw new Error(data.error || "Translation failed");
    }
}
