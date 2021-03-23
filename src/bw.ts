import { Bn } from './bn'

/**
 * Buffer Writer
 * =============
 *
 * This is the writing complement of the Br. You can easily write
 * VarInts and other basic number types. The way to use it is: buf =
 * new Bw().write(buf1).write(buf2).toBuffer()
 */
export class Bw {
    public bufs: Buffer[]

    constructor(bufs?: Buffer[]) {
        this.fromObject({ bufs })
    }

    public fromObject(obj: { bufs: Buffer[] }): Bw {
        this.bufs = obj.bufs || this.bufs || []
        return this
    }

    public getLength(): number {
        let len = 0
        for (const i in this.bufs) {
            const buf = this.bufs[i]
            len = len + buf.length
        }
        return len
    }

    public toBuffer(): Buffer {
        return Buffer.concat(this.bufs)
    }

    public write(buf: Buffer): Bw {
        this.bufs.push(buf)
        return this
    }

    public writeReverse(buf: Buffer): Bw {
        const buf2 = Buffer.alloc(buf.length)
        for (let i = 0; i < buf2.length; i++) {
            buf2[i] = buf[buf.length - 1 - i]
        }
        this.bufs.push(buf2)
        return this
    }

    public writeUInt8(n: number): Bw {
        const buf = Buffer.alloc(1)
        buf.writeUInt8(n, 0)
        this.write(buf)
        return this
    }

    public writeInt8(n: number): Bw {
        const buf = Buffer.alloc(1)
        buf.writeInt8(n, 0)
        this.write(buf)
        return this
    }

    public writeUInt16BE(n: number): Bw {
        const buf = Buffer.alloc(2)
        buf.writeUInt16BE(n, 0)
        this.write(buf)
        return this
    }

    public writeInt16BE(n: number): Bw {
        const buf = Buffer.alloc(2)
        buf.writeInt16BE(n, 0)
        this.write(buf)
        return this
    }

    public writeUInt16LE(n: number): Bw {
        const buf = Buffer.alloc(2)
        buf.writeUInt16LE(n, 0)
        this.write(buf)
        return this
    }

    public writeInt16LE(n: number): Bw {
        const buf = Buffer.alloc(2)
        buf.writeInt16LE(n, 0)
        this.write(buf)
        return this
    }

    public writeUInt32BE(n: number): Bw {
        const buf = Buffer.alloc(4)
        buf.writeUInt32BE(n, 0)
        this.write(buf)
        return this
    }

    public writeInt32BE(n: number): Bw {
        const buf = Buffer.alloc(4)
        buf.writeInt32BE(n, 0)
        this.write(buf)
        return this
    }

    public writeUInt32LE(n: number): Bw {
        const buf = Buffer.alloc(4)
        buf.writeUInt32LE(n, 0)
        this.write(buf)
        return this
    }

    public writeInt32LE(n: number): Bw {
        const buf = Buffer.alloc(4)
        buf.writeInt32LE(n, 0)
        this.write(buf)
        return this
    }

    public writeUInt64BEBn(bn: Bn): Bw {
        const buf = bn.toBuffer({ size: 8 })
        this.write(buf)
        return this
    }

    public writeUInt64LEBn(bn: Bn): Bw {
        const buf = bn.toBuffer({ size: 8 })
        this.writeReverse(buf)
        return this
    }

    public writeVarIntNum(n: number): Bw {
        const buf = Bw.varIntBufNum(n)
        this.write(buf)
        return this
    }

    public writeVarIntBn(bn: Bn): Bw {
        const buf = Bw.varIntBufBn(bn)
        this.write(buf)
        return this
    }

    public static varIntBufNum(n: number): Buffer {
        let buf: Buffer
        if (n < 253) {
            buf = Buffer.alloc(1)
            buf.writeUInt8(n, 0)
        } else if (n < 0x10000) {
            buf = Buffer.alloc(1 + 2)
            buf.writeUInt8(253, 0)
            buf.writeUInt16LE(n, 1)
        } else if (n < 0x100000000) {
            buf = Buffer.alloc(1 + 4)
            buf.writeUInt8(254, 0)
            buf.writeUInt32LE(n, 1)
        } else {
            buf = Buffer.alloc(1 + 8)
            buf.writeUInt8(255, 0)
            buf.writeInt32LE(n & -1, 1)
            buf.writeUInt32LE(Math.floor(n / 0x100000000), 5)
        }
        return buf
    }

    public static varIntBufBn(bn: Bn): Buffer {
        let buf: Buffer
        const n = bn.toNumber()
        if (n < 253) {
            buf = Buffer.alloc(1)
            buf.writeUInt8(n, 0)
        } else if (n < 0x10000) {
            buf = Buffer.alloc(1 + 2)
            buf.writeUInt8(253, 0)
            buf.writeUInt16LE(n, 1)
        } else if (n < 0x100000000) {
            buf = Buffer.alloc(1 + 4)
            buf.writeUInt8(254, 0)
            buf.writeUInt32LE(n, 1)
        } else {
            const bw = new Bw()
            bw.writeUInt8(255)
            bw.writeUInt64LEBn(bn)
            buf = bw.toBuffer()
        }
        return buf
    }
}
