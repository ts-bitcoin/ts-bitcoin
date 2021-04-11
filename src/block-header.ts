/**
 * Block Header
 * ============
 *
 * Every block contains a blockHeader. This is probably not something you will
 * personally use, but it's here if you need it.
 */
import { Br } from './br'
import { Bw } from './bw'
import { StructLegacy } from './struct-legacy'

export interface BlockHeaderLike {
    versionBytesNum: number
    prevBlockHashBuf: string
    merkleRootBuf: string
    time: number
    bits: number
    nonce: number
}

export class BlockHeader extends StructLegacy {
    public versionBytesNum: number
    public prevBlockHashBuf: Buffer
    public merkleRootBuf: Buffer
    public time: number
    public bits: number
    public nonce: number

    constructor(
        versionBytesNum?: number,
        prevBlockHashBuf?: Buffer,
        merkleRootBuf?: Buffer,
        time?: number,
        bits?: number,
        nonce?: number
    ) {
        super({
            versionBytesNum,
            prevBlockHashBuf,
            merkleRootBuf,
            time,
            bits,
            nonce,
        })
    }

    public fromJSON(json: BlockHeaderLike): this {
        this.fromObject({
            versionBytesNum: json.versionBytesNum,
            prevBlockHashBuf: Buffer.from(json.prevBlockHashBuf, 'hex'),
            merkleRootBuf: Buffer.from(json.merkleRootBuf, 'hex'),
            time: json.time,
            bits: json.bits,
            nonce: json.nonce,
        })
        return this
    }

    public toJSON(): BlockHeaderLike {
        return {
            versionBytesNum: this.versionBytesNum,
            prevBlockHashBuf: this.prevBlockHashBuf.toString('hex'),
            merkleRootBuf: this.merkleRootBuf.toString('hex'),
            time: this.time,
            bits: this.bits,
            nonce: this.nonce,
        }
    }

    public fromBr(br: Br): this {
        this.versionBytesNum = br.readUInt32LE()
        this.prevBlockHashBuf = br.read(32)
        this.merkleRootBuf = br.read(32)
        this.time = br.readUInt32LE()
        this.bits = br.readUInt32LE()
        this.nonce = br.readUInt32LE()
        return this
    }

    public toBw(bw?: Bw): Bw {
        if (!bw) {
            bw = new Bw()
        }
        bw.writeUInt32LE(this.versionBytesNum)
        bw.write(this.prevBlockHashBuf)
        bw.write(this.merkleRootBuf)
        bw.writeUInt32LE(this.time)
        bw.writeUInt32LE(this.bits)
        bw.writeUInt32LE(this.nonce)
        return bw
    }
}
