const Pool = new Map<BigInt, number>();

type BloomInput = {
  challenge: string;
  sig: string;
};
export function bloom(input: BloomInput) {
  const ts = parseInt(input.challenge.split(":")[0]);
  const key = BigInt("0x" + input.sig.slice(0, 16));
  if (Pool.has(key)) return false;

  Pool.set(key, ts);
  return true;
}

setInterval(() => {
  const now = ~~(Date.now() / 1000);
  for (const [i, val] of Pool.entries()) {
    if (now - val > 600000) Pool.delete(i);
  }
}, 600000);
