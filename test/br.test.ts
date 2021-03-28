import should = require('should')
import { Bn } from '../src/bn'
import { Br } from '../src/br'
import { Bw } from '../src/bw'

describe('Br', () => {
    it('should make a new Br', () => {
        let br = new Br()
        should.exist(br)
        br = new Br()
        should.exist(br)
    })

    it('should create a new bufferreader with a buffer', () => {
        const buf = Buffer.alloc(0)
        const br = new Br(buf)
        should.exist(br)
        Buffer.isBuffer(br.buf).should.equal(true)
    })

    describe('#fromObject', () => {
        it('should set pos', () => {
            should.exist(new Br().fromObject({ pos: 1 }).pos)
        })
    })

    describe('#eof', () => {
        it('should return true for a blank br', () => {
            const br = new Br(Buffer.from([]))
            br.eof().should.equal(true)
        })
    })

    describe('#read', () => {
        it('should return the same buffer', () => {
            const buf = Buffer.from([0])
            const br = new Br(buf)
            br.read().toString('hex').should.equal(buf.toString('hex'))
        })

        it('should return a buffer of this length', () => {
            const buf = Buffer.alloc(10)
            buf.fill(0)
            const br = new Br(buf)
            const buf2 = br.read(2)
            buf2.length.should.equal(2)
            br.eof().should.equal(false)
            br.pos.should.equal(2)
        })

        it('should be able to read 0 bytes', () => {
            const buf = Buffer.from('0101', 'hex')
            new Br(buf).read(0).length.should.equal(0)
        })
    })

    describe('#readReverse', () => {
        it('should reverse this [0, 1]', () => {
            const buf = Buffer.from([0, 1])
            const br = new Br(buf)
            br.readReverse().toString('hex').should.equal('0100')
        })

        it('should be able to read 0 bytes', () => {
            const buf = Buffer.from('0101', 'hex')
            new Br(buf).readReverse(0).length.should.equal(0)
        })
    })

    describe('#readUInt8', () => {
        it('should return 1', () => {
            const buf = Buffer.alloc(1)
            buf.writeUInt8(1, 0)
            const br = new Br(buf)
            br.readUInt8().should.equal(1)
        })
    })

    describe('#readInt8', () => {
        it('should return 1', () => {
            const buf = Buffer.alloc(1)
            buf.writeInt8(1, 0)
            const br = new Br(buf)
            br.readInt8().should.equal(1)
            new Br(Buffer.from('ff', 'hex')).readInt8().should.equal(-1)
        })
    })

    describe('#readUInt16BE', () => {
        it('should return 1', () => {
            const buf = Buffer.alloc(2)
            buf.writeUInt16BE(1, 0)
            const br = new Br(buf)
            br.readUInt16BE().should.equal(1)
        })
    })

    describe('#readInt16BE', () => {
        it('should return 1', () => {
            const buf = Buffer.alloc(2)
            buf.writeInt16BE(1, 0)
            const br = new Br(buf)
            br.readInt16BE().should.equal(1)
            new Br(Buffer.from('ffff', 'hex')).readInt16BE().should.equal(-1)
        })
    })

    describe('#readUInt16LE', () => {
        it('should return 1', () => {
            const buf = Buffer.alloc(2)
            buf.writeUInt16LE(1, 0)
            const br = new Br(buf)
            br.readUInt16LE().should.equal(1)
        })
    })

    describe('#readInt16LE', () => {
        it('should return 1', () => {
            const buf = Buffer.alloc(2)
            buf.writeInt16LE(1, 0)
            const br = new Br(buf)
            br.readInt16LE().should.equal(1)
            new Br(Buffer.from('ffff', 'hex')).readInt16LE().should.equal(-1)
        })
    })

    describe('#readUInt32BE', () => {
        it('should return 1', () => {
            const buf = Buffer.alloc(4)
            buf.writeUInt32BE(1, 0)
            const br = new Br(buf)
            br.readUInt32BE().should.equal(1)
        })
    })

    describe('#readInt32BE', () => {
        it('should return 1', () => {
            const buf = Buffer.alloc(4)
            buf.writeInt32BE(1, 0)
            const br = new Br(buf)
            br.readInt32BE().should.equal(1)
            new Br(Buffer.from('ffffffff', 'hex')).readInt32BE().should.equal(-1)
        })
    })

    describe('#readUInt32LE', () => {
        it('should return 1', () => {
            const buf = Buffer.alloc(4)
            buf.writeUInt32LE(1, 0)
            const br = new Br(buf)
            br.readUInt32LE().should.equal(1)
        })
    })

    describe('#readInt32LE', () => {
        it('should return 1', () => {
            const buf = Buffer.alloc(4)
            buf.writeInt32LE(1, 0)
            const br = new Br(buf)
            br.readInt32LE().should.equal(1)
            new Br(Buffer.from('ffffffff', 'hex')).readInt32LE().should.equal(-1)
        })
    })

    describe('#readUInt64BEBn', () => {
        it('should return 1', () => {
            const buf = Buffer.alloc(8)
            buf.fill(0)
            buf.writeUInt32BE(1, 4)
            const br = new Br(buf)
            br.readUInt64BEBn().toNumber().should.equal(1)
        })

        it('should return 2^64', () => {
            const buf = Buffer.alloc(8)
            buf.fill(0xff)
            const br = new Br(buf)
            br.readUInt64BEBn().toNumber().should.equal(Math.pow(2, 64))
        })
    })

    describe('#readUInt64LEBn', () => {
        it('should return 1', () => {
            const buf = Buffer.alloc(8)
            buf.fill(0)
            buf.writeUInt32LE(1, 0)
            const br = new Br(buf)
            br.readUInt64LEBn().toNumber().should.equal(1)
        })

        it('should return 2^30', () => {
            const buf = Buffer.alloc(8)
            buf.fill(0)
            buf.writeUInt32LE(Math.pow(2, 30), 0)
            const br = new Br(buf)
            br.readUInt64LEBn().toNumber().should.equal(Math.pow(2, 30))
        })

        it('should return 0', () => {
            const buf = Buffer.alloc(8)
            buf.fill(0)
            const br = new Br(buf)
            br.readUInt64LEBn().toNumber().should.equal(0)
        })

        it('should return 2^64', () => {
            const buf = Buffer.alloc(8)
            buf.fill(0xff)
            const br = new Br(buf)
            br.readUInt64LEBn().toNumber().should.equal(Math.pow(2, 64))
        })
    })

    describe('#readVarIntBuf', () => {
        it('should read a 1 byte varInt', () => {
            const buf = Buffer.from([50])
            const br = new Br(buf)
            br.readVarIntBuf().length.should.equal(1)
        })

        it('should read a 3 byte varInt', () => {
            const buf = Buffer.from([253, 253, 0])
            const br = new Br(buf)
            br.readVarIntBuf().length.should.equal(3)
        })

        it('should read a 5 byte varInt', () => {
            const buf = Buffer.from([254, 0, 0, 0, 0])
            buf.writeUInt32LE(50000, 1)
            const br = new Br(buf)
            br.readVarIntBuf().length.should.equal(5)
        })

        it('should read a 9 byte varInt', () => {
            const buf = new Bw().writeVarIntBn(new Bn(Math.pow(2, 54).toString())).toBuffer()
            const br = new Br(buf)
            br.readVarIntBuf().length.should.equal(9)
        })
    })

    describe('#readVarIntNum', () => {
        it('should read a 1 byte varInt', () => {
            const buf = Buffer.from([50])
            const br = new Br(buf)
            br.readVarIntNum().should.equal(50)
        })

        it('should read a 3 byte varInt', () => {
            const buf = Buffer.from([253, 253, 0])
            const br = new Br(buf)
            br.readVarIntNum().should.equal(253)
        })

        it('should read a 5 byte varInt', () => {
            const buf = Buffer.from([254, 0, 0, 0, 0])
            buf.writeUInt32LE(50000, 1)
            const br = new Br(buf)
            br.readVarIntNum().should.equal(50000)
        })

        it('should throw an error on a 9 byte varInt over the javascript uint precision limit', () => {
            const buf = new Bw().writeVarIntBn(new Bn(Math.pow(2, 54).toString())).toBuffer()
            const br = new Br(buf)
            ;(function () {
                br.readVarIntNum()
            }.should.throw('number too large to retain precision - use readVarIntBn'))
        })

        it('should not throw an error on a 9 byte varInt not over the javascript uint precision limit', () => {
            const buf = new Bw().writeVarIntBn(new Bn(Math.pow(2, 53).toString())).toBuffer()
            const br = new Br(buf)
            ;(function () {
                br.readVarIntNum()
            }.should.not.throw('number too large to retain precision - use readVarIntBn'))
        })
    })

    describe('#readVarIntBn', () => {
        it('should read a 1 byte varInt', () => {
            const buf = Buffer.from([50])
            const br = new Br(buf)
            br.readVarIntBn().toNumber().should.equal(50)
        })

        it('should read a 3 byte varInt', () => {
            const buf = Buffer.from([253, 253, 0])
            const br = new Br(buf)
            br.readVarIntBn().toNumber().should.equal(253)
        })

        it('should read a 5 byte varInt', () => {
            const buf = Buffer.from([254, 0, 0, 0, 0])
            buf.writeUInt32LE(50000, 1)
            const br = new Br(buf)
            br.readVarIntBn().toNumber().should.equal(50000)
        })

        it('should read a 9 byte varInt', () => {
            const buf = Buffer.concat([Buffer.from([255]), Buffer.from('ffffffffffffffff', 'hex')])
            const br = new Br(buf)
            br.readVarIntBn().toNumber().should.equal(Math.pow(2, 64))
        })
    })
})
