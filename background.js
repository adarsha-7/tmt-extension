const API_URL = "http://localhost:3000/translate";


browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "translate") {
        return translateText(request.text, request.src_lang, request.tgt_lang)
            .then((result) => ({ success: true, translation: result }))
            .catch((err) => ({ success: false, error: err.message }));
    }
});

async function translateText(text, src_lang, tgt_lang, retries = 5) {
    try {
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
    } catch (err) {
        if (retries > 0) {
            console.log("Unable to reach server. Trying again...");
            await new Promise((resolve) => setTimeout(resolve, 800));
            return translateText(text, src_lang, tgt_lang, retries - 1);
        }
        throw err;
    }
}
