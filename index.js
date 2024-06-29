const express = require("express");
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require("cors");
const app = express();
const socketIo = require('socket.io');
const http = require('http');
const server = http.createServer(app);
const io = socketIo(server);
const Message = require('./models/chat.model');

const Port = process.env.PORT || 3300;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb+srv://rhssoft1:726339.Ra@cluster0.4rvjzct.mongodb.net/',
  { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB database connection established successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

app.use(express.json());

const userRoute = require("./routes/user");
const ngoRoute = require("./routes/ngo");
const complaintRoute = require("./routes/complaint");
const contactRoute = require("./routes/contact");
const feedbackRoute = require("./routes/feedback");
const lawyerRoute = require("./routes/lawyer");
const PhychiatristRoute = require('./routes/phychiatrist');
const chatRoute = require('./routes/chat');
const adminRoute = require('./routes/admin');

app.use("/user", userRoute);
app.use("/ngo", ngoRoute);
app.use("/form", complaintRoute);
app.use("/contact", contactRoute);
app.use("/support", feedbackRoute);
app.use("/lawyer", lawyerRoute);
app.use("/Phychiatrist", PhychiatristRoute);
app.use("/chat", chatRoute);
app.use("/admin", adminRoute);

app.get("/", (req, res) => res.json("Your first REST API"));

// Socket.IO implementation
const userMap = {};
io.on('connection', (socket) => {
  console.log('A socket connected');

  socket.on("connect_user", (userId) => {
    console.log("User with", userId, "Connected");
    userMap[userId] = socket.id;
  });

  socket.on('sendMessage', async (msg) => {
    try {
      console.log('Received message payload:', msg);

      const createdTime = msg.createdTime ? new Date(msg.createdTime) : new Date();
      if (isNaN(createdTime.getTime())) {
        console.log('Invalid createdTime:', msg.createdTime);
        return;
      }

      const message = await Message.create({
        ...msg,
        createdTime: createdTime,
      });
      console.log('Message saved successfully:', message);

      console.log('createdTime:', message.createdAt);

      // Sending to all except sender
      socket.broadcast.emit('receiveMessage', message);

      // Sending Private Messages
      // const socketId = userMap[message.recipientId];
      // if (socketId) {
      //   io.to(socketId).emit('receiveMessage', message);
      // } else {
      //   console.log("Failed to send message to User with", message.recipientId)
      // }
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on("get_all_messages", async (roomId) => {
    console.log("sending all messages",);
    const messages = await Message.find({ roomId });
    socket.emit("recieve_all_messages", { messages, roomId });
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(Port, () => {
  console.log(`Server is running on port ${Port}`);
});
