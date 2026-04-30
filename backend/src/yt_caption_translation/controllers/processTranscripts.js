const createTranscriptChunks = require("../utils/transcriptChunks");
const { extractCaption } = require("../utils/transcritpsExtracter");

const CHUNK_SIZE = 10;

async function translateTranscript(req,res){

	const { videoId , targetedLang } = req.query;
	const transcripts = await extractCaption(videoId);

    if (!transcripts || transcripts.length === 0) {
        return res.status(400).json({ error: "No transcript found for this video." });
    }
	console.log(typeof transcripts)
    const transcriptChunks = createTranscriptChunks(transcripts);

    console.log(transcriptChunks);
}


module.exports = { translateTranscript };
