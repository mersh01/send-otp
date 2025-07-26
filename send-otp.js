require('dotenv').config(); // Load env vars

const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');

const app = express();
const port = process.env.PORT || 3000;

// Load Twilio credentials from environment
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;

const client = twilio(accountSid, authToken);

app.use(bodyParser.json());

app.post('/send-otp', async (req, res) => {
    const phone = req.body.phone;

    if (!phone) {
        return res.status(400).json({ status: 'error', message: 'Phone number required' });
    }

    try {
        const verification = await client.verify.v2.services(serviceSid)
            .verifications
            .create({ to: phone, channel: 'sms' });

        res.json({
            status: 'success',
            verification_sid: verification.sid
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to send OTP'
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
