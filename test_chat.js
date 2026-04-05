const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");

try {
    const model = new ChatGoogleGenerativeAI({ model: "gemini-2.5-flash" });
    console.log("Chat model initialized successfully:", model.model);
} catch (e) {
    console.error("Error with 'model':", e.message);
}

try {
    const model2 = new ChatGoogleGenerativeAI({ modelName: "gemini-2.5-flash" });
    console.log("Chat model initialized successfully:", model2.model);
} catch (e) {
    console.error("Error with 'modelName':", e.message);
}
