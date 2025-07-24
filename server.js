const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Helmet with custom CSP to allow Google Fonts
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "style-src": ["'self'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
    },
  })
);

// Serve static frontend files from "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Fallback route for frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Sample API endpoint (replace or extend)
app.post("/register-url", (req, res) => {
  res.json({ message: "Registration successful" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
