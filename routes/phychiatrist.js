const express = require('express');
const router = express.Router();
const Phychiatrist = require('../models/Phychiatrists.model');
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
require('dotenv').config();

// Configuring AWS
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// Configuring Multer to store the image directly in S3
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'imagestoreage',
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            cb(null, Date.now().toString() + '-' + file.originalname);
        }
    })
});

// Register a lawyer with an image upload
router.post('/add', upload.single('image'), async (req, res) => {
    try {
        console.log(req.body); // Log body to debug
        console.log(req.file); // Log file to debug

        const { name, description } = req.body;

        if (!name || !description) {
            return res.status(400).json({ error: 'Name and description are required' });
        }

        const newPhychiatrist = new Phychiatrist({
            name,
            imageUrl: req.file.location, // Accessing the location property of the uploaded file
            description
        });

        await newPhychiatrist.save();
        res.status(201).json({ message: 'Phychiatrist added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while adding the lawyer' });
        console.error(error);
    }
});
router.get('/all', async (req, res) => {
    try {
        const phychiatrist = await Phychiatrist.find();
        res.status(200).json(phychiatrist);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching Phychiatrist' });
        console.error(error);
    }
});
router.delete('/:id', async (req, res) => {
    try {
      const phychiatrist = await Phychiatrist.findByIdAndDelete(req.params.id);
      if (!phychiatrist) {
        return res.status(404).json({ message: 'phychiatrist not found' });
      }
      res.status(200).json({ message: 'phychiatrist deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Error deleting lawyer', error: err.message });
    }
  });

  router.post('/:id', async (req, res) => {
    try {
      // Remove any leading colons or other characters from the ID
      const id = req.params.id.replace(/^:/, '');
  
      console.log(`Updating lawyer with ID: ${id}`);
      console.log(`Request body: ${JSON.stringify(req.body)}`);
  
      const phychiatrist = await Phychiatrist.findByIdAndUpdate(
        id,
        req.body,
        { new: true }
      );
  
      if (!phychiatrist) {
        console.log(`phychiatrist with ID: ${id} not found.`);
        return res.status(404).json({ message: 'phychiatrist not found' });
      }
  
      console.log(`phychiatrist updated successfully: ${JSON.stringify(phychiatrist)}`);
      res.status(200).json({ message: 'phychiatrist updated successfully', phychiatrist });
    } catch (err) {
      console.error(`Error updating phychiatrist: ${err.message}`);
      res.status(500).json({ message: 'Error updating phychiatrist', error: err.message });
    }
  });

module.exports = router;
