function distributeTranscripts(sentenceGroup) {
  return sentenceGroup
    .map((group) => {
      const { translatedText, chunks, text } = group;

      if (!translatedText) {
        return chunks.map((chunk) => ({ ...chunk }));
      }

      if (chunks.length === 1) {
        return [{ ...chunks[0], text: chunks[0].text, translatedText }];
      }

      const words = translatedText.split(" ");
      const totalDuration = chunks.reduce((sum, c) => sum + c.duration, 0);
      const result = [];
      let wordIndex = 0;

      chunks.forEach((chunk, i) => {
        const isLast = i === chunks.length - 1;
        const ratio = chunk.duration / totalDuration;
        const wordCount = isLast
          ? words.length - wordIndex
          : Math.max(1, Math.round(words.length * ratio));

        result.push({
          ...chunk,
          text: chunk.text,
          translatedText: words
            .slice(wordIndex, wordIndex + wordCount)
            .join(" "),
        });

        wordIndex = Math.min(wordIndex + wordCount, words.length);
      });

      return result;
    })
    .flat();
}
module.exports = distributeTranscripts;
