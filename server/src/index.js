require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:4173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.) or matching origins
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/students', require('./routes/students'));
app.use('/api/library/books', require('./routes/library/books'));
app.use('/api/library/issues', require('./routes/library/issues'));
app.use('/api/library/fines', require('./routes/library/fines'));
app.use('/api/library/reservations', require('./routes/library/reservations'));
app.use('/api/library/digital', require('./routes/library/digital'));
app.use('/api/library/reminders', require('./routes/library/reminders'));
app.use('/api/placement/companies', require('./routes/placement/companies'));
app.use('/api/placement/drives', require('./routes/placement/drives'));
app.use('/api/placement/applications', require('./routes/placement/applications'));
app.use('/api/placement/rounds', require('./routes/placement/rounds'));
app.use('/api/alumni', require('./routes/alumni'));
app.use('/api/mentorship', require('./routes/mentorship'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/resumes', require('./routes/resumes'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports', require('./routes/reports'));

// Cron jobs
require('./utils/cron');

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuild));
  // SPA fallback — all non-API routes serve index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = { app, server };
