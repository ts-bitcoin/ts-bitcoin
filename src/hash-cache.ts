/**
 * Hash Cache
 * ==========
 *
 * For use in sighash.
 */
import { Struct } from './struct'

export class HashCache extends Struct {
    public prevoutsHashBuf: Buffer
    public sequenceHashBuf: Buffer
    public outputsHashBuf: Buffer

    constructor(prevoutsHashBuf?: Buffer, sequenceHashBuf?: Buffer, outputsHashBuf?: Buffer) {
        super()
        this.fromObject({ prevoutsHashBuf, sequenceHashBuf, outputsHashBuf })
    }

    public fromBuffer(buf: Buffer): this {
        return this.fromJSON(JSON.parse(buf.toString()))
    }

    public toBuffer(): Buffer {
        return Buffer.from(JSON.stringify(this.toJSON()))
    }

    public fromJSON(json: { prevoutsHashBuf?: string; sequenceHashBuf?: string; outputsHashBuf?: string }): this {
        this.prevoutsHashBuf = json.prevoutsHashBuf ? Buffer.from(json.prevoutsHashBuf, 'hex') : undefined
        this.sequenceHashBuf = json.sequenceHashBuf ? Buffer.from(json.sequenceHashBuf, 'hex') : undefined
        this.outputsHashBuf = json.outputsHashBuf ? Buffer.from(json.outputsHashBuf, 'hex') : undefined
        return this
    }

    public toJSON() {
        return {
            prevoutsHashBuf: this.prevoutsHashBuf ? this.prevoutsHashBuf.toString('hex') : undefined,
            sequenceHashBuf: this.sequenceHashBuf ? this.sequenceHashBuf.toString('hex') : undefined,
            outputsHashBuf: this.outputsHashBuf ? this.outputsHashBuf.toString('hex') : undefined,
        }
    }
}
