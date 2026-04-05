require("dotenv").config();
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");

try {
    const model1 = new ChatGoogleGenerativeAI({ model: "gemini-2.5-flash" });
    console.log("Model 1 initialized successfully:", model1.model);
} catch (e) {
    console.error("Error 1:", e.message);
}

try {
    const model2 = new ChatGoogleGenerativeAI({ modelName: "gemini-2.5-flash" });
    console.log("Model 2 initialized successfully:", model2.model);
} catch (e) {
    console.error("Error 2:", e.message);
}
