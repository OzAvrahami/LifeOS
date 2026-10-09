import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

type Store = { getItem: (key: string) => Promise<string | null>; setItem: (key: string, value: string) => Promise<void>; removeItem: (key: string) => Promise<void> };
type Manifest = { generation: string; count: number };
// Small UTF-16 chunks also stay below native byte limits for non-ASCII user metadata.
const chunkSize = 450;
export function createSessionStorage(secure: Store, legacy: Store): Store {
  const prefix = (key: string) => `lifeos.${encodeURIComponent(key).replace(/%/g, '_')}`;
  const manifest = async (key: string): Promise<Manifest | null> => {
    const raw = await secure.getItem(`${prefix(key)}.manifest`);
    if (!raw) return null;
    const value = JSON.parse(raw) as Manifest;
    if (!/^[a-z0-9-]+$/.test(value.generation) || !Number.isInteger(value.count) || value.count < 0 || value.count > 1000) throw new Error('Invalid secure session storage');
    return value;
  };
  const cleanup = async (key: string, old: Manifest | null) => {
    if (old) await Promise.all(Array.from({ length: old.count }, (_, i) => secure.removeItem(`${prefix(key)}.${old.generation}.${i}`)));
  };
  const storage: Store = {
    async getItem(key) {
      const current = await manifest(key);
      if (current) {
        if (!current.count) return null; // Tombstone prevents resurrection from an old plaintext copy.
        const chunks = await Promise.all(Array.from({ length: current.count }, (_, i) => secure.getItem(`${prefix(key)}.${current.generation}.${i}`)));
        if (chunks.some(chunk => chunk === null)) throw new Error('Incomplete secure session storage');
        await legacy.removeItem(key).catch(() => undefined);
        return chunks.join('');
      }
      const existing = await legacy.getItem(key);
      if (existing !== null) await storage.setItem(key, existing);
      return existing;
    },
    async setItem(key, value) {
      const old = await manifest(key);
      const generation = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      const characters = Array.from(value); // Never split a Unicode surrogate pair across native writes.
      const chunks = Array.from({ length: Math.ceil(characters.length / chunkSize) }, (_, i) => characters.slice(i * chunkSize, (i + 1) * chunkSize).join(''));
      if (chunks.length > 1000) throw new Error('Session metadata is too large');
      // Publish only after all chunks are durable; an interrupted write keeps the previous session.
      try {
        for (let i = 0; i < chunks.length; i++) await secure.setItem(`${prefix(key)}.${generation}.${i}`, chunks[i]);
        await secure.setItem(`${prefix(key)}.manifest`, JSON.stringify({ generation, count: chunks.length }));
      } catch (error) {
        await cleanup(key, { generation, count: chunks.length }).catch(() => undefined);
        throw error;
      }
      await legacy.removeItem(key).catch(() => undefined);
      await cleanup(key, old).catch(() => undefined);
    },
    async removeItem(key) {
      const old = await manifest(key);
      await secure.setItem(`${prefix(key)}.manifest`, JSON.stringify({ generation: 'deleted', count: 0 }));
      await legacy.removeItem(key).catch(() => undefined);
      await cleanup(key, old).catch(() => undefined);
    },
  };
  return storage;
}

const secure: Store = {
  getItem: key => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }),
  removeItem: key => SecureStore.deleteItemAsync(key),
};
// Web retains Supabase's browser storage contract. The auxiliary recovery marker contains no tokens.
export const nativeSessionStorage = createSessionStorage(secure, AsyncStorage);
export const recoveryStorage = Platform.OS === 'web' ? AsyncStorage : nativeSessionStorage;
