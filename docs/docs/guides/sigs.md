---
title: Signatures
---

An ECDSA signature consists of two numbers, r and s, both of which are big numbers. A signature is produced from a private key and a message and a signature is verified using a public key, a signature and the message. Only the person with the private key can produce a signature for a corresponding public key, and anyone with the public key can verify the authenticity of the signature.

In a Bitcoin transaction, another value called the SIGHASH type is added to a signature. The SIGHASH type specifies what operation is used to create and verify the signature. A signature inside a Bitcoin transaction is encoded in DER format followed by a single byte indicated the SIGHASH type. The DER format itself includes several header bytes.
