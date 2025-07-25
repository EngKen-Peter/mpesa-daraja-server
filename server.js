import express from "express";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import winston from "winston";

// Load environment variables
dotenv.config();

// Create app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'mpesa.log' })
  ],
});

// For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Safaricom IP whitelist (for production)
const SAFARICOM_IPS = ['196.201.214.200', '196.201.214.206'];

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(express.static(path.join(__dirname, "public")));

// MPesa-specific middleware
app.use('/mpesa/*', (req, res, next) => {
  // Method validation
  if (req.method !== 'POST') {
    logger.warn(`Invalid method attempted: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // IP validation in production
  if (process.env.NODE_ENV === 'production' && !SAFARICOM_IPS.includes(req.ip)) {
    logger.warn(`Unauthorized IP attempt: ${req.ip}`);
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
});

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// M-Pesa validation endpoint
app.post("/mpesa/validation", (req, res) => {
  try {
    logger.info('Validation request received', { body: req.body });
    
    // Basic validation
    if (!req.body.BillRefNumber || !req.body.MSISDN) {
      logger.warn('Invalid validation payload', { body: req.body });
      return res.status(400).json({ ResultCode: 1, ResultDesc: "Invalid payload" });
    }

    // Additional business validation logic here
    // Example: Check if BillRefNumber exists in your system
    
    res.status(200).json({ 
      ResultCode: 0, 
      ResultDesc: "Accepted",
      ThirdPartyTransID: req.body.TransID || ""
    });
  } catch (error) {
    logger.error('Validation error', { error });
    res.status(500).json({ ResultCode: 1, ResultDesc: "Internal Error" });
  }
});

// M-Pesa confirmation endpoint
app.post("/mpesa/confirmation", async (req, res) => {
  try {
    const payload = req.body;
    logger.info('Confirmation received', { payload });

    // Essential validation
    if (!payload.TransID || !payload.MSISDN) {
      logger.warn('Invalid confirmation payload', { payload });
      return res.status(400).json({ ResultCode: 1, ResultDesc: "Invalid payload" });
    }

    // Prevent duplicate processing
    // const existing = await Transaction.findOne({ transactionId: payload.TransID });
    // if (existing) {
    //   return res.status(200).json({ ResultCode: 0, ResultDesc: "Duplicate ignored" });
    // }

    // Process payment (example structure)
    const transaction = {
      transactionId: payload.TransID,
      amount: parseFloat(payload.TransAmount),
      phone: payload.MSISDN,
      accountNumber: payload.BillRefNumber,
      name: payload.FirstName || 'N/A',
      timestamp: new Date(),
      rawData: JSON.stringify(payload)
    };

    // Save to database (uncomment when you have your DB setup)
    // await Transaction.create(transaction);
    
    logger.info(`Payment processed: ${payload.TransAmount} from ${payload.MSISDN}`);

    res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    logger.error('Confirmation processing error', { error });
    res.status(500).json({ ResultCode: 1, ResultDesc: "Error processing" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Server error', { 
    error: err.message,
    stack: err.stack,
    url: req.originalUrl
  });
  
  res.status(500).json({ 
    ResultCode: 1,
    ResultDesc: 'Internal Server Error' 
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server is running on port ${PORT}`);
  console.log(`MPesa endpoints configured for shortcode: ${process.env.MPESA_SHORTCODE || '6696416'}`);
});