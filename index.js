const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
const port = 5000;

app.use(express.json());

app.use("/api/auth", require("./routers/authRouter"));

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});