import should = require('should')
import { Base58 } from '../src/base-58'

describe('Base58', () => {
    const buf = Buffer.from([0, 1, 2, 3, 253, 254, 255])
    const enc = '1W7N4RuG'

    it('should make an instance with "new"', () => {
        const b58 = new Base58()
        should.exist(b58)
    })

    it('should make an instance without "new"', () => {
        const b58 = new Base58()
        should.exist(b58)
    })

    it('should allow this handy syntax', () => {
        new Base58(buf).toString().should.equal(enc)
        new Base58().fromString(enc).toBuffer().toString('hex').should.equal(buf.toString('hex'))
    })

    describe('#fromObject', () => {
        it('should set a blank buffer', () => {
            new Base58().fromObject({ buf: Buffer.from([]) })
        })
    })

    describe('@encode', () => {
        it('should encode the buffer accurately', () => {
            Base58.encode(buf).should.equal(enc)
        })

        it('should throw an error when the Input is not a buffer', () => {
            ;(function () {
                Base58.encode('string' as any)
            }.should.throw('Input should be a buffer'))
        })
    })

    describe('@decode', () => {
        it('should decode this encoded value correctly', () => {
            Base58.decode(enc).toString('hex').should.equal(buf.toString('hex'))
            Buffer.isBuffer(Base58.decode(enc)).should.equal(true)
        })

        it('should throw an error when Input is not a string', () => {
            ;(function () {
                Base58.decode(5 as any)
            }.should.throw('Input should be a string'))
        })
    })

    describe('#fromHex', () => {
        it('should set buffer', () => {
            const b58 = new Base58().fromHex(buf.toString('hex'))
            b58.buf.toString('hex').should.equal(buf.toString('hex'))
        })
    })

    describe('#fromBuffer', () => {
        it('should not fail', () => {
            should.exist(new Base58().fromBuffer(buf))
        })

        it('should set buffer', () => {
            const b58 = new Base58().fromBuffer(buf)
            b58.buf.toString('hex').should.equal(buf.toString('hex'))
        })
    })

    describe('#fromString', () => {
        it('should convert this known string to a buffer', () => {
            new Base58().fromString(enc).toBuffer().toString('hex').should.equal(buf.toString('hex'))
        })
    })

    describe('#toHex', () => {
        it('should return the buffer in hex', () => {
            const b58 = new Base58(buf)
            b58.toHex().should.equal(buf.toString('hex'))
        })
    })

    describe('#toBuffer', () => {
        it('should return the buffer', () => {
            const b58 = new Base58(buf)
            b58.toBuffer().toString('hex').should.equal(buf.toString('hex'))
        })
    })

    describe('#toString', () => {
        it('should return the buffer', () => {
            const b58 = new Base58(buf)
            b58.toString().should.equal(enc)
        })
    })
})
