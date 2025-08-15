const express = require('express');
const router = express.Router();
const Controllers = require('../Controllers/controllers');

// Currently we expose GET /api/karmikas via authRoutes as well, but keep this route file ready
router.get('/karmikas', Controllers.getKarmikas);

module.exports = router;