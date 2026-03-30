import { Router } from "express";

const router = Router();

router.post("/contact", (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are required." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }

  console.log("=== NEW CONTACT FORM SUBMISSION ===");
  console.log(`Name: ${name}`);
  console.log(`Email: ${email}`);
  console.log(`Subject: ${subject || "(none)"}`);
  console.log(`Message: ${message}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log("===================================");

  return res.json({ success: true, message: "Thank you for your message. We'll be in touch soon." });
});

export default router;
