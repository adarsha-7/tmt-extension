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
    await sleep(500);
  }

  return results;
}

async function translationAPI(text, src_lang = "en", tgt_lang) {
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
    console.error("Translation error:", err.message);
    return null;
  }
}

module.exports = translateSentences;
