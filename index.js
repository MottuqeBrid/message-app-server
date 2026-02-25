const express = require("express");
const app = express();
const cors = require("cors");
const { default: mongoose } = require("mongoose");
require("dotenv").config();

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
console.log(process.env.DB_URI);

mongoose
  .connect(process.env.DB_URI || "mongodb://localhost:27017/message-app")
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB", err);
  });

app.use("/api/auth", require("./routers/authRouter"));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
