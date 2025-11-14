import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM;

class Mail {
  private transporter;
  private static instance: Mail;

  private constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      host: host,
      port: 465,
      secure: true,
      auth: {
        user,
        pass,
      },
    });
  }

  public static getInstance(): Mail {
    if (!Mail.instance) {
      Mail.instance = new Mail();
    }
    return Mail.instance;
  }

  async sendMail({
    to,
    subject,
    template,
  }: {
    to: string;
    subject: string;
    template: string;
  }): Promise<string | boolean> {
    return new Promise<string | boolean>((resolve, reject) => {
      this.transporter.sendMail(
        {
          from: {
            name: "Make Easy",
            address: from!,
          },
          to: to,
          subject: subject,
          text: "",
          html: template,
        },
        (error: Error | null, info: any) => {
          if (error) {
            return reject(error);
          }
          if (!info.messageId) {
            return resolve(false);
          }
          resolve(info.messageId);
        }
      );
    });
  }
}

export const mail = Mail.getInstance();
