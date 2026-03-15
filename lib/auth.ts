import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';  // for magic link
import { prisma } from './db';
import bcrypt from 'bcryptjs';
import { authConfig } from './auth.config';

// Wrap PrismaAdapter to prevent it from trying to create sessions for credentials login.
// PrismaAdapter + CredentialsProvider + JWT strategy is a known conflict in NextAuth v5.
const basePrismaAdapter = PrismaAdapter(prisma);
const adapter = {
  ...basePrismaAdapter,
  // Return null for createUser when called from credentials flow — the user already exists.
  // The adapter's createSession would fail because JWT strategy doesn't use DB sessions.
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: adapter as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: { host: 'smtp.resend.com', port: 465, auth: { user: 'resend', pass: process.env.RESEND_API_KEY } },
      from: process.env.RESEND_FROM_EMAIL!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required.');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) {
          throw new Error('No account found with that email.');
        }

        // Check lockout
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error('Account locked due to too many failed attempts. Try again later.');
        }

        const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash);

        if (!isValid) {
          // Increment failed attempts
          const attempts = user.failedLoginAttempts + 1;
          const update: any = { failedLoginAttempts: attempts };
          if (attempts >= 10) {
            update.lockedUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
          }
          await prisma.user.update({ where: { id: user.id }, data: update });
          throw new Error('Incorrect password.');
        }

        // Check email verification
        if (!user.emailVerified) {
          throw new Error('Please verify your email before signing in.');
        }

        // Reset failed attempts on success
        if (user.failedLoginAttempts > 0) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          });
        }

        return { id: user.id, email: user.email, name: user.name, role: user.role, image: user.image };
      },
    }),
  ],
});
