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

// ✅ M-Pesa validation endpoint
app.post("/mpesa/validation", (req, res) => {
  console.log("✅ Validation request received");
  console.log(JSON.stringify(req.body, null, 2));
  res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
});

// ✅ M-Pesa confirmation endpoint
app.post("/mpesa/confirmation", (req, res) => {
  const { TransAmount, TransID, MSISDN, FirstName, InvoiceNumber } = req.body;

  console.log("✅ Confirmation received:");
  console.log(`Amount: ${TransAmount}`);
  console.log(`Transaction ID: ${TransID}`);
  console.log(`Phone: ${MSISDN}`);
  console.log(`Name: ${FirstName}`);
  console.log(`Invoice: ${InvoiceNumber}`);
  console.log("Full Payload:", JSON.stringify(req.body, null, 2));

  // Save to DB or process as needed

  res.status(200).json({ message: "Confirmation received successfully" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
