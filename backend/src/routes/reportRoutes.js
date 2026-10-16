const express = require('express');
const { getInteractionReport, getSalesReport } = require('../controllers/reportController');
const { requireAuth, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/interacciones', requireAuth, allowRoles('Admin'), getInteractionReport);
router.get('/ventas', requireAuth, allowRoles('Admin'), getSalesReport);

module.exports = router;
