// server.js
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet'; // ✅ Import helmet

dotenv.config();

const app = express();

// ✅ Use Helmet with custom Content Security Policy (CSP)
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      imgSrc: ["'self'"],
      objectSrc: ["'none'"],
    },
  })
);

// ✅ Other middlewares
app.use(cors());
app.use(express.json());

// Load keys from .env
const consumerKey = process.env.CONSUMER_KEY || 'y53gLRv8sQfeB6yjCvwySJKAXLj9HUxiCe23Gy0bQ67jWLXe';
const consumerSecret = process.env.CONSUMER_SECRET || 'cRI1pLYTS3iXU9VLpiob0ruSbSwsuc74etocGPUoa4FNCiAQ9epFbiiB9PkFUFmT';

const baseURL = 'https://sandbox.safaricom.co.ke';

// Step 1: Generate Access Token
const getAccessToken = async () => {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  try {
    const response = await axios.get(`${baseURL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    return response.data.access_token;
  } catch (err) {
    console.error('Access token error:', err.response?.data || err.message);
    return null;
  }
};

// Step 2: Register Confirmation and Validation URLs
app.post('/register-url', async (req, res) => {
  const accessToken = await getAccessToken();
  if (!accessToken) return res.status(500).json({ error: 'Access token failed' });

  try {
    const response = await axios.post(
      `${baseURL}/mpesa/c2b/v1/registerurl`,
      {
        ShortCode: '6696416',
        ResponseType: 'Completed',
        ConfirmationURL: 'https://mpesa-daraja-server.onrender.com/confirmation',
        ValidationURL: 'https://mpesa-daraja-server.onrender.com/validation',
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    res.status(200).json(response.data);
  } catch (err) {
    console.error('Register URL error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Register URL failed' });
  }
});

// Step 3: Webhooks
app.post('/confirmation', (req, res) => {
  console.log('✅ Confirmation Received:', req.body);
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

app.post('/validation', (req, res) => {
  console.log('🟡 Validation Received:', req.body);
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Validation passed successfully' });
});

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
