import { hex } from "../deps.ts";
import { totk } from "../totk.ts";

async function start() {
  const res1 = await fetch("http://localhost:8000/.well-known/totk");
  const json1 = await res1.json();
  const pub = hex.decode(json1.public_key);
  const priv = hex.decode(
    "cd418c82b30b56d0b7bcd488b0647c638f8cbbefeadb34ce23e7425d27cc2127",
  );
  const code = await totk(priv, pub);
  const res2 = await fetch("http://localhost:8000/alias", {
    method: "DELETE",
    body: JSON.stringify({ name: "hello", code }),
  });
  console.log(res2.status, await res2.text());
}

start();
