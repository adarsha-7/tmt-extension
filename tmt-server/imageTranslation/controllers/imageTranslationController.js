async function TranslationAPI(text){
    let authorization = process.env.TMT_API_TOKEN    
    const response = await fetch("https://tmt.ilprl.ku.edu.np/lang-translate", {
	method: "POST",
	headers: {
	    "Content-Type": "application/json",
	    "Authorization": `Bearer ${authorization}` 
    },
	body: JSON.stringify({
	    text: text,
	    src_lang: "en",
	    tgt_lang: "ne"
	})
    });
    const data = await response.json();
    return data.output
}

async function runOCR(link) {
  try {
      const worker = await createWorker("eng", 1, {})

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
const imageTranslationHandler = async (req , res)=>{
    try{
	const {link} = req.body
	const result = await runOCR(link)
	   console.log(JSON.stringify(result , null , 2))
	const lines = extractLines(result.data.blocks)
	  return res.status(200).json({
	    full_text: result.data.text,
	    lines  
	  })

    }
    catch(err){
	return res.status(500).json({
	    msg : err.msg,
	    success : false,
	})
    }
}

const languageTranslate = async ( req, res)=>{
    try{

	  const { lines } = req.body

	  const translated = await Promise.all(
	    lines.map(async (line) => ({
	      original: line.text,
	      translated: await TranslationAPI(line.text),
	      bbox: line.bbox
	    }))
	    )
	  return res.status(200).json({ lines: translated })
    }
    catch(err){
	
	return res.status(500).json({
	    msg : err.msg,
	    success : false
	})

    }
}

module.exports = {imageTranslationHandler , languageTranslate}
