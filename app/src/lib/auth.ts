'use server';

import { hash, compare } from 'bcryptjs';

// Cloudflare D1 configuration
const D1_CONFIG = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
  databaseId: process.env.CLOUDFLARE_D1_UUID || '805f0b5e-9c8a-4651-8eb9-f084b873eb22',
  apiToken: process.env.CLOUDFLARE_D1_TOKEN || process.env.NEXT_PRIVATE_TOKEN_CLOUDFLARE || '',
};

interface D1QueryResult<T> {
  results: T[];
  success: boolean;
  meta?: {
    changes?: number;
    duration?: number;
    last_row_id?: number;
    rows_read?: number;
    rows_written?: number;
  };
}

interface D1Response<T> {
  success: boolean;
  result?: D1QueryResult<T>[];
  errors?: Array<{ code: number; message: string }>;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  password_hash: string | null;
  image: string | null;
  provider: string;
  created_at: number;
  updated_at: number;
}

// Execute SQL query on Cloudflare D1
async function executeD1Query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${D1_CONFIG.accountId}/d1/database/${D1_CONFIG.databaseId}/query`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${D1_CONFIG.apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sql,
      params,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`D1 query failed: ${error}`);
  }

  const data: D1Response<T> = await response.json();

  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || 'D1 query failed');
  }

  // D1 returns result as array of query results, each with a 'results' property
  // For a single query, we want result[0].results
  const queryResult = data.result?.[0];
  if (!queryResult) {
    return [];
  }

  return queryResult.results || [];
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const results = await executeD1Query<User>(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email.toLowerCase()]
    );
    return results[0] || null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  try {
    const results = await executeD1Query<User>(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return results[0] || null;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
}

// Create new user
export async function createUser(data: {
  email: string;
  name?: string;
  password?: string;
  image?: string;
  provider?: string;
}): Promise<User | null> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const passwordHash = data.password ? await hash(data.password, 12) : null;
  const emailLower = data.email.toLowerCase();

  try {
    await executeD1Query(
      `INSERT INTO users (id, email, name, password_hash, image, provider, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        emailLower,
        data.name || null,
        passwordHash,
        data.image || null,
        data.provider || 'credentials',
        now,
        now,
      ]
    );

    // Verify the user was actually created by fetching it back
    const createdUser = await getUserByEmail(emailLower);
    if (!createdUser) {
      console.error('User creation failed: User not found after INSERT');
      return null;
    }

    // Verify it's the user we just created (same ID)
    if (createdUser.id !== id) {
      console.error('User creation conflict: Different user exists with same email');
      return null;
    }

    return createdUser;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

// Delete user by email (for cleanup)
export async function deleteUserByEmail(email: string): Promise<boolean> {
  try {
    await executeD1Query(
      'DELETE FROM users WHERE email = ?',
      [email.toLowerCase()]
    );
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}

// Update user
export async function updateUser(
  id: string,
  data: Partial<Pick<User, 'name' | 'image'>>
): Promise<boolean> {
  try {
    const updates: string[] = [];
    const params: unknown[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.image !== undefined) {
      updates.push('image = ?');
      params.push(data.image);
    }

    if (updates.length === 0) return true;

    updates.push('updated_at = ?');
    params.push(Math.floor(Date.now() / 1000));
    params.push(id);

    await executeD1Query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return true;
  } catch (error) {
    console.error('Error updating user:', error);
    return false;
  }
}

// Verify password
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}
