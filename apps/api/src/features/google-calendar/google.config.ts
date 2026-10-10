import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { GoogleError } from './google.types.js';
export const googleScopes = ['openid', 'email', 'https://www.googleapis.com/auth/calendar.calendarlist.readonly', 'https://www.googleapis.com/auth/calendar.events.readonly'];
export type GoogleConfig = { clientId: string; clientSecret: string; redirectUri: string; webReturn: string; nativeReturn: string; key: Buffer; supabaseUrl: string; serviceKey: string };
export function readGoogleConfig(): GoogleConfig | null {
  const env = process.env;
  const values = ['GOOGLE_CALENDAR_CLIENT_ID','GOOGLE_CALENDAR_CLIENT_SECRET','GOOGLE_CALENDAR_REDIRECT_URI','GOOGLE_CALENDAR_WEB_RETURN_URI','GOOGLE_CALENDAR_ENCRYPTION_KEY','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_URL'];
  if (values.some(name => !env[name])) return null;
  const localOrHttps = (value: string) => {
    const u = new URL(value);
    if (u.username || u.password || u.search || u.hash || (u.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && u.protocol === 'http:' && ['localhost','127.0.0.1'].includes(u.hostname)))) throw new Error('Invalid integration URL');
    return u.href;
  };
  try {
    const key = Buffer.from(env.GOOGLE_CALENDAR_ENCRYPTION_KEY!, 'base64');
    if (key.length !== 32) return null;
    const redirectUri = localOrHttps(env.GOOGLE_CALENDAR_REDIRECT_URI!);
    const webReturn = localOrHttps(env.GOOGLE_CALENDAR_WEB_RETURN_URI!);
    if (new URL(redirectUri).pathname !== '/integrations/google/callback' || new URL(webReturn).pathname !== '/settings/google-return') return null;
    return { clientId: env.GOOGLE_CALENDAR_CLIENT_ID!, clientSecret: env.GOOGLE_CALENDAR_CLIENT_SECRET!, redirectUri, webReturn,
      nativeReturn: 'lifeos://settings/google-return', key, supabaseUrl: localOrHttps(env.SUPABASE_URL!), serviceKey: env.SUPABASE_SERVICE_ROLE_KEY! };
  } catch { return null; }
}
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export const nonce = () => randomBytes(32).toString('base64url');
export function seal(value: string, owner: string, purpose: string, key: Buffer) {
  const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(`${owner}:${purpose}`));
  const body = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), body].map(part => part.toString('base64url')).join('.');
}
export function unseal(value: string, owner: string, purpose: string, key: Buffer) {
  try {
    const [iv, tag, body] = value.split('.').map(part => Buffer.from(part, 'base64url'));
    const cipher = createDecipheriv('aes-256-gcm', key, iv!); cipher.setAAD(Buffer.from(`${owner}:${purpose}`)); cipher.setAuthTag(tag!);
    return Buffer.concat([cipher.update(body!), cipher.final()]).toString('utf8');
  } catch { throw new GoogleError(409, 'reconnect_required'); }
}
