import {sluggify} from "./sluggify.js";

async function sha256(input: string): Promise<bigint> {
  const encoded = new TextEncoder().encode(input);
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  return new Uint8Array(buffer).reduce((i, byte) => (i << 8n) | BigInt(byte), 0n);
}

function base36(int: bigint, length: number): string {
  return int.toString(36).padStart(length, "0").slice(0, length);
}

export async function hash(strings: readonly string[], ...params: unknown[]): Promise<string> {
  return base36(await sha256(JSON.stringify([strings, ...params])), 16);
}

export async function nameHash(name: string): Promise<string> {
  return /^[\w-]+$/.test(name)
    ? name
    : `${sluggify(basename(name))}.${base36(await sha256(name), 8)}`;
}

function basename(name: string): string {
  return name.replace(/^.*\//, "");
}
