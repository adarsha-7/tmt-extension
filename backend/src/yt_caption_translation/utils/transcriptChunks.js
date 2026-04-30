function createTranscriptChunks(transcripts){
	const transcriptChunks = [];
	for(let i = 0; i < transcripts.length; i+= CHUNK_SIZE){
		transcriptChunks.push(transcripts.slice( i, i + CHUNK_SIZE ));
	}
	return transcriptChunks;
}

module.exports = createTranscriptChunks
