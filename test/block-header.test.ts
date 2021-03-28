import should = require('should')
import { BlockHeader } from '../src/block-header'
import { Br } from '../src/br'
import { Bw } from '../src/bw'

describe('BlockHeader', () => {
    const bh = new BlockHeader()
    const versionBytesNum = 1
    const prevBlockHashBuf = Buffer.alloc(32)
    prevBlockHashBuf.fill(5)
    const merkleRootBuf = Buffer.alloc(32)
    merkleRootBuf.fill(9)
    const time = 2
    const bits = 3
    const nonce = 4
    bh.fromObject({
        versionBytesNum,
        prevBlockHashBuf,
        merkleRootBuf,
        time,
        bits,
        nonce,
    })
    const bhhex =
        '0100000005050505050505050505050505050505050505050505050505050505050505050909090909090909090909090909090909090909090909090909090909090909020000000300000004000000'
    const bhbuf = Buffer.from(bhhex, 'hex')

    it('should make a new blockHeader', () => {
        let blockHeader = new BlockHeader()
        should.exist(blockHeader)
        blockHeader = new BlockHeader()
        should.exist(blockHeader)
    })

    describe('#fromObject', () => {
        it('should set all the variables', () => {
            bh.fromObject({
                versionBytesNum,
                prevBlockHashBuf,
                merkleRootBuf,
                time,
                bits,
                nonce,
            })
            should.exist(bh.versionBytesNum)
            should.exist(bh.prevBlockHashBuf)
            should.exist(bh.merkleRootBuf)
            should.exist(bh.time)
            should.exist(bh.bits)
            should.exist(bh.nonce)
        })
    })

    describe('#fromJSON', () => {
        it('should set all the variables', () => {
            const bh2 = new BlockHeader().fromJSON({
                versionBytesNum,
                prevBlockHashBuf: prevBlockHashBuf.toString('hex'),
                merkleRootBuf: merkleRootBuf.toString('hex'),
                time,
                bits,
                nonce,
            })
            should.exist(bh2.versionBytesNum)
            should.exist(bh2.prevBlockHashBuf)
            should.exist(bh2.merkleRootBuf)
            should.exist(bh2.time)
            should.exist(bh2.bits)
            should.exist(bh2.nonce)
        })
    })

    describe('#toJSON', () => {
        it('should set all the variables', () => {
            const json = bh.toJSON()
            should.exist(json.versionBytesNum)
            should.exist(json.prevBlockHashBuf)
            should.exist(json.merkleRootBuf)
            should.exist(json.time)
            should.exist(json.bits)
            should.exist(json.nonce)
        })
    })

    describe('#fromHex', () => {
        it('should parse this known hex string', () => {
            new BlockHeader().fromHex(bhhex).toBuffer().toString('hex').should.equal(bhhex)
        })
    })

    describe('#fromBuffer', () => {
        it('should parse this known buffer', () => {
            new BlockHeader().fromBuffer(bhbuf).toBuffer().toString('hex').should.equal(bhhex)
        })
    })

    describe('#fromBr', () => {
        it('should parse this known buffer', () => {
            new BlockHeader().fromBr(new Br(bhbuf)).toBuffer().toString('hex').should.equal(bhhex)
        })
    })

    describe('#toHex', () => {
        it('should output this known hex string', () => {
            new BlockHeader().fromBuffer(bhbuf).toHex().should.equal(bhhex)
        })
    })

    describe('#toBuffer', () => {
        it('should output this known buffer', () => {
            new BlockHeader().fromBuffer(bhbuf).toBuffer().toString('hex').should.equal(bhhex)
        })
    })

    describe('#toBw', () => {
        it('should output this known buffer', () => {
            new BlockHeader().fromBuffer(bhbuf).toBw().toBuffer().toString('hex').should.equal(bhhex)
            const bw = new Bw()
            new BlockHeader().fromBuffer(bhbuf).toBw(bw)
            bw.toBuffer().toString('hex').should.equal(bhhex)
        })
    })
})
