const { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const { ChatPromptTemplate } = require("@langchain/core/prompts");

// In-memory vector store for MVP
let vectorStore = null;

async function indexDocument(text, sourceName) {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    
    // Split the text into chunks
    const docs = await splitter.createDocuments([text], [{ source: sourceName }]);
    
    // Initialize or add to the vector store
    if (!vectorStore) {
        vectorStore = await MemoryVectorStore.fromDocuments(docs, new GoogleGenerativeAIEmbeddings({ modelName: "text-embedding-004" }));
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
    const retriever = vectorStore.asRetriever();
    
    const prompt = ChatPromptTemplate.fromTemplate(`
    Answer the following question based only on the provided context:
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
