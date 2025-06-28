const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const defaultUsers = [
  {
    username: 'alice',
    email: 'alice@uchat.com',
    password: 'password123',
    name: 'Alice Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face',
    color: '#007bff'
  },
  {
    username: 'bob',
    email: 'bob@uchat.com',
    password: 'password123',
    name: 'Bob Smith',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    color: '#28a745'
  }
];

async function initializeUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if users already exist
    const existingUsers = await User.find({});
    if (existingUsers.length > 0) {
      console.log('Users already exist. Skipping initialization.');
      return;
    }

    // Create default users
    for (const userData of defaultUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${user.username}`);
    }

    console.log('Default users created successfully!');
    console.log('\nLogin credentials:');
    console.log('User 1: alice / password123');
    console.log('User 2: bob / password123');
    
  } catch (error) {
    console.error('Error initializing users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

if (require.main === module) {
  initializeUsers();
}

module.exports = initializeUsers;
