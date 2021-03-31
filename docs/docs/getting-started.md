---
title: Getting Started
slug: /
---

## Installation

```shell
npm install @ts-bitcoin/core
```

## Usage

```typescript
import { Address, Bn, KeyPair, PrivKey, TxBuilder, TxOut, deps } from '@ts-bitcoin/core'

// make change address
const privKey1 = PrivKey.fromRandom()
const keyPair1 = KeyPair.fromPrivKey(privKey1)
const addr1 = Address.fromPubKey(keyPair1.pubKey)

// make address to send from
const privKey2 = PrivKey.fromBn(new Bn(1))
const keyPair2 = KeyPair.fromPrivKey(privKey2)
const addr2 = Address.fromPubKey(keyPair2.pubKey)

const txOut = TxOut.fromProperties(new Bn(2e8), addr2.toTxOutScript())
const txHashBuf = deps.Buffer.alloc(32).fill(0)

// make address to send to
const privKey3 = PrivKey.fromBn(new Bn(2))
const keyPair3 = KeyPair.fromPrivKey(privKey3)
const addr3 = Address.fromPubKey(keyPair3.pubKey)

const tx = new TxBuilder()
  .setFeePerKbNum(0.0001e8)
  .setChangeAddress(addr1)
  .inputFromPubKeyHash(txHashBuf, 0, txOut, keyPair2.pubKey)
  .outputToAddress(new Bn(1e8), addr3)
  .build()

const raw = tx.toHex()
```
