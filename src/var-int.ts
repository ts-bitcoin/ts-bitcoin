/**
 * VarInt (a.k.a. Compact Size)
 * ============================
 *
 * A varInt is a varible sized integer, and it is a format that is unique to
 * bitcoin, and used throughout bitcoin to represent the length of binary data
 * in a compact format that can take up as little as 1 byte or as much as 9
 * bytes.
 */
import { Bn } from './bn'
import { Br } from './br'
import { Bw } from './bw'
import { StructLegacy } from './struct-legacy'

export class VarInt extends StructLegacy {
    public buf: Buffer

    constructor(buf?: Buffer) {
        super({ buf })
    }

    public fromJSON(json: string): this {
        this.fromObject({
            buf: Buffer.from(json, 'hex'),
        })
        return this
    }

    public toJSON(): string {
        return this.buf.toString('hex')
    }

    public fromBuffer(buf: Buffer): this {
        this.buf = buf
        return this
    }

    public fromBr(br: Br): this {
        this.buf = br.readVarIntBuf()
        return this
    }

    public fromBn(bn: Bn): this {
        this.buf = new Bw().writeVarIntBn(bn).toBuffer()
        return this
    }

    public static fromBn(bn: Bn): VarInt {
        return new this().fromBn(bn)
    }

    public fromNumber(num: number): this {
        this.buf = new Bw().writeVarIntNum(num).toBuffer()
        return this
    }

    public static fromNumber(num: number): VarInt {
        return new this().fromNumber(num)
    }

    public toBuffer(): Buffer {
        return this.buf
    }

    public toBn(): Bn {
        return new Br(this.buf).readVarIntBn()
    }

    public toNumber(): number {
        return new Br(this.buf).readVarIntNum()
    }
}
