const { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const { ChatPromptTemplate } = require("@langchain/core/prompts");

let vectorStore = null;

// Shared embeddings instance — same model used for both indexing & querying
const embeddings = new GoogleGenerativeAIEmbeddings({ 
    modelName: "gemini-embedding-2-preview",
    
});

async function indexDocument(text, sourceName) {
    const docs = [];
    
    // Split the text into chunks whenever a timestamp matches exactly like [00:00 - 00:15]:
    const segments = text.split(/(?=\[\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\]:?)/g);
    
    for (let segment of segments) {
        segment = segment.trim();
        if (!segment) continue;
        
        let time = "Unknown";
        let content = segment;
        
        const timeMatch = segment.match(/^\[(.*?)\]:?\s*(.*)/s);
        if (timeMatch) {
            time = timeMatch[1];
            // Include the timestamp right in the text chunk so the RAG model natively sees it
            content = `[Time: ${time}] ${timeMatch[2]}`;
        }
        
        docs.push({
            pageContent: content,
            metadata: { source: sourceName, time: time }
        });
    }

    if (docs.length === 0) {
        console.log("No valid transcript chunks found to index.");
        return;
    }

    if (!vectorStore) {
        vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
    } else {
        await vectorStore.addDocuments(docs);
    }

    console.log(`Indexed ${docs.length} chunks from ${sourceName}`);
}

async function queryModel(question) {
    if (!vectorStore) {
        return "No documents have been indexed yet. Please upload a video first.";
    }

    const model = new ChatGoogleGenerativeAI({ model: "gemini-2.5-flash" });

    // Retriever uses the same shared embeddings instance to embed the query
    const retriever = vectorStore.asRetriever();

    const prompt = ChatPromptTemplate.fromTemplate(`
    Answer the following question based only on the provided context.
    IMPORTANT: You must include the timestamps from the context in your answer so the user knows when the video discussed it (e.g. "At [00:15 - 00:30] the video mentions...").
    
    <context>
    {context}
    </context>
    Question: {input}
    `);

    const documentChain = await createStuffDocumentsChain({
        llm: model,
        prompt,
    });

    const retrievalChain = await createRetrievalChain({
        combineDocsChain: documentChain,
        retriever,
    });

    const response = await retrievalChain.invoke({
        input: question,
    });

    return response.answer;
}

module.exports = { indexDocument, queryModel };