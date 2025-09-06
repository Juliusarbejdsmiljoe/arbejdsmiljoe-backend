const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Test route
app.get("/", (req, res) => {
  res.send("Backend kører! 🚀");
});

app.listen(5000, () => console.log("Server kører på http://localhost:5000"));
