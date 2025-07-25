import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { scheduleWelcomeEmail } from "@/lib/utils/mail";

interface WelcomeEmailParams {
  userId: string;
  email: string;
  name: string;
  isFirstLogin?: boolean;
  signupMethod?: "email" | "oauth";
}

/**
 * Handles welcome email logic for both email and OAuth users
 */
export async function handleWelcomeEmail({
  userId,
  email,
  name,
  isFirstLogin = false,
  signupMethod = "email",
}: WelcomeEmailParams): Promise<void> {
  try {
    // Get user data to check welcome email status
    const [user] = await db
      .select({
        welcomeEmailSent: users.welcomeEmailSent,
        firstLoginAt: users.firstLoginAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      console.error(`User not found for welcome email: ${userId}`);
      return;
    }

    // Check if welcome email already sent
    if (user.welcomeEmailSent) {
      console.log(`Welcome email already sent to ${email}`);
      return;
    }

    // For email users: send welcome email after verification
    // For OAuth users: send welcome email after first login
    const shouldSendWelcomeEmail =
      (signupMethod === "email" && !isFirstLogin) || // Email verification flow
      (signupMethod === "oauth" && isFirstLogin); // First OAuth login

    if (shouldSendWelcomeEmail) {
      // Update first login time if it's a first login
      if (isFirstLogin && !user.firstLoginAt) {
        await db
          .update(users)
          .set({
            firstLoginAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      }

      // Schedule welcome email with 3-minute delay
      await scheduleWelcomeEmail(email, name, 3);

      // Mark welcome email as sent
      await db
        .update(users)
        .set({
          welcomeEmailSent: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      console.log(`Welcome email scheduled for ${email} in 3 minutes`);
    }
  } catch (error) {
    console.error(`Error handling welcome email for ${email}:`, error);
  }
}

/**
 * Check if user needs welcome email on login
 */
export async function checkWelcomeEmailOnLogin(userId: string): Promise<{
  needsWelcomeEmail: boolean;
  isFirstLogin: boolean;
  user: {
    email: string;
    name: string;
    signupMethod: string;
  } | null;
}> {
  try {
    const [user] = await db
      .select({
        email: users.email,
        name: users.name,
        firstLoginAt: users.firstLoginAt,
        welcomeEmailSent: users.welcomeEmailSent,
        signupMethod: users.signupMethod,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.email || !user.name) {
      return {
        needsWelcomeEmail: false,
        isFirstLogin: false,
        user: null,
      };
    }

    const isFirstLogin = !user.firstLoginAt;
    const needsWelcomeEmail = !user.welcomeEmailSent && isFirstLogin;

    return {
      needsWelcomeEmail,
      isFirstLogin,
      user: {
        email: user.email,
        name: user.name,
        signupMethod: user.signupMethod || "email",
      },
    };
  } catch (error) {
    console.error(`Error checking welcome email status:`, error);
    return {
      needsWelcomeEmail: false,
      isFirstLogin: false,
      user: null,
    };
  }
}
