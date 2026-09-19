// Reproducible regression check for the public content-item API's
// authorization boundary. Run against a live Strapi instance:
//
//   node scripts/verify-public-api-security.mjs
//
// Exits non-zero (and prints which check failed) if any boundary regresses.
// This exists because the boundary was previously broken: an anonymous
// request to `?status=draft` returned real unpublished content. See
// controllers/content-item.ts for the fix.

const BASE = process.env.STRAPI_URL ?? 'http://localhost:1337';
let failures = 0;

function check(name, condition) {
  if (condition) {
    console.log(`PASS: ${name}`);
  } else {
    console.error(`FAIL: ${name}`);
    failures += 1;
  }
}

async function main() {
  // 1. Anonymous published read must succeed.
  const publishedRes = await fetch(`${BASE}/api/content-items?pagination[pageSize]=5`);
  const publishedJson = await publishedRes.json();
  check('anonymous published read succeeds (200)', publishedRes.status === 200);
  check(
    'anonymous published read returns only published entries',
    Array.isArray(publishedJson.data) && publishedJson.data.every((item) => item.publishedAt !== null),
  );

  // 2. Anonymous request for draft content must NOT return unpublished rows,
  // regardless of the status query param the caller supplies.
  const draftRes = await fetch(`${BASE}/api/content-items?status=draft&pagination[pageSize]=20`);
  const draftJson = await draftRes.json();
  check(
    'anonymous ?status=draft never returns an unpublished row',
    draftRes.status !== 200 || (Array.isArray(draftJson.data) && draftJson.data.every((item) => item.publishedAt !== null)),
  );

  // 3. Anonymous writes must still be rejected.
  const writeRes = await fetch(`${BASE}/api/content-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { title: 'SECURITY-CHECK', description: 'x', category: 'ANNOUNCEMENT', audience: 'EVERYONE' } }),
  });
  check('anonymous write is rejected (403)', writeRes.status === 403);

  // 4. The authenticated admin panel must still require a session.
  const adminRes = await fetch(`${BASE}/admin/users/me`);
  check('admin API requires authentication (401)', adminRes.status === 401);

  console.log(failures === 0 ? '\nAll public-API security checks passed.' : `\n${failures} check(s) FAILED.`);
  // Setting exitCode and letting the event loop drain naturally (rather than
  // calling process.exit() directly) avoids a Node/undici crash on Windows
  // where fetch's keep-alive sockets aren't closed before a forced exit
  // ("Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)") - which
  // otherwise makes this script report a non-zero exit code even when every
  // check passed, exactly the kind of false failure a CI script must not
  // produce.
  process.exitCode = failures === 0 ? 0 : 1;
}

main().catch((err) => {
  console.error('verify-public-api-security failed to run:', err);
  process.exitCode = 1;
});
