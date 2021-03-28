import should = require('should')
import { Bn } from '../src/bn'
import { Br } from '../src/br'
import { Bw } from '../src/bw'

describe('Bw', () => {
    it('should create a new buffer writer', () => {
        const bw = new Bw()
        should.exist(bw)
    })

    describe('#fromObject', () => {
        it('set bufs', () => {
            const buf1 = Buffer.from([0])
            const buf2 = Buffer.from([1])
            const bufs = [buf1, buf2]
            const bw = new Bw().fromObject({ bufs })
            bw.toBuffer().toString('hex').should.equal('0001')
        })
    })

    describe('#getLength', () => {
        it('should compute length correctly of two 2 byte buffers', () => {
            const buf1 = Buffer.from('0000', 'hex')
            const buf2 = Buffer.from('0000', 'hex')
            const bw = new Bw().write(buf1).write(buf2)
            bw.getLength().should.equal(4)
        })
    })

    describe('#toBuffer', () => {
        it('should concat these two bufs', () => {
            const buf1 = Buffer.from([0])
            const buf2 = Buffer.from([1])
            const bw = new Bw().fromObject({ bufs: [buf1, buf2] })
            bw.toBuffer().toString('hex').should.equal('0001')
        })
    })

    describe('#write', () => {
        it('should write a buffer', () => {
            const buf = Buffer.from([0])
            const bw = new Bw()
            bw.write(buf)
            bw.toBuffer().toString('hex').should.equal('00')
        })
    })

    describe('#writeReverse', () => {
        it('should write a buffer in reverse', () => {
            const buf = Buffer.from([0, 1])
            const bw = new Bw()
            bw.writeReverse(buf)
            bw.toBuffer().toString('hex').should.equal('0100')
        })
    })

    describe('#writeUInt8', () => {
        it('should write 1', () => {
            const bw = new Bw()
            bw.writeUInt8(1).toBuffer().toString('hex').should.equal('01')
        })
    })

    describe('#writeInt8', () => {
        it('should write 1', () => {
            const bw = new Bw()
            bw.writeInt8(1).toBuffer().toString('hex').should.equal('01')
            new Bw().writeInt8(-1).toBuffer().toString('hex').should.equal('ff')
        })
    })

    describe('#writeUInt16BE', () => {
        it('should write 1', () => {
            const bw = new Bw()
            bw.writeUInt16BE(1).toBuffer().toString('hex').should.equal('0001')
        })
    })

    describe('#writeInt16BE', () => {
        it('should write 1', () => {
            const bw = new Bw()
            bw.writeInt16BE(1).toBuffer().toString('hex').should.equal('0001')
            new Bw().writeInt16BE(-1).toBuffer().toString('hex').should.equal('ffff')
        })
    })

    describe('#writeUInt16LE', () => {
        it('should write 1', () => {
            const bw = new Bw()
            bw.writeUInt16LE(1).toBuffer().toString('hex').should.equal('0100')
        })
    })

    describe('#writeInt16LE', () => {
        it('should write 1', () => {
            const bw = new Bw()
            bw.writeInt16LE(1).toBuffer().toString('hex').should.equal('0100')
            new Bw().writeInt16LE(-1).toBuffer().toString('hex').should.equal('ffff')
        })
    })

    describe('#writeUInt32BE', () => {
        it('should write 1', () => {
            const bw = new Bw()
            bw.writeUInt32BE(1).toBuffer().toString('hex').should.equal('00000001')
        })
    })

    describe('#writeInt32BE', () => {
        it('should write 1', () => {
            const bw = new Bw()
            bw.writeInt32BE(1).toBuffer().toString('hex').should.equal('00000001')
            new Bw().writeInt32BE(-1).toBuffer().toString('hex').should.equal('ffffffff')
        })
    })

    describe('#writeUInt32LE', () => {
        it('should write 1', () => {
            const bw = new Bw()
            bw.writeUInt32LE(1).toBuffer().toString('hex').should.equal('01000000')
        })
    })

    describe('#writeInt32LE', () => {
        it('should write 1', () => {
            const bw = new Bw()
            bw.writeInt32LE(1).toBuffer().toString('hex').should.equal('01000000')
            new Bw().writeInt32LE(-1).toBuffer().toString('hex').should.equal('ffffffff')
        })
    })

    describe('#writeUInt64BEBn', () => {
        it('should write 1', () => {
            const bw = new Bw()
            bw.writeUInt64BEBn(new Bn(1)).toBuffer().toString('hex').should.equal('0000000000000001')
        })
    })

    describe('#writeUInt64LEBn', () => {
        it('should write 1', () => {
            const bw = new Bw()
            bw.writeUInt64LEBn(new Bn(1)).toBuffer().toString('hex').should.equal('0100000000000000')
        })
    })

    describe('#writeVarInt', () => {
        it('should write a 1 byte varInt', () => {
            const bw = new Bw()
            bw.writeVarIntNum(1)
            bw.toBuffer().length.should.equal(1)
        })

        it('should write a 3 byte varInt', () => {
            const bw = new Bw()
            bw.writeVarIntNum(1000)
            bw.toBuffer().length.should.equal(3)
        })

        it('should write a 5 byte varInt', () => {
            const bw = new Bw()
            bw.writeVarIntNum(Math.pow(2, 16 + 1))
            bw.toBuffer().length.should.equal(5)
        })

        it('should write a 9 byte varInt', () => {
            const bw = new Bw()
            bw.writeVarIntNum(Math.pow(2, 32 + 1))
            bw.toBuffer().length.should.equal(9)
        })

        it('should read back the same value it wrote for a 9 byte varInt', () => {
            const bw = new Bw()
            const n = Math.pow(2, 53)
            n.should.equal(n + 1) // javascript number precision limit
            bw.writeVarIntNum(n)
            const br = new Br(bw.toBuffer())
            br.readVarIntBn().toNumber().should.equal(n)
        })
    })

    describe('#writeVarIntBn', () => {
        it('should write a 1 byte varInt', () => {
            const bw = new Bw()
            bw.writeVarIntBn(new Bn(1))
            bw.toBuffer().length.should.equal(1)
        })

        it('should write a 3 byte varInt', () => {
            const bw = new Bw()
            bw.writeVarIntBn(new Bn(1000))
            bw.toBuffer().length.should.equal(3)
        })

        it('should write a 5 byte varInt', () => {
            const bw = new Bw()
            bw.writeVarIntBn(new Bn(Math.pow(2, 16 + 1)))
            bw.toBuffer().length.should.equal(5)
        })

        it('should write a 9 byte varInt', () => {
            const bw = new Bw()
            bw.writeVarIntBn(new Bn(Math.pow(2, 32 + 1)))
            bw.toBuffer().length.should.equal(9)
        })
    })
})
