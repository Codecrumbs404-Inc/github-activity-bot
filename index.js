const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

// Set up Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Body parser middleware to parse JSON payloads
app.use(bodyParser.json());

// Import webhook routes
const webhookRoutes = require('./api/webhook');
const weborgRoutes = require('./api/weborg');

// Use the routes
app.use('/webhook', webhookRoutes);
app.use('/weborg', weborgRoutes);

// Ping endpoint for testing webhook connection
app.get('/ping', (req, res) => {
    res.send('Webhook is active and connected!');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
