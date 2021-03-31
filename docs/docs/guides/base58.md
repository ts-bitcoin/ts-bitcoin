---
title: Base58
---

A Bitcoin address is the hash of a public key. In the early days of Bitcoin, and still often today, users have to copy and paste addresses around, and there is a lot of opportunity to make mistakes. It would be really bad to accidentally send money to the wrong address. So Satoshi used a custom Base 58 encoding scheme for Bitcoin addresses that doesn't allow any confusing characters (no lower case L and no upper case i). In addition, the encoding scheme includes a hash checksum to make errors in copying an address almost impossible.

```typescript
const buf = Buffer.from('my string')
Base58.encode(buf)
```
