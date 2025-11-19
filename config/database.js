const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if MONGODB_URI is defined
    if (!process.env.MONGODB_URI) {
      throw new Error(
        'MONGODB_URI is not defined. Please create a .env file with MONGODB_URI.\n' +
        'Example: MONGODB_URI=mongodb://localhost:27017/chatdb\n' +
        'Or for MongoDB Atlas: MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/chatdb'
      );
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

