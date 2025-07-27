require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');

const app = express();
const port = process.env.PORT || 3000;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;

const client = twilio(accountSid, authToken);

app.use(bodyParser.json());

// New verify OTP route
app.post('/verify-otp', async (req, res) => {
  console.log("Received in /verify-otp:", req.body); // 👈 Log incoming request

  const { verification_sid, otp } = req.body;

  if (!verification_sid || !otp) {
    const errorResponse = { status: 'error', message: 'Missing parameters' };
    console.log("Sending response:", errorResponse);
    return res.status(400).json(errorResponse);
  }

  try {
    // Check the verification code
    const verification_check = await client.verify.v2.services(serviceSid)
      .verificationChecks
      .create({
        code: otp,
        verificationSid: verification_sid
      });

    if (verification_check.status === 'approved') {
      const successResponse = { status: 'approved', message: 'OTP verified successfully' };
      console.log("Sending response:", successResponse);
      res.json(successResponse);
    } else {
      const pendingResponse = { status: 'pending', message: 'Invalid OTP code or verification pending' };
      console.log("Sending response:", pendingResponse);
      res.json(pendingResponse);
    }
  } catch (error) {
    const errorResponse = { status: 'error', message: error.message || 'Verification failed' };
    console.error("Twilio error:", error);
    console.log("Sending response:", errorResponse);
    res.status(500).json(errorResponse);
  }
});

// Existing send OTP route
app.post('/send-otp', async (req, res) => {
  const phone = req.body.phone;
  if (!phone) {
    return res.status(400).json({ status: 'error', message: 'Phone number required' });
  }
  try {
    const verification = await client.verify.v2.services(serviceSid)
      .verifications
      .create({ to: phone, channel: 'sms' });
    res.json({ status: 'success', verification_sid: verification.sid });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message || 'Failed to send OTP' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});