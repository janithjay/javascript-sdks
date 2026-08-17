import path from 'node:path';
import {fileURLToPath} from 'node:url';
import express from 'express';
import cookieParser from 'cookie-parser';
import {thunderID, handleSignIn, handleSignOut, handleFlow, protect, getUsersMe, getUsersMeMeta} from '@thunderid/express';
import {verifyBearerToken} from './lib/auth.mjs';
import {layout, esc, escAttr, COPY_ICON} from './lib/layout.mjs';
import {thunderMark} from './lib/thunderMark.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3000;
const baseUrl = process.env.THUNDERID_BASE_URL || 'https://localhost:8090';

// This app demonstrates two independent, separately-configurable ways to authenticate:
// OAuth2 redirect flow (clientId/clientSecret) or app-native embedded flow
// (applicationId/flowSecret, /native-login). Either is sufficient on its own — the
// config gate below only blocks the app when *neither* is set up.
const REDIRECT_FLOW_VARS = ['THUNDERID_CLIENT_ID', 'THUNDERID_CLIENT_SECRET'];
const redirectFlowConfigured = REDIRECT_FLOW_VARS.every((key) => process.env[key]);

const applicationId = process.env.THUNDERID_APPLICATION_ID;
const flowSecret = process.env.THUNDERID_FLOW_SECRET;
const nativeFlowConfigured = Boolean(applicationId && flowSecret);

const anyFlowConfigured = redirectFlowConfigured || nativeFlowConfigured;
// Points the nav's "Sign in" button at whichever flow is actually usable.
const signInHref = redirectFlowConfigured ? '/login' : nativeFlowConfigured ? '/native-login' : '/login';

app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// The thunderID() middleware powers `/login`/`/token` (redirect flow) and
// `/native-login`'s handleFlow() route (native flow) alike — req.thunderIDAuth is
// needed by both, so this mounts whenever either flow has enough config to run.
// The API routes (`/api/*`) don't rely on cookies or sessions at all — see lib/auth.mjs.
if (anyFlowConfigured) {
  app.use(
    thunderID({
      baseUrl,
      clientId: process.env.THUNDERID_CLIENT_ID,
      clientSecret: process.env.THUNDERID_CLIENT_SECRET,
      // Only used by the /native-login demo's handleFlow() route — the OAuth2
      // redirect flow above authenticates with clientId/clientSecret instead.
      applicationId,
      flowSecret,
      // afterSignInUrl doubles as the OAuth2 redirect_uri sent to ThunderID, so
      // it must match the redirect URI registered for this app (`/login`,
      // where handleSignIn() below actually exchanges the code). Where the
      // user lands once sign-in completes is controlled separately via
      // onSignIn.
      afterSignInUrl: 'http://localhost:3000/login',
      // Same story as afterSignInUrl: this is the post_logout_redirect_uri
      // sent to ThunderID, so it must match handleSignOut()'s mount path
      // (`/logout`) for the `?state=sign_out_success` callback below to fire.
      afterSignOutUrl: 'http://localhost:3000/logout',
      onSignIn: (res) => res.redirect('/'),
      onSignOut: (res) => res.redirect('/'),
    }),
  );
}

const requireBearer = verifyBearerToken(baseUrl);

async function getSession(req) {
  const client = req.thunderIDAuth;
  const sessionId = client && req.cookies?.[client.getSessionCookieName()];
  if (!client || !sessionId) return {signedIn: false, accessToken: null, user: null};
  const signedIn = (await client.isSignedIn(sessionId)) ?? false;
  if (!signedIn) return {signedIn: false, accessToken: null, user: null};
  const [accessToken, user] = await Promise.all([client.getAccessToken(sessionId), client.getUser(sessionId)]);
  return {signedIn, accessToken, user};
}

// ── Configuration notice ────────────────────────────────────────────────

