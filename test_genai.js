require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function main() {
    console.log("Testing gemini-2.5-flash...");
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    try {
        const result = await model.generateContent("hello");
        console.log("Response:", result.response.text());
    } catch (e) {
        console.error("Error:", e.message);
    }
}
main();
