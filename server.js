import express from "express";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import winston from "winston";
import axios from "axios";

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

// Token management variables
let accessToken = '';
let tokenExpiry = 0;

// Token generation function
async function generateMpesaToken() {
  try {
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`
        }
      }
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 300000; // 5 min buffer
    logger.info('Generated new M-Pesa access token');
    return accessToken;
  } catch (error) {
    logger.error('Token generation failed:', error);
    throw error;
  }
}

// Token middleware
app.use('/mpesa-api/*', async (req, res, next) => {
  try {
    if (!accessToken || Date.now() >= tokenExpiry) {
      await generateMpesaToken();
    }
    req.mpesaToken = accessToken;
    next();
  } catch (error) {
    logger.error('Token middleware error:', error);
    res.status(503).json({ error: 'Service temporarily unavailable' });
  }
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
  if (req.method !== 'POST') {
    logger.warn(`Invalid method attempted: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

// New endpoint to simulate payments
app.post("/mpesa-api/simulate", async (req, res) => {
  try {
    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/c2b/v1/simulate',
      {
        ShortCode: process.env.MPESA_SHORTCODE || '6696416',
        CommandID: req.body.command || 'CustomerPayBillOnline',
        Amount: req.body.amount || '10',
        Msisdn: req.body.phone || '254708374149',
        BillRefNumber: req.body.reference || 'TEST'
      },
      {
        headers: {
          Authorization: `Bearer ${req.mpesaToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    logger.error('Simulation error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Payment simulation failed' });
  }
});

// Existing M-Pesa endpoints remain unchanged
app.post("/mpesa/validation", (req, res) => {
  console.log('Confirmation received:', req.body);
  res.status(200).json({ message: 'Confirmation received successfully' });
  /* ... existing validation code ... */
});

app.post("/mpesa/confirmation", async (req, res) => {
  /* ... existing confirmation code ... */
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

// Initial token generation and periodic refresh
generateMpesaToken().catch(logger.error);
setInterval(() => generateMpesaToken().catch(logger.error), 50 * 60 * 1000); // Refresh every 50 mins

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server is running on port ${PORT}`);
  console.log(`MPesa endpoints configured for shortcode: ${process.env.MPESA_SHORTCODE || '6696416'}`);
});