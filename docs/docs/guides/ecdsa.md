---
title: ECDSA
---

One standard method to produce digital signatures is called the Digital Signature Algorithm (DSA), standardized by NIST in 1994. DSA is based on prime numbers.

An improvement over DSA called Elliptic Curve Digital Signature Algorithm (ECDSA) is very similar to DSA except that it is based on elliptic curves instead of prime numbers. The advantage of elliptic curves is that it allows a smaller key size for the same level of security which saves on storage and computation costs. ECDSA was standardized in ANSI x9.63 in 1999. ECDSA is what's used inside Bitcoin to sign and verify Bitcoin transactions. In Bitcoin, ECDSA uses the SECP256k1 elliptic curve. This document by Certicom gives a wonderful overview ECDSA including a preliminary overview of DSA.
