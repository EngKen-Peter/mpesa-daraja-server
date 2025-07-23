// routes/registerUrl.js
import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

router.post("/", async (req, res) => {
  const { CONSUMER_KEY, CONSUMER_SECRET, SHORT_CODE, CALLBACK_BASE_URL } = process.env;

  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");

  try {
    // Step 1: Generate Access Token
    const tokenRes = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    const accessToken = tokenRes.data.access_token;

    // Step 2: Register Callback URLs
    const registerRes = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl",
      {
        ShortCode: SHORT_CODE,
        ResponseType: "Completed",
        ConfirmationURL: `${CALLBACK_BASE_URL}/confirmation`,
        ValidationURL: `${CALLBACK_BASE_URL}/validation`,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ URL Registration Response:", registerRes.data);
    res.json(registerRes.data);
  } catch (error) {
    console.error("❌ Failed to register URLs:", error.response?.data || error.message);
    res.status(500).json({ error: "URL registration failed" });
  }
});

export default router;
