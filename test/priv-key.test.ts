import should = require('should')
import { Bn } from '../src/bn'
import { Point } from '../src/point'
import { PrivKey } from '../src/priv-key'

describe('PrivKey', () => {
    const hex = '96c132224121b509b7d0a16245e957d9192609c5637c6228311287b1be21627a'
    const buf = Buffer.from(hex, 'hex')
    const enctestnet = 'cSdkPxkAjA4HDr5VHgsebAPDEh9Gyub4HK8UJr2DFGGqKKy4K5sG'
    const enctu = '92jJzK4tbURm1C7udQXxeCBvXHoHJstDXRxAMouPG1k1XUaXdsu'
    const encmainnet = 'L2Gkw3kKJ6N24QcDuH4XDqt9cTqsKTVNDGz1CRZhk9cq4auDUbJy'
    const encmu = '5JxgQaFM1FMd38cd14e3mbdxsdSa9iM2BV6DHBYsvGzxkTNQ7Un'

    it('should satisfy these basic API features', () => {
        let privKey = new PrivKey()
        should.exist(privKey)
        privKey = new PrivKey()
        should.exist(privKey)

        new PrivKey().constructor.should.equal(new PrivKey().constructor)
        new PrivKey.Testnet().constructor.should.equal(new PrivKey.Testnet().constructor)

        PrivKey.Testnet.fromRandom().toString()[0].should.equal('c')
    })

    it('should create a 0 private key with this convenience method', () => {
        const bn = new Bn(0)
        const privKey = new PrivKey(bn)
        privKey.bn.toString().should.equal(bn.toString())
    })

    it('should create a mainnet private key', () => {
        const privKey = new PrivKey(Bn.fromBuffer(buf), true)
        privKey.toString().should.equal(encmainnet)
    })

    it('should create an uncompressed testnet private key', () => {
        const privKey = new PrivKey.Testnet(Bn.fromBuffer(buf), false)
        privKey.toString().should.equal(enctu)
    })

    it('should create an uncompressed mainnet private key', () => {
        const privKey = new PrivKey(Bn.fromBuffer(buf), false)
        privKey.toString().should.equal(encmu)
    })

    describe('#fromObject', () => {
        it('should set bn', () => {
            should.exist(new PrivKey().fromObject({ bn: Bn.fromBuffer(buf) }).bn)
        })
    })

    describe('#fromJSON', () => {
        it('should input this address correctly', () => {
            const privKey = new PrivKey()
            privKey.fromString(encmu)
            const privKey2 = new PrivKey()
            privKey2.fromJSON(privKey.toHex())
            privKey2.toWif().should.equal(encmu)
        })
    })

    describe('#toString', () => {
        it('should output this address correctly', () => {
            const privKey = new PrivKey()
            privKey.fromString(encmu)
            privKey.toString().should.equal(encmu)
        })
    })

    describe('#fromRandom', () => {
        it('should set bn gt 0 and lt n, and should be compressed', () => {
            const privKey = new PrivKey().fromRandom()
            privKey.bn.gt(new Bn(0)).should.equal(true)
            privKey.bn.lt(Point.getN()).should.equal(true)
            privKey.compressed.should.equal(true)
        })
    })

    describe('@fromRandom', () => {
        it('should set bn gt 0 and lt n, and should be compressed', () => {
            const privKey = PrivKey.fromRandom()
            privKey.bn.gt(new Bn(0)).should.equal(true)
            privKey.bn.lt(Point.getN()).should.equal(true)
            privKey.compressed.should.equal(true)
        })
    })

    describe('#toHex', () => {
        it('should return a hex string', () => {
            const privKey = new PrivKey().fromBn(new Bn(5))
            privKey.toHex().should.equal('80000000000000000000000000000000000000000000000000000000000000000501')
        })
    })

    describe('#toBuffer', () => {
        it('should return a buffer', () => {
            const privKey = new PrivKey().fromBn(new Bn(5))
            privKey
                .toBuffer()
                .toString('hex')
                .should.equal('80000000000000000000000000000000000000000000000000000000000000000501')
        })
    })

    describe('#fromHex', () => {
        it('should return a hex string', () => {
            const privKey = new PrivKey().fromHex(
                '80000000000000000000000000000000000000000000000000000000000000000501'
            )
            privKey.toHex().should.equal('80000000000000000000000000000000000000000000000000000000000000000501')
        })
    })

    describe('#fromBuffer', () => {
        it('should return a buffer', () => {
            const privKey = new PrivKey().fromBuffer(
                Buffer.from('80000000000000000000000000000000000000000000000000000000000000000501', 'hex')
            )
            privKey
                .toBuffer()
                .toString('hex')
                .should.equal('80000000000000000000000000000000000000000000000000000000000000000501')
        })

        it('should throw an error if buffer is wrong length', () => {
            ;(function () {
                new PrivKey().fromBuffer(
                    Buffer.from('8000000000000000000000000000000000000000000000000000000000000000050100', 'hex')
                )
            }.should.throw('Length of privKey buffer must be 33 (uncompressed pubKey) or 34 (compressed pubKey)'))
            ;(function () {
                new PrivKey().fromBuffer(
                    Buffer.from('8000000000000000000000000000000000000000000000000000000000000005', 'hex')
                )
            }.should.throw('Length of privKey buffer must be 33 (uncompressed pubKey) or 34 (compressed pubKey)'))
        })

        it('should throw an error if buffer has wrong versionByteNum byte', () => {
            ;(function () {
                new PrivKey().fromBuffer(
                    Buffer.from('90000000000000000000000000000000000000000000000000000000000000000501', 'hex')
                )
            }.should.throw('Invalid versionByteNum byte'))
        })
    })

    describe('#toBn', () => {
        it('should return a bn', () => {
            const privKey = new PrivKey().fromBn(new Bn(5))
            privKey.toBn().eq(new Bn(5)).should.equal(true)
        })
    })

    describe('#fromBn', () => {
        it('should create a privKey from a bignum', () => {
            const privKey = new PrivKey().fromBn(new Bn(5))
            privKey.bn.toString().should.equal('5')
        })
    })

    describe('@fromBn', () => {
        it('should create a privKey from a bignum', () => {
            const privKey = PrivKey.fromBn(new Bn(5))
            privKey.bn.toString().should.equal('5')
        })
    })

    describe('#validate', () => {
        it('should unvalidate these privKeys', () => {
            const privKey = new PrivKey()
            privKey.compressed = true
            privKey.bn = Point.getN()
            ;(function () {
                privKey.validate()
            }.should.throw('Number must be less than N'))
            privKey.bn = Point.getN().sub(1)
            privKey.compressed = undefined
            ;(function () {
                privKey.validate()
            }.should.throw('Must specify whether the corresponding public key is compressed or not (true or false)'))
            privKey.compressed = true
            privKey.validate().should.equal(privKey)
        })
    })

    describe('#fromWif', () => {
        it('should parse this compressed testnet address correctly', () => {
            const privKey = new PrivKey()
            privKey.fromWif(encmainnet)
            privKey.toWif().should.equal(encmainnet)
        })
    })

    describe('@fromWif', () => {
        it('should parse this compressed testnet address correctly', () => {
            const privKey = PrivKey.fromWif(encmainnet)
            privKey.toWif().should.equal(encmainnet)
        })
    })

    describe('#toWif', () => {
        it('should parse this compressed testnet address correctly', () => {
            const privKey = new PrivKey.Testnet()
            privKey.fromWif(enctestnet)
            privKey.toWif().should.equal(enctestnet)
        })
    })

    describe('#fromString', () => {
        it('should parse this uncompressed testnet address correctly', () => {
            const privKey = new PrivKey.Testnet()
            privKey.fromString(enctu)
            privKey.toWif().should.equal(enctu)
        })
    })

    describe('#toString', () => {
        it('should parse this uncompressed mainnet address correctly', () => {
            const privKey = new PrivKey()
            privKey.fromString(encmu)
            privKey.toString().should.equal(encmu)
        })
    })
})
