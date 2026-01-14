import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, deleteUserByEmail } from '@/src/lib/auth';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      // Check if it's a social login account (no password) or corrupted data
      if (!existingUser.password_hash) {
        const providerName = getProviderDisplayName(existingUser.provider);

        // If provider is also missing/invalid, it's likely corrupted data
        if (!existingUser.provider || existingUser.provider === 'undefined' || existingUser.provider === 'null') {
          return NextResponse.json(
            { error: 'Este email possui um registro incompleto. Entre em contato com o suporte ou tente novamente mais tarde.' },
            { status: 409 }
          );
        }

        return NextResponse.json(
          { error: `Este email está vinculado a uma conta ${providerName}. Faça login usando ${providerName}.` },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Este email já está em uso' },
        { status: 409 }
      );
    }

    // Create user
    const user = await createUser({
      email,
      password,
      name,
      provider: 'credentials',
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Erro ao criar usuário. Verifique a conexão com o banco de dados.' },
        { status: 500 }
      );
    }

    // Double-check user was actually persisted
    const verifyUser = await getUserByEmail(email);
    if (!verifyUser || verifyUser.id !== user.id) {
      return NextResponse.json(
        { error: 'Erro ao verificar criação do usuário. Tente novamente.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Usuário criado com sucesso',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to cleanup corrupted users (for development)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    const deleted = await deleteUserByEmail(email);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Erro ao deletar usuário' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Usuário deletado com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
