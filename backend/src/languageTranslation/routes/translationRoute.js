const express = require("express");
const router = express.Router();
const { translate } = require("../controllers/translationController");

router.post("/", translate);

module.exports = router;
