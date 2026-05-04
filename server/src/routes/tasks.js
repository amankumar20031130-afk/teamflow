const express = require('express');
const { body } = require('express-validator');
const {
  getTasksByProject,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  getMyTasks,
  getDashboardStats,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/my', getMyTasks);
router.get('/dashboard', getDashboardStats);

router.get('/project/:projectId', getTasksByProject);
router.post(
  '/project/:projectId',
  [body('title').trim().isLength({ min: 3, max: 150 }).withMessage('Title must be 3-150 characters')],
  createTask
);

router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/comments', addComment);

module.exports = router;
