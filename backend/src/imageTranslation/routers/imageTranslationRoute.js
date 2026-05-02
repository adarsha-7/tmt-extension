const express = require("express")
const router = express.Router()
const {imageTranslationHandler , languageTranslate} = require("../controllers/imageTranslationController.js")

router.post("/ocr-reading" , imageTranslationHandler).post("/translate" , languageTranslate)

module.exports = router
