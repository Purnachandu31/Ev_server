// Import necessary packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto'); // Import the crypto module
require('dotenv').config();

// Initialize Express app
const app = express();
const port = 5000;

async function connectDB() {
  try {
    url=process.env.MONGODB_URI
    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`Database connected: ${url}`);
  } catch (err) {
    console.error(`Connection error: ${err}`);
    process.exit(1);
  }
}

// Call connectDB function
connectDB();

// Define database schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Create User model
const User = mongoose.model('User', userSchema);

// Middleware
app.use(express.json());
app.use(cors());

// Signup endpoint
app.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash the password using SHA-256
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    // Create new user
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.json({ message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) throw new Error('Invalid user');

    // Hash the provided password for comparison
    const providedPasswordHash = crypto.createHash('sha256').update(password).digest('hex');

    // Compare hashed passwords
    if (providedPasswordHash !== user.password) throw new Error('Invalid credentials');

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, 'my-secret-key', { expiresIn: '1h' });

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(401).json("error");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});