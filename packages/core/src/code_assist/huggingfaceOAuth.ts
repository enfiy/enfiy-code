/**
 * @license
 * Copyright 2025 The Enfiy Community Contributors
 * SPDX-License-Identifier: MIT
 */

import * as http from 'http';
import url from 'url';
import crypto from 'crypto';
import * as net from 'net';
import open from 'open';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import * as os from 'os';

// HuggingFace OAuth configuration
const HF_OAUTH_BASE_URL = 'https://huggingface.co/oauth/authorize';
const HF_TOKEN_URL = 'https://huggingface.co/oauth/token';
const HF_CLIENT_ID = process.env.HF_CLIENT_ID || 'enfiy-code'; // This should be registered
const HF_OAUTH_SCOPES = [
  'openid',
  'profile',
  'inference-api',
  'read-repos'
];

const ENFIY_DIR = '.enfiy';
const HF_CREDENTIAL_FILENAME = 'hf_oauth_creds.json';

interface HFOAuthResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

export interface HFWebLogin {
  authUrl: string;
  loginCompletePromise: Promise<HFOAuthResponse>;
}

export async function getHuggingFaceOAuthClient(): Promise<HFOAuthResponse> {
  // Check for cached credentials first
  const cachedCreds = await loadCachedHFCredentials();
  if (cachedCreds) {
    console.log('✅ Using cached HuggingFace credentials');
    return cachedCreds;
  }

  // Start OAuth flow
  const webLogin = await authWithHFWeb();

  const isWSL = process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP;
  const isLinux = process.platform === 'linux';
  const isDocker = process.env.container || process.env.DOCKER_CONTAINER;
  
  console.log('\n🤗 HuggingFace authentication required');
  console.log('Opening browser for HuggingFace account authentication...');
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
  } catch (error) {
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
  
  console.log('✅ HuggingFace authentication successful! Credentials cached for future use.');

  // Cache the credentials
  await cacheHFCredentials(response);

  return response;
}

async function authWithHFWeb(): Promise<HFWebLogin> {
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
    client_id: HF_CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: HF_OAUTH_SCOPES.join(' '),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state
  });

  const authUrl = `${HF_OAUTH_BASE_URL}?${authParams.toString()}`;

  const loginCompletePromise = new Promise<HFOAuthResponse>((resolve, reject) => {
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
          reject(new Error(`HuggingFace OAuth error: ${error}`));
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
          res.end('<html><body><h1>🤗 Authentication Successful!</h1><p>You can close this window and return to Enfiy Code.</p></body></html>');
          
          resolve(tokenResponse);
        } catch (tokenError) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body><h1>Authentication Failed</h1><p>Failed to exchange code for token. You can close this window.</p></body></html>');
          reject(tokenError);
        }
        
        server.close();
      } catch (error) {
        reject(error);
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
): Promise<HFOAuthResponse> {
  const tokenParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    client_id: HF_CLIENT_ID,
    code_verifier: codeVerifier
  });

  const response = await fetch(HF_TOKEN_URL, {
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

  const tokenData = await response.json() as HFOAuthResponse;
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

async function loadCachedHFCredentials(): Promise<HFOAuthResponse | null> {
  try {
    const credPath = getHFCachedCredentialPath();
    const credsData = await fs.readFile(credPath, 'utf-8');
    const creds = JSON.parse(credsData) as HFOAuthResponse;
    
    // TODO: Validate token expiry and refresh if needed
    
    return creds;
  } catch {
    return null;
  }
}

async function cacheHFCredentials(credentials: HFOAuthResponse) {
  const filePath = getHFCachedCredentialPath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  
  const credString = JSON.stringify(credentials, null, 2);
  await fs.writeFile(filePath, credString);
}

function getHFCachedCredentialPath(): string {
  return path.join(os.homedir(), ENFIY_DIR, HF_CREDENTIAL_FILENAME);
}

export async function clearHFCachedCredentials() {
  try {
    await fs.rm(getHFCachedCredentialPath());
  } catch {
    // Ignore errors
  }
}