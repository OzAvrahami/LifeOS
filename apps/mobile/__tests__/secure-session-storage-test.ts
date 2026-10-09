import { createSessionStorage } from '@/lib/supabase/session-storage';

function memoryStore() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => { values.set(key, value); }),
    removeItem: jest.fn(async (key: string) => { values.delete(key); }),
  };
}
it('migrates the existing Supabase storage key without losing a session and survives a fresh adapter', async () => {
  const secure = memoryStore(), legacy = memoryStore();
  const payload = JSON.stringify({ access_token: 'synthetic', metadata: 'a'.repeat(449) + '🌱'.repeat(1500) });
  legacy.values.set('sb-project-auth-token', payload);
  const storage = createSessionStorage(secure, legacy);
  expect(await storage.getItem('sb-project-auth-token')).toBe(payload);
  expect(legacy.values.size).toBe(0);
  expect(await createSessionStorage(secure, legacy).getItem('sb-project-auth-token')).toBe(payload);
  for (const [key, value] of secure.values) {
    expect(key).toMatch(/^[A-Za-z0-9._-]+$/);
    expect(encodeURIComponent(value).replace(/%[A-F\d]{2}/gi, 'x').length).toBeLessThan(2048);
    expect(() => encodeURIComponent(value)).not.toThrow();
  }
});
it('retains the previous durable session when a chunk or manifest write fails', async () => {
  const secure = memoryStore(), legacy = memoryStore();
  const storage = createSessionStorage(secure, legacy);
  await storage.setItem('session', 'original');
  secure.setItem.mockRejectedValueOnce(new Error('keychain unavailable'));
  await expect(storage.setItem('session', 'replacement')).rejects.toThrow();
  expect(await storage.getItem('session')).toBe('original');
  secure.setItem.mockImplementationOnce(async (key, value) => { secure.values.set(key, value); })
    .mockRejectedValueOnce(new Error('manifest failed'));
  await expect(storage.setItem('session', 'replacement')).rejects.toThrow();
  expect(await storage.getItem('session')).toBe('original');
});
it('does not delete the legacy session if migration cannot be persisted', async () => {
  const secure = memoryStore(), legacy = memoryStore();
  legacy.values.set('session', 'original');
  secure.setItem.mockRejectedValueOnce(new Error('locked'));
  await expect(createSessionStorage(secure, legacy).getItem('session')).rejects.toThrow();
  expect(legacy.values.get('session')).toBe('original');
});
it('does not resurrect an old plaintext session after logout, even if legacy cleanup fails', async () => {
  const secure = memoryStore(), legacy = memoryStore();
  const storage = createSessionStorage(secure, legacy);
  await storage.setItem('session', 'new');
  legacy.values.set('session', 'old');
  legacy.removeItem.mockRejectedValue(new Error('unavailable'));
  await storage.removeItem('session');
  expect(await createSessionStorage(secure, legacy).getItem('session')).toBeNull();
  expect([...secure.values.values()]).not.toContain('new');
});
it('rejects partial secure data rather than silently loading a stale legacy session', async () => {
  const secure = memoryStore(), legacy = memoryStore();
  const storage = createSessionStorage(secure, legacy);
  await storage.setItem('session', 'new');
  const chunk = [...secure.values.keys()].find(key => !key.endsWith('.manifest'))!;
  secure.values.delete(chunk); legacy.values.set('session', 'old');
  await expect(storage.getItem('session')).rejects.toThrow('Incomplete');
});
