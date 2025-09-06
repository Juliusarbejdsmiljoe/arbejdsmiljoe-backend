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
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server kører på port ${PORT}`);
});
