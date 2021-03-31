---
title: Hash Functions
---

Bitcoin makes extensive use of cryptographic hash functions. The id of a block is the reverse double SHA256 hash of the block. This is the value that is iterated with a nonce when miners are mining - they are trying to get a hash that starts with a large number of zeros. The id of a transaction is also a double SHA256 hash. An address is the RIPEMD160 hash of a SHA256 hash. And last but not least, digital signatures involve hashing a transaction to sign and verify.

```typescript
const data = Buffer.from('The quick brown fox jumps over the lazy dog')
const hashBuf = Hash.sha256(data)
hashBuf.toString('hex')
```
