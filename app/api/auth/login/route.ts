import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encode } from 'next-auth/jwt';
import { SignJWT } from 'jose';
import {
  getUserByEmail,
  verifyPasswordSecure,
  isAccountLocked,
  incrementFailedAttempts,
  resetFailedAttempts,
  maskEmail,
  ensureMinResponseTime,
} from '@/src/lib/auth';

// NextAuth v5 uses 'authjs.session-token' as cookie name
const SESSION_COOKIE = 'authjs.session-token';
const SECURE_SESSION_COOKIE = '__Secure-authjs.session-token';

// Generic error message for all authentication failures (prevents user enumeration)
const GENERIC_AUTH_ERROR = 'Credenciais invalidas';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse credentials from body
    const contentType = req.headers.get('content-type') || '';
    let email: string | null = null;
    let password: string | null = null;
    let callbackUrl = '/sessions';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const body = await req.text();
      const params = new URLSearchParams(body);
      email = params.get('email');
      password = params.get('password');
      callbackUrl = params.get('callbackUrl') || '/sessions';
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      email = body.email;
      password = body.password;
      callbackUrl = body.callbackUrl || '/sessions';
    }

    // Validate required fields
    if (!email || !password) {
      await ensureMinResponseTime(startTime);
      return NextResponse.json(
        { error: 'Email e senha sao obrigatorios' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Fetch user (may or may not exist)
    const user = await getUserByEmail(normalizedEmail);

    // SECURITY: Always perform password verification even if user doesn't exist
    // This prevents timing attacks that could enumerate valid emails
    const isPasswordValid = await verifyPasswordSecure(password, user?.password_hash || null);

    // Check if account is locked (only if user exists)
    if (user && await isAccountLocked(user.id, user.locked_until)) {
      // Log attempt on locked account (masked email)
      console.warn(`[AUTH] Login attempt on locked account: ${maskEmail(normalizedEmail)}`);
      // Return same generic error - don't reveal account is locked
      await ensureMinResponseTime(startTime);
      return NextResponse.json(
        { error: GENERIC_AUTH_ERROR },
        { status: 401 }
      );
    }

    // Authentication failed cases:
    // 1. User doesn't exist
    // 2. Password is incorrect
    // 3. User exists but has no password (OAuth user)
    if (!user || !isPasswordValid || !user.password_hash) {
      // Log failed attempt (masked email)
      console.warn(`[AUTH] Failed login attempt: ${maskEmail(normalizedEmail)}`);

      // Increment failed attempts only if user exists
      if (user) {
        await incrementFailedAttempts(user.id, user.failed_login_attempts || 0);
      }

      // SECURITY: Return same error message for all failure cases
      await ensureMinResponseTime(startTime);
      return NextResponse.json(
        { error: GENERIC_AUTH_ERROR },
        { status: 401 }
      );
    }

    // Authentication successful
    // Reset failed attempts counter
    await resetFailedAttempts(user.id);

    // Create session using NextAuth's encode function
    const secret = process.env.NEXTAUTH_SECRET!;
    const maxAge = 30 * 24 * 60 * 60; // 30 days

    // Create access token for external APIs
    const jwtSecret = new TextEncoder().encode(secret);
    const jti = crypto.randomUUID(); // Token ID for revocation support
    const accessToken = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      jti, // Include JTI for token revocation
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
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
        jti, // Include JTI for revocation
        accessToken,
        accessTokenExpires: Date.now() + 30 * 24 * 60 * 60 * 1000,
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

    console.log(`[AUTH] Successful login: ${maskEmail(normalizedEmail)}`);

    await ensureMinResponseTime(startTime);
    return NextResponse.json({
      success: true,
      callbackUrl,
    });
  } catch (error) {
    console.error('[AUTH] Login error:', error instanceof Error ? error.message : 'Unknown');

    await ensureMinResponseTime(startTime);
    return NextResponse.json(
      { error: 'Erro interno. Tente novamente.' },
      { status: 500 }
    );
  }
}
