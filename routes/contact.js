const express = require('express');
const router = express.Router();
const Contact = require('../models/contact.model');

// Create a new contact
router.post('/contacts', async (req, res) => {
    try {
        console.log('Request body:', req.body);
        const newContact = new Contact(req.body);
        const savedContact = await newContact.save();
        res.status(201).json(savedContact);
    } catch (error) {
        res.status(400).json({ error: error.message }); // Use 400 for validation errors or bad requests
    }
});

// Get all contacts
router.get('/contactsform', async (req, res) => {
    try {
        const contacts = await Contact.find();
        res.status(200).json(contacts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a specific contact by ID
router.get('/contacts/:id', async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) {
            return res.status(404).json({ message: 'Contact not found' });
        }
        res.status(200).json(contact);
    } catch (error) {
        res.status(400).json({ error: 'Invalid contact ID' }); // Use 400 for invalid IDs
    }
});

// Update a contact by ID
router.patch('/contacts/:id', async (req, res) => {
    try {
        const updatedContact = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedContact) {
            return res.status(404).json({ message: 'Contact not found' });
        }
        res.status(200).json(updatedContact);
    } catch (error) {
        res.status(400).json({ error: error.message }); // Use 400 for validation errors or bad requests
    }
});

// Delete a contact by ID
router.delete('/contacts/:id', async (req, res) => {
    try {
        const deletedContact = await Contact.findByIdAndDelete(req.params.id);
        if (!deletedContact) {
            return res.status(404).json({ message: 'Contact not found' });
        }
        res.status(200).json({ message: 'Contact deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: 'Invalid contact ID' }); // Use 400 for invalid IDs
    }
});

module.exports = router;
