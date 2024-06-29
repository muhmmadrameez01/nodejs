const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Lawyer schema
const lawyerSchema = new Schema({
    name: {
        type: String,
        // required: true,
        
    },
    imageUrl: {
        type: String,
        // required: true,
       
    },
    description: {
        type: String,
        // required: true,
        
    }
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

// Create and export the Lawyer model
const Lawyer = mongoose.model('Lawyer', lawyerSchema);
module.exports = Lawyer;
