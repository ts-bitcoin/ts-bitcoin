/**
 * Merkle
 * ======
 *
 * A node in a Merkle tree (possibly the root node, in which case it is the
 * Merkle root). A node either contains a buffer or links to two other nodes.
 */
import { Hash } from './hash'
import { StructLegacy } from './struct-legacy'

export class Merkle extends StructLegacy {
    public hashBuf: Buffer
    public buf: Buffer
    public merkle1: Merkle
    public merkle2: Merkle

    constructor(hashBuf?: Buffer, buf?: Buffer, merkle1?: Merkle, merkle2?: Merkle) {
        super({ hashBuf, buf, merkle1, merkle2 })
    }

    public hash(): Buffer {
        if (this.hashBuf) {
            return this.hashBuf
        }
        if (this.buf) {
            return Hash.sha256Sha256(this.buf)
        }
        const hashBuf1 = this.merkle1.hash()
        const hashBuf2 = this.merkle2.hash()
        this.buf = Buffer.concat([hashBuf1, hashBuf2])
        return Hash.sha256Sha256(this.buf)
    }

    public fromBuffers(bufs: Buffer[]): this {
        if (bufs.length < 1) {
            throw new Error('buffers must have a length')
        }
        bufs = bufs.slice()
        const log = Math.log2(bufs.length)
        if (!Number.isInteger(log)) {
            // If a merkle tree does not have a number of ends that is a power of 2,
            // then we have to copy the last value until it is a power of 2. Note
            // that we copy *the actual object* over and over again, which ensures
            // that when we finds its hash, the hash is cached.
            const lastval = bufs[bufs.length - 1]
            const len = Math.pow(2, Math.ceil(log))
            for (let i = bufs.length; i < len; i++) {
                bufs.push(lastval)
            }
        }
        const bufs1 = bufs.slice(0, bufs.length / 2)
        const bufs2 = bufs.slice(bufs.length / 2)
        this.fromBufferArrays(bufs1, bufs2)
        return this
    }

    public static fromBuffers(bufs: Buffer[]): Merkle {
        return new this().fromBuffers(bufs)
    }

    /**
     * Takes two arrays, both of which *must* be of a length that is a power of
     * two.
     */
    public fromBufferArrays(bufs1: Buffer[], bufs2: Buffer[]): this {
        if (bufs1.length === 1) {
            this.merkle1 = new Merkle(undefined, bufs1[0])
            this.merkle2 = new Merkle(undefined, bufs2[0])
            return this
        }
        const bufs11 = bufs1.slice(0, bufs1.length / 2)
        const bufs12 = bufs1.slice(bufs1.length / 2)
        this.merkle1 = new Merkle().fromBufferArrays(bufs11, bufs12)
        const bufs21 = bufs2.slice(0, bufs2.length / 2)
        const bufs22 = bufs2.slice(bufs2.length / 2)
        this.merkle2 = new Merkle().fromBufferArrays(bufs21, bufs22)
        return this
    }

    public static fromBufferArrays(bufs1: Buffer[], bufs2: Buffer[]): Merkle {
        return new this().fromBufferArrays(bufs1, bufs2)
    }

    public leavesNum(): number {
        if (this.merkle1) {
            return this.merkle1.leavesNum() + this.merkle2.leavesNum()
        }
        if (this.buf) {
            return 1
        }
        throw new Error('invalid number of leaves')
    }
}
