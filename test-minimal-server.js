const express = require('express');
const app = express();
const PORT = 3006;

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Users endpoint
app.get('/api/users', (req, res) => {
  console.log('Users endpoint requested');
  res.json({ users: [], message: 'Test users endpoint working' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Test Server running on http://localhost:${PORT}`);
  console.log('✅ Server is ready for connections');
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

server.on('listening', () => {
  const address = server.address();
  if (address) {
    console.log(`🔍 Server bound to: ${address.address}:${address.port}`);
  }
});

console.log('Server startup initiated...');
