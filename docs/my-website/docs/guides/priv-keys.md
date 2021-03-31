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

Bitcoin has two networks - mainnet (the real network) and testnet. Use the testnet network for testing. You can create a private key on testnet, which is formatted differently:

```typescript
const privateKey = PrivKey.fromRandom()
```

Normally, you should output a private key into Wallet Import Format (WIF). This is a Base 58 Check formatted string. It contains an extra byte, 'compressed', to indicate whether the corresponding public key is compressed or not. Normally, the public key is compressed.

To display the WIF private key, use:

```typescript
console.log(privateKey.toWIF())

// prints:
// Kwn6yDoKobVjH2dqa9UZ4c5yXfUQQo6PxdQCTknbRW85LeyYxTbp
// ...or whatever your randomly generated private key is.
```

Notice that the WIF key looks like this:

```typescript
Kwn6yDoKobVjH2dqa9UZ4c5yXfUQQo6PxdQCTknbRW85LeyYxTbp
```

You can import a private key and export it again:

```typescript
const str = 'Kwn6yDoKobVjH2dqa9UZ4c5yXfUQQo6PxdQCTknbRW85LeyYxTbp'
const privateKey2 = PrivKey.fromWif(str)

console.log(privateKey2.toWIF())
// prints:
// Kwn6yDoKobVjH2dqa9UZ4c5yXfUQQo6PxdQCTknbRW85LeyYxTbp
```

```typescript
console.log(privateKey.toWIF())
// prints:
// Kwn6yDoKobVjH2dqa9UZ4c5yXfUQQo6PxdQCTknbRW85LeyYxTbp
// ...or whatever your randomly generated private key is.
```

We can also generate and display a testnet private key:

```typescript
const privateKey = bsv.PrivKey.fromRandom('testnet')

console.log(privateKey.toWIF())
// prints:
// cRuVA4z4TYdwt4uGYcQxwCTVkwK2VSt5PNrJmDG9QXh4YHWLtTnY
// ...or whatever your randomly generated private key is.
```

Notice in this case the private key looks like this:

```typescript
cRuVA4z4TYdwt4uGYcQxwCTVkwK2VSt5PNrJmDG9QXh4YHWLtTnY
```

Private keys on testnet always start with a 'c' and private keys on mainnet either start with a 'K' or an 'L' when formatted in WIF.

If you would like to see the big number inside a private key, you can do this:

```typescript
privateKey = PrivKey.fromString('Kwn6yDoKobVjH2dqa9UZ4c5yXfUQQo6PxdQCTknbRW85LeyYxTbp')
privateKey.bn.toString()

// prints:
// 7537391639902988000652013410090023935060956443631057909604306796118758817057
```
