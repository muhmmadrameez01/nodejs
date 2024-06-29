const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    
    name: String,
    subject: String,
    feedback:String,
    date_created: { type: Date, default: Date.now },

});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
