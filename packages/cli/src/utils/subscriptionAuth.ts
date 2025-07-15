/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import { ProviderType } from '@enfiy/core';
import { getApiKey } from './secureStorage.js';

export interface SubscriptionAuth {
  provider: ProviderType;
  authType: 'subscription' | 'api' | 'oauth';
  accountEmail?: string;
  subscriptionTier?: 'free' | 'pro' | 'max' | 'team';
  sessionToken?: string;
  expiresAt?: Date;
}

// Session storage for subscription authentication
const subscriptionSessions = new Map<ProviderType, SubscriptionAuth>();

export function getSubscriptionAuth(
  provider: ProviderType,
): SubscriptionAuth | null {
  return subscriptionSessions.get(provider) || null;
}

export function setSubscriptionAuth(auth: SubscriptionAuth): void {
  subscriptionSessions.set(auth.provider, auth);
}

export function removeSubscriptionAuth(provider: ProviderType): void {
  subscriptionSessions.delete(provider);
}

export function isSubscriptionValid(provider: ProviderType): boolean {
  const auth = getSubscriptionAuth(provider);
  if (!auth) return false;

  if (auth.expiresAt && auth.expiresAt < new Date()) {
    removeSubscriptionAuth(provider);
    return false;
  }

  return true;
}

// Claude subscription authentication
export async function authenticateClaudeSubscription(
  email: string,
  password: string,
): Promise<SubscriptionAuth> {
  // This is a mock implementation - in real scenario, you'd integrate with Claude's web authentication
  // For now, we'll simulate the login process

  try {
    // Simulate API call to Claude authentication
    const response = await simulateClaudeLogin(email, password);

    const auth: SubscriptionAuth = {
      provider: ProviderType.ANTHROPIC,
      authType: 'subscription',
      accountEmail: email,
      subscriptionTier: response.tier,
      sessionToken: response.sessionToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    setSubscriptionAuth(auth);
    return auth;
  } catch (error) {
    throw new Error(`Claude subscription authentication failed: ${error}`);
  }
}

// Gemini OAuth authentication
export async function authenticateGeminiOAuth(): Promise<SubscriptionAuth> {
  try {
    // This would integrate with Google OAuth flow
    const response = await simulateGoogleOAuth();

    const auth: SubscriptionAuth = {
      provider: ProviderType.GEMINI,
      authType: 'oauth',
      accountEmail: response.email,
      subscriptionTier: response.tier,
      sessionToken: response.accessToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    };

    setSubscriptionAuth(auth);
    return auth;
  } catch (error) {
    throw new Error(`Gemini OAuth authentication failed: ${error}`);
  }
}

// Get authentication status for provider
export function getAuthStatus(provider: ProviderType): {
  isAuthenticated: boolean;
  authType: 'api' | 'subscription' | 'oauth' | null;
  accountInfo?: string;
  subscriptionTier?: string;
} {
  // Check API key
  const apiKey = getApiKey(provider);
  if (apiKey) {
    return {
      isAuthenticated: true,
      authType: 'api',
      accountInfo: `API Key (${apiKey.substring(0, 8)}...)`,
    };
  }

  // Check subscription
  const subscriptionAuth = getSubscriptionAuth(provider);
  if (subscriptionAuth && isSubscriptionValid(provider)) {
    return {
      isAuthenticated: true,
      authType: subscriptionAuth.authType,
      accountInfo: subscriptionAuth.accountEmail,
      subscriptionTier: subscriptionAuth.subscriptionTier,
    };
  }

  return {
    isAuthenticated: false,
    authType: null,
  };
}

// Mock functions for demonstration - replace with real implementations
async function simulateClaudeLogin(
  email: string,
  password: string,
): Promise<{
  sessionToken: string;
  tier: 'free' | 'pro' | 'max';
}> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Mock validation
  if (!email.includes('@')) {
    throw new Error('Invalid email format');
  }

  if (password.length < 6) {
    throw new Error('Invalid password');
  }

  // Mock successful response
  return {
    sessionToken: 'claude_session_' + Math.random().toString(36).substring(7),
    tier: email.includes('pro')
      ? 'pro'
      : email.includes('max')
        ? 'max'
        : 'free',
  };
}

async function simulateGoogleOAuth(): Promise<{
  email: string;
  accessToken: string;
  tier: 'free' | 'pro';
}> {
  // Simulate OAuth flow
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Mock successful OAuth response
  return {
    email: 'user@gmail.com',
    accessToken: 'google_oauth_' + Math.random().toString(36).substring(7),
    tier: 'free',
  };
}

export function getProviderDisplayName(
  provider: ProviderType,
  authStatus: ReturnType<typeof getAuthStatus>,
): string {
  const baseNames: Record<ProviderType, string> = {
    [ProviderType.ANTHROPIC]: 'Claude',
    [ProviderType.GEMINI]: 'Gemini',
    [ProviderType.OPENAI]: 'OpenAI',
    [ProviderType.MISTRAL]: 'Mistral',
    [ProviderType.OLLAMA]: 'Ollama',
    [ProviderType.HUGGINGFACE]: 'HuggingFace',
    [ProviderType.VLLM]: 'vLLM',
    [ProviderType.OPENROUTER]: 'OpenRouter',
  };

  const baseName = baseNames[provider] || provider.toString();

  if (!authStatus.isAuthenticated) {
    return `${baseName} (Not Connected)`;
  }

  switch (authStatus.authType) {
    case 'api':
      return `${baseName} (API)`;
    case 'subscription':
      return `${baseName} (${authStatus.subscriptionTier?.toUpperCase()})`;
    case 'oauth':
      return `${baseName} (OAuth)`;
    default:
      return baseName;
  }
}
