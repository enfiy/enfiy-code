/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as crypto from 'node:crypto';

const ENFIY_CONFIG_DIR = path.join(os.homedir(), '.enfiy');
const SECURE_CONFIG_FILE = path.join(ENFIY_CONFIG_DIR, 'secure.json');
const KEY_FILE = path.join(ENFIY_CONFIG_DIR, '.key');

// Security constants
const _KEY_DERIVATION_ITERATIONS = 100000; // PBKDF2 iterations
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

interface SecureConfig {
  providers: {
    [key: string]: {
      apiKey?: string;
      endpoint?: string;
      authMethod?: string;
      encrypted: boolean;
    };
  };
  version: string;
}

/**
 * Generate or retrieve encryption key with enhanced security
 */
function _getEncryptionKey(): Buffer {
  try {
    if (fs.existsSync(KEY_FILE)) {
      const keyData = fs.readFileSync(KEY_FILE);
      // Validate key length
      if (keyData.length === KEY_LENGTH) {
        return keyData;
      }
      // Invalid key, regenerate
      console.warn('Invalid key file, regenerating');
    }
  } catch (_error) {
    // If we can't read the key file, generate a new one
  }

  // Generate new key using hardware random if available
  const key = crypto.randomBytes(KEY_LENGTH);

  try {
    // Ensure directory exists with strict permissions
    if (!fs.existsSync(ENFIY_CONFIG_DIR)) {
      fs.mkdirSync(ENFIY_CONFIG_DIR, { mode: 0o700, recursive: true });
    }

    // Check directory permissions
    const stats = fs.statSync(ENFIY_CONFIG_DIR);
    if ((stats.mode & 0o077) !== 0) {
      // Directory is accessible by others, fix permissions
      fs.chmodSync(ENFIY_CONFIG_DIR, 0o700);
    }

    // Write key with restricted permissions
    fs.writeFileSync(KEY_FILE, key, { mode: 0o600 });

    // Verify file permissions
    const keyStats = fs.statSync(KEY_FILE);
    if ((keyStats.mode & 0o077) !== 0) {
      fs.chmodSync(KEY_FILE, 0o600);
    }
  } catch (_error) {
    console.warn(
      'Warning: Could not save encryption key. API keys will not persist between sessions.',
    );
  }

  return key;
}

/**
 * Encrypt data using AES-256-GCM with additional security measures
 */
function encrypt(data: string): {
  encrypted: string;
  iv: string;
  tag: string;
  salt?: string;
  version: number;
} {
  // Validate input
  if (!data || typeof data !== 'string') {
    throw new Error('Invalid data for encryption');
  }

  const key = _getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  // Use a salt for key derivation in future versions
  const salt = crypto.randomBytes(SALT_LENGTH);

  // Create cipher with authenticated encryption
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  // Add additional authenticated data (AAD)
  const aad = Buffer.from('enfiy-secure-storage-v2');
  cipher.setAAD(aad);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  // Validate tag length
  if (tag.length !== TAG_LENGTH) {
    throw new Error('Invalid tag length');
  }

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    salt: salt.toString('hex'),
    version: 2,
  };
}

/**
 * Decrypt data using AES-256-GCM with validation
 */
