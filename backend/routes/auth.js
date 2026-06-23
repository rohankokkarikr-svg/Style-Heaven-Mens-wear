const express = require('express');
const router = express.Router();
const { register, login, getMe, getRewards } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/signup', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/rewards', protect, getRewards);


module.exports = router;
