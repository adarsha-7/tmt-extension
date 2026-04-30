const {createWorker} = require("tesseract.js") 
async function runOCR(link, sourceLang) {
  try {
      let setOCRScan = ''
      if (sourceLang =='tmg' || sourceLang =='ne'){
	  setOCRScan = "hin"
      }
      else{
	  setOCRScan = "eng"
      }
      console.log("before" , )
      const worker = await createWorker(setOCRScan, 1, {})

  await worker.setParameters({
    tessedit_pageseg_mode: "3",   
  })
        const result = await worker.recognize(link, {
    rotateAuto: true,
  }, {
    text: true,
    blocks: true,
   // tsv: true, //This is primarily used for machine learning purposes
   // hocr: true, // This is a htmlized version of the read text with kind of the proportions
   // imageColor: true,
  })
  await worker.terminate()  // always clean up
  return result
  } catch (err) {
    console.error("OCR Error:", err);
  }
}
function extractLines(blocks) {
  const lines = []

  for (const block of blocks) {
    for (const para of block.paragraphs) {
      for (const line of para.lines) {
        const text = line.text.trim()
        if (!text) continue

        lines.push({
          text,
          bbox: line.bbox,
          confidence: line.confidence
        })
      }
    }
  }

  return lines
}

const imageTranslationHandler = async(req, res)=>{
    try{

      const { src ,sourceLang } = req.body
      const result = await runOCR(src ,sourceLang)
      const lines = extractLines(result.data.blocks)
      return res.status(200).json({
	full_text: result.data.text,
	lines  
      })
    }
    catch(err){
	console.log(err.stack)
	return res.status(500).json({
	    msg : err.msg,
	    success : false
	})
    }
}


const languageTranslate = async (req, res)=>{
    try{
      const { lines , sourceLang , targetLang } = req.body
      const translated = await Promise.all(
	lines.map(async (line) => ({
	  original: line.text,
	  translated: await TranslationAPI(line.text , sourceLang , targetLang),
	  bbox: line.bbox
	}))
      )
      return res.status(200).json({ lines: translated })

    }
    catch(err){
	console.log(err.stack)
	return res.status(500).json({
	    success : false,
	    msg : err.msg
	})
    }
}


async function TranslationAPI(text , sourceLang , targetLang){
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


module.exports = {imageTranslationHandler , languageTranslate}
