const https = require('https');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;

// This would be your serverless function handler (e.g., for Vercel/Netlify)
module.exports = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ status: 'error', message: 'Method not allowed' });
      return;
    }

    // Get request body
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const verificationSid = data.verification_sid || '';
        const otp = data.otp || '';

        if (!verificationSid || !otp) {
          res.status(400).json({ status: 'error', message: 'Missing parameters' });
          return;
        }

        // Twilio API request options
        const options = {
          hostname: 'verify.twilio.com',
          path: `/v2/Services/${serviceSid}/VerificationCheck`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
          }
        };

        // Prepare POST data
        const postData = new URLSearchParams();
        postData.append('Code', otp);
        postData.append('VerificationSid', verificationSid);

        // Make request to Twilio
        const twilioReq = https.request(options, twilioRes => {
          let responseData = '';
          
          twilioRes.on('data', chunk => {
            responseData += chunk;
          });

          twilioRes.on('end', () => {
            const result = JSON.parse(responseData);
            
            if (twilioRes.statusCode === 200 && result.status === 'approved') {
              res.status(200).json({
                status: 'approved',
                message: 'OTP verified successfully'
              });
            } else {
              res.status(400).json({
                status: 'pending',
                message: result.message || 'Invalid OTP code'
              });
            }
          });
        });

        twilioReq.on('error', error => {
          throw new Error(`Twilio request failed: ${error.message}`);
        });

        twilioReq.write(postData.toString());
        twilioReq.end();

      } catch (error) {
        res.status(500).json({
          status: 'error',
          message: error.message
        });
      }
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};