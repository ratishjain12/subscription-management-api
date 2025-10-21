import nodemailer from "nodemailer";
import { EMAIL_PASS } from "./env.js";

export const accountEmail = "ratishjain6@gmail.com";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: accountEmail,
    pass: EMAIL_PASS,
  },
});

export default transporter;
