const { extractCaption } = require("../utils/transcritpsExtracter");

const CHUNK_SIZE = 100;

function translateTranscript(req,res){

	const { videoId , targetedLang } = req.query;
	const transcripts = extractCaption(videoId);
	const transcriptChunks  = createTranscriptChunks(transcripts);
	console.log(transcriptChunks.length);
}

function createTranscriptChunks(transcripts){
	const transcriptChunks = [];
	for(let i = 0; i < transcripts.length; i+= CHUNK_SIZE){
		transcriptChunks.push(transcripts.slice( i, i + CHUNK_SIZE ));
	}
	return transcriptChunks;
}

module.exports = { translateTranscript };
