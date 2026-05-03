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

  req.log.info(
    {
      type: "contact_form",
      name,
      email,
      subject: subject || null,
      messageLength: typeof message === "string" ? message.length : 0,
    },
    "contact form submission",
  );

  return res.json({ success: true, message: "Thank you for your message. We'll be in touch soon." });
});

export default router;
