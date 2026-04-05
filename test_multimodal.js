require("dotenv").config();
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

async function main() {
    console.log("Testing gemini-2.5-flash with multimodal...");
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY);
    
    // Create a dummy txt file
    fs.writeFileSync("dummy.txt", "hello world audio transcript test blah blah");
    const uploadResult = await fileManager.uploadFile("dummy.txt", {
        mimeType: "text/plain",
        displayName: "dummy.txt",
    });
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    try {
        const result = await model.generateContent([
            { fileData: { mimeType: uploadResult.file.mimeType, fileUri: uploadResult.file.uri } },
            { text: "What is this?" }
        ]);
        console.log("Response:", result.response.text());
    } catch (e) {
        console.error("Error generating content:", e.message);
    }
}
main();
