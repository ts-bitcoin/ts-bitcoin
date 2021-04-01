---
title: Mnemonics (BIP39)
---

```typescript
const seed = Bip39.fromString('fruit wave dwarf banana earth journey tattoo true farm silk olive fence').toSeed()
let bip32 = Bip32.fromSeed(seed)
bip32 = bip32.derive("m/44'/0'/0'/0/0")
const address = Address.fromPubKey(bip32.pubKey)
address.toString()
```
