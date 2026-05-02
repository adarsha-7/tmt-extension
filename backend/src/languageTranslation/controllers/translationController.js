const axios = require("axios");

const translate = async (req, res) => {
    const { text, src_lang, tgt_lang } = req.body;
    console.log(`📨 Translate request: "${text}" | ${src_lang} → ${tgt_lang}`);

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
        console.error("Translation error:", err.message);
        return res.status(500).json({
            success: false,
            error: err.message || "Server error",
        });
    }
};

module.exports = { translate };
