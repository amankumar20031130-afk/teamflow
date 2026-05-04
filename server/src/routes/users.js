const express = require('express');
const { searchUsers, getUserById } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/search', searchUsers);
router.get('/:id', getUserById);

module.exports = router;
