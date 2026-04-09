const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !message) return res.status(400).json({ success: false, message: 'Name and message required' });

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      });
      await transporter.sendMail({
        from: `"RK BAZAAR" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `📩 New Contact: ${name}`,
        html: `<h2>New Contact Message</h2>
               <p><b>Name:</b> ${name}</p>
               <p><b>Email:</b> ${email || 'N/A'}</p>
               <p><b>Phone:</b> ${phone || 'N/A'}</p>
               <p><b>Message:</b></p><p>${message}</p>`
      });
    }

    res.json({ success: true, message: 'Message sent! We will reply soon.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;