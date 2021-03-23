/**
 * WorkersResult
 * =============
 *
 * A response sent back from a worker to the main thread. Contains the "result"
 * of the computation in the form of a buffer, resbuf. If the actual result is
 * an object with a .toFastBuffer method, the object is converted to a buffer
 * using that method. Otherwise it is JSON serialized into a buffer. The result
 * can also be an error, in which case the isError flag is set.
 */
import { Br } from './br'
import { Bw } from './bw'
import { Struct } from './struct'

export class WorkersResult extends Struct {
    public resbuf: Buffer
    public isError: boolean
    public id: number

    constructor(resbuf?: Buffer, isError?: boolean, id?: number) {
        super({ resbuf, isError, id })
    }

    public fromResult(result: Buffer | Struct | string, id: number): this {
        if (Buffer.isBuffer(result)) {
            this.resbuf = result
        } else if ((result as any).toFastBuffer) {
            this.resbuf = (result as any).toFastBuffer()
        } else {
            this.resbuf = Buffer.from(JSON.stringify(result))
        }
        this.isError = false
        this.id = id
        return this
    }

    public static fromResult(result: Buffer | Struct | string, id: number): WorkersResult {
        return new this().fromResult(result, id)
    }

    public fromError(error: any, id: number): this {
        this.resbuf = Buffer.from(JSON.stringify(error.message))
        this.isError = true
        this.id = id
        return this
    }

    public toBw(bw?: Bw): Bw {
        if (!bw) {
            bw = new Bw()
        }
        bw.writeVarIntNum(this.resbuf.length)
        bw.write(this.resbuf)
        bw.writeUInt8(Number(this.isError))
        bw.writeVarIntNum(this.id)
        return bw
    }

    public fromBr(br: Br): this {
        const resbuflen = br.readVarIntNum()
        this.resbuf = br.read(resbuflen)
        this.isError = Boolean(br.readUInt8())
        this.id = br.readVarIntNum()
        return this
    }
}
