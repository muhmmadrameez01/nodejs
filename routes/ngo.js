const express = require("express");
const config = require("../config");
const jwt = require("jsonwebtoken");
const middleware = require("../middleware");
const Ngo = require("../models/ngo.model");
const router = express.Router();

//--------------------NGO Register -------------------------------------//
// Route to register a new NGO
router.route('/register').post(async (req, res) => {
  console.log("inside the register");
  // Create a new NGO instance from the request body
  const ngo = new Ngo({
    username: req.body.username,
    email: req.body.email,
    address: req.body.address,
    phoneNumber: req.body.phoneNumber,
    licence: req.body.licence,
    password: req.body.password,
  });

  try {
    // Save the NGO to the database
    const savedNgo = await ngo.save();
    console.log("NGO registered", savedNgo);
    res.status(201).json({ message: "NGO registered successfully", ngo: { id: savedNgo._id, username: savedNgo.username } });
  } catch (err) {
    // Handle errors during registration
    console.error("Error registering NGO:", err.message);
    res.status(422).json({ msg: err.message });
  }
});

//--------------------Get list of NGOs----------------------------------//
// Route to get a list of all registered NGOs
router.route('/ngos').get(async (req, res) => {
  try {
    // Find all NGOs and return only their username and ID
    const ngos = await Ngo.find({}, 'username _id');
    res.status(200).json(ngos);
  } catch (err) {
    // Handle errors during retrieval
    console.error('Error retrieving NGOs:', err.message);
    res.status(422).json({ msg: err.message });
  }
});

//--------------------NGO Login-----------------------------------------//
// Route to login an NGO
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find the NGO by email
    const ngo = await Ngo.findOne({ email });
    if (!ngo) {
      // If NGO is not found
      return res.status(403).json({ msg: "Email incorrect" });
    } else if (ngo.password === password) {
      // If password matches, generate a JWT token
      let token = jwt.sign({ id: ngo._id }, config.key, { expiresIn: "24h" });
      res.json({
        token: token,
        ngoId: ngo._id,  // Confirming NGO ID is sent
        username: ngo.username,  // Ensure this line exists
        msg: "Login successful",
      });
      console.log("Ngo login");
    } else {
      // If password is incorrect
      res.status(403).json({ msg: "Password incorrect" });
    }
  } catch (err) {
    // Handle errors during login
    res.status(500).json({ msg: err.message });
  }
});

//--------------------Update NGO----------------------------------------//
// Route to update NGO's password
router.route("/update/:email").patch(middleware.checkToken, async (req, res) => {
  try {
    // Find NGO by email and update the password
    await Ngo.findOneAndUpdate(
      { email: req.params.email },
      { $set: { password: req.body.password } }
    );
    res.json({
      msg: "Password successfully updated",
      email: req.params.email,
    });
  } catch (err) {
    // Handle errors during update
    res.status(403).json({
      msg: "Password update failed",
      error: err,
    });
  }
});

//--------------------Delete NGO----------------------------------------//
// Route to delete an NGO
router.delete("/delete/:email", middleware.checkToken, async (req, res) => {
  try {
    // Find NGO by email and delete
    const ngo = await Ngo.findOneAndDelete({ email: req.params.email });
    if (!ngo) {
      // If NGO is not found
      return res.status(404).json({ message: "NGO not found" });
    }
    res.status(200).json({ message: "NGO successfully deleted" });
  } catch (err) {
    // Handle errors during deletion
    res.status(500).json({ error: "An error occurred" });
  }
});

//--------------------Get NGO by Email----------------------------------//
// Route to get NGO details by email
router.route("/:email").get(middleware.checkToken, async (req, res) => {
  try {
    // Find NGO by email
    const ngo = await Ngo.findOne({ email: req.params.email });
    if (!ngo) {
      // If NGO is not found
      return res.status(404).json({ msg: "NGO not found" });
    }

    // Retrieve the token from the request headers
    const token = req.headers.authorization.slice(7);

    // Set the token as an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // Set to true for HTTPS
    });

    res.json({
      msg: "NGO found",
      ngo: ngo,
    });
  } catch (err) {
    // Handle errors during retrieval
    console.error(err); // Log the error for debugging purposes.
    res.status(500).json({
      msg: "Error",
      error: err.message, // Use err.message to get the error message.
    });
  }
});

//--------------------Check Email Existence----------------------------//
// Route to check if an email is already registered
router.post('/checkemail/:email', async (req, res) => {
  try {
    // Find NGO by email
    const result = await Ngo.findOne({ email: req.params.email });
    if (result !== null) {
      // If email exists
      return res.json({ Status: true });
    } else {
      // If email does not exist
      return res.json({ Status: false });
    }
  } catch (err) {
    // Handle errors during check
    return res.status(500).json({ msg: err.message });
  }
});

//--------------------Get NGO Name by Email-----------------------------//
// Route to get NGO username by email
router.route("/ngoname/:email").get(middleware.checkToken, async (req, res) => {
  try {
    // Find NGO by email and select username
    const user = await Ngo.findOne({ email: req.params.email }).select('username');
    if (!user) {
      // If NGO is not found
      return res.status(404).json({ msg: "User not found" });
    }
    res.json({ username: user.username });
  } catch (err) {
    // Handle errors during retrieval
    res.status(500).json({ msg: "Error", error: err.message });
  }
});

//--------------------Verify NGO Status---------------------------------//
// Route to verify NGO status
router.post('/verify-ngo/:id', middleware.checkToken, async (req, res) => {
  const { status } = req.body;  // Expected to be 'Allowed' or 'Declined'
  if (!['Allowed', 'Declined'].includes(status)) {
    return res.status(400).json({ msg: "Invalid status provided" });
  }

  try {
    // Find NGO by ID and update verification status
    const ngo = await Ngo.findByIdAndUpdate(req.params.id, { verificationStatus: status }, { new: true });
    if (!ngo) {
      // If NGO is not found
      return res.status(404).json({ msg: "NGO not found" });
    }
    res.json({
      msg: `NGO verification status updated to ${status}`,
      ngo: { id: ngo._id, verificationStatus: ngo.verificationStatus }
    });
  } catch (err) {
    // Handle errors during update
    console.error('Error updating NGO status:', err.message);
    res.status(500).json({ msg: err.message });
  }
});

router.route("/ngoupdate").post(middleware.checkToken, async (req, res) => {

  const { email, oldPassword, newPassword } = req.body;
  console.log(res.body);

  try {
    // Find the user by email
    const ngo = await Ngo.findOne({ email });

    // If user not found, return error
    if (!ngo) {
      return res.status(404).json({
        msg: "User not found",
        email: email,
      });
    }

    // Compare old password
    const isMatch = oldPassword === ngo.password;
    if (!isMatch) {
      return res.status(401).json({
        msg: "Old password is incorrect",
        email: email,
      });
    }

    // Hash the new password

    ngo.password = newPassword;
    await ngo.save();

    // Password successfully updated
    res.json({
      msg: "Password successfully updated",
      email: email,
    });
  } catch (err) {
    // Error updating password
    console.error(err); // Log the error for debugging
    res.status(500).json({
      msg: "Password update failed",
      error: err.message,
    });
  }
});

module.exports = router;
