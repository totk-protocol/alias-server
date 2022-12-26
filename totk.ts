import { ed25519 } from "./deps.ts";

export async function totk(priv: Uint8Array, pub: Uint8Array) {
  const key = await ed25519.getSharedSecret(priv, pub);
  const ts = ~~(Date.now() / 30000);
  const dv = new DataView(new Uint8Array(4).buffer);
  dv.setInt32(0, ts);
  const hash = await ed25519.sign(new Uint8Array(dv.buffer), key);
  const offset = hash[hash.length - 1] & 0x0f;
  const dv2 = new DataView(hash.buffer);
  const n = dv2.getUint32(offset);
  return (n % 1000000).toString().padStart(6, "0");
}
