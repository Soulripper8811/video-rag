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
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    const docs = await splitter.createDocuments([text], [{ source: sourceName }]);

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