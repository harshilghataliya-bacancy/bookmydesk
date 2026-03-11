import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log("[AUTH] signIn callback triggered", {
        email: user.email,
        provider: account?.provider,
      });

      const email = user.email;
      if (!email) {
        console.log("[AUTH] No email, rejecting");
        return false;
      }

      if (!email.endsWith("@bacancy.com")) {
        return "/unauthorized";
      }

      try {
        await prisma.user.upsert({
          where: { email },
          update: {
            name: user.name || "",
            avatarUrl: user.image || null,
          },
          create: {
            email,
            name: user.name || "",
            avatarUrl: user.image || null,
            role: "USER",
          },
        });
        console.log("[AUTH] User upserted successfully:", email);
      } catch (error) {
        console.error("[AUTH] Prisma upsert error:", error);
        // Still allow login even if DB fails
      }

      return true;
    },
    async jwt({ token }) {
      if (token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
          }
        } catch (error) {
          console.error("[AUTH] JWT callback DB error:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log("[AUTH] redirect callback:", { url, baseUrl });
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: "/login",
  },
});
