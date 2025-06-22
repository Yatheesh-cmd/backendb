const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const validator = require('validator');
const Contact = require('./models/Contact');

dotenv.config();
const app = express();

// Configure CORS to allow requests from your frontend
app.use(cors({
  origin: 'https://contactbook-ashy.vercel.app', // Your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
  allowedHeaders: ['Content-Type'], // Allowed headers
  credentials: false // Set to true if you need cookies/auth
}));

// Explicitly handle preflight OPTIONS requests (optional, cors middleware usually handles this)
app.options('*', cors());

// Parse JSON request bodies
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Create a new contact
app.post('/api/contacts', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    const existingContact = await Contact.findOne({ email });
    if (existingContact) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    const contact = new Contact({ name, email, phone });
    await contact.save();
    res.status(201).json({ message: 'Contact added successfully', contact });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all contacts
app.get('/api/contacts', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search contacts
app.get('/api/contacts/search', async (req, res) => {
  try {
    const { query } = req.query;
    const contacts = await Contact.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a contact
app.put('/api/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    const existingContact = await Contact.findOne({ email, _id: { $ne: id } });
    if (existingContact) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    const contact = await Contact.findByIdAndUpdate(id, { name, email, phone }, { new: true });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json({ message: 'Contact updated successfully', contact });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a contact
app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findByIdAndDelete(id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json({ message: 'Contact deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));