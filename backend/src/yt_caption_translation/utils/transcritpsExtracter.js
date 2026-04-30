const { YoutubeTranscript } = require("youtube-transcript");

async function extractCaption(videoID, targetedLang) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoID, {
      lang: targetedLang,
    });
    return transcript;
  } catch (err) {
    console.error("Failed:", err.message);
  }
}

extractCaption("cOAaonpTLlc");

module.exports = { extractCaption };
