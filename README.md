# Real-Time Chat Application Backend


## Features

- **User Authentication**: JWT-based authentication with bcrypt password hashing
- **Real-Time Messaging**: One-to-one messaging via Socket.io
- **Message Persistence**: All messages stored in MongoDB
- **Online/Offline Status**: Dynamic user status tracking
- **Chat History**: Retrieve previous conversations via API
- **WebSocket Logging**: Comprehensive logging using Winston
- **Unit Tests**: Test coverage for authentication and messaging

## Tech Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **Socket.io** - Real-time bidirectional communication
- **MongoDB** - Database with Mongoose ODM
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Winston** - Logging library
- **Jest** - Testing framework

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or remote instance)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ChatApplication
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory (use `.env.example` as reference):
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/chatdb
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
LOG_LEVEL=info
```

4. Create logs directory:
```bash
mkdir logs
```

5. Start MongoDB (if running locally):
```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
```

6. Start the server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "password": "password123"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "status": "offline"
  }
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "status": "offline"
  }
}
```

### Message Endpoints

#### Get Chat History
```http
GET /api/messages/history/:userId
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "messages": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "sender": {
        "_id": "507f1f77bcf86cd799439011",
        "username": "johndoe"
      },
      "receiver": {
        "_id": "507f1f77bcf86cd799439012",
        "username": "janedoe"
      },
      "content": "Hello!",
      "read": false,
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### Get All Conversations
```http
GET /api/messages/conversations
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "conversations": [
    {
      "user": {
        "id": "507f1f77bcf86cd799439012",
        "username": "janedoe",
        "status": "online"
      },
      "lastMessage": {
        "content": "Hello!",
        "createdAt": "2024-01-01T12:00:00.000Z",
        "sender": "507f1f77bcf86cd799439011"
      },
      "unreadCount": 0
    }
  ]
}
```

### Health Check
```http
GET /health
```

**Response (200 OK):**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## WebSocket Events

### Client → Server Events

#### Connect
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

#### Send Message
```javascript
socket.emit('send_message', {
  receiverId: '507f1f77bcf86cd799439012',
  content: 'Hello, how are you?'
});
```

#### Typing Indicator
```javascript
socket.emit('typing', {
  receiverId: '507f1f77bcf86cd799439012',
  isTyping: true
});
```

### Server → Client Events

#### Receive Message
```javascript
socket.on('receive_message', (data) => {
  console.log('New message:', data.message);
});
```

#### Message Sent Confirmation
```javascript
socket.on('message_sent', (data) => {
  console.log('Message sent:', data.message);
});
```

#### User Status Change
```javascript
socket.on('user_status_change', (data) => {
  console.log(`${data.username} is now ${data.status}`);
});
```

#### Online Users
```javascript
socket.on('online_users', (userIds) => {
  console.log('Online users:', userIds);
});
```

#### User Typing
```javascript
socket.on('user_typing', (data) => {
  console.log(`${data.username} is typing...`);
});
```

#### Error
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error.message);
});
```

## Testing

Run unit tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## Project Structure

```
ChatApplication/
├── config/
│   ├── database.js      # MongoDB connection
│   └── logger.js        # Winston logger configuration
├── middleware/
│   └── auth.js          # JWT authentication middleware
├── models/
│   ├── User.js          # User model
│   └── Message.js       # Message model
├── routes/
│   ├── auth.js          # Authentication routes
│   └── messages.js      # Message routes
├── socket/
│   └── socketHandlers.js # Socket.io event handlers
├── tests/
│   ├── auth.test.js     # Authentication tests
│   └── messages.test.js # Message tests
├── logs/                # Log files directory
├── server.js            # Main server file
├── package.json
├── jest.config.js
├── .env.example
└── README.md
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment (development/production) | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/chatdb |
| `JWT_SECRET` | Secret key for JWT tokens | (required) |
| `JWT_EXPIRES_IN` | JWT token expiration time | 7d |
| `LOG_LEVEL` | Winston log level | info |
| `CLIENT_URL` | Allowed CORS origin | * |

## Logging

The application uses Winston for logging. Logs are written to:
- `logs/error.log` - Error level logs
- `logs/combined.log` - All logs

WebSocket events are logged with the following information:
- Timestamp
- Event type (connect, disconnect, send_message, receive_message)
- User ID and username
- Socket ID

## Security Features

- Passwords are hashed using bcrypt before storage
- JWT tokens for secure authentication
- Protected routes require valid JWT tokens
- WebSocket connections require token authentication
- Input validation and sanitization
- CORS configuration

## Error Handling

The application includes comprehensive error handling:
- Validation errors return 400 status
- Authentication errors return 401 status
- Not found errors return 404 status
- Server errors return 500 status
- All errors are logged using Winston

## Future Enhancements

- Message read receipts
- File/image sharing
- Group chat functionality
- Message search
- User presence (away, busy, etc.)
- Push notifications
- Rate limiting
- Message encryption

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## Support

For issues and questions, please open an issue on the repository.

