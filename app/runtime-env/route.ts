import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  const env = {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? '',
    socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL ?? '',
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
