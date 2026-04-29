const API_URL = "https://tmt.ilprl.ku.edu.np/lang-translate";
const API_TOKEN = "team_522691d14915f970";

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
            Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({ text, src_lang, tgt_lang }),
    });

    const data = await response.json();

    if (data.message_type === "SUCCESS") {
        return data.output;
    } else {
        throw new Error(data.message || "Translation failed");
    }
}
