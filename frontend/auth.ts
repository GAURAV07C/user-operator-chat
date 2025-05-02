import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

declare module "next-auth" {
  interface User {
    accessToken?: string;
    role?: string;
    id?: string; // Optional: Add id to User interface if needed
  }

  interface Session {
    accessToken?: string;
    role?: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const res = await fetch("http://localhost:8000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password,
          }),
        });

        const data = await res.json();
        console.log("Login API Response:", data);

        if (!res.ok) {
          throw new Error(data.message || "Invalid credentials");
        }

        // Return user data along with JWT token
        return {
          email: data.user.email,
          role: data.user.role,
          accessToken: data.token, // The JWT token
          id: data.user.id, // Include user id if necessary
        };
      },
    }),
  ],
  pages: {
    signIn: "/login", // Custom login page
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.role = user.role;
        token.id = user.id as string; // Ensure user id is explicitly typed as string
      }
    
      return token;
    },
    async session({ session, token }) {
      // Sync session with token data
      session.accessToken = token.accessToken as string | undefined;
      session.role = token.role as string | undefined;

      // If user data exists in session, add additional information
      if (session.user) {
        session.user.accessToken = token.accessToken as string | undefined;
        session.user.role = token.role as string | undefined;
        session.user.id = (token.id as string) ?? ""; // Ensure token.id is cast to string
      }

      
      return session;
    },
  },
});
