const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');

const getTasksByProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { status, priority, assignee } = req.query;
    const filter = { project: project._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name')
      .populate('comments.user', 'name email avatar');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { title, description, status, priority, assignee, dueDate, tags } = req.body;

    if (assignee && !project.isMember(assignee)) {
      return res.status(400).json({
        success: false,
        message: 'Assignee must be a project member',
      });
    }

    const task = await Task.create({
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      project: project._id,
      assignee: assignee || null,
      createdBy: req.user._id,
      dueDate: dueDate || null,
      tags: tags || [],
    });

    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    res.status(201).json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { title, description, status, priority, assignee, dueDate, tags } = req.body;

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (assignee !== undefined) task.assignee = assignee || null;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (tags) task.tags = tags;

    await task.save();
    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (
      task.createdBy.toString() !== req.user._id.toString() &&
      !project.isAdmin(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Only task creator or admin can delete tasks',
      });
    }

    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    task.comments.push({ user: req.user._id, text: text.trim() });
    await task.save();
    await task.populate('comments.user', 'name email avatar');

    res.status(201).json({ success: true, comments: task.comments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getMyTasks = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { assignee: req.user._id };
    if (status) filter.status = status;

    const tasks = await Task.find(filter)
      .populate('project', 'name status')
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ dueDate: 1, createdAt: -1 });

    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const projects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    });
    const projectIds = projects.map((p) => p._id);

    const allTasks = await Task.find({ project: { $in: projectIds } })
      .populate('project', 'name')
      .populate('assignee', 'name email avatar');

    const myTasks = await Task.find({ assignee: userId })
      .populate('project', 'name')
      .populate('assignee', 'name email avatar')
      .sort({ dueDate: 1 })
      .limit(10);

    const overdueTasks = await Task.find({
      project: { $in: projectIds },
      dueDate: { $lt: now },
      status: { $ne: 'done' },
    })
      .populate('project', 'name')
      .populate('assignee', 'name email avatar')
      .sort({ dueDate: 1 });

    const stats = {
      totalProjects: projects.length,
      activeProjects: projects.filter((p) => p.status === 'active').length,
      totalTasks: allTasks.length,
      tasksByStatus: {
        todo: allTasks.filter((t) => t.status === 'todo').length,
        inProgress: allTasks.filter((t) => t.status === 'in-progress').length,
        inReview: allTasks.filter((t) => t.status === 'in-review').length,
        done: allTasks.filter((t) => t.status === 'done').length,
      },
      overdueTasks: overdueTasks.length,
      myTasks,
      recentOverdue: overdueTasks.slice(0, 5),
    };

    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getTasksByProject,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  getMyTasks,
  getDashboardStats,
};
