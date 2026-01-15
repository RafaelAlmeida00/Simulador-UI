import { NextRequest, NextResponse } from 'next/server';

const D1_CONFIG = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
  databaseId: process.env.CLOUDFLARE_D1_UUID || '',
  apiToken: process.env.CLOUDFLARE_D1_TOKEN || process.env.NEXT_PRIVATE_TOKEN_CLOUDFLARE || '',
};

async function executeQuery(sql: string) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${D1_CONFIG.accountId}/d1/database/${D1_CONFIG.databaseId}/query`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${D1_CONFIG.apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params: [] }),
  });

  return response.json();
}

// GET - View schema
export async function GET() {
  try {
    const schema = await executeQuery("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");

    return NextResponse.json({
      config: {
        accountId: D1_CONFIG.accountId ? '***configured***' : 'MISSING',
        databaseId: D1_CONFIG.databaseId ? '***configured***' : 'MISSING',
        apiToken: D1_CONFIG.apiToken ? '***configured***' : 'MISSING',
      },
      schema,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST - Run migrations
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'add-name-column') {
      const result = await executeQuery("ALTER TABLE users ADD COLUMN name TEXT");
      return NextResponse.json({ success: true, action, result });
    }

    if (action === 'add-image-column') {
      const result = await executeQuery("ALTER TABLE users ADD COLUMN image TEXT");
      return NextResponse.json({ success: true, action, result });
    }

    if (action === 'add-provider-column') {
      const result = await executeQuery("ALTER TABLE users ADD COLUMN provider TEXT DEFAULT 'credentials'");
      return NextResponse.json({ success: true, action, result });
    }

    if (action === 'add-timestamps') {
      const result1 = await executeQuery("ALTER TABLE users ADD COLUMN created_at INTEGER DEFAULT (strftime('%s', 'now'))");
      const result2 = await executeQuery("ALTER TABLE users ADD COLUMN updated_at INTEGER DEFAULT (strftime('%s', 'now'))");
      return NextResponse.json({ success: true, action, results: [result1, result2] });
    }

    if (action === 'view-all-users') {
      const result = await executeQuery("SELECT * FROM users");
      return NextResponse.json({ success: true, action, result });
    }

    if (action === 'clear-all-users') {
      const result = await executeQuery("DELETE FROM users");
      return NextResponse.json({ success: true, action, result });
    }

    return NextResponse.json({ error: 'Unknown action. Available: add-name-column, add-image-column, add-provider-column, add-timestamps, view-all-users, clear-all-users' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
