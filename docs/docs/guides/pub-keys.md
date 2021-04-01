---
title: Public Keys
---

A public key is a key that is derived from a private key and under normal circumstances can be shared publicly. Public keys can be used for encryption, Diffie-Helman shared secrets, and deriving addresses for receiving money. Mathematically, a public key is a point on the secp256k1 elliptic curve and it is equal to a private key times the base point.

In this library, the PubKey class is wrapper of Point.

To generate a new private key and the corresponding public key, use:

```typescript
const privateKey = PrivKey.fromRandom()
const publicKey = PubKey.fromPrivKey(privateKey)
```

If you wish to save or display a public key, you should use compressed hex format, and you can use the .toHex() method to do that. For example:

```typescript
publicKey.toHex()

// prints:
// 0340a908047b5aa865e48f6c5917bc04c9d45e50ed81b43d10798b6aebe2e55ed9
// ...or whatever your public key is corresponding to the private key.
```
