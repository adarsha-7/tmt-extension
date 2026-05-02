const distributeTranscripts = require("../utils/distributeTranscripts");
const createTranscriptChunks = require("../utils/transcriptChunks");
const { extractCaption } = require("../utils/transcritpsExtracter");
const translateSentences = require("../utils/translateSentences");

async function translateTranscript(req, res) {
  const CHUNK_SIZE = 10;
  const VIDEO_LENGTH_THRESHOLD = 10 * 60 * 1000;
  const { videoId, targetedLang } = req.query;
  const transcripts = await extractCaption(videoId);

  console.log(transcripts.slice(0, 10));
  if (!transcripts || transcripts.length === 0) {
    return res
      .status(400)
      .json({ error: "No transcript found for this video." });
  }

  const videoLength =
    transcripts.at(-1)?.offset + transcripts.at(-1)?.duration ?? 0;

  // if (videoLength <= VIDEO_LENGTH_THRESHOLD) {
  const transcriptsAsSentences = createTranscriptChunks(transcripts);
  const translatedTranscripts = await translateSentences(
    transcriptsAsSentences,
    targetedLang,
  );
  const distributedChunks = distributeTranscripts(translatedTranscripts);
  return res.status(200).json({
    success: true,
    transcript: distributedChunks,
  });
  // }
}

module.exports = { translateTranscript };
