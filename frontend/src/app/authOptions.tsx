import { AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

export const authOptions: AuthOptions = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if(!credentials?.email || !credentials?.password){
          throw new Error("Missing credentials");
        }

        // Find user by email
        const { data: user, error } = await supabase
          .from('auth')
          .select('*')
          .eq('email', credentials.email)
          .single();

        if(error || !user){
          throw new Error("Invalid email");
        }

        const correctPassword = await bcrypt.compare(credentials.password, user.password);

        if(!correctPassword){
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
        };
      },
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token } : any) {
      if (session.user) {
        session.user.id = token.id;
        // Include the JWT token in the session
        session.accessToken = token;
      }
      return session;
    }
  },
  jwt: {
    // Use a consistent secret for JWT signing
    secret: process.env.NEXTAUTH_SECRET,
    // Optional: customize JWT expiration
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  debug: process.env.NODE_ENV !== "production",
  pages: {
    signIn: "/signin",
  },
}