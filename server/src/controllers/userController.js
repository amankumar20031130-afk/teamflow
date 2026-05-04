const User = require('../models/User');

const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ success: false, message: 'Query must be at least 2 characters' });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
      _id: { $ne: req.user._id },
    })
      .select('name email avatar')
      .limit(10);

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name email avatar createdAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { searchUsers, getUserById };
