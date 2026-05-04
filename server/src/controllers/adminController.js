const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

/* ─────────────────────────────────────────
   SYSTEM STATS
───────────────────────────────────────── */
const getSystemStats = async (req, res) => {
  try {
    const now = new Date();

    const [
      totalUsers,
      totalAdmins,
      activeUsers,
      totalProjects,
      activeProjects,
      totalTasks,
      doneTasks,
      overdueTasks,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ isActive: true }),
      Project.countDocuments(),
      Project.countDocuments({ status: 'active' }),
      Task.countDocuments(),
      Task.countDocuments({ status: 'done' }),
      Task.countDocuments({ dueDate: { $lt: now }, status: { $ne: 'done' } }),
    ]);

    const tasksByStatus = await Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const tasksByPriority = await Task.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    // Recent signups in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSignups = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    res.json({
      success: true,
      stats: {
        users: { total: totalUsers, admins: totalAdmins, active: activeUsers, recentSignups },
        projects: { total: totalProjects, active: activeProjects },
        tasks: {
          total: totalTasks,
          done: doneTasks,
          overdue: overdueTasks,
          completionRate: totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0,
          byStatus: tasksByStatus.reduce((a, b) => ({ ...a, [b._id]: b.count }), {}),
          byPriority: tasksByPriority.reduce((a, b) => ({ ...a, [b._id]: b.count }), {}),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ─────────────────────────────────────────
   USER MANAGEMENT
───────────────────────────────────────── */
const getAllUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) filter.role = role;

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const [ownedProjects, memberProjects, createdTasks, assignedTasks] = await Promise.all([
      Project.find({ owner: user._id }).select('name status createdAt').limit(10),
      Project.find({ 'members.user': user._id }).select('name status createdAt').limit(10),
      Task.countDocuments({ createdBy: user._id }),
      Task.countDocuments({ assignee: user._id }),
    ]);

    res.json({
      success: true,
      user,
      activity: { ownedProjects, memberProjects, createdTasks, assignedTasks },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Use "user" or "admin".' });
    }

    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, message: `User role updated to ${role}`, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const toggleUserActive = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate yourself.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete yourself.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Remove from all project memberships
    await Project.updateMany(
      { 'members.user': user._id },
      { $pull: { members: { user: user._id } } }
    );
    // Unassign their tasks
    await Task.updateMany({ assignee: user._id }, { $set: { assignee: null } });
    await user.deleteOne();

    res.json({ success: true, message: 'User deleted and cleaned up successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ─────────────────────────────────────────
   PROJECT MANAGEMENT
───────────────────────────────────────── */
const getAllProjects = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('owner', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Project.countDocuments(filter),
    ]);

    // Attach task counts
    const projectIds = projects.map((p) => p._id);
    const taskCounts = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$project', count: { $sum: 1 } } },
    ]);
    const countMap = taskCounts.reduce((a, b) => ({ ...a, [b._id]: b.count }), {});

    const result = projects.map((p) => ({
      ...p.toObject(),
      taskCount: countMap[p._id] || 0,
      memberCount: (p.members?.length || 0) + 1,
    }));

    res.json({ success: true, projects: result, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const adminDeleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ success: true, message: 'Project and all its tasks deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ─────────────────────────────────────────
   TASK MANAGEMENT
───────────────────────────────────────── */
const getAllTasks = async (req, res) => {
  try {
    const { search, status, priority, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const skip = (Number(page) - 1) * Number(limit);
    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('project', 'name')
        .populate('assignee', 'name email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Task.countDocuments(filter),
    ]);

    res.json({ success: true, tasks, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getSystemStats,
  getAllUsers,
  getUserDetails,
  updateUserRole,
  toggleUserActive,
  deleteUser,
  getAllProjects,
  adminDeleteProject,
  getAllTasks,
};