function renderConfigNeeded() {
  return layout({
    title: 'Configuration needed',
    body: `<section class="hero">
      <div class="hero-inner">
        <div class="hero-mark">${thunderMark(40)}</div>
        <div class="hero-badge config-badge"><span class="hero-badge-line"></span><span>Setup required</span><span class="hero-badge-line"></span></div>
        <h1 class="hero-title">Configuration needed</h1>
        <p class="hero-subtitle">This quickstart can't reach ThunderID yet. Set up <strong>one</strong> of the
        two sign-in methods below, then restart the server.</p>

        <div class="config-step">
          <div class="config-step-label">Step 1 &middot; Set environment variables</div>
          <p class="config-hint" style="margin:0 0 10px">Either the OAuth2 redirect flow&hellip;</p>
          <ul class="config-list">
            ${REDIRECT_FLOW_VARS.map((key) => `<li class="config-list-item">${esc(key)}</li>`).join('')}
          </ul>
          <p class="config-hint" style="margin:14px 0 10px">&hellip;or the native/embedded flow:</p>
          <ul class="config-list">
            <li class="config-list-item">THUNDERID_APPLICATION_ID</li>
            <li class="config-list-item">THUNDERID_FLOW_SECRET</li>
          </ul>
          <p class="config-hint">Copy <code>.env.example</code> to <code>.env</code>, fill in the values from
          your ThunderID application, then run <code>npm run dev</code> again.</p>
        </div>

        <div class="config-step">
          <div class="config-step-label">Step 2 &middot; Register redirect URIs</div>
          <div class="config-box">
            <p class="config-box-body">Sign-in and sign-out are handled by this app's server, so no CORS
            configuration is needed. In the <strong>ThunderID Console</strong>, open this application and go to
            <strong> Advanced Settings &rarr; OAuth2 Configuration</strong>, then add the exact URIs below.</p>
            <div class="config-value-group">
              <div>
                <div class="config-value-label">Authorized redirect URI</div>
                <code class="config-value">http://localhost:3000/login</code>
              </div>
              <div>
                <div class="config-value-label">Post-Logout Redirect URI</div>
                <code class="config-value">http://localhost:3000/logout</code>
              </div>
            </div>
          </div>
        </div>

        <p class="config-docs-note">Need more info? Take a look at the
        <a href="https://thunderid.dev/docs/next/getting-started/connect-your-application/express/" target="_blank" rel="noopener noreferrer">Express quickstart guide.</a></p>
      </div>
    </section>`,
  });
}

app.use((req, res, next) => {
  if (!anyFlowConfigured && req.path !== '/styles.css') {
    return res.status(503).send(renderConfigNeeded());
  }
  next();
});

// ── API documentation / landing page ────────────────────────────────────

function curlBlock(lines) {
  return `<div class="code-block"><pre>${esc(lines.join('\n'))}</pre></div>`;
}

