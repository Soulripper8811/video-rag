const { queryModel } = require("../services/rag");

exports.queryRag = async (req, res, next) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: "No query provided." });
        }

        const answer = await queryModel(query);
        res.json({ answer });
    } catch (error) {
        next(error);
    }
};
