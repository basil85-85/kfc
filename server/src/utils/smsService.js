const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const twilio = require('twilio');

const getTwilioClient = () => {
  const sid = (process.env.TWILIO_SID || '').trim();
  const token = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  if (sid && token) {
    try {
      return twilio(sid, token);
    } catch (e) {
      console.error('Twilio initialization failed:', e.message);
    }
  }
  return null;
};

const sendSMS = async ({ to, body }) => {
  if (!to || !to.trim()) {
    return { success: false, error: 'Recipient phone number is missing' };
  }

  let formattedTo = to.trim();
  if (!formattedTo.startsWith('+')) {
    formattedTo = `+${formattedTo}`;
  }

  const client = getTwilioClient();
  const from = (process.env.TWILIO_PHONE_NUMBER || '').trim();

  if (!client || !from) {
    console.log('\n📱 ==================== SMS SIMULATION MODE ====================');
    console.log(`To: ${formattedTo}`);
    console.log(`Body: ${body}`);
    console.log('===============================================================\n');
    return { success: true, simulated: true };
  }

  try {
    const res = await client.messages.create({ body, from, to: formattedTo });
    console.log(`📲 [SMS Sent via Twilio] SID: ${res.sid} to ${formattedTo}`);
    return { success: true, sid: res.sid };
  } catch (err) {
    console.error(`❌ [Twilio Send Error] Failed to send SMS to ${formattedTo}:`, err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { sendSMS };
