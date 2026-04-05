const { processVideo } = require("../services/extractor");
const { indexDocument } = require("../services/rag");
const fs = require("fs");
const path = require("path");

exports.ingestVideo = async (req, res, next) => {
    try {
        const { filename } = req.body;
        if (!filename) {
            return res.status(400).json({ error: "No filename provided. Please provide the name of the video inside the 'videos' folder." });
        }

        const videoPath = path.join(__dirname, "..", "videos", filename);
        if (!fs.existsSync(videoPath)) {
            return res.status(404).json({ error: `Video file not found in videos folder: ${filename}` });
        }

        console.log(`Processing local video: ${videoPath}`);

        // 1. Extract audio & transcribe
        const transcriptText = await processVideo(videoPath);
        
        // 2. Index to RAG memory vector store
        await indexDocument(transcriptText, filename);

        res.json({ message: "Video successfully processed and indexed.", transcript: transcriptText });
    } catch (error) {
        next(error);
    }
};
