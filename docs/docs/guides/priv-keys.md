---
title: Private Keys
---

A private key can be used to spend Bitcoin. A private key is to be kept private

- normally, a user should not share their private key. Anyone who has access to the private key can spend funds. A private key can be used to derive a corresponding public key, and a public key can be used to derive an address.
  In bsv, the PrivKey class is wrapper of Big Number. It is a 256 bit big number.

To generate a new, cryptographically secure random private key, use:

```typescript
const privKey = PrivKey.fromRandom()
```
