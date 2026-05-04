const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [3, 'Project name must be at least 3 characters'],
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'on-hold', 'completed', 'archived'],
      default: 'active',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [memberSchema],
    dueDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Helper: works whether the field is a raw ObjectId or a populated document
const toId = (val) => (val?._id ?? val)?.toString();

projectSchema.methods.isAdmin = function (userId) {
  if (toId(this.owner) === userId.toString()) return true;
  const member = this.members.find((m) => toId(m.user) === userId.toString());
  return member && member.role === 'admin';
};

projectSchema.methods.isMember = function (userId) {
  if (toId(this.owner) === userId.toString()) return true;
  return this.members.some((m) => toId(m.user) === userId.toString());
};

module.exports = mongoose.model('Project', projectSchema);
