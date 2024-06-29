const express = require("express");
const User = require("../models/user.model");
const config = require("../config");
const jwt = require("jsonwebtoken");
const middleware = require("../middleware");
const nodemailer = require('nodemailer');
const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'rameezmalik012@gmail.com',
    pass: 'nfpf zcdg lrvl xjwh',
  },
});

// Function to generate a random OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTPs temporarily
const otpStore = {};

router.post('/request-otp', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.error('User not found');
      return res.status(404).json({ message: 'User not found', status: false });
    }

    const otp = generateOtp();
    otpStore[email] = otp; // Save OTP temporarily

    const mailOptions = {
      from: 'rhssoft1@gmail.com',
      to: email,
      subject: 'OTP for Password Reset',
      text: `Your OTP for password reset is: ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ message: 'Error sending email', status: false });
      }
      console.log('Email sent:', info.response);
      res.status(200).json({ message: 'OTP sent successfully', status: true });
    });
  } catch (err) {
    console.error('Internal server error:', err);
    res.status(500).json({ message: 'Internal server error', status: false });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    if (otpStore[email] !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.error('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    const mailOptions = {
      from: 'rhssoft1@gmail.com',
      to: email,
      subject: 'Password Reset Confirmation',
      text: 'Your password has been successfully reset.',
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ message: 'Error sending email', error: error.message });
      }
      console.log('Email sent:', info.response);
      delete otpStore[email]; // Remove OTP after successful password reset
      res.status(200).json({ message: 'Password reset successfully and email sent' });
    });
  } catch (err) {
    console.error('Internal server error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

router.route("/reset-password").post(async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.error("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    user.password = newPassword;
    await user.save();

    const mailOptions = {
      from: 'rhssoft1@gmail.com',
      to: email,
      subject: 'Password Reset Confirmation',
      text: 'Your password has been successfully reset.'
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: 'Error sending email', error: error.message });
      }
      console.log("Email sent:", info.response);
      res.status(200).json({ message: 'Password reset successfully and email sent' });
    });
  } catch (err) {
    console.error("Internal server error:", err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

router.route("/:email").get(middleware.checkToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    // Retrieve the token from the request headers
    const token = req.headers.authorization.slice(7);

    // Set the token as an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // Set to true for HTTPS
    });

    res.json({
      msg: "User found",
      user: user,
    });
  } catch (err) {
    console.error(err); // Log the error for debugging purposes.
    res.status(500).json({
      msg: "Error",
      error: err.message, // Use err.message to get the error message.
    });
  }
});

//------------------------Check Username-----------------------------//
router.get('/checkemail/:email', async (req, res) => {
  try {
    const result = await User.findOne({ email: req.params.email });
    if (result !== null) {
      return res.json({
        Status: true,
      });
    } else {
      return res.json({ Status: false });
    }
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

//------------------------LOGIN----------------------------------------------

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(403).json({ msg: "Email incorrect" });
      } else if (user.password === password) {
          let token = jwt.sign({ id: user._id }, config.key, { expiresIn: "24h" });
          res.json({
              token: token,
              userId: user._id,  // Confirming User ID is sent
              username: user.username,  // Ensure this line exists
              msg: "Login successful",
          });
          console.log("User login");
      } else {
          res.status(403).json({ msg: "Password incorrect" });
      }
  } catch (err) {
      res.status(500).json({ msg: err.message });
  }
});



//------------------------REGISTRATION---------------------------------------

router.route('/register').post(async (req, res) => {
  console.log('Inside the register');
  const user = new User({
    username: req.body.username,
    password: req.body.password,
    email: req.body.email,
  });
  try {
    // Save the NGO to the database
    const saveduser = await user.save();
    console.log("User registered", saveduser);
    res.status(201).json({ message: "User registered successfully", user: { id: saveduser._id, username: saveduser.username } });
  } catch (err) {
    // Handle errors during registration
    console.error("Error registering User:", err.message);
    res.status(422).json({ msg: err.message });
  }
  
});

router.route('/').get(async (req, res) => {
  try {
    // console.log('Received request to /users'); // Log request receipt
    // Find all users and return only their username and ID
    const users = await User.find({}, 'username _id');
    if (!users || users.length === 0) {
      console.error('No users found');
      return res.status(404).json({ msg: 'No users found' });
    }
    // console.log('Users retrieved:', users); // Log the retrieved users
    res.status(200).json(users);
  } catch (err) {
    // Handle errors during retrieval
    console.error('Error retrieving users:', err.message);
    console.error(err.stack); // Log stack trace for debugging
    res.status(422).json({ msg: err.message });
  }
});


router.route("/public/register").get(async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.route("/update").post(middleware.checkToken, async (req, res) => {

  const { email, oldPassword, newPassword } = req.body;
  console.log(res.body);

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    // If user not found, return error
    if (!user) {
      return res.status(404).json({
        msg: "User not found",
        email: email,
      });
    }

    // Compare old password
    const isMatch = oldPassword === user.password;
    if (!isMatch) {
      return res.status(401).json({
        msg: "Old password is incorrect",
        email: email,
      });
    }

    // Hash the new password

    user.password = newPassword;
    await user.save();

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

router.delete("/delete/:email", middleware.checkToken, async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ email: req.params.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Email successfully deleted" });
  } catch (err) {
    res.status(500).json({ error: "An error occurred" });
  }

});

router.route("/username/:email").get(middleware.checkToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email }).select('username');

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    res.json({
      username: user.username,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Error",
      error: err.message,
    });
  }
});

router.route("/updateUsername").post(middleware.checkToken, async (req, res) => {
  try {
    const { email, newUsername } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    // If user not found, return error
    if (!user) {
      return res.status(404).json({
        msg: "User not found",
        email: email,
      });
    }

    // Update the username
    user.username = newUsername;
    await user.save();

    // Username successfully updated
    res.json({
      msg: "Username successfully updated",
      email: email,
      newUsername: newUsername,
    });
  } catch (err) {
    // Error updating username
    console.error(err); // Log the error for debugging
    res.status(500).json({
      msg: "Username update failed",
      error: err.message,
    });
  }
});
// router.get('/u', async (req, res) => {
//   try {
//     const users = await User.find().select('username');
//     if (!users || users.length === 0) {
//       return res.status(404).json({ message: 'No users found' });
//     }
//     const usernames = users.map(user => user.username);
//     res.status(200).json({ usernames });
//   } catch (err) {
//     console.error("Error fetching usernames:", err.message);
//     res.status(500).json({ message: 'Internal server error', error: err.message });
//   }
// });
module.exports = router;
