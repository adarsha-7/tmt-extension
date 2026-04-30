function createTranscriptChunks(transcripts) {
  let sentenceString = "";
  const sentenceGroup = [];
  let currentChunk = [];

  for (const chunk of transcripts) {
    if (
      chunk.text.trim().match(/^\(.*\)$/) ||
      chunk.text.trim().match(/^\[.*\]$/)
    ) {
      if (sentenceString.trim()) {
        sentenceGroup.push({
          text: sentenceString.trim(),
          chunks: [...currentChunk],
        });
        sentenceString = "";
        currentChunk = [];
      }
      sentenceGroup.push({
        text: chunk.text,
        chunks: [chunk],
        passthrough: true,
      });
      continue;
    }

    const cleanText = chunk.text.replace(/^-\s*/, "");
    sentenceString += cleanText + " ";
    sentenceString = sentenceString.replace(/\n/g, " ").replace(/\.\.\./g, "…");
    currentChunk.push(chunk);

    const sentences = sentenceString.match(/[A-Z][^.!?…]*[.!?…]/gm);
    if (sentences) {
      for (const sentence of sentences) {
        sentenceGroup.push({
          text: sentence.trim(),
          chunks: [...currentChunk],
        });
      }
      const last = sentences.at(-1);
      sentenceString = sentenceString.slice(
        sentenceString.lastIndexOf(last) + last.length,
      );
      currentChunk = [chunk];
    }
  }

  if (sentenceString.trim()) {
    sentenceGroup.push({ text: sentenceString.trim(), chunks: currentChunk });
  }

  return sentenceGroup;
}

module.exports = createTranscriptChunks;
