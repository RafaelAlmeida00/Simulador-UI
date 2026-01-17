import NextAuth from 'next-auth';
import { skipCSRFCheck } from '@auth/core';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import {
  getUserByEmail,
  createUser,
  verifyPasswordSecure,
  isAccountLocked,
  incrementFailedAttempts,
  resetFailedAttempts,
  maskEmail,
} from '@/src/lib/auth';
import { isTokenRevoked, revokeToken } from '@/src/lib/token-revocation';
import { SignJWT } from 'jose';

// Generic error message for all authentication failures (prevents user enumeration)
const GENERIC_AUTH_ERROR = 'Credenciais invalidas';

const handler = NextAuth({
  skipCSRFCheck: skipCSRFCheck,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PRIVATE_GOOGLE_OAUTH_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || process.env.NEXT_PRIVATE_GOOGLE_OAUTH_KEY || '',
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha sao obrigatorios');
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        // Fetch user (may or may not exist)
        const user = await getUserByEmail(email);

        // SECURITY: Always perform password verification even if user doesn't exist
        // This prevents timing attacks that could enumerate valid emails
        const isPasswordValid = await verifyPasswordSecure(password, user?.password_hash || null);

        // Check if account is locked (only if user exists)
        if (user && await isAccountLocked(user.id, user.locked_until)) {
          console.warn(`[AUTH] Login attempt on locked account: ${maskEmail(email)}`);
          // Return same generic error - don't reveal account is locked
          throw new Error(GENERIC_AUTH_ERROR);
        }

        // Authentication failed cases:
        // 1. User doesn't exist
        // 2. Password is incorrect
        // 3. User exists but has no password (OAuth user)
        if (!user || !isPasswordValid || !user.password_hash) {
          console.warn(`[AUTH] Failed login attempt: ${maskEmail(email)}`);

          // Increment failed attempts only if user exists
          if (user) {
            await incrementFailedAttempts(user.id, user.failed_login_attempts || 0);
          }

          // SECURITY: Return same error message for all failure cases
          throw new Error(GENERIC_AUTH_ERROR);
        }

        // Authentication successful
        // Reset failed attempts counter
        await resetFailedAttempts(user.id);

        console.log(`[AUTH] Successful login: ${maskEmail(email)}`);

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
      if (account?.provider === 'google') {
        const existingUser = await getUserByEmail(user.email!);

        if (!existingUser) {
          await createUser({
            email: user.email!,
            name: user.name || undefined,
            image: user.image || undefined,
            provider: 'google',
          });
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        // Generate unique token ID for revocation support
        token.jti = crypto.randomUUID();
      }
      if (account) {
        token.provider = account.provider;
      }

      // Generate accessToken for external API authentication
      if (!token.accessToken || Date.now() > (token.accessTokenExpires as number || 0)) {
        const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
        const jti = token.jti || crypto.randomUUID();
        const accessToken = await new SignJWT({
          id: token.id,
          email: token.email,
          name: token.name,
          jti, // Include JTI for token revocation
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('30d')
          .sign(secret);

        token.accessToken = accessToken;
        token.accessTokenExpires = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
        token.jti = jti;
      }

      return token;
    },
    async session({ session, token }) {
      // SECURITY: Check if token has been revoked
      if (token.jti) {
        const revoked = await isTokenRevoked(token.jti as string);
        if (revoked) {
          console.warn(`[AUTH] Revoked token used: ${(token.jti as string).substring(0, 8)}...`);
          // Return empty session to force re-authentication
          return { expires: new Date(0).toISOString() } as typeof session;
        }
      }

      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
      }
      // Expose accessToken to the client
      (session as { accessToken?: string }).accessToken = token.accessToken as string;
      return session;
    },
  },
  events: {
    async signOut(message) {
      // Revoke token on logout to prevent reuse
      const token = 'token' in message ? message.token : null;
      if (token?.jti) {
        await revokeToken(token.jti as string, {
          userId: token.id as string,
          reason: 'logout',
        });
        console.log(`[AUTH] Token revoked on logout: ${(token.jti as string).substring(0, 8)}...`);
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export const { GET, POST } = handler.handlers;
