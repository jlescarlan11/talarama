import prisma from "@/prisma/client";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          username: profile.email.split("@")[0], // Generate username from email
          image: profile.picture.replace(/=s96-c/, "=s500-c"),
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, user }) {
      // If user object is available (sign in), pull user from DB to get updated username
      if (user || !token.username) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.username = dbUser.username!;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      const base = user.email?.split("@")[0] ?? "user";
      let username = base;
      let count = 1;

      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${base}${count}`;
        count++;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { username },
      });
    },
  },
};

export default authOptions;
