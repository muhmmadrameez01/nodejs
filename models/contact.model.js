const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    
    email:String,
    subject: String,
    message: String,
    date_created: { type: Date, default: Date.now },

});

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;
