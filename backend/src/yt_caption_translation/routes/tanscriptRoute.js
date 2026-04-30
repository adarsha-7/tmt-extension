const { Router } = require("express"); 
const { translateTranscript } = require("../controllers/processTranscripts");

const transcriptRouter = Router();
transcriptRouter.get('/',translateTranscript );

module.exports = transcriptRouter;
