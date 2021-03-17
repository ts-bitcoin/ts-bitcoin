/**
 * Base58 Encoding
 * ===============
 *
 * Base58 (no check)
 */
import * as bs58 from 'bs58'
import { Struct } from './struct'

export class Base58 extends Struct {
    public buf: Buffer

    constructor(buf: Buffer) {
        super({ buf })
    }

    public fromHex(hex: string): this {
        return this.fromBuffer(Buffer.from(hex, 'hex'))
    }

    public toHex(): string {
        return this.toBuffer().toString('hex')
    }

    public static encode(buf: Buffer): string {
        if (!Buffer.isBuffer(buf)) {
            throw new Error('Input should be a buffer')
        }
        return bs58.encode(buf)
    }

    public static decode(str: string): Buffer {
        if (typeof str !== 'string') {
            throw new Error('Input should be a string')
        }
        return Buffer.from(bs58.decode(str))
    }

    public fromBuffer(buf: Buffer): this {
        this.buf = buf
        return this
    }

    public fromString(str: string): this {
        const buf = Base58.decode(str)
        this.buf = buf
        return this
    }

    public toBuffer(): Buffer {
        return this.buf
    }

    public toString(): string {
        return Base58.encode(this.buf)
    }
}
