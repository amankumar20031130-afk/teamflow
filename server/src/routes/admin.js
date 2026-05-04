const express = require('express');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminAuth');
const {
  getSystemStats,
  getAllUsers,
  getUserDetails,
  updateUserRole,
  toggleUserActive,
  deleteUser,
  getAllProjects,
  adminDeleteProject,
  getAllTasks,
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, isAdmin);

// Stats
router.get('/stats', getSystemStats);

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/toggle-active', toggleUserActive);
router.delete('/users/:id', deleteUser);

// Project management
router.get('/projects', getAllProjects);
router.delete('/projects/:id', adminDeleteProject);

// Task management
router.get('/tasks', getAllTasks);

module.exports = router;
