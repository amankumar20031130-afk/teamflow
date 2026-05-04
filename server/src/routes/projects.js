const express = require('express');
const { body } = require('express-validator');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  updateMemberRole,
  getProjectStats,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getProjects);
router.post(
  '/',
  [body('name').trim().isLength({ min: 3, max: 100 }).withMessage('Project name must be 3-100 characters')],
  createProject
);

router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.get('/:id/stats', getProjectStats);

router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);
router.put('/:id/members/:userId/role', updateMemberRole);

module.exports = router;
