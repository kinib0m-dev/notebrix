"use server";

import {
  deleteAccountSchema,
  loginSchema,
  newPasswordSchema,
  registerSchema,
  resetSchema,
} from "@/lib/auth/validation/auth-schemas";
import { z } from "zod";
import { signIn, signOut, revokeAllUserSessions, auth } from "@/auth";
import { AuthError } from "next-auth";
import {
  sendResetPasswordEmail,
  sendTwoFactorTokenEmail,
  sendVerificationEmail,
} from "@/lib/utils/mail";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { ratelimit } from "@/lib/utils/ratelimit";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  passwordResetTokens,
  twoFactorConfirmation,
  twoFactorTokens,
  users,
  verificationTokens,
} from "@/db/schema";
import {
  getUserByEmail,
  getUserById,
  updateAccountStatus,
} from "./helpers/user";
import {
  generateResetPasswordToken,
  generateTwoFactorToken,
  generateVerificationToken,
} from "./helpers/tokens";
import {
  getTwoFactorConfirmationByUserId,
  getTwoFactorTokenByEmail,
} from "./helpers/twoFactor";
import { recordLoginActivity } from "./helpers/activity";
import { getVerificationTokenByToken } from "./helpers/verificationToken";
import { getPasswordResetTokenByToken } from "./helpers/passwordReset";
import { DEFAULT_LOGIN_REDIRECT } from "./routes/routes";
import {
  handleWelcomeEmail,
  checkWelcomeEmailOnLogin,
} from "./helpers/welcome";

