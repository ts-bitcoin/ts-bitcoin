import should = require('should')
import { Base58 } from '../src/base-58'
import { Base58Check } from '../src/base-58-check'

describe('Base58Check', () => {
    const buf = Buffer.from([0, 1, 2, 3, 253, 254, 255])
    const enc = '14HV44ipwoaqfg'

    it('should make an instance with "new"', () => {
        const b58 = new Base58Check()
        should.exist(b58)
    })

    it('should make an instance without "new"', () => {
        const b58 = new Base58Check()
        should.exist(b58)
    })

    it('should allow this handy syntax', () => {
        new Base58Check(buf).toString().should.equal(enc)
        new Base58Check().fromString(enc).toBuffer().toString('hex').should.equal(buf.toString('hex'))
    })

    describe('#fromObject', () => {
        it('should set a buf', () => {
            should.exist(new Base58Check().fromObject({ buf }).buf)
        })
    })

    describe('@encode', () => {
        it('should encode the buffer accurately', () => {
            Base58Check.encode(buf).should.equal(enc)
        })

        it('should throw an error when the input is not a buffer', () => {
            ;(function () {
                Base58Check.encode('string' as any)
            }.should.throw('Input must be a buffer'))
        })
    })

    describe('@decode', () => {
        it('should decode this encoded value correctly', () => {
            Base58Check.decode(enc).toString('hex').should.equal(buf.toString('hex'))
        })

        it('should throw an error when input is not a string', () => {
            ;(function () {
                Base58Check.decode(5 as any)
            }.should.throw('Input must be a string'))
        })

        it('should throw an error when input is too short', () => {
            ;(function () {
                Base58Check.decode(enc.slice(0, 1))
            }.should.throw('Input string too short'))
        })

        it('should throw an error when there is a checksum mismatch', () => {
            const buf2 = Base58.decode(enc)
            buf2[0] = buf2[0] + 1
            const enc2 = Base58.encode(buf2)
            ;(function () {
                Base58Check.decode(enc2)
            }.should.throw('Checksum mismatch'))
        })
    })

    describe('#fromHex', () => {
        it('should set buffer from hex', () => {
            const b58 = new Base58Check().fromHex(buf.toString('hex'))
            b58.buf.toString('hex').should.equal(buf.toString('hex'))
        })
    })

    describe('#fromBuffer', () => {
        it('should not fail', () => {
            should.exist(new Base58Check().fromBuffer(buf))
        })

        it('should set buffer', () => {
            const b58 = new Base58Check().fromBuffer(buf)
            b58.buf.toString('hex').should.equal(buf.toString('hex'))
        })
    })

    describe('#fromString', () => {
        it('should convert this known string to a buffer', () => {
            new Base58Check().fromString(enc).toBuffer().toString('hex').should.equal(buf.toString('hex'))
        })
    })

    describe('#toHex', () => {
        it('should return the buffer', () => {
            const b58 = new Base58Check(buf)
            b58.toHex().should.equal(buf.toString('hex'))
        })
    })

    describe('#toBuffer', () => {
        it('should return the buffer', () => {
            const b58 = new Base58Check(buf)
            b58.toBuffer().toString('hex').should.equal(buf.toString('hex'))
        })
    })

    describe('#toString', () => {
        it('should return the buffer', () => {
            const b58 = new Base58Check(buf)
            b58.toString().should.equal(enc)
        })
    })
})
