// Set test environment variables BEFORE loading any modules
process.env.NODE_ENV = 'test';

// Load dotenv first, then override with test values
require('dotenv').config();

// Override with test values after dotenv loads
process.env.JWT_SECRET = 'test-secret-key-for-jwt';
process.env.JWT_EXPIRES_IN = '7d';
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const { app } = require('../server');

describe('Messages API', () => {
  let user1Token, user2Token, user1Id, user2Id;
  let mongoConnected = false;

  beforeAll(async () => {
    // Connect to test database only if not already connected
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatdb_test';
      try {
        await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 10000, // 10 seconds timeout
          socketTimeoutMS: 45000,
        });
        mongoConnected = true;
      } catch (error) {
        console.error('\n❌ Failed to connect to MongoDB:', error.message);
        console.error('💡 Make sure MongoDB is running on localhost:27017');
        console.error('   On Windows, you can start it with: net start MongoDB');
        console.error('   Or install MongoDB and start the service manually\n');
        mongoConnected = false;
        // Don't throw - let tests skip instead
      }
    } else {
      mongoConnected = true;
    }
  }, 30000); // 30 second timeout for beforeAll

  afterAll(async () => {
    // Clean up and close connection
    try {
      await User.deleteMany({});
      await Message.deleteMany({});
      await mongoose.connection.close();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }, 30000); // 30 second timeout for afterAll

  beforeEach(async () => {
    if (!mongoConnected) return;
    // Clear data before each test
    await User.deleteMany({});
    await Message.deleteMany({});

    // Create test users with unique usernames to avoid conflicts
    const timestamp = Date.now();
    const user1 = await User.create({
      username: `user1_${timestamp}`,
      password: 'password123',
    });
    const user2 = await User.create({
      username: `user2_${timestamp}`,
      password: 'password123',
    });

    user1Id = user1._id.toString();
    user2Id = user2._id.toString();

    // Ensure JWT_SECRET is set
    const jwtSecret = process.env.JWT_SECRET || 'test-secret-key-for-jwt';
    
    // Generate tokens
    user1Token = jwt.sign(
      { userId: user1Id, username: user1.username },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    user2Token = jwt.sign(
      { userId: user2Id, username: user2.username },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  });

  describe('GET /api/messages/history/:userId', () => {
    it('should get chat history between two users', async () => {
      if (!mongoConnected) {
        console.log('⏭️  Skipping test - MongoDB not available');
        return;
      }
      // Create some messages
      await Message.create([
        {
          sender: user1Id,
          receiver: user2Id,
          content: 'Hello from user1',
        },
        {
          sender: user2Id,
          receiver: user1Id,
          content: 'Hello from user2',
        },
      ]);

      const response = await request(app)
        .get(`/api/messages/history/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('messages');
      expect(response.body.messages).toHaveLength(2);
      expect(response.body.messages[0].content).toBe('Hello from user1');
      expect(response.body.messages[1].content).toBe('Hello from user2');
    });

    it('should return empty array if no messages exist', async () => {
      if (!mongoConnected) {
        console.log('⏭️  Skipping test - MongoDB not available');
        return;
      }
      const response = await request(app)
        .get(`/api/messages/history/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.messages).toHaveLength(0);
    });

    it('should require authentication', async () => {
      if (!mongoConnected) {
        console.log('⏭️  Skipping test - MongoDB not available');
        return;
      }
      const response = await request(app)
        .get(`/api/messages/history/${user2Id}`);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent user', async () => {
      if (!mongoConnected) {
        console.log('⏭️  Skipping test - MongoDB not available');
        return;
      }
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/messages/history/${fakeId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/messages/conversations', () => {
    it('should get all conversations for authenticated user', async () => {
      if (!mongoConnected) {
        console.log('⏭️  Skipping test - MongoDB not available');
        return;
      }
      // Create messages
      await Message.create([
        {
          sender: user1Id,
          receiver: user2Id,
          content: 'Message 1',
        },
      ]);

      const response = await request(app)
        .get('/api/messages/conversations')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('conversations');
      expect(response.body.conversations.length).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      if (!mongoConnected) {
        console.log('⏭️  Skipping test - MongoDB not available');
        return;
      }
      const response = await request(app)
        .get('/api/messages/conversations');

      expect(response.status).toBe(401);
    });
  });
});

