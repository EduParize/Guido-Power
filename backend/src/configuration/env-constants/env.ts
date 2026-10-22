const DEFAULT_PORT = 3000;

export interface Env {
  PORT: number;
  MONGO_URI: string;
  ZENVIA_API_URL: string;
  ZENVIA_API_TOKEN: string;
  ZENVIA_WHATSAPP_FROM: string;
}

function parsePort(value: string | undefined): number {
  if (!value) {
    return DEFAULT_PORT;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid environment variables: PORT must be a positive integer, got "${value}"`);
  }

  return port;
}

function requireString(source: NodeJS.ProcessEnv, key: string): string {
  const value = source[key]?.trim();

  if (!value) {
    throw new Error(`Invalid environment variables: ${key} is required`);
  }

  return value;
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return {
    PORT: parsePort(source.PORT),
    MONGO_URI: requireString(source, "MONGO_URI"),
    ZENVIA_API_URL: requireString(source, "ZENVIA_API_URL"),
    ZENVIA_API_TOKEN: requireString(source, "ZENVIA_API_TOKEN"),
    ZENVIA_WHATSAPP_FROM: requireString(source, "ZENVIA_WHATSAPP_FROM"),
  };
}
