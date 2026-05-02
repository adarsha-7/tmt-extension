const { YoutubeTranscript } = require("youtube-transcript");

async function extractCaption(videoID) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoID, {
      lang: "en",
    });
    return transcript;
  } catch (err) {
    console.error("Failed:", err.message);
  }
}

extractCaption("cOAaonpTLlc");

module.exports = { extractCaption };