/** Joins a multi-line, backslash-continued curl command into one pasteable line. */
function toSingleLineCommand(lines) {
  return lines
    .map((line) => line.trim().replace(/\\$/, '').trim())
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function copyButton(text) {
  return `<button class="token-copy-btn" data-copy="${escAttr(text)}" onclick="copyCodeBlock(this)">${COPY_ICON}<span class="copy-btn-label">Copy</span></button>`;
}

function endpoint({method, path: routePath, summary, protectedRoute, curl, sample}) {
  return `
    <details class="endpoint">
      <summary class="endpoint-summary">
        <span class="method-badge">${esc(method)}</span>
        <span class="endpoint-path">${esc(routePath)}</span>
        <span class="endpoint-desc">${esc(summary)}</span>
        <span class="tag ${protectedRoute ? 'tag-protected' : 'tag-public'}">${protectedRoute ? 'Protected' : 'Public'}</span>
      </summary>
      <div class="endpoint-body">
        <div class="token-raw-label-row" style="margin-top:16px">
          <span class="endpoint-body-label" style="margin:0">Request</span>
          ${copyButton(toSingleLineCommand(curl))}
        </div>
        ${curlBlock(curl)}
        <div class="endpoint-body-label">Sample response</div>
        <div class="code-block"><pre>${esc(sample)}</pre></div>
      </div>
    </details>`;
}

function bearerLine(accessToken) {
  return accessToken ? `Bearer ${accessToken}` : 'Bearer $ACCESS_TOKEN';
}

app.get('/', async (req, res) => {
  const {signedIn, accessToken, user} = await getSession(req);

  const hero = `
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-mark">${thunderMark(40)}</div>
        <div class="hero-badge"><span class="hero-badge-line"></span><span>Open source</span><span class="hero-badge-line"></span></div>
        <h1 class="hero-title">Auth for Modern Apps and Agents</h1>
        <p class="hero-subtitle">ThunderID gives you OAuth&nbsp;2.0, PKCE, MFA, and JWT out of
        the box. Clone the Quickstart and ship auth before lunch.</p>
        <hr class="hero-divider">
        <div class="hero-stats">
          <div class="hero-stat"><span class="hero-stat-value">OAuth 2.0</span><span class="hero-stat-label">Authorization standard</span></div>
          <div class="hero-stat"><span class="hero-stat-value">&lt; 5 min</span><span class="hero-stat-label">Integration time</span></div>
          <div class="hero-stat"><span class="hero-stat-value">Apache 2.0</span><span class="hero-stat-label">License</span></div>
        </div>
      </div>
    </section>`;

  const authCard = signedIn
    ? `<div class="card">
        <p>You're signed in. Here's your access token — it's already substituted into the curl
        examples below, so you can copy and run them as-is.</p>
        <div class="token-raw-label-row" style="margin-top:12px">
          <span class="token-section-label">Access token</span>
          ${copyButton(accessToken || '')}
        </div>
        <code class="token-raw">${esc(accessToken)}</code>
        <p style="margin-top:12px">See the full decoded token, expiry, and claims at <a href="/token">/token</a>.</p>
      </div>`
    : `<div class="card">
        <span class="token-section-label">Authorization header</span>
        <div style="margin-top:8px">${curlBlock(['Authorization: Bearer <access_token>'])}</div>
        <p style="margin-top:14px"><strong>Sign in</strong> above for a demo token, or obtain one via OAuth 2.0 in your own app.</p>
      </div>`;

  const body = `${hero}
    <div class="docs-shell">
    <div class="section-label">Authentication</div>
    ${authCard}

    <div class="section-label">Endpoints</div>
    ${endpoint({
      method: 'GET',
      path: '/api/public',
      summary: 'No authentication required.',
      protectedRoute: false,
      curl: ['curl http://localhost:3000/api/public'],
      sample: JSON.stringify({message: 'This endpoint is public. No token needed.'}, null, 2),
    })}
    ${endpoint({
      method: 'GET',
      path: '/api/protected',
      summary: 'Returns a sample resource for the authenticated caller.',
      protectedRoute: true,
      curl: [
        'curl http://localhost:3000/api/protected \\',
        `  -H "Authorization: ${bearerLine(accessToken)}"`,
      ],
      sample: JSON.stringify(
        {message: 'You are authenticated.', subject: '<sub claim from your token>'},
        null,
        2,
      ),
    })}
    ${endpoint({
      method: 'GET',
      path: '/api/me',
      summary: "Proxies ThunderID's userinfo claims for the token's owner.",
      protectedRoute: true,
      curl: ['curl http://localhost:3000/api/me \\', `  -H "Authorization: ${bearerLine(accessToken)}"`],
      sample: JSON.stringify({sub: '...', email: 'jane@example.com', given_name: 'Jane'}, null, 2),
    })}
    ${endpoint({
      method: 'GET',
      path: '/api/profile',
      summary: 'Full profile attributes + schema from /users/me and /users/me/meta.',
      protectedRoute: true,
      curl: ['curl http://localhost:3000/api/profile \\', `  -H "Authorization: ${bearerLine(accessToken)}"`],
      sample: JSON.stringify(
        {profile: {attributes: {given_name: 'Jane'}}, schema: {given_name: {type: 'string'}}},
        null,
        2,
      ),
    })}

    <div class="section-label">Native sign-in</div>
    <div class="card">
      <p>Prefer app-native auth over a redirect to a hosted page? <a href="/native-login">/native-login</a>
      drives the same sign-in flow through <code>POST /flow/sign-in</code>, rendering each step's UI
      components directly in this app via <code>handleFlow()</code>.</p>
    </div>

    <div class="section-label">Postman</div>
    <div class="card">
      <p>Prefer a GUI? Download the collection below — it ships with requests for every
      endpoint above and a <code>{{accessToken}}</code> variable you can fill in from
      <a href="/token">/token</a>.</p>
      <div style="margin-top:14px">
        <a class="btn-primary" href="/postman-collection.json" download="ThunderID-Express-Quickstart.postman_collection.json">Download Postman collection</a>
      </div>
    </div>
    </div>
  `;
  res.send(layout({title: 'API docs', signedIn, user, signInHref, body}));
});

// ── Demo token helper (browser-based, cookie session) ───────────────────

// /login and /logout drive the OAuth2 redirect flow specifically — guard them so a
// deployment with only applicationId/flowSecret configured doesn't fall through to
// ThunderID with an empty client_id, which surfaces as a confusing hosted error page
// instead of a clear local one.
function requireRedirectFlow(_req, res, next) {
  if (!redirectFlowConfigured) {
    res.redirect(nativeFlowConfigured ? '/native-login' : '/');
    return;
  }
  next();
}

app.get('/login', requireRedirectFlow, handleSignIn());
app.get('/logout', requireRedirectFlow, handleSignOut());

// ── Native/embedded sign-in (Flow Execution API) ────────────────────────
// Demonstrates app-native auth: no redirect to a hosted page, the flow's UI
// components are rendered by this app itself and driven via POST /flow/sign-in.

app.get('/native-login', (_req, res) => {
  if (!nativeFlowConfigured) {
    res.status(503).send(
      layout({
        title: 'Native sign-in',
        showBack: true,
        body: `<div class="page">
          <div class="eyebrow"><span class="eyebrow-dot" style="background:#e88b3a"></span>Setup required</div>
          <h1 class="page-title">Native sign-in needs a Flow Secret</h1>
          <p class="page-subtitle">Set <code>THUNDERID_APPLICATION_ID</code> and
          <code>THUNDERID_FLOW_SECRET</code> in <code>.env</code> (ThunderID Console &rarr; your application
          &rarr; Overview / Advanced Settings), then restart the server.</p>
        </div>`,
      }),
    );
    return;
  }

  res.send(
    layout({
      title: 'Native sign-in',
      showBack: true,
      body: `<div class="page">
        <div class="eyebrow"><span class="eyebrow-dot"></span>Flow Execution API</div>
        <h1 class="page-title">Native sign-in</h1>
        <p class="page-subtitle">This form is rendered from the flow steps returned by ThunderID —
        no redirect to a hosted page. Driven by <code>POST /flow/sign-in</code>, backed by
        <code>handleFlow()</code> from <code>@thunderid/express</code>.</p>
        <div id="native-login-root" class="card" data-application-id="${escAttr(applicationId)}">
          <div class="native-login-error" hidden></div>
        </div>
      </div>
      <script src="/native-login.js" defer></script>`,
    }),
  );
});

app.post('/flow/sign-in', handleFlow());

app.get('/token', protect((res) => res.redirect('/login')), async (req, res) => {
  const {accessToken, user} = await getSession(req);

  const parts = accessToken ? accessToken.split('.') : [];
  const decodePart = (part) => {
    try {
      return JSON.parse(Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    } catch {
      return null;
    }
  };
  const header = parts[0] ? decodePart(parts[0]) : null;
  const payload = parts[1] ? decodePart(parts[1]) : null;
  const issuer = payload?.iss;
  const audience = Array.isArray(payload?.aud) ? payload.aud.join(', ') : payload?.aud;
  const scopes = payload?.scope;

  const body = `<div class="page">
    <div class="token-header">
      <div>
        <h1 class="token-title">Token debug</h1>
        <p class="token-subtitle">Inspect your access token and decoded claims.</p>
      </div>
      <div class="token-badge" id="token-badge"><span class="token-badge-dot"></span><span id="token-badge-text">Valid</span></div>
    </div>

    <div class="token-raw-section">
      <div class="token-raw-label-row">
        <span class="token-section-label">Access token</span>
        ${copyButton(accessToken || '')}
      </div>
      <code class="token-raw"><span class="token-part--header">${esc(parts[0])}</span><span class="token-dot">.</span><span class="token-part--payload">${esc(parts[1])}</span><span class="token-dot">.</span><span class="token-part--signature">${esc(parts[2])}</span></code>
    </div>

    <div class="token-decoded-grid">
      <div class="token-code-box">
        <div class="token-code-box-header token-code-box-header--header">JWT Header</div>
        <pre class="token-code-pre">${esc(JSON.stringify(header, null, 2))}</pre>
      </div>
      <div class="token-code-box">
        <div class="token-code-box-header token-code-box-header--payload">JWT Payload</div>
        <pre class="token-code-pre">${esc(JSON.stringify(payload, null, 2))}</pre>
      </div>
    </div>

    ${
      issuer || audience || scopes
        ? `<div class="token-meta-row">
            ${issuer ? `<div class="token-meta-item"><div class="token-meta-label">Issuer</div><div class="token-meta-value">${esc(issuer)}</div></div>` : ''}
            ${audience ? `<div class="token-meta-item"><div class="token-meta-label">Audience</div><div class="token-meta-value">${esc(audience)}</div></div>` : ''}
            ${scopes ? `<div class="token-meta-item"><div class="token-meta-label">Scopes</div><div class="token-meta-value">${esc(scopes)}</div></div>` : ''}
          </div>`
        : ''
    }

    <script>
      (function () {
        var exp = ${JSON.stringify(payload?.exp ?? null)};
        var badge = document.getElementById('token-badge');
        var badgeText = document.getElementById('token-badge-text');
        function tick() {
          if (!exp) return;
          var secsLeft = exp - Math.floor(Date.now() / 1000);
          if (secsLeft <= 0) {
            badge.classList.add('token-badge--expired');
            badgeText.textContent = 'Expired';
          } else {
            badgeText.textContent = 'Valid \\u00b7 expires in ' + Math.floor(secsLeft / 60) + ' min';
          }
        }
        tick();
        setInterval(tick, 1000);
      })();
    </script>
  </div>`;
  res.send(layout({title: 'Token debug', signedIn: true, showBack: true, user, signInHref, body}));
});

// ── API routes (bearer-token protected, no cookies involved) ────────────

app.get('/api/public', (_req, res) => {
  res.json({message: 'This endpoint is public. No token needed.'});
});

app.get('/api/protected', requireBearer, (req, res) => {
  res.json({
    message: 'You are authenticated.',
    subject: req.thunderIDUserInfo.sub ?? req.thunderIDUserInfo.id,
  });
});

app.get('/api/me', requireBearer, (req, res) => {
  res.json(req.thunderIDUserInfo);
});

app.get('/api/profile', requireBearer, async (req, res) => {
  const fetcher = (url, config) =>
    fetch(url, {...config, headers: {...config?.headers, Authorization: `Bearer ${req.thunderIDAccessToken}`}});

  try {
    const [profile, meta] = await Promise.all([
      getUsersMe({baseUrl, fetcher}),
      getUsersMeMeta({baseUrl, fetcher}),
    ]);
    res.json({profile, schema: meta.schema ?? {}});
  } catch (err) {
    res.status(502).json({error: 'bad_gateway', message: err.message ?? 'Failed to fetch user profile.'});
  }
});

// ── Postman collection download ─────────────────────────────────────────

app.get('/postman-collection.json', (_req, res) => {
  res.download(path.join(__dirname, 'postman', 'ThunderID-Express-Quickstart.postman_collection.json'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
