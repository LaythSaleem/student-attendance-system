// Test User Management API with detailed logging
const express = require('express');
const app = express();

// Simple middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log(`   Headers: ${JSON.stringify(req.headers, null, 2)}`);
  next();
});

// Test if the basic routing is working
app.get('/api/test', (req, res) => {
  console.log('✅ Test endpoint hit');
  res.json({ message: 'Test endpoint working' });
});

app.get('/api/users', (req, res) => {
  console.log('✅ Users endpoint hit');
  res.json({ message: 'Users endpoint working', users: [] });
});

// Error handling
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
});

const PORT = 3002; // Use different port to avoid conflicts
app.listen(PORT, () => {
  console.log(`🧪 Test server running on http://localhost:${PORT}`);
});

module.exports = app;
