const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const path = require("path");
const fs = require("fs");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const { GoogleGenerativeAI } = require("@google/generative-ai");

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function processVideo(videoPath) {
    const audioPath = path.join(path.dirname(videoPath), `${path.basename(videoPath, path.extname(videoPath))}.mp3`);

    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .noVideo()
            .audioCodec('libmp3lame')
            .save(audioPath)
            .on('end', async () => {
                console.log(`Audio extracted to ${audioPath}`);
                try {
                    // 1. Upload audio to Google AI File API
                    const uploadResult = await fileManager.uploadFile(audioPath, {
                        mimeType: "audio/mp3",
                        displayName: path.basename(audioPath),
                    });
                    
                    // 2. Transcribe via Gemini
                    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                    const result = await model.generateContent([
                        { fileData: { mimeType: uploadResult.file.mimeType, fileUri: uploadResult.file.uri } },
                        { text: "Provide a complete verbatim transcript of this audio file. Group paragraphs logically and ALWAYS prefix each paragraph with its start and end timestamp in the exact format \"[MM:SS - MM:SS]: \". Do not output anything else." }
                    ]);
                    
                    fs.unlinkSync(audioPath); // Cleanup local audio file
                    resolve(result.response.text());
                } catch (error) {
                    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
                    reject(error);
                }
            })
            .on('error', (err) => {
                reject(err);
            });
    });
}

module.exports = { processVideo };
