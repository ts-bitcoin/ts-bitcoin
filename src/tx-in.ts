/*
 * Transaction Input
 * =================
 *
 * An input to a transaction. The way you probably want to use this is through
 * the convenient method of new TxIn(txHashBuf, txOutNum, script, nSequence) (i.e., you
 * can leave out the scriptVi, which is computed automatically if you leave it
 * out.)
 */
import { Br } from './br'
import { Bw } from './bw'
import { OpCode } from './op-code'
import { PubKey } from './pub-key'
import { Script } from './script'
import { Struct } from './struct'
import { TxOut } from './tx-out'

export interface TxInSchema {
    txHashBuf: string
    txOutNum: number
    script: string
    nSequence: number
}

export class TxIn extends Struct {
    /* Interpret sequence numbers as relative lock-time constraints. */
    public static readonly LOCKTIME_VERIFY_SEQUENCE = 1 << 0

    /* Setting nSequence to this value for every input in a transaction disables
     * nLockTime. */
    public static readonly SEQUENCE_FINAL = 0xffffffff

    /* Below flags apply in the context of Bip 68 */
    /* If this flag set, txIn.nSequence is NOT interpreted as a relative lock-time.
     * */
    public static readonly SEQUENCE_LOCKTIME_DISABLE_FLAG = 1 << 31

    /* If txIn.nSequence encodes a relative lock-time and this flag is set, the
     * relative lock-time has units of 512 seconds, otherwise it specifies blocks
     * with a granularity of 1. */
    public static readonly SEQUENCE_LOCKTIME_TYPE_FLAG = 1 << 22

    /* If txIn.nSequence encodes a relative lock-time, this mask is applied to
     * extract that lock-time from the sequence field. */
    public static readonly SEQUENCE_LOCKTIME_MASK = 0x0000ffff

    /* In order to use the same number of bits to encode roughly the same
     * wall-clock duration, and because blocks are naturally limited to occur
     * every 600s on average, the minimum granularity for time-based relative
     * lock-time is fixed at 512 seconds.  Converting from CTxIn::nSequence to
     * seconds is performed by multiplying by 512 = 2^9, or equivalently
     * shifting up by 9 bits. */
    public static readonly SEQUENCE_LOCKTIME_GRANULARITY = 9

    public txHashBuf = Buffer.alloc(32, 0x00)
    public txOutNum = 0xffffffff
    public script = new Script()
    public nSequence = 0xffffffff

    constructor(
        data: {
            txHashBuf?: Buffer
            txOutNum?: number
            script?: Script
            nSequence?: number
        } = {}
    ) {
        super()
        if (data.txHashBuf !== undefined) {
            this.txHashBuf = data.txHashBuf
        }
        if (data.txOutNum !== undefined) {
            this.txOutNum = data.txOutNum
        }
        if (data.script !== undefined) {
            this.setScript(data.script)
        }
        if (data.nSequence !== undefined) {
            this.nSequence = data.nSequence
        }
    }

    public static fromBr(br: Br): TxIn {
        const txHashBuf = br.read(32)
        const txOutNum = br.readUInt32LE()
        const scriptLength = br.readVarIntNum()
        const script = Script.fromBuffer(br.read(scriptLength))
        const nSequence = br.readUInt32LE()
        return new this({ txHashBuf, txOutNum, script, nSequence })
    }

    public toBw(bw?: Bw): Bw {
        if (!bw) {
            bw = new Bw()
        }
        bw.write(this.txHashBuf)
        bw.writeUInt32LE(this.txOutNum)
        const scriptBuf = this.script.toBuffer()
        bw.writeVarIntNum(scriptBuf.length)
        bw.write(scriptBuf)
        bw.writeUInt32LE(this.nSequence)
        return bw
    }

    public static fromJSON(json: Partial<TxInSchema>): TxIn {
        return new this({
            txHashBuf: json.txHashBuf !== undefined ? Buffer.from(json.txHashBuf, 'hex') : undefined,
            txOutNum: json.txOutNum,
            script: json.script !== undefined ? Script.fromJSON(json.script) : undefined,
            nSequence: json.nSequence,
        })
    }

    public toJSON(): TxInSchema {
        return {
            txHashBuf: this.txHashBuf.toString('hex'),
            txOutNum: this.txOutNum,
            script: this.script.toJSON(),
            nSequence: this.nSequence,
        }
    }

    /**
     * Generate txIn with blank signatures from a txOut and its
     * txHashBuf+txOutNum. A "blank" signature is just an OP_0. The pubKey also
     * defaults to blank but can be substituted with the real public key if you
     * know what it is.
     */
    public static fromPubKeyHashTxOut(txHashBuf: Buffer, txOutNum: number, txOut: TxOut, pubKey: PubKey): TxIn {
        const script = new Script()
        if (txOut.script.isPubKeyHashOut()) {
            script.writeOpCode(OpCode.OP_0) // blank signature
            if (pubKey) {
                script.writeBuffer(pubKey.toBuffer())
            } else {
                script.writeOpCode(OpCode.OP_0)
            }
        } else {
            throw new Error('txOut must be of type pubKeyHash')
        }
        return new this({
            txHashBuf,
            txOutNum,
            script,
        })
    }

    public hasNullInput(): boolean {
        const hex = this.txHashBuf.toString('hex')
        if (
            hex === '0000000000000000000000000000000000000000000000000000000000000000' &&
            this.txOutNum === 0xffffffff
        ) {
            return true
        }
        return false
    }

    /**
     * Analagous to bitcoind's SetNull in COutPoint
     */
    public setNullInput(): void {
        this.txHashBuf = Buffer.alloc(32, 0x00)
        this.txOutNum = 0xffffffff // -1 cast to unsigned int
    }

    public setScript(value: Script): this {
        this.script = value
        return this
    }

    public setSequence(value: number): this {
        if (value >>> 0 !== value) {
            throw new Error('Sequence must be a uint32')
        }
        this.nSequence = value
        return this
    }
}
