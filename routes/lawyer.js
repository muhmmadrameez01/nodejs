const express = require('express');
const router = express.Router();
const Lawyer = require('../models/lawyer.model');
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

        const newLawyer = new Lawyer({
            name,
            imageUrl: req.file.location, // Accessing the location property of the uploaded file
            description
        });

        await newLawyer.save();
        res.status(201).json({ message: 'Lawyer added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while adding the lawyer' });
        console.error(error);
    }
});
router.get('/all', async (req, res) => {
    try {
        const lawyers = await Lawyer.find();
        res.status(200).json(lawyers);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching lawyers' });
        console.error(error);
    }
});
router.delete('/:id', async (req, res) => {
    try {
      const lawyer = await Lawyer.findByIdAndDelete(req.params.id);
      if (!lawyer) {
        return res.status(404).json({ message: 'Lawyer not found' });
      }
      res.status(200).json({ message: 'Lawyer deleted successfully' });
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
  
      const lawyer = await Lawyer.findByIdAndUpdate(
        id,
        req.body,
        { new: true }
      );
  
      if (!lawyer) {
        console.log(`Lawyer with ID: ${id} not found.`);
        return res.status(404).json({ message: 'Lawyer not found' });
      }
  
      console.log(`Lawyer updated successfully: ${JSON.stringify(lawyer)}`);
      res.status(200).json({ message: 'Lawyer updated successfully', lawyer });
    } catch (err) {
      console.error(`Error updating lawyer: ${err.message}`);
      res.status(500).json({ message: 'Error updating lawyer', error: err.message });
    }
  });
  
module.exports = router;