function decrypt(encryptedData: {
  encrypted: string;
  iv: string;
  tag: string;
  salt?: string;
  version?: number;
}): string {
  // Validate input
  if (
    !encryptedData ||
    !encryptedData.encrypted ||
    !encryptedData.iv ||
    !encryptedData.tag
  ) {
    throw new Error('Invalid encrypted data format');
  }

  const key = _getEncryptionKey();

  // Validate hex strings
  if (
    !/^[0-9a-f]+$/i.test(encryptedData.iv) ||
    !/^[0-9a-f]+$/i.test(encryptedData.tag) ||
    !/^[0-9a-f]+$/i.test(encryptedData.encrypted)
  ) {
    throw new Error('Invalid hex format in encrypted data');
  }

  const iv = Buffer.from(encryptedData.iv, 'hex');
  const tag = Buffer.from(encryptedData.tag, 'hex');

  // Validate lengths
  if (iv.length !== IV_LENGTH || tag.length !== TAG_LENGTH) {
    throw new Error('Invalid IV or tag length');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  // Add AAD for version 2
  if (encryptedData.version === 2) {
    const aad = Buffer.from('enfiy-secure-storage-v2');
    decipher.setAAD(aad);
  }

  try {
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (_error) {
    throw new Error(
      'Decryption failed - data may be corrupted or tampered with',
    );
  }
}

/**
 * Load secure configuration
 */
export function loadSecureConfig(): SecureConfig {
  const defaultConfig: SecureConfig = {
    providers: {},
    version: '1.0.0',
  };

  try {
    if (!fs.existsSync(SECURE_CONFIG_FILE)) {
      return defaultConfig;
    }

    const configData = fs.readFileSync(SECURE_CONFIG_FILE, 'utf8');
    const config = JSON.parse(configData) as SecureConfig;

    // Decrypt API keys
    for (const [providerName, providerConfig] of Object.entries(
      config.providers,
    )) {
      if (providerConfig.encrypted && providerConfig.apiKey) {
        try {
          const encryptedData = JSON.parse(providerConfig.apiKey);
          config.providers[providerName].apiKey = decrypt(encryptedData);
          config.providers[providerName].encrypted = false; // Mark as decrypted in memory
        } catch (error) {
          console.warn(
            `Warning: Could not decrypt API key for ${providerName}:`,
            error instanceof Error ? error.message : String(error),
          );
          delete config.providers[providerName].apiKey;
        }
      }
    }

    return config;
  } catch (error) {
    console.warn(
      'Warning: Could not load secure configuration, using defaults:',
      error instanceof Error ? error.message : String(error),
    );
    return defaultConfig;
  }
}

/**
 * Save secure configuration
 */
export function saveSecureConfig(config: SecureConfig): void {
  try {
    // Ensure directory exists
    if (!fs.existsSync(ENFIY_CONFIG_DIR)) {
      fs.mkdirSync(ENFIY_CONFIG_DIR, { mode: 0o700 });
    }

    // Create a copy for encryption
    const configToSave = JSON.parse(JSON.stringify(config));

    // Encrypt API keys
    for (const [providerName, providerConfig] of Object.entries(
      configToSave.providers,
    )) {
      if (
        providerConfig &&
        typeof providerConfig === 'object' &&
        'apiKey' in providerConfig &&
        'encrypted' in providerConfig
      ) {
        if (providerConfig.apiKey && !providerConfig.encrypted) {
          const encryptedData = encrypt(providerConfig.apiKey as string);
          configToSave.providers[providerName].apiKey =
            JSON.stringify(encryptedData);
          configToSave.providers[providerName].encrypted = true;
        }
      }
    }

    // Write with restricted permissions
    fs.writeFileSync(
      SECURE_CONFIG_FILE,
      JSON.stringify(configToSave, null, 2),
      { mode: 0o600 },
    );
  } catch (_error) {
    console.warn('Warning: Could not save secure configuration:', _error);
  }
}

/**
 * Store API key securely
 */
export function storeApiKey(
  provider: string,
  apiKey: string,
  endpoint?: string,
  authMethod?: string,
): void {
  const config = loadSecureConfig();

  // Sanitize API key input
  const cleanedApiKey = apiKey
    .replace(/\[200~|\[201~/g, '') // Remove bracketed paste markers
    // eslint-disable-next-line no-control-regex
    .replace(/\\u001b|[\u001b]/g, '') // Remove escape characters
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, '') // Remove all control characters
    .replace(/[^\x20-\x7E]/g, '') // Remove non-printable ASCII
    .trim();

  // Additional validation
  if (cleanedApiKey.length === 0) {
    throw new Error('API key cannot be empty');
  }

  if (cleanedApiKey.length > 512) {
    throw new Error('API key is too long');
  }

  config.providers[provider] = {
    apiKey: cleanedApiKey,
    endpoint,
    authMethod,
    encrypted: false, // Will be encrypted during save
  };

  saveSecureConfig(config);
}

/**
 * Retrieve API key
 */
export function getApiKey(provider: string): string | undefined {
  const config = loadSecureConfig();
  return config.providers[provider]?.apiKey;
}

/**
 * Remove API key
 */
export function removeApiKey(provider: string): void {
  const config = loadSecureConfig();
  delete config.providers[provider];
  saveSecureConfig(config);
}

/**
 * Check if provider has stored credentials
 */
export function hasStoredCredentials(provider: string): boolean {
  const config = loadSecureConfig();
  return !!config.providers[provider]?.apiKey;
}

/**
 * List configured providers
 */
export function getConfiguredProviders(): string[] {
  const config = loadSecureConfig();
  return Object.keys(config.providers);
}

/**
 * Load API keys from secure storage into environment variables
 */
export function loadApiKeysIntoEnvironment(): void {
  const config = loadSecureConfig();

  for (const [provider, providerConfig] of Object.entries(config.providers)) {
    if (providerConfig.apiKey) {
      // Map provider names to environment variable names
      const envVar = getEnvVarForProvider(provider);
      if (envVar && !process.env[envVar]) {
        process.env[envVar] = providerConfig.apiKey;
      }
    }
  }
}

/**
 * Get environment variable name for provider
 */
function getEnvVarForProvider(provider: string): string | undefined {
  const envVarMap: { [key: string]: string } = {
    // Cloud AI Providers (lowercase)
    openai: 'OPENAI_API_KEY',
    gemini: 'GEMINI_API_KEY',
    google: 'GOOGLE_API_KEY',
    mistral: 'MISTRAL_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',

    // Cloud AI Providers (uppercase)
    OPENAI: 'OPENAI_API_KEY',
    GEMINI: 'GEMINI_API_KEY',
    GOOGLE: 'GOOGLE_API_KEY',
    MISTRAL: 'MISTRAL_API_KEY',
    ANTHROPIC: 'ANTHROPIC_API_KEY',

    // OpenRouter
    openrouter: 'OPENROUTER_API_KEY',
    OPENROUTER: 'OPENROUTER_API_KEY',
  };

  return envVarMap[provider] || envVarMap[provider.toLowerCase()];
}

/**
 * Validate API key format
 */
export function validateApiKey(provider: string, apiKey: string): boolean {
  // Enhanced validation patterns for security
  const patterns = {
    // OpenAI
    openai: /^sk-.*$/,

    // Google (Gemini)
    gemini: /^AIza.{20,}$/,
    google: /^AIza.{20,}$/,

    // Mistral
    mistral: /^[A-Za-z0-9]{32,}$/,

    // Anthropic
    anthropic: /^sk-ant-[A-Za-z0-9\-_]{20,}$/,

    // OpenRouter
    openrouter: /^sk-or-v1-[0-9a-f]{64}$/,
  };

  const providerKey = provider.toLowerCase();
  const pattern = patterns[providerKey as keyof typeof patterns];

  if (pattern) {
    const result = pattern.test(apiKey);

    if (!result && (providerKey === 'gemini' || providerKey === 'google')) {
      // Allow any key that starts with AIza and is reasonable length
      if (
        apiKey.startsWith('AIza') &&
        apiKey.length >= 20 &&
        apiKey.length <= 200
      ) {
        return true;
      }
    }
    return result;
  }

  // For local providers like Ollama, no API key required
  const localProviders = ['ollama', 'vllm'];
  if (localProviders.includes(provider.toLowerCase())) {
    return true; // No API key validation needed for local providers
  }

  // For unknown providers, basic validation
  return (
    apiKey.length >= 10 &&
    apiKey.length <= 200 &&
    /^[A-Za-z0-9_-]+$/.test(apiKey)
  );
}
