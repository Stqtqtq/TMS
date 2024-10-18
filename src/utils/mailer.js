import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config()

// Create a SMTP transporter object
export const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD
  }
})
