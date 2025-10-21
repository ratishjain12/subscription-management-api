import { emailTemplates } from "./email-template.js";
import dayjs from "dayjs";
import transporter, { accountEmail } from "../config/nodemailer.js";

export const sendReminderEmail = async ({ to, type, subscription }) => {
  if (!to || !type || !subscription) {
    throw new Error("Missing required fields");
  }

  const template = emailTemplates.find((template) => template.label === type);

  if (!template) throw new Error("Invalid template type");

  const mailInfo = {
    userName: subscription.user.username,
    subscriptionName: subscription.name,
    renewalDate: dayjs(subscription.renewalDate).format("MMM D, YYYY"),
    planName: subscription.name,
    price: `${subscription.currency} ${subscription.price}(${subscription.frequency})`,
    paymentMethod: subscription.paymentMethod,
  };

  const emailBody = template.generateBody(mailInfo);
  const emailSubject = template.generateSubject(mailInfo);

  const mailOptions = await transporter.sendMail({
    from: accountEmail,
    to,
    subject: emailSubject,
    html: emailBody,
  });

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email");
    }

    console.log("Email sent successfully:", info.response);
  });
};
