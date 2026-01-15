import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encode } from 'next-auth/jwt';
import { SignJWT } from 'jose';
import { getUserByEmail, verifyPassword } from '@/src/lib/auth';

// NextAuth v5 uses 'authjs.session-token' as cookie name
const SESSION_COOKIE = 'authjs.session-token';
const SECURE_SESSION_COOKIE = '__Secure-authjs.session-token';

// Provider display names for error messages
const providerDisplayNames: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
  credentials: 'email e senha',
};

export async function POST(req: NextRequest) {
  // Parse credentials from body
  const contentType = req.headers.get('content-type') || '';
  let email: string | null = null;
  let password: string | null = null;
  let callbackUrl = '/';

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const body = await req.text();
    const params = new URLSearchParams(body);
    email = params.get('email');
    password = params.get('password');
    callbackUrl = params.get('callbackUrl') || '/';
  } else if (contentType.includes('application/json')) {
    const body = await req.json();
    email = body.email;
    password = body.password;
    callbackUrl = body.callbackUrl || '/';
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email e senha são obrigatórios' },
      { status: 400 }
    );
  }

  // Authenticate user
  const user = await getUserByEmail(email);

  if (!user) {
    return NextResponse.json(
      { error: 'Usuário não encontrado' },
      { status: 401 }
    );
  }

  if (!user.password_hash) {
    const providerName = providerDisplayNames[user.provider || ''] || user.provider || 'login social';
    return NextResponse.json(
      { error: `Esta conta usa ${providerName}. Faça login usando ${providerName}.` },
      { status: 401 }
    );
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    return NextResponse.json(
      { error: 'Senha incorreta' },
      { status: 401 }
    );
  }

  // Create session using NextAuth's encode function
  const secret = process.env.NEXTAUTH_SECRET!;
  const maxAge = 30 * 24 * 60 * 60; // 30 days

  // Create access token for external APIs
  const jwtSecret = new TextEncoder().encode(secret);
  const accessToken = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(jwtSecret);

  // Create session token using NextAuth's encoder (handles JWE encryption)
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieName = isProduction ? SECURE_SESSION_COOKIE : SESSION_COOKIE;

  const sessionToken = await encode({
    token: {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.image,
      sub: user.id,
      accessToken,
      accessTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
    },
    secret,
    salt: cookieName, // NextAuth v5 uses cookie name as salt
    maxAge,
  });

  // Set session cookie (use secure cookie name in production)
  const cookieStore = await cookies();

  cookieStore.set(cookieName, sessionToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge,
  });

  return NextResponse.json({
    success: true,
    callbackUrl,
  });
}
