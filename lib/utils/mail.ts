import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const path =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:3000"
    : process.env.NEXT_PUBLIC_APP_URL;

const emailTemplate = (
  title: string,
  content: string,
  buttonText?: string,
  buttonLink?: string,
  isWelcome?: boolean
) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="x-apple-disable-message-reformatting">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #0f172a 100%); min-height: 100vh;">
      
      <!-- Main Container -->
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        
        <!-- Email Card -->
        <div style="position: relative; background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 50%, rgba(30, 41, 59, 0.95) 100%); border-radius: 24px; overflow: hidden; backdrop-filter: blur(40px); border: 1px solid rgba(71, 85, 105, 0.3); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);">
          
          <!-- Glass overlay effect -->
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);"></div>
          
          <!-- Header Section -->
          <div style="position: relative; padding: 48px 40px 40px; text-align: center; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 50%, rgba(16, 185, 129, 0.03) 100%); border-bottom: 1px solid rgba(71, 85, 105, 0.3);">
            
            <!-- Brand Logo and Name -->
            <div style="display: inline-flex; align-items: center; gap: 16px; margin-bottom: 32px;">
              <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3); border: 1px solid rgba(59, 130, 246, 0.5);">
                <span style="color: white; font-weight: 700; font-size: 24px; letter-spacing: -0.5px;">A</span>
              </div>
              <div>
                <span style="color: #f8fafc; font-size: 28px; font-weight: 700; letter-spacing: -0.75px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">AuthService</span>
                <div style="height: 2px; background: linear-gradient(90deg, #3b82f6, #8b5cf6); border-radius: 1px; margin-top: 4px; opacity: 0.6;"></div>
              </div>
            </div>
            
            <!-- Title -->
            <h1 style="color: #f8fafc; font-size: 32px; font-weight: 700; margin: 0; line-height: 1.2; letter-spacing: -0.5px; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);">${title}</h1>
            
          </div>

          <!-- Content Section -->
          <div style="padding: 48px 40px; position: relative;">
            
            <!-- Subtle background pattern -->
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.03; background-image: radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.3) 1px, transparent 0); background-size: 20px 20px;"></div>
            
            <div style="position: relative; text-align: center;">
              
              <!-- Main Content -->
              <p style="color: #cbd5e1; font-size: 18px; line-height: 1.7; margin: 0 0 40px 0; font-weight: 400;">${content}</p>
              
              ${
                buttonText && buttonLink
                  ? `
                <!-- Action Button -->
                <div style="margin: 40px 0;">
                  <a href="${buttonLink}" style="display: inline-block; background: linear-gradient(135deg, ${
                    isWelcome
                      ? "#10b981 0%, #059669 100%"
                      : "#1d4ed8 0%, #1e40af 100%"
                  }); color: white; text-decoration: none; padding: 18px 36px; border-radius: 12px; font-size: 18px; font-weight: 600; text-align: center; box-shadow: 0 12px 20px -4px ${
                    isWelcome
                      ? "rgba(16, 185, 129, 0.4)"
                      : "rgba(29, 78, 216, 0.4)"
                  }, 0 0 0 1px rgba(255, 255, 255, 0.1); transition: all 0.3s ease; letter-spacing: -0.25px; border: 1px solid ${
                    isWelcome
                      ? "rgba(16, 185, 129, 0.5)"
                      : "rgba(29, 78, 216, 0.5)"
                  };">
                    ${buttonText}
                  </a>
                </div>`
                  : ""
              }
            </div>

            ${
              isWelcome
                ? `
            <!-- Welcome Features Section -->
            <div style="margin-top: 56px; padding-top: 40px; border-top: 1px solid rgba(71, 85, 105, 0.3); position: relative;">
              
              <h3 style="color: #f1f5f9; font-size: 20px; font-weight: 600; margin: 0 0 32px 0; text-align: center; letter-spacing: -0.25px;">What's next?</h3>
              
              <div style="display: grid; gap: 20px; max-width: 480px; margin: 0 auto;">
                
                <!-- Feature 1 -->
                <div style="display: flex; align-items: center; gap: 16px; padding: 20px; background: rgba(51, 65, 85, 0.4); border-radius: 12px; border: 1px solid rgba(71, 85, 105, 0.4); backdrop-filter: blur(8px);">
                  <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                    <span style="font-size: 18px;">⚙️</span>
                  </div>
                  <div>
                    <p style="color: #f1f5f9; font-weight: 600; margin: 0 0 4px 0; font-size: 16px;">Complete your profile</p>
                    <p style="color: #94a3b8; margin: 0; font-size: 14px;">Add your personal information and preferences</p>
                  </div>
                </div>
                
                <!-- Feature 2 -->
                <div style="display: flex; align-items: center; gap: 16px; padding: 20px; background: rgba(51, 65, 85, 0.4); border-radius: 12px; border: 1px solid rgba(71, 85, 105, 0.4); backdrop-filter: blur(8px);">
                  <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                    <span style="font-size: 18px;">🛡️</span>
                  </div>
                  <div>
                    <p style="color: #f1f5f9; font-weight: 600; margin: 0 0 4px 0; font-size: 16px;">Enable two-factor authentication</p>
                    <p style="color: #94a3b8; margin: 0; font-size: 14px;">Add an extra layer of security to your account</p>
                  </div>
                </div>
                
                <!-- Feature 3 -->
                <div style="display: flex; align-items: center; gap: 16px; padding: 20px; background: rgba(51, 65, 85, 0.4); border-radius: 12px; border: 1px solid rgba(71, 85, 105, 0.4); backdrop-filter: blur(8px);">
                  <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                    <span style="font-size: 18px;">🚀</span>
                  </div>
                  <div>
                    <p style="color: #f1f5f9; font-weight: 600; margin: 0 0 4px 0; font-size: 16px;">Explore the platform</p>
                    <p style="color: #94a3b8; margin: 0; font-size: 14px;">Discover all the features available to you</p>
                  </div>
                </div>
                
              </div>
            </div>
            `
                : ""
            }
          </div>

          <!-- Footer Section -->
          <div style="padding: 40px; background: rgba(15, 23, 42, 0.9); text-align: center; border-top: 1px solid rgba(71, 85, 105, 0.3); position: relative;">
            
            <!-- Security Notice -->
            <p style="font-size: 14px; color: #64748b; margin: 0 0 16px 0; line-height: 1.5;">
              If you didn't request this email, please ignore it. This email was sent from a secure server.
            </p>
            
            <!-- Signature -->
            <p style="font-size: 14px; color: #64748b; margin: 0 0 24px 0;">
              Best regards,<br>
              <span style="color: #94a3b8; font-weight: 600;">The AuthService Team</span>
            </p>
            
            <!-- Decorative Elements -->
            <div style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 32px;">
              <div style="width: 8px; height: 8px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 50%; opacity: 0.6; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);"></div>
              <div style="width: 8px; height: 8px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; opacity: 0.6; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);"></div>
              <div style="width: 8px; height: 8px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); border-radius: 50%; opacity: 0.6; box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);"></div>
            </div>
            
          </div>
        </div>
        
        <!-- Email Client Support Text -->
        <div style="text-align: center; margin-top: 32px;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} AuthService. Secure authentication for modern applications.
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `;
};

export async function sendVerificationEmail(email: string, token: string) {
  const confirmLink = `${path}/new-verification?token=${token}`;

  await resend.emails.send({
    from: "AuthService <noreply@mocktalk.dev>",
    to: email,
    subject: "Confirm Your Email Address",
    html: emailTemplate(
      "Confirm Your Email",
      "Welcome to AuthService! Please confirm your email address to complete your account setup and start using our secure authentication platform.",
      "Verify Email Address",
      confirmLink
    ),
  });
}

export async function sendResetPasswordEmail(email: string, token: string) {
  const resetLink = `${path}/new-password?token=${token}`;

  await resend.emails.send({
    from: "AuthService <noreply@mocktalk.dev>",
    to: email,
    subject: "Reset Your Password",
    html: emailTemplate(
      "Reset Your Password",
      "We received a request to reset your password. Click the button below to create a new password. This link will expire in 1 hour for security reasons.",
      "Reset Password",
      resetLink
    ),
  });
}

export async function sendTwoFactorTokenEmail(email: string, token: string) {
  await resend.emails.send({
    from: "AuthService <noreply@mocktalk.dev>",
    to: email,
    subject: "Your Two-Factor Authentication Code",
    html: emailTemplate(
      "Two-Factor Authentication",
      `Your two-factor authentication code is: <br><br><div style='font-family: Monaco, Consolas, monospace; font-size: 36px; font-weight: bold; color: #3b82f6; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05)); padding: 20px 32px; border-radius: 12px; border: 2px solid rgba(59, 130, 246, 0.3); display: inline-block; letter-spacing: 6px; box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2); backdrop-filter: blur(8px);'>${token}</div><br><br>This code will expire in 5 minutes for your security.`
    ),
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  await resend.emails.send({
    from: "AuthService <welcome@mocktalk.dev>",
    to: email,
    subject: "Welcome to AuthService! 🎉",
    html: emailTemplate(
      `Welcome, ${name}!`,
      `Thank you for joining AuthService! Your account is now fully activated and ready to use. We're excited to have you as part of our community and look forward to providing you with secure, reliable authentication for all your applications.`,
      "Get Started",
      `${path}/dashboard`,
      true // isWelcome flag
    ),
  });
}

// New function to schedule welcome email with delay
export async function scheduleWelcomeEmail(
  email: string,
  name: string,
  delayMinutes: number = 3
) {
  setTimeout(
    async () => {
      try {
        await sendWelcomeEmail(email, name);
        console.log(
          `Welcome email sent to ${email} after ${delayMinutes} minute(s) delay`
        );
      } catch (error) {
        console.error(`Failed to send welcome email to ${email}:`, error);
      }
    },
    delayMinutes * 60 * 1000
  ); // Convert minutes to milliseconds
}
