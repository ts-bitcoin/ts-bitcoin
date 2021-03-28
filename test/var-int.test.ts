import should = require('should')
import { Bn } from '../src/bn'
import { Br } from '../src/br'
import { Bw } from '../src/bw'
import { VarInt } from '../src/var-int'

describe('VarInt', () => {
    it('should make a new varInt', () => {
        const buf = Buffer.from('00', 'hex')
        let varInt = new VarInt(buf)
        should.exist(varInt)
        varInt.buf.toString('hex').should.equal('00')
        varInt = new VarInt(buf)
        should.exist(varInt)
        varInt.buf.toString('hex').should.equal('00')

        // varInts can have multiple buffer representations
        VarInt.fromNumber(0)
            .toNumber()
            .should.equal(new VarInt(Buffer.from([0xfd, 0, 0])).toNumber())
        VarInt.fromNumber(0)
            .toBuffer()
            .toString('hex')
            .should.not.equal(
                new VarInt()
                    .fromBuffer(Buffer.from([0xfd, 0, 0]))
                    .toBuffer()
                    .toString('hex')
            )
    })

    describe('#fromObject', () => {
        it('should set a buffer', () => {
            const buf = Buffer.from('00', 'hex')
            const varInt = new VarInt().fromObject({ buf })
            varInt.buf.toString('hex').should.equal('00')
            varInt.fromObject({})
            varInt.buf.toString('hex').should.equal('00')
        })
    })

    describe('#fromJSON', () => {
        it('should set a buffer', () => {
            const buf = new Bw().writeVarIntNum(5).toBuffer()
            const varInt = new VarInt().fromJSON(buf.toString('hex'))
            varInt.toNumber().should.equal(5)
        })
    })

    describe('#toJSON', () => {
        it('should return a buffer', () => {
            const buf = new Bw().writeVarIntNum(5).toBuffer()
            const varInt = new VarInt().fromJSON(buf.toString('hex'))
            varInt.toJSON().should.equal('05')
        })
    })

    describe('#fromBuffer', () => {
        it('should set a buffer', () => {
            const buf = new Bw().writeVarIntNum(5).toBuffer()
            const varInt = new VarInt().fromBuffer(buf)
            varInt.toNumber().should.equal(5)
        })
    })

    describe('#fromBr', () => {
        it('should set a buffer reader', () => {
            const buf = new Bw().writeVarIntNum(5).toBuffer()
            const br = new Br(buf)
            const varInt = new VarInt().fromBr(br)
            varInt.toNumber().should.equal(5)
        })
    })

    describe('#fromBn', () => {
        it('should set a number', () => {
            const varInt = new VarInt().fromBn(new Bn(5))
            varInt.toNumber().should.equal(5)
        })
    })

    describe('@fromBn', () => {
        it('should set a number', () => {
            const varInt = VarInt.fromBn(new Bn(5))
            varInt.toNumber().should.equal(5)
        })
    })

    describe('#fromNumber', () => {
        it('should set a number', () => {
            const varInt = new VarInt().fromNumber(5)
            varInt.toNumber().should.equal(5)
        })
    })

    describe('@fromNumber', () => {
        it('should set a number', () => {
            const varInt = VarInt.fromNumber(5)
            varInt.toNumber().should.equal(5)
        })
    })

    describe('#toBuffer', () => {
        it('should return a buffer', () => {
            const buf = new Bw().writeVarIntNum(5).toBuffer()
            const varInt = new VarInt(buf)
            varInt.toBuffer().toString('hex').should.equal(buf.toString('hex'))
        })
    })

    describe('#toBn', () => {
        it('should return a buffer', () => {
            const varInt = VarInt.fromNumber(5)
            varInt.toBn().toString().should.equal(new Bn(5).toString())
        })
    })

    describe('#toNumber', () => {
        it('should return a buffer', () => {
            const varInt = VarInt.fromNumber(5)
            varInt.toNumber().should.equal(5)
        })
    })
})
