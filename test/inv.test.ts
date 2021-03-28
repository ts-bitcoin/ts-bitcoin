import should = require('should')
import { Bw } from '../src/bw'
import { Hash } from '../src/hash'
import { Inv } from '../src/inv'

describe('Inv', () => {
    it('should exist', () => {
        const inv = new Inv()
        should.exist(inv)
        should.exist(Inv)
    })

    describe('#fromBuffer', () => {
        it('should convert from a buffer', () => {
            const hashBuf = Hash.sha256(Buffer.alloc(0))
            const typeNum = 1
            const typebuf = new Bw().writeUInt32LE(typeNum).toBuffer()
            const buf = Buffer.concat([typebuf, hashBuf])
            const inv = new Inv().fromBuffer(buf)
            inv.typeNum.should.equal(typeNum)
            Buffer.compare(inv.hashBuf, hashBuf).should.equal(0)
        })
    })

    describe('#toBuffer', () => {
        it('should convert to a buffer', () => {
            const hashBuf = Hash.sha256(Buffer.alloc(0))
            const typeNum = 1
            const typebuf = new Bw().writeUInt32LE(typeNum).toBuffer()
            const buf = Buffer.concat([typebuf, hashBuf])
            const inv = new Inv().fromBuffer(buf)
            const buf2 = inv.toBuffer()
            Buffer.compare(buf, buf2).should.equal(0)
        })
    })

    describe('#isTx', () => {
        it('should know this is a tx hash', () => {
            const hashBuf = Hash.sha256(Buffer.alloc(0))
            const typeNum = Inv.MSG_TX
            const inv = new Inv(typeNum, hashBuf)
            inv.isTx().should.equal(true)
        })
    })

    describe('#isBlock', () => {
        it('should know this is a block hash', () => {
            const hashBuf = Hash.sha256(Buffer.alloc(0))
            const typeNum = Inv.MSG_BLOCK
            const inv = new Inv(typeNum, hashBuf)
            inv.isBlock().should.equal(true)
        })
    })

    describe('#isFilteredBlock', () => {
        it('should know this is a filtered block hash', () => {
            const hashBuf = Hash.sha256(Buffer.alloc(0))
            const typeNum = Inv.MSG_FILTERED_BLOCK
            const inv = new Inv(typeNum, hashBuf)
            inv.isFilteredBlock().should.equal(true)
        })
    })
})
