import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/server";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
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
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const supabase = createAdminClient();

        const { data: user, error } = await supabase
          .from("User")
          .select("id, email, name, password, image")
          .eq("email", credentials.email)
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
        
        // Check if user already exists
        const { data: existingUser } = await supabase
          .from("User")
          .select("id, email, name, image")
          .eq("email", user.email!)
          .single();
        
        if (existingUser) {
          // Update existing user's image if they don't have one
          if (!existingUser.image && user.image) {
            await supabase
              .from("User")
              .update({ image: user.image })
              .eq("id", existingUser.id);
          }
          // User exists, allow sign in
          return true;
        }
        
        // Create new user
        const { data: newUser, error } = await supabase
          .from("User")
          .insert({
            email: user.email!,
            name: user.name || user.email!.split("@")[0],
            image: user.image,
            // No password for OAuth users
          })
          .select("id")
          .single();
        
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
      if (account && user) {
        const supabase = createAdminClient();
        
        // Fetch user from database to get the actual ID
        const { data: dbUser } = await supabase
          .from("User")
          .select("id")
          .eq("email", user.email!)
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
