import moment from "moment";

export function AccountVerificationTemplate({
  link,
}: {
  link: string;
}): string {
  const companyName = "Make Easy";
  const image =
    "https://webnox.blr1.digitaloceanspaces.com/MakeEasy/MakeEasy.png";
  const helpMail = "MakeEasy@gmail.com";
  const date = moment().format("DD-MM-YYYY");

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="ie=edge" />
        <title>Account Verification</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style="margin: 0; font-family: 'Poppins', sans-serif; background: #ffffff; font-size: 14px;">
        <div style="max-width: 680px; margin: 0 auto; padding: 45px 30px 60px; background: #f4f7ff; font-size: 14px; color: #434343;">
          <header>
            <table style="width: 100%;">
              <tbody>
                <tr>
                  <td>
                    <img alt="" src="${image}" height="30px" />
                  </td>
                  <td style="text-align: right;">
                    <span style="font-size: 16px; line-height: 30px; color: #434343;">${date}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </header>
  
          <main>
            <div style="margin-top: 70px; padding: 50px 30px; background: #ffffff; border-radius: 30px; text-align: center;">
              <h1 style="font-size: 24px; font-weight: 500; color: #1f1f1f;">Verify Your Email Address</h1>
              <p style="margin-top: 17px; font-size: 16px; font-weight: 500;">
                Thank you for registering with ${companyName}! Please verify your email address to complete your registration.
              </p>
              <p style="margin-top: 20px;">
                Click the button below to verify your email address:
              </p>
              <a href="${link}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #499fb6; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 5px;">
                Verify Email
              </a>
              <p style="margin-top: 20px;">If you did not create an account with us, please ignore this email.</p>
            </div>
  
            <p style="max-width: 400px; margin: 90px auto 0; text-align: center; font-weight: 500; color: #8c8c8c;">
              Need help? Contact us at
              <a href="mailto:${helpMail}" style="color: #499fb6; text-decoration: none;">${helpMail}</a>
            </p>
          </main>
  
          <footer style="max-width: 490px; margin: 20px auto 0; text-align: center; border-top: 1px solid #e6ebf1;">
            <p style="margin-top: 40px; font-size: 16px; font-weight: 600; color: #434343;">${companyName}</p>
            <p style="margin-top: 8px; color: #434343;">
              Address No.721/2, Venky complex, Second floor, Cross Cut Rd, Coimbatore, Tamil Nadu 641012
            </p>
            <p style="margin-top: 16px; color: #434343;">Copyright © ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
          </footer>
        </div>
      </body>
    </html>
    `;
}
