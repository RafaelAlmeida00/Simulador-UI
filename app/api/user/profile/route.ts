import { NextRequest, NextResponse } from 'next/server';
import { decode } from 'next-auth/jwt';
import { updateUser, getUserById } from '@/src/lib/auth';

// NextAuth v5 uses 'authjs.session-token' as cookie name
const SESSION_COOKIE = 'authjs.session-token';
const SECURE_SESSION_COOKIE = '__Secure-authjs.session-token';

/**
 * Helper to get authenticated user from session token
 */
async function getAuthenticatedUser(req: NextRequest): Promise<{ id: string; email: string } | null> {
  const sessionToken =
    req.cookies.get(SECURE_SESSION_COOKIE)?.value ||
    req.cookies.get(SESSION_COOKIE)?.value;

  if (!sessionToken) {
    return null;
  }

  const cookieName = req.cookies.get(SECURE_SESSION_COOKIE)?.value
    ? SECURE_SESSION_COOKIE
    : SESSION_COOKIE;

  try {
    const token = await decode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET!,
      salt: cookieName,
    });

    if (!token || !token.id || !token.email) {
      return null;
    }

    // Check expiration
    if (token.exp && Date.now() >= token.exp * 1000) {
      return null;
    }

    return {
      id: token.id as string,
      email: token.email as string,
    };
  } catch {
    return null;
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Nao autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, image } = body;

    // Update user
    const updateData: { name?: string; image?: string | null } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return NextResponse.json(
          { error: 'Nome deve ter pelo menos 2 caracteres' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (image !== undefined) {
      if (image !== null && typeof image !== 'string') {
        return NextResponse.json(
          { error: 'URL da imagem invalida' },
          { status: 400 }
        );
      }
      // Convert null to undefined for the updateUser function
      updateData.image = image || undefined;
    }

    const success = await updateUser(user.id, updateData);

    if (!success) {
      return NextResponse.json(
        { error: 'Erro ao atualizar perfil' },
        { status: 500 }
      );
    }

    // Fetch updated user
    const updatedUser = await getUserById(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser?.id,
        name: updatedUser?.name,
        email: updatedUser?.email,
        image: updatedUser?.image,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);

    if (!authUser) {
      return NextResponse.json(
        { error: 'Nao autenticado' },
        { status: 401 }
      );
    }

    const user = await getUserById(authUser.id);

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario nao encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
