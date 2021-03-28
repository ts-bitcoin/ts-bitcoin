/* eslint-disable @typescript-eslint/no-shadow */
import should = require('should')
import { Bn } from '../src/bn'
import { Ecdsa } from '../src/ecdsa'
import { Hash } from '../src/hash'
import { KeyPair } from '../src/key-pair'
import { Point } from '../src/point'
import { PrivKey } from '../src/priv-key'
import { PubKey } from '../src/pub-key'
import { Sig } from '../src/sig'
import * as vectors from './vectors/ecdsa.json'

describe('Ecdsa', () => {
    it('should create a blank ecdsa', () => {
        const ecdsa = new Ecdsa()
        should.exist(ecdsa)
    })

    const ecdsa = new Ecdsa()
    ecdsa.hashBuf = Hash.sha256(Buffer.from('test data'))
    ecdsa.keyPair = new KeyPair()
    ecdsa.keyPair.privKey = new PrivKey().fromBn(
        new Bn().fromBuffer(Buffer.from('fee0a1f7afebf9d2a5a80c0c98a31c709681cce195cbcd06342b517970c0be1e', 'hex'))
    )
    ecdsa.keyPair.pubKey = new PubKey().fromObject({
        point: new Point(
            new Bn().fromBuffer(Buffer.from('ac242d242d23be966085a2b2b893d989f824e06c9ad0395a8a52f055ba39abb2', 'hex')),
            new Bn().fromBuffer(Buffer.from('4836ab292c105a711ed10fcfd30999c31ff7c02456147747e03e739ad527c380', 'hex'))
        ),
    })

    describe('#fromObject', () => {
        it('should set hashBuf', () => {
            should.exist(new Ecdsa().fromObject({ hashBuf: ecdsa.hashBuf }).hashBuf)
        })
    })

    describe('#toJSON', () => {
        it('should return json', () => {
            const json = ecdsa.toJSON()
            should.exist(json.keyPair)
            should.exist(json.hashBuf)
        })
    })

    describe('#fromJSON', () => {
        it('should convert from json', () => {
            const json = ecdsa.toJSON()
            const ecdsa2 = new Ecdsa().fromJSON(json)
            should.exist(ecdsa2.keyPair)
            should.exist(ecdsa2.hashBuf)
        })
    })

    describe('#toBuffer', () => {
        it('should return buffer', () => {
            const buf = ecdsa.toBuffer()
            Buffer.isBuffer(buf).should.equal(true)
        })
    })

    describe('#fromBuffer', () => {
        it('should return from buffer', () => {
            const buf = ecdsa.toBuffer()
            const ecdsa2 = new Ecdsa().fromBuffer(buf)
            should.exist(ecdsa2.keyPair)
            should.exist(ecdsa2.hashBuf)
        })
    })

    describe('#calcrecovery', () => {
        it('should calculate pubKey recovery number', () => {
            ecdsa.randomK()
            ecdsa.sign()
            ecdsa.calcrecovery()
            should.exist(ecdsa.sig.recovery)
        })

        it('should calculate this known pubKey recovery number', () => {
            const hashBuf = Hash.sha256(Buffer.from('some data'))
            const r = new Bn('71706645040721865894779025947914615666559616020894583599959600180037551395766', 10)
            const s = new Bn('109412465507152403114191008482955798903072313614214706891149785278625167723646', 10)
            const ecdsa = new Ecdsa()
            ecdsa.keyPair = new KeyPair().fromPrivKey(
                new PrivKey().fromBn(new Bn().fromBuffer(Hash.sha256(Buffer.from('test'))))
            )
            ecdsa.hashBuf = hashBuf
            ecdsa.sig = Sig.fromObject({ r, s })

            ecdsa.calcrecovery()
            ecdsa.sig.recovery.should.equal(1)
        })

        it('should do a round trip with signature parsing', () => {
            ecdsa.calcrecovery()
            const pubKey = ecdsa.keyPair.pubKey
            let sig = ecdsa.sig
            const hashBuf = ecdsa.hashBuf
            Ecdsa.sig2PubKey(sig, hashBuf).toHex().should.equal(pubKey.toHex())

            sig = sig.fromCompact(sig.toCompact())
            Ecdsa.sig2PubKey(sig, hashBuf).toHex().should.equal(pubKey.toHex())
        })
    })

    describe('#asyncCalcrecovery', () => {
        it('should calculate pubKey recovery number', async () => {
            ecdsa.randomK()
            ecdsa.sign()
            await ecdsa.asyncCalcrecovery()
            should.exist(ecdsa.sig.recovery)
        })

        it('should calculate this known pubKey recovery number', async () => {
            const hashBuf = Hash.sha256(Buffer.from('some data'))
            const r = new Bn('71706645040721865894779025947914615666559616020894583599959600180037551395766', 10)
            const s = new Bn('109412465507152403114191008482955798903072313614214706891149785278625167723646', 10)
            const ecdsa = new Ecdsa()
            ecdsa.keyPair = new KeyPair().fromPrivKey(
                new PrivKey().fromBn(new Bn().fromBuffer(Hash.sha256(Buffer.from('test'))))
            )
            ecdsa.hashBuf = hashBuf
            ecdsa.sig = Sig.fromObject({ r, s })

            await ecdsa.asyncCalcrecovery()
            ecdsa.sig.recovery.should.equal(1)
        })

        it('should do a round trip with signature parsing', async () => {
            await ecdsa.asyncCalcrecovery()
            const pubKey = ecdsa.keyPair.pubKey
            let sig = ecdsa.sig
            const hashBuf = ecdsa.hashBuf
            Ecdsa.sig2PubKey(sig, hashBuf).toHex().should.equal(pubKey.toHex())

            sig = sig.fromCompact(sig.toCompact())
            Ecdsa.sig2PubKey(sig, hashBuf).toHex().should.equal(pubKey.toHex())
        })
    })

    describe('@calcrecovery', () => {
        it('should calculate pubKey recovery number same as #calcrecovery', () => {
            ecdsa.randomK()
            ecdsa.sign()
            const sig1 = ecdsa.calcrecovery().sig
            const sig2 = Ecdsa.calcrecovery(ecdsa.sig, ecdsa.keyPair.pubKey, ecdsa.hashBuf)
            Buffer.compare(sig1.toCompact(), sig2.toCompact()).should.equal(0)
        })

        it('should calulate this known pubKey recovery number same as #calcrecovery', () => {
            const hashBuf = Hash.sha256(Buffer.from('some data'))
            const r = new Bn('71706645040721865894779025947914615666559616020894583599959600180037551395766', 10)
            const s = new Bn('109412465507152403114191008482955798903072313614214706891149785278625167723646', 10)
            const ecdsa = new Ecdsa()
            ecdsa.keyPair = new KeyPair().fromPrivKey(
                new PrivKey().fromBn(new Bn().fromBuffer(Hash.sha256(Buffer.from('test'))))
            )
            ecdsa.hashBuf = hashBuf
            ecdsa.sig = Sig.fromObject({ r, s })

            const sig1 = ecdsa.calcrecovery().sig
            const sig2 = Ecdsa.calcrecovery(ecdsa.sig, ecdsa.keyPair.pubKey, ecdsa.hashBuf)
            Buffer.compare(sig1.toCompact(), sig2.toCompact()).should.equal(0)
        })
    })

    describe('@asyncCalcrecovery', () => {
        it('should calculate pubKey recovery number same as #calcrecovery', async () => {
            ecdsa.randomK()
            ecdsa.sign()
            const sig1 = ecdsa.calcrecovery().sig
            const sig2 = await Ecdsa.asyncCalcrecovery(ecdsa.sig, ecdsa.keyPair.pubKey, ecdsa.hashBuf)
            Buffer.compare(sig1.toCompact(), sig2.toCompact()).should.equal(0)
        })

        it('should calulate this known pubKey recovery number same as #calcrecovery', async () => {
            const hashBuf = Hash.sha256(Buffer.from('some data'))
            const r = new Bn('71706645040721865894779025947914615666559616020894583599959600180037551395766', 10)
            const s = new Bn('109412465507152403114191008482955798903072313614214706891149785278625167723646', 10)
            const ecdsa = new Ecdsa()
            ecdsa.keyPair = new KeyPair().fromPrivKey(
                new PrivKey().fromBn(new Bn().fromBuffer(Hash.sha256(Buffer.from('test'))))
            )
            ecdsa.hashBuf = hashBuf
            ecdsa.sig = Sig.fromObject({ r, s })

            const sig1 = ecdsa.calcrecovery().sig
            const sig2 = await Ecdsa.asyncCalcrecovery(ecdsa.sig, ecdsa.keyPair.pubKey, ecdsa.hashBuf)
            Buffer.compare(sig1.toCompact(), sig2.toCompact()).should.equal(0)
        })
    })

    describe('#fromString', () => {
        it('should to a round trip with to string', () => {
            const str = ecdsa.toString()
            const ecdsa2 = new Ecdsa()
            ecdsa2.fromString(str)
            should.exist(ecdsa.hashBuf)
            should.exist(ecdsa.keyPair)
        })
    })

    describe('#randomK', () => {
        it('should generate a new random k when called twice in a row', () => {
            ecdsa.randomK()
            const k1 = ecdsa.k
            ecdsa.randomK()
            const k2 = ecdsa.k
            ;(k1.cmp(k2) === 0).should.equal(false)
        })

        it('should generate a random k that is (almost always) greater than this relatively small number', () => {
            ecdsa.randomK()
            const k1 = ecdsa.k
            const k2 = new Bn(Math.pow(2, 32)).mul(new Bn(Math.pow(2, 32))).mul(new Bn(Math.pow(2, 32)))
            k2.gt(k1).should.equal(false)
        })
    })

    describe('#deterministicK', () => {
        it('should generate the same deterministic k', () => {
            ecdsa.deterministicK()
            ecdsa.k
                .toBuffer()
                .toString('hex')
                .should.equal('fcce1de7a9bcd6b2d3defade6afa1913fb9229e3b7ddf4749b55c4848b2a196e')
        })

        it('should generate the same deterministic k if badrs is set', () => {
            ecdsa.deterministicK(0)
            ecdsa.k
                .toBuffer()
                .toString('hex')
                .should.equal('fcce1de7a9bcd6b2d3defade6afa1913fb9229e3b7ddf4749b55c4848b2a196e')
            ecdsa.deterministicK(1)
            ecdsa.k
                .toBuffer()
                .toString('hex')
                .should.not.equal('fcce1de7a9bcd6b2d3defade6afa1913fb9229e3b7ddf4749b55c4848b2a196e')
            ecdsa.k
                .toBuffer()
                .toString('hex')
                .should.equal('727fbcb59eb48b1d7d46f95a04991fc512eb9dbf9105628e3aec87428df28fd8')
        })

        it('should compute this test vector correctly', () => {
            // test fixture from bitcoinjs
            // https://github.com/bitcoinjs/bitcoinjs-lib/blob/10630873ebaa42381c5871e20336fbfb46564ac8/test/fixtures/ecdsa.json#L6
            const ecdsa = new Ecdsa()
            ecdsa.hashBuf = Hash.sha256(
                Buffer.from('Everything should be made as simple as possible, but not simpler.')
            )
            ecdsa.keyPair = new KeyPair().fromPrivKey(new PrivKey().fromObject({ bn: new Bn(1) }))
            ecdsa.deterministicK()
            ecdsa.k
                .toBuffer()
                .toString('hex')
                .should.equal('ec633bd56a5774a0940cb97e27a9e4e51dc94af737596a0c5cbb3d30332d92a5')
            ecdsa.sign()
            ecdsa.sig.r
                .toString()
                .should.equal('23362334225185207751494092901091441011938859014081160902781146257181456271561')
            ecdsa.sig.s
                .toString()
                .should.equal('50433721247292933944369538617440297985091596895097604618403996029256432099938')
        })
    })

    describe('#sig2PubKey', () => {
        it('should calculate the correct public key for this signature with low s', () => {
            ecdsa.sig = new Sig().fromString(
                '3045022100ec3cfe0e335791ad278b4ec8eac93d0347a97877bb1d54d35d189e225c15f6650220278cf15b05ce47fb37d2233802899d94c774d5480bba9f0f2d996baa13370c43'
            )
            ecdsa.sig.recovery = 0
            const pubKey = ecdsa.sig2PubKey()
            pubKey.point.eq(ecdsa.keyPair.pubKey.point).should.equal(true)
        })

        it('should calculate the correct public key for this signature with high s', () => {
            ecdsa.sign()
            ecdsa.sig = new Sig().fromString(
                '3046022100ec3cfe0e335791ad278b4ec8eac93d0347a97877bb1d54d35d189e225c15f665022100d8730ea4fa31b804c82ddcc7fd766269f33a079ea38e012c9238f2e2bcff34fe'
            )
            ecdsa.sig.recovery = 1
            const pubKey = ecdsa.sig2PubKey()
            pubKey.point.eq(ecdsa.keyPair.pubKey.point).should.equal(true)
        })
    })

    describe('#asyncSig2PubKey', () => {
        it('should calculate the correct public key for this signature with low s', async () => {
            ecdsa.sig = new Sig().fromString(
                '3045022100ec3cfe0e335791ad278b4ec8eac93d0347a97877bb1d54d35d189e225c15f6650220278cf15b05ce47fb37d2233802899d94c774d5480bba9f0f2d996baa13370c43'
            )
            ecdsa.sig.recovery = 0
            const pubKey = await ecdsa.asyncSig2PubKey()
            pubKey.point.eq(ecdsa.keyPair.pubKey.point).should.equal(true)
        })

        it('should calculate the correct public key for this signature with high s', async () => {
            ecdsa.sign()
            ecdsa.sig = new Sig().fromString(
                '3046022100ec3cfe0e335791ad278b4ec8eac93d0347a97877bb1d54d35d189e225c15f665022100d8730ea4fa31b804c82ddcc7fd766269f33a079ea38e012c9238f2e2bcff34fe'
            )
            ecdsa.sig.recovery = 1
            const pubKey = await ecdsa.asyncSig2PubKey()
            pubKey.point.eq(ecdsa.keyPair.pubKey.point).should.equal(true)
        })
    })

    describe('@sig2PubKey', () => {
        it('should calculate the correct public key', () => {
            ecdsa.k = new Bn('114860389168127852803919605627759231199925249596762615988727970217268189974335', 10)
            ecdsa.sign()
            ecdsa.sig.recovery = 0
            const pubKey1 = ecdsa.sig2PubKey()
            const pubKey2 = Ecdsa.sig2PubKey(ecdsa.sig, ecdsa.hashBuf)
            pubKey1.toString().should.equal(pubKey2.toString())
        })

        it('should calculate the correct public key for this signature with low s', () => {
            ecdsa.k = new Bn('114860389168127852803919605627759231199925249596762615988727970217268189974335', 10)
            ecdsa.sig = new Sig().fromString(
                '3045022100ec3cfe0e335791ad278b4ec8eac93d0347a97877bb1d54d35d189e225c15f6650220278cf15b05ce47fb37d2233802899d94c774d5480bba9f0f2d996baa13370c43'
            )
            ecdsa.sig.recovery = 0
            const pubKey1 = ecdsa.sig2PubKey()
            const pubKey2 = Ecdsa.sig2PubKey(ecdsa.sig, ecdsa.hashBuf)
            pubKey1.toString().should.equal(pubKey2.toString())
        })

        it('should calculate the correct public key for this signature with high s', () => {
            ecdsa.k = new Bn('114860389168127852803919605627759231199925249596762615988727970217268189974335', 10)
            ecdsa.sign()
            ecdsa.sig = new Sig().fromString(
                '3046022100ec3cfe0e335791ad278b4ec8eac93d0347a97877bb1d54d35d189e225c15f665022100d8730ea4fa31b804c82ddcc7fd766269f33a079ea38e012c9238f2e2bcff34fe'
            )
            ecdsa.sig.recovery = 1
            const pubKey1 = ecdsa.sig2PubKey()
            const pubKey2 = Ecdsa.sig2PubKey(ecdsa.sig, ecdsa.hashBuf)
            pubKey1.toString().should.equal(pubKey2.toString())
        })
    })

    describe('@asyncSig2PubKey', () => {
        it('should calculate the correct public key', async () => {
            ecdsa.k = new Bn('114860389168127852803919605627759231199925249596762615988727970217268189974335', 10)
            ecdsa.sign()
            ecdsa.sig.recovery = 0
            const pubKey1 = ecdsa.sig2PubKey()
            const pubKey2 = await Ecdsa.asyncSig2PubKey(ecdsa.sig, ecdsa.hashBuf)
            pubKey1.toString().should.equal(pubKey2.toString())
        })

        it('should calculate the correct public key for this signature with low s', async () => {
            ecdsa.k = new Bn('114860389168127852803919605627759231199925249596762615988727970217268189974335', 10)
            ecdsa.sig = new Sig().fromString(
                '3045022100ec3cfe0e335791ad278b4ec8eac93d0347a97877bb1d54d35d189e225c15f6650220278cf15b05ce47fb37d2233802899d94c774d5480bba9f0f2d996baa13370c43'
            )
            ecdsa.sig.recovery = 0
            const pubKey1 = ecdsa.sig2PubKey()
            const pubKey2 = await Ecdsa.asyncSig2PubKey(ecdsa.sig, ecdsa.hashBuf)
            pubKey1.toString().should.equal(pubKey2.toString())
        })

        it('should calculate the correct public key for this signature with high s', async () => {
            ecdsa.k = new Bn('114860389168127852803919605627759231199925249596762615988727970217268189974335', 10)
            ecdsa.sign()
            ecdsa.sig = new Sig().fromString(
                '3046022100ec3cfe0e335791ad278b4ec8eac93d0347a97877bb1d54d35d189e225c15f665022100d8730ea4fa31b804c82ddcc7fd766269f33a079ea38e012c9238f2e2bcff34fe'
            )
            ecdsa.sig.recovery = 1
            const pubKey1 = ecdsa.sig2PubKey()
            const pubKey2 = await Ecdsa.asyncSig2PubKey(ecdsa.sig, ecdsa.hashBuf)
            pubKey1.toString().should.equal(pubKey2.toString())
        })
    })

    describe('#verifyStr', () => {
        it('should return an error if the hash is invalid', () => {
            const ecdsa = new Ecdsa()
            ecdsa.verifyStr().should.equal('hashBuf must be a 32 byte buffer')
        })

        it('should return an error if the pubKey is invalid', () => {
            const ecdsa = new Ecdsa()
            ecdsa.hashBuf = Hash.sha256(Buffer.from('test'))
            ;(ecdsa.verifyStr() as string).indexOf('Invalid pubKey').should.equal(0)
        })

        it('should return an error if r, s are invalid', () => {
            const ecdsa = new Ecdsa()
            ecdsa.hashBuf = Hash.sha256(Buffer.from('test'))
            const pk = new PubKey()
            pk.fromDer(
                Buffer.from(
                    '041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341',
                    'hex'
                )
            )
            ecdsa.keyPair = new KeyPair()
            ecdsa.keyPair.pubKey = pk
            ecdsa.sig = new Sig()
            ecdsa.sig.r = new Bn(0)
            ecdsa.sig.s = new Bn(0)
            ecdsa.verifyStr().should.equal('r and s not in range')
        })

        it('should return an error if the signature is incorrect', () => {
            ecdsa.sig = new Sig()
            ecdsa.sig.fromString(
                '3046022100e9915e6236695f093a4128ac2a956c40ed971531de2f4f41ba05fac7e2bd019c02210094e6a4a769cc7f2a8ab3db696c7cd8d56bcdbfff860a8c81de4bc6a798b90827'
            )
            ecdsa.sig.r = ecdsa.sig.r.add(new Bn(1))
            ecdsa.verifyStr(false).should.equal('Invalid signature')
        })
    })

    describe('#sign', () => {
        it('should create a valid signature', () => {
            ecdsa.randomK()
            ecdsa.sign()
            ecdsa.verify().verified.should.equal(true)
        })

        it('should should throw an error if hashBuf is not 32 bytes', () => {
            const ecdsa2 = new Ecdsa().fromObject({
                hashBuf: ecdsa.hashBuf.slice(0, 31),
                keyPair: ecdsa.keyPair,
            })
            ecdsa2.randomK()
            ;(function () {
                ecdsa2.sign()
            }.should.throw('hashBuf must be a 32 byte buffer'))
        })
    })

    describe('#asyncSign', () => {
        it('should create the same signature as sign', async () => {
            ecdsa.sign()
            const sig = ecdsa.sig
            const sig2 = ecdsa.sig
            await ecdsa.asyncSign()
            sig.toString().should.equal(sig2.toString())
        })
    })

    describe('#signRandomK', () => {
        it('should produce a signature, and be different when called twice', () => {
            ecdsa.signRandomK()
            should.exist(ecdsa.sig)
            const ecdsa2 = new Ecdsa().fromObject(ecdsa)
            ecdsa2.signRandomK()
            ecdsa.sig.toString().should.not.equal(ecdsa2.sig.toString())
        })
    })

    describe('#toString', () => {
        it('should convert this to a string', () => {
            const str = ecdsa.toString()
            ;(typeof str === 'string').should.equal(true)
        })
    })

    describe('#verify', () => {
        it('should verify a signature that was just signed', () => {
            ecdsa.sign()
            ecdsa.verify().verified.should.equal(true)
        })

        it('should verify this known good signature', () => {
            ecdsa.sig = new Sig()
            ecdsa.sig.fromString(
                '3046022100e9915e6236695f093a4128ac2a956c40ed971531de2f4f41ba05fac7e2bd019c02210094e6a4a769cc7f2a8ab3db696c7cd8d56bcdbfff860a8c81de4bc6a798b90827'
            )
            ecdsa.verify(false).verified.should.equal(true)
        })
    })

    describe('#asyncVerify', () => {
        it('should verify this known good signature', async () => {
            ecdsa.verified = undefined
            ecdsa.signRandomK()
            await ecdsa.asyncVerify()
            ecdsa.verified.should.equal(true)
        })
    })

    describe('@sign', () => {
        it('should produce a signature', () => {
            const sig = Ecdsa.sign(ecdsa.hashBuf, ecdsa.keyPair)
            ;(sig instanceof Sig).should.equal(true)
        })
    })

    describe('@asyncSign', () => {
        it('should produce the same signature as @sign', async () => {
            const sig = Ecdsa.sign(ecdsa.hashBuf, ecdsa.keyPair)
            const sigstr = sig.toString()
            const sig2 = await Ecdsa.asyncSign(ecdsa.hashBuf, ecdsa.keyPair)
            const sig2str = sig2.toString()
            sigstr.should.equal(sig2str)
        })
    })

    describe('@verify', () => {
        it('should verify a valid signature, and unverify an invalid signature', () => {
            const sig = Ecdsa.sign(ecdsa.hashBuf, ecdsa.keyPair)
            Ecdsa.verify(ecdsa.hashBuf, sig, ecdsa.keyPair.pubKey).should.equal(true)
            const fakesig = new Sig(sig.r.add(1), sig.s)
            Ecdsa.verify(ecdsa.hashBuf, fakesig, ecdsa.keyPair.pubKey).should.equal(false)
        })

        it('should work with big and little endian', () => {
            let sig = Ecdsa.sign(ecdsa.hashBuf, ecdsa.keyPair, 'big')
            Ecdsa.verify(ecdsa.hashBuf, sig, ecdsa.keyPair.pubKey, 'big').should.equal(true)
            Ecdsa.verify(ecdsa.hashBuf, sig, ecdsa.keyPair.pubKey, 'little').should.equal(false)
            sig = Ecdsa.sign(ecdsa.hashBuf, ecdsa.keyPair, 'little')
            Ecdsa.verify(ecdsa.hashBuf, sig, ecdsa.keyPair.pubKey, 'big').should.equal(false)
            Ecdsa.verify(ecdsa.hashBuf, sig, ecdsa.keyPair.pubKey, 'little').should.equal(true)
        })
    })

    describe('@asyncVerify', () => {
        it('should verify a valid signature, and unverify an invalid signature', async () => {
            const sig = Ecdsa.sign(ecdsa.hashBuf, ecdsa.keyPair)
            let verified = await Ecdsa.asyncVerify(ecdsa.hashBuf, sig, ecdsa.keyPair.pubKey)
            verified.should.equal(true)
            const fakesig = new Sig(sig.r.add(1), sig.s)
            verified = await Ecdsa.asyncVerify(ecdsa.hashBuf, fakesig, ecdsa.keyPair.pubKey)
            verified.should.equal(false)
        })
    })

    describe('vectors', () => {
        vectors.valid.forEach((obj, i) => {
            it('should validate valid vector ' + i, () => {
                const ecdsa = new Ecdsa().fromObject({
                    keyPair: new KeyPair().fromPrivKey(
                        new PrivKey().fromBn(new Bn().fromBuffer(Buffer.from(obj.d, 'hex')))
                    ),
                    k: new Bn().fromBuffer(Buffer.from(obj.k, 'hex')),
                    hashBuf: Hash.sha256(Buffer.from(obj.message)),
                    sig: new Sig().fromObject({
                        r: new Bn(obj.signature.r),
                        s: new Bn(obj.signature.s),
                        recovery: obj.i,
                    }),
                })
                const ecdsa2 = new Ecdsa().fromObject(ecdsa)
                ecdsa2.k = undefined
                ecdsa2.sign()
                ecdsa2.calcrecovery()
                // ecdsa2.k.toString().should.equal(ecdsa.k.toString())
                ecdsa2.sig.toString().should.equal(ecdsa.sig.toString())
                ecdsa2.sig.recovery.should.equal(ecdsa.sig.recovery)
                ecdsa.verify().verified.should.equal(true)
            })
        })

        vectors.invalid.verifystr.forEach((obj, i) => {
            it('should validate invalid.verifystr vector ' + i + ': ' + obj.description, () => {
                const ecdsa = new Ecdsa().fromObject({
                    keyPair: new KeyPair().fromObject({
                        pubKey: new PubKey().fromObject({ point: Point.fromX(true, 1) }),
                    }),
                    sig: new Sig(new Bn(obj.signature.r), new Bn(obj.signature.s)),
                    hashBuf: Hash.sha256(Buffer.from(obj.message)),
                })
                ecdsa.verifyStr().should.equal(obj.exception)
            })
        })

        vectors.deterministicK.forEach((obj, i) => {
            it('should validate deterministicK vector ' + i, () => {
                const hashBuf = Hash.sha256(Buffer.from(obj.message))
                const privKey = new PrivKey().fromObject({
                    bn: new Bn().fromBuffer(Buffer.from(obj.privkey, 'hex')),
                })
                const ecdsa = new Ecdsa().fromObject({
                    keyPair: new KeyPair().fromObject({ privKey }),
                    hashBuf,
                })
                ecdsa.deterministicK(0).k.toString('hex').should.equal(obj.k_bad00)
                ecdsa.deterministicK(1).k.toString('hex').should.equal(obj.k_bad01)
                ecdsa.deterministicK(15).k.toString('hex').should.equal(obj.k_bad15)
            })
        })
    })
})
