require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const translationRouter = require("./src/languageTranslation/routes/translationRoute");
const transcriptRouter = require("./src/yt_caption_translation/routes/tanscriptRoute");
const ocrHandler = require("./src/imageTranslation/routers/imageTranslationRoute.js");

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.get("/", (req, res) => {
    res.json({ status: "TMT Proxy Server is running!" });
});

app.use("/translate", translationRouter);
app.use("/api/translate/yt", transcriptRouter);
app.use("/ocr", ocrHandler);

app.listen(PORT, () => {
    console.log(`TMT Proxy Server running on http://localhost:${PORT}`);
});