export async function signInAction(values: z.infer<typeof loginSchema>) {
  const validatedFields = loginSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid Fields!",
    };
  }

  const { email, password, code } = validatedFields.data;

  // Implement a rate limiter to prevent DDOS
  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  const userAgent = (await headers()).get("user-agent") || "";
  const { success } = await ratelimit.limit(ip);

  if (!success) return redirect("/too-fast");

  // We check if there are any existing users with that email
  const existingUser = await getUserByEmail(email);

  if (!existingUser || !existingUser.email || !existingUser.password) {
    return {
      success: false,
      message: "Invalid Credentials!",
    };
  }

  // Check account status
  if (existingUser.accountStatus === "suspended") {
    return {
      success: false,
      message: "Your account has been suspended. Please contact support.",
    };
  }

  if (existingUser.accountStatus === "deleted") {
    return {
      success: false,
      message: "Account not found.",
    };
  }

  // Check if account is locked
  if (
    existingUser.lockedUntil &&
    new Date(existingUser.lockedUntil) > new Date()
  ) {
    const remainingLockTime = Math.ceil(
      (new Date(existingUser.lockedUntil).getTime() - new Date().getTime()) /
        (60 * 1000)
    );

    return {
      success: false,
      message: `Account is temporarily locked. Please try again in ${remainingLockTime} minute${
        remainingLockTime !== 1 ? "s" : ""
      }.`,
    };
  }

  // Check email verification
  if (existingUser.emailStatus !== "confirmed") {
    return {
      success: false,
      message: "Please verify your email before signing in.",
    };
  }

  const isPasswordValid = await bcrypt.compare(password, existingUser.password);

  if (!isPasswordValid) {
    // Record failed login
    await recordLoginActivity({
      userId: existingUser.id,
      ipAddress: ip,
      userAgent,
      success: false,
    });

    // Increment failed attempts and potentially lock the account
    const updatedFailedAttempts = (existingUser.failedLoginAttempts || 0) + 1;

    const updateData: {
      failedLoginAttempts: number;
      lastFailedLoginAttempt: Date;
      lockedUntil?: Date;
    } = {
      failedLoginAttempts: updatedFailedAttempts,
      lastFailedLoginAttempt: new Date(),
    };

    // Lock account after 5 failed attempts for 30 minutes
    if (updatedFailedAttempts >= 5) {
      updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
    }

    await db.update(users).set(updateData).where(eq(users.id, existingUser.id));

    return {
      success: false,
      message:
        updatedFailedAttempts >= 5
          ? "Account temporarily locked due to multiple failed login attempts."
          : "Invalid Credentials!",
    };
  }

  // 2FA handling
  if (existingUser.isTwoFactorEnabled && existingUser.email) {
    if (code) {
      const twoFactorToken = await getTwoFactorTokenByEmail(existingUser.email);

      if (!twoFactorToken) {
        return {
          success: false,
          message: "Invalid Code!",
        };
      }

      if (twoFactorToken.token !== code) {
        return {
          success: false,
          message: "Invalid Code!",
        };
      }

      const hasExpired = new Date(twoFactorToken.expires) < new Date();
      if (hasExpired) {
        return {
          success: false,
          message: "Code Expired!",
        };
      }

      await db
        .delete(twoFactorTokens)
        .where(eq(twoFactorTokens.id, twoFactorToken.id));

      const existingConfirmation = await getTwoFactorConfirmationByUserId(
        existingUser.id
      );
      if (existingConfirmation) {
        await db
          .delete(twoFactorConfirmation)
          .where(eq(twoFactorConfirmation.id, existingConfirmation.id));
      }
      await db.insert(twoFactorConfirmation).values({
        userId: existingUser.id,
      });
    } else {
      // 2FA is enabled but no code provided, send 2FA token
      const twoFactorToken = await generateTwoFactorToken(existingUser.email);
      await sendTwoFactorTokenEmail(twoFactorToken.email, twoFactorToken.token);

      return { twoFactor: true };
    }
  }

  // Check for welcome email logic before signin
  const welcomeEmailCheck = await checkWelcomeEmailOnLogin(existingUser.id);

  // Attempt to sign in
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    // Record successful login activity
    await recordLoginActivity({
      userId: existingUser.id,
      ipAddress: ip,
      userAgent,
      success: true,
    });

    // Reset failed login attempts on successful login
    await db
      .update(users)
      .set({
        failedLoginAttempts: 0,
        lockedUntil: null,
      })
      .where(eq(users.id, existingUser.id));

    // Handle welcome email for first-time OAuth users or email users after verification
    if (welcomeEmailCheck.needsWelcomeEmail && welcomeEmailCheck.user) {
      await handleWelcomeEmail({
        userId: existingUser.id,
        email: welcomeEmailCheck.user.email,
        name: welcomeEmailCheck.user.name,
        isFirstLogin: welcomeEmailCheck.isFirstLogin,
        signupMethod: welcomeEmailCheck.user.signupMethod as "email" | "oauth",
      });
    }
  } catch (error) {
    // Only record failed login if there's an actual AuthError
    if (error instanceof AuthError) {
      // Record failed login
      await recordLoginActivity({
        userId: existingUser.id,
        ipAddress: ip,
        userAgent,
        success: false,
      });

      const typedError = error as unknown as {
        type: string;
      };

      switch (typedError.type) {
        case "CredentialsSignin":
          return {
            success: false,
            message: "Invalid Credentials!",
          };
        case "CallbackRouteError":
          return {
            success: false,
            message: "Invalid Credentials!",
          };
        case "OAuthAccountNotLinked":
          return {
            success: false,
            message:
              "Email already in use with different provider. Please sign in using the correct provider.",
          };
        default:
          return {
            success: false,
            message: "Something went wrong!",
          };
      }
    }

    // If it's not an AuthError, re-throw it
    throw error;
  }

  return redirect(DEFAULT_LOGIN_REDIRECT);
}

export async function signUpAction(values: z.infer<typeof registerSchema>) {
  const validatedFields = registerSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid Fields!",
    };
  }

  const { name, email, password } = validatedFields.data;

  // Implement a rate limiter to prevent DDOS
  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) return redirect("/too-fast");

  // To store with credentials
  // First we hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // We check if there are any existing users with that email
  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    // Check if the account is deleted - if so, allow re-registration
    if (existingUser.accountStatus === "deleted") {
      // Reactivate the deleted account with new data
      await db
        .update(users)
        .set({
          name: name,
          password: hashedPassword,
          accountStatus: "active",
          emailStatus: "pending",
          emailVerified: null,
          signupMethod: "email",
          welcomeEmailSent: false,
          firstLoginAt: null,
          // Reset security fields
          failedLoginAttempts: 0,
          lockedUntil: null,
          isTwoFactorEnabled: false,
          // Update timestamps
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id));

      // Generate new verification token
      const verificationToken = await generateVerificationToken(email);
      await sendVerificationEmail(
        verificationToken.email,
        verificationToken.token
      );

      return {
        success: true,
        message:
          "Welcome back! Please verify your email to complete registration.",
      };
    }

    // Check if account is suspended
    if (existingUser.accountStatus === "suspended") {
      return {
        success: false,
        message: "This account has been suspended. Please contact support.",
      };
    }

    // Account is active - can't register again
    return {
      success: false,
      message: "Account already exists!",
    };
  }

  // Create new user account
  await db.insert(users).values({
    name: name,
    email: email,
    password: hashedPassword,
    emailStatus: "pending",
    accountStatus: "active",
    signupMethod: "email",
    welcomeEmailSent: false,
  });

  const verificationToken = await generateVerificationToken(email);
  await sendVerificationEmail(verificationToken.email, verificationToken.token);

  return {
    success: true,
    message: "Confirmation Email Sent!",
  };
}

