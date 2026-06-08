const express = require('express');
const router = express.Router();

// Helper to escape HTML characters to prevent injection
function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !message) return res.status(400).json({ success: false, message: 'Name and message required' });

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      });

      const escapedName = escapeHTML(name);
      const escapedEmail = escapeHTML(email || 'N/A');
      const escapedPhone = escapeHTML(phone || 'N/A');
      const escapedMessage = escapeHTML(message);

      await transporter.sendMail({
        from: `"RK BAZAAR" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `📩 New Contact: ${escapedName}`,
        html: `<h2>New Contact Message</h2>
               <p><b>Name:</b> ${escapedName}</p>
               <p><b>Email:</b> ${escapedEmail}</p>
               <p><b>Phone:</b> ${escapedPhone}</p>
               <p><b>Message:</b></p><p>${escapedMessage}</p>`
      });
    }

    res.json({ success: true, message: 'Message sent! We will reply soon.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;