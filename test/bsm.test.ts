/* eslint-disable @typescript-eslint/no-shadow */
import should = require('should')
import { Address } from '../src/address'
import { Bsm } from '../src/bsm'
import { KeyPair } from '../src/key-pair'

describe('Bsm', () => {
    it('should make a new bsm', () => {
        const bsm = new Bsm()
        should.exist(bsm)
    })

    it('should make a new bsm when called without "new"', () => {
        const bsm = new Bsm()
        should.exist(bsm)
    })

    describe('#fromObject', () => {
        it('should set the messageBuf', () => {
            const messageBuf = Buffer.from('message')
            should.exist(new Bsm().fromObject({ messageBuf }).messageBuf)
        })
    })

    describe('@MagicHash', () => {
        it('should return a hash', () => {
            const buf = Buffer.from('001122', 'hex')
            const hashBuf = Bsm.magicHash(buf)
            Buffer.isBuffer(hashBuf).should.equal(true)
        })
    })

    describe('@asyncMagicHash', () => {
        it('should return a hash', async () => {
            const buf = Buffer.from('001122', 'hex')
            const hashBuf = await Bsm.asyncMagicHash(buf)
            Buffer.isBuffer(hashBuf).should.equal(true)
        })
    })

    describe('@sign', () => {
        const messageBuf = Buffer.from('this is my message')
        const keyPair = new KeyPair().fromRandom()

        it('should return a base64 string', () => {
            const sigstr = Bsm.sign(messageBuf, keyPair)
            const sigbuf = Buffer.from(sigstr, 'base64')
            sigbuf.length.should.equal(1 + 32 + 32)
        })

        it('should sign with a compressed pubKey', () => {
            const keyPair = new KeyPair().fromRandom()
            keyPair.pubKey.compressed = true
            const sigstr = Bsm.sign(messageBuf, keyPair)
            const sigbuf = Buffer.from(sigstr, 'base64')
            sigbuf[0].should.be.above(27 + 4 - 1)
            sigbuf[0].should.be.below(27 + 4 + 4 - 1)
        })

        it('should sign with an uncompressed pubKey', () => {
            const keyPair = new KeyPair().fromRandom()
            keyPair.pubKey.compressed = false
            const sigstr = Bsm.sign(messageBuf, keyPair)
            const sigbuf = Buffer.from(sigstr, 'base64')
            sigbuf[0].should.be.above(27 - 1)
            sigbuf[0].should.be.below(27 + 4 - 1)
        })
    })

    describe('@asyncSign', () => {
        const messageBuf = Buffer.from('this is my message')
        const keyPair = new KeyPair().fromRandom()

        it('should return the same as sign', async () => {
            const sigstr1 = Bsm.sign(messageBuf, keyPair)
            const sigstr2 = await Bsm.asyncSign(messageBuf, keyPair)
            sigstr1.should.equal(sigstr2)
        })
    })

    describe('@verify', () => {
        const messageBuf = Buffer.from('this is my message')
        const keyPair = new KeyPair().fromRandom()

        it('should verify a signed message', () => {
            const sigstr = Bsm.sign(messageBuf, keyPair)
            const addr = new Address().fromPubKey(keyPair.pubKey)
            Bsm.verify(messageBuf, sigstr, addr).should.equal(true)
        })

        it('should verify this known good signature', () => {
            const addrstr = '1CKTmxj6DjGrGTfbZzVxnY4Besbv8oxSZb'
            const address = new Address().fromString(addrstr)
            const sigstr = 'IOrTlbNBI0QO990xOw4HAjnvRl/1zR+oBMS6HOjJgfJqXp/1EnFrcJly0UcNelqJNIAH4f0abxOZiSpYmenMH4M='
            Bsm.verify(messageBuf, sigstr, address)
        })
    })

    describe('@asyncVerify', () => {
        const messageBuf = Buffer.from('this is my message')
        const keyPair = new KeyPair().fromRandom()

        it('should verify a signed message', async () => {
            const sigstr = Bsm.sign(messageBuf, keyPair)
            const addr = new Address().fromPubKey(keyPair.pubKey)
            const verified = Bsm.verify(messageBuf, sigstr, addr)
            verified.should.equal(true)
        })
    })

    describe('#sign', () => {
        const messageBuf = Buffer.from('this is my message')
        const keyPair = new KeyPair().fromRandom()

        it('should sign a message', () => {
            const bsm = new Bsm()
            bsm.messageBuf = messageBuf
            bsm.keyPair = keyPair
            bsm.sign()
            const sig = bsm.sig
            should.exist(sig)
        })
    })

    describe('#verify', () => {
        const messageBuf = Buffer.from('this is my message')
        const keyPair = new KeyPair().fromRandom()

        it('should verify a message that was just signed', () => {
            const bsm = new Bsm()
            bsm.messageBuf = messageBuf
            bsm.keyPair = keyPair
            bsm.address = new Address().fromPubKey(keyPair.pubKey)
            bsm.sign()
            bsm.verify()
            bsm.verified.should.equal(true)
        })
    })
})
