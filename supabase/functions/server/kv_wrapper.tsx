// Wrapper for kv_store with timeout protection
import * as kv from "./kv_store.tsx";

const TIMEOUT_MS = 10000; // 10 seconds timeout

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = TIMEOUT_MS): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Database operation timeout')), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } catch (error: any) {
    console.error('withTimeout error:', error?.message);
    throw error;
  }
}

export async function get(key: string): Promise<any> {
  try {
    return await withTimeout(kv.get(key));
  } catch (error: any) {
    console.error('KV get error:', key, error.message);
    return null;
  }
}

export async function set(key: string, value: any): Promise<void> {
  try {
    await withTimeout(kv.set(key, value));
  } catch (error: any) {
    console.error('KV set error:', key, error.message);
    throw error;
  }
}

export async function del(key: string): Promise<void> {
  try {
    await withTimeout(kv.del(key));
  } catch (error: any) {
    console.error('KV del error:', key, error.message);
    // Don't throw on delete errors
  }
}

export async function getByPrefix(prefix: string): Promise<any[]> {
  try {
    return await withTimeout(kv.getByPrefix(prefix));
  } catch (error: any) {
    console.error('KV getByPrefix error:', prefix, error.message);
    return [];
  }
}

export async function mget(keys: string[]): Promise<any[]> {
  try {
    return await withTimeout(kv.mget(keys));
  } catch (error: any) {
    console.error('KV mget error:', keys, error.message);
    return [];
  }
}

export async function mset(keys: string[], values: any[]): Promise<void> {
  try {
    await withTimeout(kv.mset(keys, values));
  } catch (error: any) {
    console.error('KV mset error:', error.message);
    throw error;
  }
}

export async function mdel(keys: string[]): Promise<void> {
  try {
    await withTimeout(kv.mdel(keys));
  } catch (error: any) {
    console.error('KV mdel error:', error.message);
    // Don't throw on delete errors
  }
}
