import {
  generateRecoveryKey,
  importRecoveryKey,
  deriveKeyFromPassphrase,
  encryptWithKey,
  decryptWithKey,
  encryptWithPassphrase,
  generateSalt,
  bufferToBase64Url,
  base64UrlToBuffer,
} from "../src/lib/crypto/e2ee";

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${name}`);
  }
}

async function run() {
  console.log("\n=== 1. Recovery Key Round-Trip (zk-recovery) ===");
  const secret = "<h1>Secret Report</h1><p>$1,234,567</p>";
  const { keyBase64, key } = await generateRecoveryKey();
  assert(keyBase64.length > 40, "Recovery key has sufficient length");
  const { ciphertext, ivBase64 } = await encryptWithKey(key, secret);
  const cipherText = new TextDecoder().decode(ciphertext);
  assert(!cipherText.includes("Secret Report"), "Ciphertext does not contain plaintext");
  const reimported = await importRecoveryKey(keyBase64);
  const decrypted = await decryptWithKey(reimported, ciphertext, ivBase64);
  assert(decrypted === secret, "Round-trip decrypts to original plaintext");

  console.log("\n=== 2. Wrong Key Fails ===");
  const { keyBase64: wrongKeyB64 } = await generateRecoveryKey();
  const wrongKey = await importRecoveryKey(wrongKeyB64);
  let threw = false;
  try {
    await decryptWithKey(wrongKey, ciphertext, ivBase64);
  } catch {
    threw = true;
  }
  assert(threw, "Decryption with wrong key throws (AES-GCM auth tag)");

  console.log("\n=== 3. Passphrase Mode (zk-passphrase) ===");
  const salt = generateSalt();
  assert(base64UrlToBuffer(salt).byteLength === 16, "Salt is 16 bytes");
  const passphrase = "correct horse battery staple";
  const enc = await encryptWithPassphrase("classified payload", passphrase, 10_000);
  const derivedKey = await deriveKeyFromPassphrase(passphrase, enc.saltBase64, enc.iterations);
  const dec = await decryptWithKey(derivedKey, enc.ciphertext, enc.ivBase64);
  assert(dec === "classified payload", "Passphrase round-trip works");

  const wrongDerived = await deriveKeyFromPassphrase("wrong passphrase", enc.saltBase64, enc.iterations);
  let passWrongThrew = false;
  try {
    await decryptWithKey(wrongDerived, enc.ciphertext, enc.ivBase64);
  } catch {
    passWrongThrew = true;
  }
  assert(passWrongThrew, "Wrong passphrase fails decryption");

  console.log("\n=== 4. base64url Helpers ===");
  const bytes = new Uint8Array([0, 1, 2, 250, 255]);
  const b64 = bufferToBase64Url(bytes);
  assert(!b64.includes("+") && !b64.includes("/") && !b64.includes("="), "base64url has no unsafe chars");
  const back = base64UrlToBuffer(b64);
  assert(back.length === 5 && back[3] === 250 && back[4] === 255, "base64url round-trips bytes");

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
