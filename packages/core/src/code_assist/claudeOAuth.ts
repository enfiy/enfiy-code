/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import * as http from 'http';
import url from 'url';
import crypto from 'crypto';
import * as net from 'net';
import open from 'open';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import * as os from 'os';

// Claude OAuth configuration
const CLAUDE_OAUTH_BASE_URL = 'https://claude.ai/oauth/authorize';
const CLAUDE_CLIENT_ID = '9d1c250a-e61b-44d9-88ed-5944d1962f5e';
const CLAUDE_OAUTH_SCOPES = [
  'org:create_api_key',
  'user:profile',
  'user:inference'
];

const ENFIY_DIR = '.enfiy';
const CLAUDE_CREDENTIAL_FILENAME = 'claude_oauth_creds.json';

interface ClaudeOAuthResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

export interface ClaudeWebLogin {
  authUrl: string;
  loginCompletePromise: Promise<ClaudeOAuthResponse>;
}

export async function getClaudeOAuthClient(): Promise<ClaudeOAuthResponse> {
  // Check for cached credentials first
  const cachedCreds = await loadCachedClaudeCredentials();
  if (cachedCreds) {
    console.log('✅ Using cached Claude credentials');
    return cachedCreds;
  }

  // Start OAuth flow
  const webLogin = await authWithClaudeWeb();

  const isWSL = process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP;
  const isLinux = process.platform === 'linux';
  const isDocker = process.env.container || process.env.DOCKER_CONTAINER;
  
  console.log('\n🔐 Claude authentication required');
  console.log('Opening browser for Claude.ai account authentication...');
  console.log('');
  
  if (isWSL || isLinux || isDocker) {
    console.log('🌐 Remote/containerized environment detected');
    console.log('If browser doesn\'t open automatically, copy this URL to your browser:');
    console.log('');
    console.log(`🔗 ${webLogin.authUrl}`);
    console.log('');
  }
  
  try {
    await open(webLogin.authUrl);
    console.log('✅ Browser opened successfully');
  } catch (_error) {
    console.log('⚠️ Failed to open browser automatically');
    console.log('Please manually copy and paste this URL into your browser:');
    console.log('');
    console.log(`🔗 ${webLogin.authUrl}`);
    console.log('');
    
    if (isWSL) {
      console.log('💡 WSL/Linux Tips:');
      console.log(`• wslview "${webLogin.authUrl}"`);
      console.log(`• cmd.exe /c start "${webLogin.authUrl}"`);
      console.log('• Or copy URL to Windows browser');
      console.log('');
    }
  }
  
  console.log('⏳ Waiting for authentication in browser...');
  console.log('   Please complete the login process in your browser window');

  const response = await webLogin.loginCompletePromise;
  
  console.log('✅ Claude authentication successful! Credentials cached for future use.');

  // Cache the credentials
  await cacheClaudeCredentials(response);

  return response;
}

async function authWithClaudeWeb(): Promise<ClaudeWebLogin> {
  const port = await getAvailablePort();
  const redirectUri = `http://localhost:${port}/callback`;
  const state = crypto.randomBytes(32).toString('hex');
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  // Build OAuth URL with PKCE
  const authParams = new URLSearchParams({
    code: 'true',
    client_id: CLAUDE_CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: CLAUDE_OAUTH_SCOPES.join(' '),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state
  });

  const authUrl = `${CLAUDE_OAUTH_BASE_URL}?${authParams.toString()}`;

  const loginCompletePromise = new Promise<ClaudeOAuthResponse>((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const parsedUrl = new url.URL(req.url!, `http://localhost:${port}`);
        
        if (parsedUrl.pathname !== '/callback') {
          res.writeHead(404);
          res.end('Not found');
          return;
        }

        const code = parsedUrl.searchParams.get('code');
        const returnedState = parsedUrl.searchParams.get('state');
        const error = parsedUrl.searchParams.get('error');

        if (error) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body><h1>Authentication Failed</h1><p>You can close this window.</p></body></html>');
          reject(new Error(`Claude OAuth error: ${error}`));
          server.close();
          return;
        }

        if (returnedState !== state) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body><h1>Authentication Failed</h1><p>State mismatch. You can close this window.</p></body></html>');
          reject(new Error('State mismatch. Possible CSRF attack'));
          server.close();
          return;
        }

        if (!code) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body><h1>Authentication Failed</h1><p>No authorization code received. You can close this window.</p></body></html>');
          reject(new Error('No authorization code received'));
          server.close();
          return;
        }

        // Exchange code for token
        try {
          const tokenResponse = await exchangeCodeForToken(code, redirectUri, codeVerifier);
          
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body><h1>Authentication Successful!</h1><p>You can close this window and return to Enfiy Code.</p></body></html>');
          
          resolve(tokenResponse);
        } catch (tokenError) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body><h1>Authentication Failed</h1><p>Failed to exchange code for token. You can close this window.</p></body></html>');
          reject(tokenError);
        }
        
        server.close();
      } catch (_error) {
        reject(_error);
        server.close();
      }
    });
    
    server.listen(port);
  });

  return {
    authUrl,
    loginCompletePromise
  };
}

async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
  codeVerifier: string
): Promise<ClaudeOAuthResponse> {
  // Claude OAuth token exchange endpoint
  const tokenUrl = 'https://claude.ai/oauth/token';
  
  const tokenParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: CLAUDE_CLIENT_ID,
    code_verifier: codeVerifier
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: tokenParams.toString()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
  }

  const tokenData = await response.json() as ClaudeOAuthResponse;
  return tokenData;
}

function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    let port = 0;
    try {
      const server = net.createServer();
      server.listen(0, () => {
        const address = server.address()! as net.AddressInfo;
        port = address.port;
      });
      server.on('listening', () => {
        server.close();
        server.unref();
      });
      server.on('error', (e) => reject(e));
      server.on('close', () => resolve(port));
    } catch (e) {
      reject(e);
    }
  });
}

async function loadCachedClaudeCredentials(): Promise<ClaudeOAuthResponse | null> {
  try {
    const credPath = getClaudeCachedCredentialPath();
    const credsData = await fs.readFile(credPath, 'utf-8');
    const creds = JSON.parse(credsData) as ClaudeOAuthResponse;
    
    // TODO: Validate token expiry and refresh if needed
    
    return creds;
  } catch {
    return null;
  }
}

async function cacheClaudeCredentials(credentials: ClaudeOAuthResponse) {
  const filePath = getClaudeCachedCredentialPath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  
  const credString = JSON.stringify(credentials, null, 2);
  await fs.writeFile(filePath, credString);
}

function getClaudeCachedCredentialPath(): string {
  return path.join(os.homedir(), ENFIY_DIR, CLAUDE_CREDENTIAL_FILENAME);
}

export async function clearClaudeCachedCredentials() {
  try {
    await fs.rm(getClaudeCachedCredentialPath());
  } catch {
    // Ignore errors
  }
}