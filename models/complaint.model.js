const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  name: {
    type: String,
    
  },
  email: {
    type: String,
    
  },
  phoneNumber: {
    type: String,
    
  },
  description: {
    type: String,
    
  },
  locationName: {
    type: String,
    
  },
  location: {
    type: {
      type: String,
      enum: ['Point'], // 'location.type' must be 'Point'
      
    },
    coordinates: {
      type: [Number], // Array of numbers
      
    }
  },
  imageUrl: {
    type: String,
    
  }
});

// Create a GeoJSON index for better querying by location
complaintSchema.index({ location: '2dsphere' });

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;
