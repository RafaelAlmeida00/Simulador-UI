import { NextRequest, NextResponse } from 'next/server';
import { decode } from 'next-auth/jwt';

// NextAuth v5 uses 'authjs.session-token' as cookie name
const SESSION_COOKIE = 'authjs.session-token';
const SECURE_SESSION_COOKIE = '__Secure-authjs.session-token';

export async function GET(req: NextRequest) {
  // Check both secure and non-secure cookie names
  const sessionToken =
    req.cookies.get(SECURE_SESSION_COOKIE)?.value ||
    req.cookies.get(SESSION_COOKIE)?.value;

  if (!sessionToken) {
    return NextResponse.json(null);
  }

  // Determine which cookie name was used for the salt
  const cookieName = req.cookies.get(SECURE_SESSION_COOKIE)?.value
    ? SECURE_SESSION_COOKIE
    : SESSION_COOKIE;

  try {
    const token = await decode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET!,
      salt: cookieName,
    });

    if (!token) {
      return NextResponse.json(null);
    }

    // Check expiration
    if (token.exp && Date.now() >= token.exp * 1000) {
      return NextResponse.json(null);
    }

    // Return session in NextAuth format
    return NextResponse.json({
      user: {
        id: token.id,
        name: token.name,
        email: token.email,
        image: token.picture,
      },
      expires: new Date((token.exp as number) * 1000).toISOString(),
      accessToken: token.accessToken,
    });
  } catch (error) {
    console.error('[Session] Error decoding token:', error);
    return NextResponse.json(null);
  }
}
