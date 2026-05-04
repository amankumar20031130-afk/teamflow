const User = require('../models/User');

const seedDemoUsers = async () => {
  try {
    const exists = await User.findOne({ email: 'demo@teamflow.com' });
    if (!exists) {
      await User.create({
        name: 'Demo User',
        email: 'demo@teamflow.com',
        password: 'Demo@123',
      });
      console.log('[Seed] Created demo account → demo@teamflow.com');
    }
  } catch (err) {
    console.error('[Seed] Error seeding demo user:', err.message);
  }
};

module.exports = seedDemoUsers;
