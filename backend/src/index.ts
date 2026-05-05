import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import nodemailer from 'nodemailer';
import ContactSupport from './models/contactSupport';


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || '';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const createContactSupportEmail = (name: string, email: string, message: string) => {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\r?\n/g, '<br />');

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>New Contact Support Message</title>
  </head>
  <body style="margin:0; padding:0; background:#f8fafc; font-family:Arial, Helvetica, sans-serif; color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; background:#15172a; border-radius:12px; overflow:hidden; box-shadow:0 18px 45px rgba(15, 23, 42, 0.18);">
            <tr>
              <td style="padding:28px 32px; border-bottom:1px solid rgba(255,255,255,0.1);">
                <p style="margin:0 0 8px; color:#93c5fd; font-size:12px; font-weight:700; letter-spacing:1.6px; text-transform:uppercase;">Contact Support</p>
                <h1 style="margin:0; color:#ffffff; font-size:24px; line-height:1.3; font-weight:700;">New support message received</h1>
                <p style="margin:10px 0 0; color:#aab4c4; font-size:14px; line-height:1.6;">A visitor submitted a message from the contact support form.</p>
              </td>
            </tr>

            <tr>
              <td style="padding:28px 32px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:rgba(255,255,255,0.06); border:1px solid rgba(147,197,253,0.24); border-radius:10px;">
                  <tr>
                    <td style="padding:20px; border-bottom:1px solid rgba(255,255,255,0.08);">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td width="52" valign="top">
                            <div style="width:42px; height:42px; line-height:42px; border-radius:50%; background:#2563eb; color:#ffffff; text-align:center; font-size:18px; font-weight:700;">
                              ${safeName.charAt(0).toUpperCase() || 'U'}
                            </div>
                          </td>
                          <td valign="top">
                            <p style="margin:0 0 4px; color:#ffffff; font-size:16px; font-weight:700;">${safeName}</p>
                            <a href="mailto:${safeEmail}" style="color:#93c5fd; font-size:13px; text-decoration:none;">${safeEmail}</a>
                          </td>
                          <td align="right" valign="top">
                            <span style="display:inline-block; padding:4px 10px; border-radius:999px; background:rgba(37,99,235,0.18); color:#bfdbfe; font-size:11px; font-weight:700; letter-spacing:0.8px; text-transform:uppercase;">Support</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:22px 20px;">
                      <p style="margin:0 0 10px; color:#94a3b8; font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase;">Message</p>
                      <div style="color:#dbeafe; font-size:15px; line-height:1.75; word-break:break-word;">
                        ${safeMessage}
                      </div>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;">
                  <tr>
                    <td style="padding:16px 18px; background:#eff6ff; border-radius:8px; color:#1e3a8a; font-size:13px; line-height:1.6;">
                      Reply directly to this email to respond to <strong>${safeName}</strong>.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
};

const namePattern = /^[\p{L}][\p{L}\s'.-]*$/u;
const nameValidationMessage =
  "Name must start with a letter and can only include letters, spaces, apostrophes, periods, or hyphens.";


mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000, 
})
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.post('/contact-support', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof message !== 'string' ||
      !name.trim() ||
      !email.trim() ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required',
      });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!namePattern.test(trimmedName)) {
      return res.status(400).json({
        success: false,
        message: nameValidationMessage,
      });
    }

    const contact = await ContactSupport.create({
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage,
    });

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: 'reymelaquino9@gmail.com',
      replyTo: trimmedEmail,
      subject: 'New Contact Support Message',
      text: `
Name: ${trimmedName}
Email: ${trimmedEmail}

Message:
${trimmedMessage}
      `,
      html: createContactSupportEmail(trimmedName, trimmedEmail, trimmedMessage),
    });

    res.status(201).json({
      success: true,
      message: 'Support message saved and email sent',
      data: contact,
    });
  } catch (error) {
    console.error('Contact support error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to send support message',
    });
  }
});




app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
