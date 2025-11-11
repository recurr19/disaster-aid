const RegisteredNGO = require('../models/RegisteredNGO');
const User = require('../models/User');

// Twilio SMS (optional)
let twilioClient = null;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    // Lazy-require to avoid dependency issues if not installed
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
} catch (e) {
  console.error('Twilio init failed:', e);
}

// SendGrid Email (optional)
let sgMail = null;
try {
  if (process.env.SENDGRID_API_KEY) {
    sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }
} catch (e) {
  console.error('SendGrid init failed:', e);
}

async function sendSMS(toPhone, body) {
  if (!toPhone || !twilioClient || !process.env.TWILIO_FROM) return false;
  try {
    await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_FROM,
      to: toPhone
    });
    return true;
  } catch (e) {
    console.error('SMS send failed:', e?.message || e);
    return false;
  }
}

async function sendEmail(toEmail, subject, text) {
  if (!toEmail || !sgMail || !process.env.EMAIL_FROM) return false;
  try {
    await sgMail.send({
      to: toEmail,
      from: process.env.EMAIL_FROM,
      subject,
      text
    });
    return true;
  } catch (e) {
    console.error('Email send failed:', e?.message || e);
    return false;
  }
}

module.exports = {
  async ticketCreated(ticket) {
    const smsBody = `DisasterAid: Request received. Ticket ${ticket.ticketId}. We are matching NGOs.`;
    const sentSMS = await sendSMS(ticket.phone, smsBody);
    if (!sentSMS) {
      console.log(`[Notify] (fallback) Ticket created ${ticket.ticketId} for ${ticket.phone || ticket.name}`);
    }
  },
  async ticketMatched(ticket, proposals) {
    const count = Array.isArray(proposals) ? proposals.length : 0;
    const smsBody = `DisasterAid: We found ${count} NGO match(es) for Ticket ${ticket.ticketId}. Check status for updates.`;
    const sentSMS = await sendSMS(ticket.phone, smsBody);
    if (!sentSMS) {
      console.log(`[Notify] (fallback) Ticket ${ticket.ticketId} matched proposals: ${count}`);
    }
  },
  async ngoAccepted(ticket, ngoId) {
    try {
      const ngo = await RegisteredNGO.findById(ngoId).populate('user', 'email').lean();
      const ngoName = ngo?.organizationName || 'NGO';
      const citizenMsg = `DisasterAid: ${ngoName} accepted your request. Ticket ${ticket.ticketId}. They will contact you.`;
      const ngoMsg = `DisasterAid: You accepted Ticket ${ticket.ticketId}. Please coordinate with the citizen.`;

      const citizenSMS = await sendSMS(ticket.phone, citizenMsg);
      if (!citizenSMS) {
        console.log(`[Notify] (fallback) Citizen informed of NGO acceptance. Ticket ${ticket.ticketId}`);
      }

      // Notify NGO via SMS if phone present
      const ngoSMS = await sendSMS(ngo?.phone, ngoMsg);
      if (!ngoSMS) {
        console.log(`[Notify] (fallback) NGO informed of acceptance. NGO ${ngoId}, Ticket ${ticket.ticketId}`);
      }

      // Optional email to NGO.user.email
      if (ngo?.user?.email) {
        await sendEmail(ngo.user.email, `Accepted Ticket ${ticket.ticketId}`, ngoMsg);
      }
    } catch (e) {
      console.error('Notify ngoAccepted failed:', e);
    }
  },
  async ticketStatusUpdated(ticket, status) {
    const smsBody = `DisasterAid: Ticket ${ticket.ticketId} status updated to ${status}.`;
    const sentSMS = await sendSMS(ticket.phone, smsBody);
    if (!sentSMS) {
      console.log(`[Notify] (fallback) Ticket ${ticket.ticketId} status updated to ${status}`);
    }
  }
};


