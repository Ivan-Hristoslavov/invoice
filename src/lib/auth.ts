import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import cuid from "cuid";
import { createAdminClient } from "@/lib/supabase/server";
import { consumeMagicLinkToken, findOrCreateMagicLinkUser } from "@/lib/magic-link";
import { consumeOneTimeLoginToken } from "@/lib/email-verification";
import { rateLimit } from "@/lib/rate-limit";

/** Brute-force guard: 10 failed credentials attempts per email+IP per 15 minutes. */
const LOGIN_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LIMIT_MAX_ATTEMPTS = 10;

function buildLoginKey(email: string, req?: { headers?: Record<string, string | string[] | undefined> }): string {
  const headers = req?.headers ?? {};
  const forwarded = headers["x-forwarded-for"];
  const realIp = headers["x-real-ip"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const ip = (raw || (Array.isArray(realIp) ? realIp[0] : realIp) || "unknown")
    .toString()
    .split(",")[0]
    .trim();
  return `login:${email}:${ip}`;
}

const oneDayInSeconds = 60 * 60 * 24;
const isProduction = process.env.NODE_ENV === "production";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: oneDayInSeconds,
    updateAge: 60 * 60,
  },
  jwt: {
    maxAge: oneDayInSeconds,
  },
  cookies: {
    sessionToken: {
      name: isProduction
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
  },
  pages: {
    signIn: "/signin",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        magicToken: { label: "Magic token", type: "text" },
        oneTimeLoginToken: { label: "One-time login token", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email) {
          return null;
        }

        const normalizedEmail = credentials.email.trim().toLowerCase();
        const magicToken = credentials.magicToken?.trim();
        const oneTimeLoginToken = credentials.oneTimeLoginToken?.trim();

        // Apply brute-force guard only for password-based attempts.
        if (!magicToken && !oneTimeLoginToken && credentials.password) {
          const { success } = await rateLimit(buildLoginKey(normalizedEmail, req as any), {
            windowMs: LOGIN_LIMIT_WINDOW_MS,
            maxRequests: LOGIN_LIMIT_MAX_ATTEMPTS,
          });
          if (!success) {
            throw new Error("TooManyAttempts");
          }
        }

        if (oneTimeLoginToken) {
          const email = await consumeOneTimeLoginToken(oneTimeLoginToken);
          if (!email || email !== normalizedEmail) {
            return null;
          }
          const supabase = createAdminClient();
          const { data: user, error } = await supabase
            .from("User")
            .select("id, email, name, image, emailVerified")
            .eq("email", normalizedEmail)
            .single();
          if (error || !user || !user.emailVerified) {
            return null;
          }
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        }

        if (magicToken) {
          const consumedToken = await consumeMagicLinkToken(normalizedEmail, magicToken);
          if (!consumedToken) {
            return null;
          }

          const user = await findOrCreateMagicLinkUser(normalizedEmail);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        }

        if (!credentials.password) {
          return null;
        }

        const supabase = createAdminClient();

        const { data: user, error } = await supabase
          .from("User")
          .select("id, email, name, password, image, emailVerified")
          .eq("email", normalizedEmail)
          .single();

        if (error || !user || !user.password) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) {
          return null;
        }

        // Require email verification before first sign-in (credentials only)
        if (!user.emailVerified) {
          throw new Error("EmailNotVerified");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers (like Google), create or link user
      if (account?.provider === "google") {
        const supabase = createAdminClient();
        const email = user.email?.trim().toLowerCase();

        if (!email) {
          return false;
        }
        
        // Check if user already exists
        const { data: existingUser } = await supabase
          .from("User")
          .select("id, email, name, image")
          .eq("email", email)
          .single();
        
        if (existingUser) {
          const nextProfile = {
            name: existingUser.name || user.name || email.split("@")[0],
            image: existingUser.image || user.image || null,
            emailVerified: new Date().toISOString(), // Google verified this email
            updatedAt: new Date().toISOString(),
          };

          await supabase
            .from("User")
            .update(nextProfile)
            .eq("id", existingUser.id);

          return true;
        }
        
        // Create new user (Google-verified email, so set emailVerified)
        const { error } = await supabase
          .from("User")
          .insert({
            id: cuid(),
            email,
            name: user.name || email.split("@")[0],
            image: user.image || null,
            emailVerified: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        
        if (error) {
          console.error("Error creating user:", error);
          return false;
        }
        
        return true;
      }
      
      return true;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string | null;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // On initial sign in, get user ID from database
      if (account && user?.email) {
        const supabase = createAdminClient();
        const email = user.email.trim().toLowerCase();
        
        // Fetch user from database to get the actual ID
        const { data: dbUser } = await supabase
          .from("User")
          .select("id")
          .eq("email", email)
          .single();
        
        if (dbUser) {
          token.id = dbUser.id;
        }
      }
      
      // For subsequent requests, id should already be in token
      if (user && !token.id) {
        token.id = user.id;
      }
      
      return token;
    },
  },
};
