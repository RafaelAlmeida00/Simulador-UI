import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { getUserByEmail, createUser, verifyPassword } from '@/src/lib/auth';

// Map provider IDs to user-friendly names
const providerDisplayNames: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
  facebook: 'Facebook',
  twitter: 'Twitter',
  credentials: 'email e senha',
};

function getProviderDisplayName(provider: string | null | undefined): string {
  if (!provider) return 'login social';
  return providerDisplayNames[provider.toLowerCase()] || provider;
}

const handler = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || process.env.NEXT_PUBLIC_GOOGLE_OAUTH_KEY || '',
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios');
        }

        const user = await getUserByEmail(credentials.email as string);

        if (!user) {
          throw new Error('Usuário não encontrado');
        }

        if (!user.password_hash) {
          const providerName = getProviderDisplayName(user.provider);

          // Handle corrupted data case
          if (!user.provider || user.provider === 'undefined' || user.provider === 'null') {
            throw new Error('Conta com dados incompletos. Entre em contato com o suporte.');
          }

          throw new Error(`Esta conta usa ${providerName}. Faça login usando ${providerName}.`);
        }

        const isValid = await verifyPassword(credentials.password as string, user.password_hash);

        if (!isValid) {
          throw new Error('Senha incorreta');
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
      }
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
      }
      return session;
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
