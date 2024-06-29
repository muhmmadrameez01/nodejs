const express = require('express');
const router = express.Router();
const Complaint = require('../models/complaint.model');
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
require('dotenv').config(); // Load environment variables

// Log environment variables for debugging
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID);
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY);
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('AWS_BUCKET_NAME:', process.env.AWS_BUCKET_NAME);
console.log('GOOGLE_MAPS_API_KEY:', process.env.GOOGLE_MAPS_API_KEY);

// AWS Configuration
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});
const s3 = new AWS.S3();

// Multer S3 Configuration
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'imagestoreage',
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            cb(null, Date.now().toString() + '-' + file.originalname);
        }
    })
});

const googleMapsClient = require('@google/maps').createClient({
    key: process.env.GOOGLE_MAPS_API_KEY,
    Promise: Promise
});

// Submit Complaint Route
router.post('/submit-complaint', upload.single('image'), async (req, res) => {
    try {
        const { name, email, phoneNumber, description, locationSearch } = req.body;
        const imageUrl = req.file.location;

        const locationResponse = await googleMapsClient.places({ query: locationSearch }).asPromise();
        const locationResult = locationResponse.json.results[0];
        if (!locationResult) {
            return res.status(400).json({ message: 'Location not found.' });
        }

        const { lat, lng } = locationResult.geometry.location;
        const location = locationResult.formatted_address;

        const complaint = new Complaint({
            name,
            email,
            phoneNumber,
            description,
            locationName: location,
            location: {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)],
            },
            imageUrl,
        });

        await complaint.save();
        res.status(200).json({ message: 'Complaint submitted successfully.' });
    } catch (error) {
        console.error('Error submitting complaint:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Get Place Suggestions Route
router.get('/suggestions', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.trim() === '') {
            return res.status(400).json({ message: 'Query parameter is required and cannot be empty.' });
        }
        const response = await googleMapsClient.placesAutoComplete({
            input: query,
            language: 'en',
            components: { country: 'PK' },
        }).asPromise();

        res.json(response.json.predictions);
    } catch (error) {
        console.error('Error fetching place suggestions:', error);
        res.status(500).json({ message: 'Failed to fetch place suggestions' });
    }
});

// Get All Complaints Route
router.get('/', async (req, res) => {
    try {
        const complaints = await Complaint.find();
        res.status(200).json(complaints);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching complaints' });
    }
});

// Get Location Details Route
router.get('/location-details', async (req, res) => {
    try {
        const { placeId } = req.query;
        if (!placeId) {
            return res.status(400).json({ message: 'Place ID is required.' });
        }

        const locationDetails = await googleMapsClient.place({ placeid: placeId, language: 'en' }).asPromise();
        if (locationDetails.json.status !== 'OK') {
            throw new Error('Google Maps API error: ' + locationDetails.json.error_message);
        }

        res.json(locationDetails.json.result);
    } catch (error) {
        console.error('Error fetching location details:', error);
        res.status(500).json({ message: 'Failed to fetch location details' });
    }
});

// Get High Alert Locations Route
router.get('/high-alert-locations', async (req, res) => {
    try {
        const highAlertLocations = await Complaint.aggregate([
            {
                $group: {
                    _id: "$locationName",
                    totalComplaints: { $sum: 1 },
                    coordinates: { $first: "$location.coordinates" }
                }
            },
            {
                $match: {
                    totalComplaints: { $gte: 4 }
                }
            }
        ]);

        res.status(200).json(highAlertLocations);
    } catch (error) {
        console.error('Error fetching high alert locations:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
