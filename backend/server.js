const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Travel Planning & Booking API',
    status: 'success',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Travel Planning & Booking System backend is running',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
