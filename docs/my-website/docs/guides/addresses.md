---
title: Addresses
---

Addresses are derived from public keys, which in turn are derived from private keys. Two convenience methods allow you to derive addresses either from the public key or directly from the private key. For instance:

```typescript
const privKey = PrivKey.fromRandom()
const pubKey = PubKey.fromPrivKey(privKey)
const address = Address.fromPubKey(pubKey)
```

```jsx title="/src/components/HelloCodeTitle.js"
function HelloCodeTitle(props) {
  return <h1>Hello, {props.name}</h1>
}
```
