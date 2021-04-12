/**
 * Transaction Output
 * ==================
 *
 * An output to a transaction. The way you normally want to make one is with
 * new TxOut(valueBn, script) (i.e., just as with TxIn, you can leave out the
 * scriptVi, since it can be computed automatically.
 */
import { Bn } from './bn'
import { Br } from './br'
import { Bw } from './bw'
import { Script } from './script'
import { Struct } from './struct'

export interface TxOutSchema {
    valueBn: string
    script: string
}

export class TxOut extends Struct implements Record<keyof TxOutSchema, unknown> {
    public valueBn: Bn = new Bn(0)
    public script: Script = new Script()

    constructor(data: { valueBn?: Bn; script?: Script } = {}) {
        super()
        if (data.valueBn !== undefined) {
            this.setValue(data.valueBn)
        }
        if (data.script !== undefined) {
            this.setScript(data.script)
        }
    }

    public static fromBr(br: Br): TxOut {
        const valueBn = br.readUInt64LEBn()
        const scriptLength = br.readVarIntNum()
        const script = new Script().fromBuffer(br.read(scriptLength))
        return new this({ valueBn, script })
    }

    public toBw(bw?: Bw): Bw {
        if (!bw) {
            bw = new Bw()
        }
        bw.writeUInt64LEBn(this.valueBn)
        const scriptBuf = this.script.toBuffer()
        bw.writeVarIntNum(scriptBuf.length)
        bw.write(scriptBuf)
        return bw
    }

    public static fromJSON(json: TxOutSchema): TxOut {
        return new this({
            valueBn: new Bn().fromJSON(json.valueBn),
            script: new Script().fromJSON(json.script),
        })
    }

    public toJSON(): TxOutSchema {
        return {
            valueBn: this.valueBn.toJSON(),
            script: this.script.toJSON(),
        }
    }

    public setValue(value: Bn): this {
        this.valueBn = value
        return this
    }

    public setScript(value: Script): this {
        this.script = value
        return this
    }
}
