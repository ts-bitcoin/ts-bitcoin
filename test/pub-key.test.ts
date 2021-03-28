import should = require('should')
import { Bn } from '../src/bn'
import { Point } from '../src/point'
import { PrivKey } from '../src/priv-key'
import { PubKey } from '../src/pub-key'

describe('PubKey', () => {
    it('should create a blank public key', () => {
        const pk = new PubKey()
        should.exist(pk)
    })

    it('should create a public key with a point', () => {
        const p = new Point()
        const pk = new PubKey(p)
        should.exist(pk.point)
    })

    it('should create a public key with a point with this convenient method', () => {
        const p = new Point()
        const pk = new PubKey(p)
        should.exist(pk.point)
        pk.point.toString().should.equal(p.toString())
    })

    describe('#fromObject', () => {
        it('should make a public key from a point', () => {
            should.exist(new PubKey().fromObject({ point: Point.getG() }).point)
        })
    })

    describe('#fromJSON', () => {
        it('should input this public key', () => {
            const pk = new PubKey()
            pk.fromJSON(
                '00041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
            )
            pk.point
                .getX()
                .toString(16)
                .should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
            pk.point
                .getY()
                .toString(16)
                .should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
        })
    })

    describe('#toJSON', () => {
        it('should output this pubKey', () => {
            const pk = new PubKey()
            const hex =
                '01041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
            pk.fromJSON(hex).toJSON().should.equal(hex)
        })

        it('should output this uncompressed pubKey', () => {
            const pk = new PubKey()
            const hex =
                '00041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
            pk.fromJSON(hex).toJSON().should.equal(hex)
        })
    })

    describe('#fromPrivKey', () => {
        it('should make a public key from a privKey', () => {
            should.exist(new PubKey().fromPrivKey(new PrivKey().fromRandom()))
        })
    })

    describe('@fromPrivKey', () => {
        it('should make a public key from a privKey', () => {
            should.exist(PubKey.fromPrivKey(new PrivKey().fromRandom()))
        })
    })

    describe('#asyncFromPrivKey', () => {
        it('should result the same as fromPrivKey', async () => {
            const privKey = new PrivKey().fromRandom()
            const pubKey1 = new PubKey().fromPrivKey(privKey)
            const pubKey2 = await new PubKey().asyncFromPrivKey(privKey)
            pubKey1.toString().should.equal(pubKey2.toString())
        })

        it('should result the same as fromPrivKey', async () => {
            const privKey = new PrivKey().fromBn(new Bn(5))
            const pubKey1 = new PubKey().fromPrivKey(privKey)
            const pubKey2 = await new PubKey().asyncFromPrivKey(privKey)
            pubKey1.toString().should.equal(pubKey2.toString())
        })
    })

    describe('@asyncFromPrivKey', () => {
        it('should result the same as fromPrivKey', async () => {
            const privKey = new PrivKey().fromRandom()
            const pubKey1 = PubKey.fromPrivKey(privKey)
            const pubKey2 = await PubKey.asyncFromPrivKey(privKey)
            pubKey1.toString().should.equal(pubKey2.toString())
        })

        it('should result the same as fromPrivKey', async () => {
            const privKey = new PrivKey().fromBn(new Bn(5))
            const pubKey1 = PubKey.fromPrivKey(privKey)
            const pubKey2 = await PubKey.asyncFromPrivKey(privKey)
            pubKey1.toString().should.equal(pubKey2.toString())
        })
    })

    describe('#fromHex', () => {
        it('should parse this uncompressed public key', () => {
            const pk = new PubKey()
            pk.fromHex(
                '041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
            )
            pk.point
                .getX()
                .toString(16)
                .should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
            pk.point
                .getY()
                .toString(16)
                .should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
        })
    })

    describe('#fromBuffer', () => {
        it('should parse this uncompressed public key', () => {
            const pk = new PubKey()
            pk.fromBuffer(
                Buffer.from(
                    '041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341',
                    'hex'
                )
            )
            pk.point
                .getX()
                .toString(16)
                .should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
            pk.point
                .getY()
                .toString(16)
                .should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
        })

        it('should parse this compressed public key', () => {
            const pk = new PubKey()
            pk.fromBuffer(Buffer.from('031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex'))
            pk.point
                .getX()
                .toString(16)
                .should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
            pk.point
                .getY()
                .toString(16)
                .should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
        })

        it('should throw an error on this invalid public key', () => {
            const pk = new PubKey()
            ;(function () {
                pk.fromBuffer(Buffer.from('091ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex'))
            }.should.throw())
        })
    })

    describe('#asyncFromBuffer', () => {
        it('should derive the same as fromBuffer', async () => {
            const pubKey = new PubKey().fromPrivKey(new PrivKey().fromRandom())
            const pubKey1 = new PubKey().fromBuffer(pubKey.toBuffer())
            const pubKey2 = await new PubKey().asyncFromBuffer(pubKey.toBuffer())
            pubKey1.toString().should.equal(pubKey2.toString())
        })
    })

    describe('@asyncFromBuffer', () => {
        it('should derive the same as fromBuffer', async () => {
            const pubKey = PubKey.fromPrivKey(new PrivKey().fromRandom())
            const pubKey1 = PubKey.fromBuffer(pubKey.toBuffer())
            const pubKey2 = await PubKey.asyncFromBuffer(pubKey.toBuffer())
            pubKey1.toString().should.equal(pubKey2.toString())
        })
    })

    describe('#fromFastBuffer', () => {
        it('should convert from this known fast buffer', () => {
            const pubKey = new PubKey().fromFastBuffer(
                Buffer.from(
                    '01041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341',
                    'hex'
                )
            )
            pubKey.point
                .getX()
                .toString(16)
                .should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
        })
    })

    describe('#fromDer', () => {
        it('should parse this uncompressed public key', () => {
            const pk = new PubKey()
            pk.fromDer(
                Buffer.from(
                    '041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341',
                    'hex'
                )
            )
            pk.point
                .getX()
                .toString(16)
                .should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
            pk.point
                .getY()
                .toString(16)
                .should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
        })

        it('should parse this compressed public key', () => {
            const pk = new PubKey()
            pk.fromDer(Buffer.from('031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex'))
            pk.point
                .getX()
                .toString(16)
                .should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
            pk.point
                .getY()
                .toString(16)
                .should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
        })

        it('should throw an error on this invalid public key', () => {
            const pk = new PubKey()
            ;(function () {
                pk.fromDer(Buffer.from('091ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex'))
            }.should.throw())
        })
    })

    describe('@fromDer', () => {
        it('should parse this uncompressed public key', () => {
            const pk = PubKey.fromDer(
                Buffer.from(
                    '041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341',
                    'hex'
                )
            )
            pk.point
                .getX()
                .toString(16)
                .should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
            pk.point
                .getY()
                .toString(16)
                .should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
        })

        it('should parse this compressed public key', () => {
            const pk = PubKey.fromDer(
                Buffer.from('031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex')
            )
            pk.point
                .getX()
                .toString(16)
                .should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
            pk.point
                .getY()
                .toString(16)
                .should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
        })

        it('should throw an error on this invalid public key', () => {
            ;(function () {
                PubKey.fromDer(Buffer.from('091ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex'))
            }.should.throw())
        })
    })

    describe('#fromString', () => {
        it('should parse this known valid public key', () => {
            const pk = new PubKey()
            pk.fromString(
                '041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
            )
            pk.point
                .getX()
                .toString(16)
                .should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
            pk.point
                .getY()
                .toString(16)
                .should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
        })
    })

    describe('#fromX', () => {
        it('should create this known public key', () => {
            const x = Bn.fromBuffer(
                Buffer.from('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex')
            )
            const pk = new PubKey()
            pk.fromX(true, x)
            pk.point
                .getX()
                .toString(16)
                .should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
            pk.point
                .getY()
                .toString(16)
                .should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
        })
    })

    describe('@fromX', () => {
        it('should create this known public key', () => {
            const x = Bn.fromBuffer(
                Buffer.from('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex')
            )
            const pk = new PubKey()
            pk.fromX(true, x)
            pk.point
                .getX()
                .toString(16)
                .should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
            pk.point
                .getY()
                .toString(16)
                .should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
        })
    })

    describe('#toHex', () => {
        it('should return this compressed DER format', () => {
            const x = new Bn().fromHex('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
            const pk = new PubKey()
            pk.fromX(true, x)
            pk.toHex().should.equal('031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
        })
    })

    describe('#toBuffer', () => {
        it('should return this compressed DER format', () => {
            const x = Bn.fromBuffer(
                Buffer.from('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex')
            )
            const pk = new PubKey()
            pk.fromX(true, x)
            pk.toBuffer()
                .toString('hex')
                .should.equal('031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
        })
    })

    describe('#toFastBuffer', () => {
        it('should return fast buffer', () => {
            const x = Bn.fromBuffer(
                Buffer.from('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex')
            )
            const pk = new PubKey()
            pk.fromX(true, x)
            pk.toFastBuffer()
                .toString('hex')
                .should.equal(
                    '01041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
                )
            pk.toFastBuffer().length.should.greaterThan(64)
        })
    })

    describe('#toDer', () => {
        it('should return this compressed DER format', () => {
            const x = Bn.fromBuffer(
                Buffer.from('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex')
            )
            const pk = new PubKey()
            pk.fromX(true, x)
            pk.toDer(true)
                .toString('hex')
                .should.equal('031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
        })

        it('should return this uncompressed DER format', () => {
            const x = Bn.fromBuffer(
                Buffer.from('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex')
            )
            const pk = new PubKey()
            pk.fromX(true, x)
            pk.toDer(false)
                .toString('hex')
                .should.equal(
                    '041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
                )
        })
    })

    describe('#toString', () => {
        it('should print this known public key', () => {
            const hex = '031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a'
            const pk = new PubKey()
            pk.fromString(hex)
            pk.toString().should.equal(hex)
        })
    })

    describe('#validate', () => {
        it('should not throw an error if pubKey is valid', () => {
            const hex = '031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a'
            const pk = new PubKey()
            pk.fromString(hex)
            should.exist(pk.validate())
        })

        it('should not throw an error if pubKey is invalid', () => {
            const hex =
                '041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a0000000000000000000000000000000000000000000000000000000000000000'
            const pk = new PubKey()
            pk.fromString(hex)
            ;(function () {
                pk.validate()
            }.should.throw('Invalid y value of public key'))
        })

        it('should throw an error if pubKey is infinity', () => {
            const pk = new PubKey()
            let errm = ''
            try {
                pk.point = Point.getG().mul(Point.getN())
            } catch (err) {
                errm = err.message
            }
            errm.should.equal('point mul out of range')
        })
    })
})
