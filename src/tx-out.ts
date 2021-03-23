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
import { VarInt } from './var-int'

export interface TxOutLike {
    valueBn: string
    scriptVi: string
    script: string
}

export class TxOut extends Struct {
    public valueBn: Bn
    public scriptVi: VarInt
    public script: Script

    constructor(valueBn?: Bn, scriptVi?: VarInt, script?: Script) {
        super({ valueBn, scriptVi, script })
    }

    public setScript(script: Script): this {
        this.scriptVi = VarInt.fromNumber(script.toBuffer().length)
        this.script = script
        return this
    }

    public fromProperties(valueBn: Bn, script: Script): this {
        this.fromObject({ valueBn })
        this.setScript(script)
        return this
    }

    public static fromProperties(valueBn: Bn, script: Script): TxOut {
        return new this().fromProperties(valueBn, script)
    }

    public fromJSON(json: TxOutLike): this {
        this.fromObject({
            valueBn: new Bn().fromJSON(json.valueBn),
            scriptVi: new VarInt().fromJSON(json.scriptVi),
            script: new Script().fromJSON(json.script),
        })
        return this
    }

    public toJSON(): TxOutLike {
        return {
            valueBn: this.valueBn.toJSON(),
            scriptVi: this.scriptVi.toJSON(),
            script: this.script.toJSON(),
        }
    }

    public fromBr(br: Br): this {
        this.valueBn = br.readUInt64LEBn()
        this.scriptVi = VarInt.fromNumber(br.readVarIntNum())
        this.script = new Script().fromBuffer(br.read(this.scriptVi.toNumber()))
        return this
    }

    public toBw(bw?: Bw): Bw {
        if (!bw) {
            bw = new Bw()
        }
        bw.writeUInt64LEBn(this.valueBn)
        bw.write(this.scriptVi.buf)
        bw.write(this.script.toBuffer())
        return bw
    }
}