export async function verifyEmail(token: string) {
  const existingToken = await getVerificationTokenByToken(token);

  if (!existingToken) {
    return {
      success: false,
      message: "Token does not exist!",
    };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();
  const existingUser = await getUserByEmail(existingToken.email);

  if (!existingUser) {
    return {
      success: false,
      message: "User not found!",
    };
  }

  if (hasExpired) {
    // Mark email status as expired
    await db
      .update(users)
      .set({ emailStatus: "expired" })
      .where(eq(users.id, existingUser.id));

    return {
      success: false,
      message: "Token expired! Please request a new verification email.",
    };
  }

  // Verify email successfully
  await db
    .update(users)
    .set({
      emailVerified: new Date(),
      emailStatus: "confirmed",
      email: existingToken.email,
      updatedAt: new Date(),
    })
    .where(eq(users.id, existingUser.id));

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.id, existingToken.id));

  // Handle welcome email for email signup users after verification
  if (existingUser.name) {
    await handleWelcomeEmail({
      userId: existingUser.id,
      email: existingToken.email,
      name: existingUser.name,
      isFirstLogin: false, // This is email verification, not login
      signupMethod: "email",
    });
  }

  return {
    success: true,
    message: "Email has been verified. Please sign in",
  };
}

export async function logOut() {
  await signOut({ redirectTo: "/login" });
}

export async function resetPassword(values: z.infer<typeof resetSchema>) {
  const validatedFields = resetSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid Fields!",
    };
  }

  const { email } = validatedFields.data;

  // Implement a rate limiter to prevent DDOS
  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) return redirect("/too-fast");

  const existingUser = await getUserByEmail(email);

  if (!existingUser) {
    return {
      success: false,
      message: "Invalid Credentials!",
    };
  }

  const passwordResetToken = await generateResetPasswordToken(email);
  await sendResetPasswordEmail(
    passwordResetToken.email,
    passwordResetToken.token
  );

  return {
    success: true,
    message: "Reset email sent!",
  };
}

export async function newPassword(
  values: z.infer<typeof newPasswordSchema>,
  token: string
) {
  const validatedFields = newPasswordSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid Fields!",
    };
  }

  const { password } = validatedFields.data;

  if (!token) {
    return {
      success: false,
      message: "Missing token!",
    };
  }

  const existingToken = await getPasswordResetTokenByToken(token);

  if (!existingToken) {
    return {
      success: false,
      message: "Invalid token!",
    };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return {
      success: false,
      message: "Token has expired!",
    };
  }

  const existingUser = await getUserByEmail(existingToken.email);

  if (!existingUser) {
    return {
      success: false,
      message: "Email does not exist!",
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db
    .update(users)
    .set({
      password: hashedPassword,
      updatedAt: new Date(),
    })
    .where(eq(users.id, existingUser.id));

  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.id, existingToken.id));

  return {
    success: true,
    message: "Password updated!",
  };
}

export async function deleteAccountAction(
  values: z.infer<typeof deleteAccountSchema>
) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Not authenticated",
    };
  }

  const validatedFields = deleteAccountSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid password provided",
    };
  }

  const { password } = validatedFields.data;

  try {
    const user = await getUserById(session.user.id);

    if (!user || !user.password) {
      return {
        success: false,
        message: "User not found or invalid account type",
      };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return {
        success: false,
        message: "Invalid password",
      };
    }

    // Mark account as deleted instead of actually deleting
    await updateAccountStatus(session.user.id, "deleted");

    // Revoke all sessions
    await revokeAllUserSessions(session.user.id);

    // Sign out the user
    await signOut({ redirectTo: "/login" });

    return {
      success: true,
      message: "Account deleted successfully",
    };
  } catch (error) {
    console.error("Delete account error:", error);
    return {
      success: false,
      message: "Failed to delete account",
    };
  }
}
