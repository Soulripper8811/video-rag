const express = require("express");
const router = express.Router();
const ingestController = require("../controllers/ingestController");
const queryController = require("../controllers/queryController");

router.post("/ingest", ingestController.ingestVideo);
router.post("/ingest-audio", ingestController.ingestAudio);
router.post("/query", queryController.queryRag);

module.exports = router;
