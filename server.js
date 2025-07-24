import express from "express";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import { fileURLToPath } from "url";

// Create app
const app = express();
const PORT = process.env.PORT || 3000;

// For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Main route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ M-Pesa callback endpoint
app.post("/mpesa/callback", (req, res) => {
  console.log("✅ Received M-Pesa Payment Notification:");
  console.log(JSON.stringify(req.body, null, 2));

  res.status(200).json({ message: "Callback received successfully" });
});

// ✅ Validation endpoint
app.post("/mpesa/validation", (req, res) => {
  console.log("✅ VALIDATION endpoint hit!");
  console.log("Validation Body:", JSON.stringify(req.body, null, 2));

  res.status(200).json({
    ResultCode: 0,
    ResultDesc: "Accepted"
  });
});

// ✅ Confirmation endpoint
app.post("/mpesa/confirmation", (req, res) => {
  console.log("✅ CONFIRMATION endpoint hit!");
  console.log("Confirmation Body:", JSON.stringify(req.body, null, 2));

  res.status(200).json({
    ResultCode: 0,
    ResultDesc: "Accepted"
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
