---
title: Bitcoin Signed Messages
---

There is a standard way to sign arbitrary non-transaction data with a Bitcoin private key that is appropriate for any type of authentication such as signing a public statement of ownership of a particular Bitcoin address. The standard is sometimes called Bitcoin Signed Message.

One interesting property of this format is that it allows someone to share an address rather than a public key. Anyone can verify the signed message in an unusual way, which is by deriving the public key from the signature. A number of candidate public keys are derived and compared against the address. If one of the public keys matches, then that is the correct public key, and normal ECDSA signature verification can be performed.
