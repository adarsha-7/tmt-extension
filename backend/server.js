require("dotenv").config();
const express = require("express");
const cors = require("cors");
const ocrHandler = require("./src/imageTranslation/routers/imageTranslationRoute.js")
const axios = require("axios");


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
    res.json({ status: "TMT Proxy Server is running!" });
});

app.use("/ocr", ocrHandler)

// Translation route
app.post("/translate", async (req, res) => {
    const { text, src_lang, tgt_lang } = req.body;

    // Validate inputs
    if (!text || !src_lang || !tgt_lang) {
        return res.status(400).json({
            success: false,
            error: "text, src_lang and tgt_lang are all required",
        });
    }

    if (src_lang === tgt_lang) {
        return res.status(400).json({
            success: false,
            error: "src_lang and tgt_lang must be different",
        });
    }

    try {
        const response = await axios.post(
            process.env.TMT_API_URL,
            { text, src_lang, tgt_lang },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.TMT_API_TOKEN}`,
                },
            },
        );

        const data = response.data;

        if (data.message_type === "SUCCESS") {
            return res.json({
                success: true,
                translation: data.output,
            });
        } else {
            return res.status(500).json({
                success: false,
                error: data.message || "Translation failed",
            });
        }
    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message || "Server error",
        });
    }
});

app.listen(PORT, () => {
    console.log(`TMT Proxy Server running on http://localhost:${PORT}`);
});
