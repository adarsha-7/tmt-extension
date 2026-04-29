async function getYoutubeTranscript(videoId){

  	const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
  	const html = await pageRes.text();


	const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.*?\});/);

	if (playerResponseMatch) {
		const playerResponse = JSON.parse(playerResponseMatch[1]);
		const captionElement = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks;

		if (!captionElement || captionElement.length === 0) return;

		const captionBaseURL = captionElement[0]?.baseUrl;

		const res = await fetch(captionBaseURL);
		const captionXML = await res.text();

		console.log(JSON.stringify(captionBaseURL, null, 2));
		console.log(JSON.stringify(captionXML, null, 2));
	}

}

getYoutubeTranscript("JJ5U5hUezTY");
