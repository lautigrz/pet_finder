import { createTransport } from "nodemailer";
import { IEmailService } from "@domain/services/IEmailService";
import { LogEmailService } from "./LogEmailService";
import { NodemailerEmailService } from "./NodemailerEmailService";
import { SendgridEmailService } from "./SendgridEmailService";
import { readEmailConfig } from "./email.config";

export function createEmailService(): IEmailService {
  const config = readEmailConfig();
  if (config.provider === "log") {
    return new LogEmailService();
  }
  if (config.provider === "sendgrid") {
    return new SendgridEmailService(config.sendgridApiKey!, config.from!, config.appBaseUrl!);
  }
  const transporter = createTransport({
    service: "gmail",
    auth: { user: config.gmailUser!, pass: config.gmailAppPassword! },
  });
  return new NodemailerEmailService(transporter, config.from!, config.appBaseUrl!);
}
