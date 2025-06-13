const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8888; // Using a high port number

app.use(cors());
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('✅ Health check requested');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Users endpoint
app.get('/api/users', (req, res) => {
  console.log('✅ Users endpoint requested');
  res.json({ 
    users: [
      { id: 1, name: 'Test User 1', email: 'test1@example.com' },
      { id: 2, name: 'Test User 2', email: 'test2@example.com' }
    ], 
    message: 'Users endpoint working correctly',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  console.log('✅ Test endpoint requested');
  res.json({ message: 'Test endpoint working', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
console.log(`🚀 Starting server on port ${PORT}...`);

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Server successfully started on http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
});

server.on('error', (err) => {
  console.error('❌ Server startup error:', err);
  process.exit(1);
});

console.log('Server initialization complete.');
