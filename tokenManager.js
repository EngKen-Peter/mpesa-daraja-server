import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const CONSUMER_KEY = 'y53gLRv8sQfeB6yjCvwySJKAXLj9HUxiCe23Gy0bQ67jWLXe';
const CONSUMER_SECRET = 'cRI1pLYTS3iXU9VLpiob0ruSbSwsuc74etocGPUoa4FNCiAQ9epFbiiB9PkFUFmT';

let accessToken = '';
let tokenExpiry = 0;

// Add this validation at the top of generateMpesaToken()
if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET) {
  throw new Error('M-Pesa credentials not configured');
}

async function generateToken() {
  try {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    
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
    console.log('New token generated:', accessToken);
    return accessToken;
  } catch (error) {
    console.error('Token generation failed:', error.response?.data || error.message);
    throw error;
  }
}

export async function getValidToken() {
  if (!accessToken || Date.now() >= tokenExpiry) {
    await generateToken();
  }
  return accessToken;
}

// Auto-refresh token every 50 minutes
setInterval(async () => {
  await generateToken();
}, 50 * 60 * 1000);

// Initial token generation
generateToken();