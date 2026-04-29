import { YoutubeTranscript } from 'youtube-transcript';

async function extractCaption(videoID) {
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoID);
        console.log(transcript);
    } catch (err) {
        // If it fails, list available languages
        console.error("Failed:", err.message);
        
        // Try fetching transcript info to see available langs
        const info = await YoutubeTranscript.listTranscripts(videoID);
        console.log("Available transcripts:", info);
    }
}

extractCaption("cOAaonpTLlc");
