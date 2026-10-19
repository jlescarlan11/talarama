import prisma from "@/prisma/client";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { allocateUsername } from '@/app/services/profileService';

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
          image: typeof profile.picture === 'string' ? profile.picture.replace(/=s96-c/, "=s500-c") : null,
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
      // Refresh display data from persisted identity. Never trust an update payload's role or ID.
      if (token.id || user?.id || token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id || user?.id || token.sub },
          select: { id: true, username: true, name: true, image: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.username = dbUser.username!;
          token.name = dbUser.name;
          token.picture = dbUser.image;
        } else {
          token.id = '';
          token.username = '';
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.name = token.name;
        session.user.image = token.picture;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      await allocateUsername(user.id);
    },
  },
};

export default authOptions;
