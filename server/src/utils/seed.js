const User = require('../models/User');

const DEMO_USERS = [
  {
    name: 'Admin User',
    email: 'admin@teamflow.com',
    password: 'Admin@123',
    role: 'admin',
  },
  {
    name: 'Demo Member',
    email: 'user@teamflow.com',
    password: 'User@123',
    role: 'user',
  },
];

const seedDemoUsers = async () => {
  try {
    for (const demo of DEMO_USERS) {
      const exists = await User.findOne({ email: demo.email });
      if (!exists) {
        await User.create(demo);
        console.log(`[Seed] Created demo account → ${demo.email} (${demo.role})`);
      }
    }
  } catch (err) {
    console.error('[Seed] Error seeding demo users:', err.message);
  }
};

module.exports = seedDemoUsers;
