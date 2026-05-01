const {createWorker} = require("tesseract.js") 
const sharp = require("sharp")

async function preprocessImage(imageBuffer) {
  return await sharp(imageBuffer)
    .grayscale() // obv          
    .normalize()        
    .sharpen()//edge cripsy banaune           
    .linear(1.5, -30) // increase contrast     
    .toBuffer();
}
async function runOCR(link, sourceLang) {
  if (!link) throw new Error("No image source provided");
  
  let setOCRScan = (sourceLang === 'tmg' || sourceLang === 'ne') ? "hin" : "eng";
  let imageBuffer;
  if (link.startsWith("data:image")) {
    const base64Data = link.split(",")[1];
    imageBuffer = Buffer.from(base64Data, "base64");
  } else {
    const res = await fetch(link);
    imageBuffer = Buffer.from(await res.arrayBuffer());
  }

  // Preprocess before OCR
  const processedBuffer = await preprocessImage(imageBuffer); 
  const worker = await createWorker(setOCRScan, 1, {});
  await worker.setParameters({
    tessedit_pageseg_mode: "3",
  });


  const result = await worker.recognize(processedBuffer, {
    rotateAuto: true,
  }, {
    text: true,
    blocks: true,
  });

  await worker.terminate();
  return result;
}

function extractLines(blocks) {
  const rawLines = []
  for (const block of blocks) {
    for (const para of block.paragraphs) {
      for (const line of para.lines) {
        const text = line.text.trim()
        if (text) rawLines.push({ text, bbox: line.bbox, confidence: line.confidence })
      }
    }
  }

  rawLines.sort((a, b) => a.bbox.y0 - b.bbox.y0)

  const merged = []
  let current = null

  for (const line of rawLines) {
    if (!current) { current = { ...line }; continue }
    const lineHeight = current.bbox.y1 - current.bbox.y0
    const gap = line.bbox.y0 - current.bbox.y1
    const xOverlap = Math.min(line.bbox.x1, current.bbox.x1) - Math.max(line.bbox.x0, current.bbox.x0)
    const shouldMerge = gap < lineHeight * 0.4 && xOverlap > 0
    if (shouldMerge) {
      current.text += " " + line.text
      current.bbox.x0 = Math.min(current.bbox.x0, line.bbox.x0)
      current.bbox.x1 = Math.max(current.bbox.x1, line.bbox.x1)
      current.bbox.y1 = line.bbox.y1
    } else {
      merged.push(current)
      current = { ...line }
    }
  }
  if (current) merged.push(current)
  return merged
}

const imageTranslationHandler = async (req, res) => {
  try {
    const { src, sourceLang } = req.body
    console.log("Received src type:", typeof src, "| starts with:", src?.substring(0, 30))
    console.log("sourceLang:", sourceLang)

    const result = await runOCR(src, sourceLang)
    const lines = extractLines(result.data.blocks)
    return res.status(200).json({
      full_text: result.data.text,
      lines
    })
  } catch (err) {
    console.error("imageTranslationHandler error:", err.message)
    console.error(err.stack)
    return res.status(500).json({
      msg: err.message,
      success: false
    })
  }
}

const languageTranslate = async (req, res) => {
  try {
    const { lines, sourceLang, targetLang } = req.body
    const translated = await Promise.all(
      lines.map(async (line) => ({
        original: line.text,
        translated: await TranslationAPI(line.text, sourceLang, targetLang),
        bbox: line.bbox
      }))
    )
    console.log(JSON.stringify(translated, null, 2))
    return res.status(200).json({ lines: translated })
  } catch (err) {
    console.error("languageTranslate error:", err.message)
    console.error(err.stack)
    return res.status(500).json({
      success: false,
      msg: err.message
    })
  }
}

async function TranslationAPI(text, sourceLang, targetLang) {
  let authorization = `Bearer ${process.env.TMT_API_TOKEN}`
  const response = await fetch("https://tmt.ilprl.ku.edu.np/lang-translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authorization
    },
    body: JSON.stringify({
      text: text,
      src_lang: sourceLang,
      tgt_lang: targetLang
    })
  });
  const data = await response.json();
  return data.output
}

module.exports = { imageTranslationHandler, languageTranslate }
