const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON body
app.use(bodyParser.json());

// M-Pesa callback endpoint
app.post("/mpesa/callback", (req, res) => {
  console.log("✅ M-Pesa Callback Received:", req.body);
  res.status(200).send("Callback received successfully");
});

// Root route (optional)
app.get("/", (req, res) => {
  res.send("M-Pesa Daraja Server is running.");
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
