require("dotenv").config();
const { default: axios } = require("axios");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function translateSentences(transcriptAsSentence, targetedLang = "ne") {
  const results = [];

  for (const group of transcriptAsSentence) {
    if (group.passthrough) {
      results.push({ translatedText: group.text, ...group });
      continue;
    }

    const response = await translationAPI(group.text, "en", targetedLang);
    results.push({
      translatedText: response,
      ...group,
    });
    console.log("translating");
  }
  console.log("translated");

  return results;
}

async function translationAPI(
  text,
  src_lang = "en",
  tgt_lang,
  max_retries = 3,
) {
  for (let attempt = 0; attempt < max_retries; attempt++) {
    try {
      const response = await axios.post(
        process.env.TMT_API_URL,
        { text, src_lang, tgt_lang },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.TMT_API_TOKEN}`,
          },
        },
      );

      const data = response.data;

      if (data.message_type === "SUCCESS") {
        return data.output;
      }

      return null;
    } catch (err) {
      const is429 = err.response?.status === 429;
      const isLast = attempt === max_retries - 1;

      if (is429 && !isLast) {
        const waitMs = Math.pow(2, attempt) * 500 + Math.random() * 500;
        console.warn(`Rate limited. Retrying in ${Math.round(waitMs)}ms...`);
        await sleep(waitMs);
      } else {
        console.error("Translation error:", err.message);
        return null;
      }
    }
  }
}

module.exports = translateSentences;
