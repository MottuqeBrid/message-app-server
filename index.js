const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { default: mongoose } = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

require("dotenv").config();
const app = express();
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://message-app.vercel.app",
    ],
    credentials: true,
  }),
);
const port = 5000;

app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.DB_URI || "mongodb://localhost:27017/message-app")
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB", err);
  });

// Create an HTTP server using the Express app
const server = http.createServer(app);

// Create a Socket.io instance and attach it to the HTTP server
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://message-app.vercel.app",
    ],
    credentials: true,
  },
});

// =====================
// REST API
// =====================
app.use("/api/auth", require("./routers/authRouter"));
app.use("/api/friends", require("./routers/friendsRouter"));
app.use("/api/user", require("./routers/UserRouter"));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// =====================
// SOCKET API
// =====================

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("send_message", (data) => {
    console.log("message received: ", data);
    // broadcast the message to all other clients
    io.emit("receive_message", data);
  });
  socket.on("disconnect", () => {
    {
      console.log("user disconnected");
    }
  });
});

// =====================
// Start Server
// =====================

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
