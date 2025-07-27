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
app.post("/verify-otp", async (req, res) => {
  const { verification_sid, otp } = req.body;
  console.log("Received in /verify-otp:", req.body);

  try {
    const verificationCheck = await client.verify.v2
      .services(verification_sid)
      .verificationChecks.create({ code: otp });

    console.log("Verification check result:", verificationCheck.status);
    res.json({ success: verificationCheck.status === "approved" });
  } catch (error) {
    console.error("Twilio verification error:", error);
    res.status(500).json({ success: false, error: error.message });
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