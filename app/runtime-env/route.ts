import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  const env = {
    // Use proxy path for client-side to avoid CORS issues
    apiBaseUrl: '/api/backend',
    socketUrl: process.env.NEXT_PRIVATE_SOCKET_URL ?? '',
  };

  // Avoid `</script>` termination issues by escaping '<'
  const json = JSON.stringify(env).replace(/</g, '\\u003c');
  const body = `window.__RUNTIME_ENV__=${json};`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
    },
  });
}
