import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

let cachedGeminiKey = null;

export async function getGeminiApiKey() {
  if (cachedGeminiKey) return cachedGeminiKey;

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction && process.env.GEMINI_API_KEY_LOCAL_DEV_ONLY) {
    cachedGeminiKey = process.env.GEMINI_API_KEY_LOCAL_DEV_ONLY;
    return cachedGeminiKey;
  }

  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const secretName = process.env.GEMINI_SECRET_NAME || 'gemini-api-key';

  if (!projectId) {
    throw new Error(
      'GOOGLE_CLOUD_PROJECT is not set — cannot resolve the Gemini secret.'
    );
  }

  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;

  const [version] = await client.accessSecretVersion({ name });
  const payload = version.payload?.data?.toString('utf8');

  if (!payload) {
    throw new Error('Gemini secret payload was empty.');
  }

  cachedGeminiKey = payload;
  return cachedGeminiKey;
}
