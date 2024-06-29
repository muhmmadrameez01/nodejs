const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create schema for the user
const AdminSchema = Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

module.exports = mongoose.model("Admin", AdminSchema);
