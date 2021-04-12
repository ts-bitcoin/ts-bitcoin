/**
 * Transaction
 * ===========
 *
 * A bitcoin transaction.
 */
import { Bn } from './bn'
import { Br } from './br'
import { Bw } from './bw'
import { Ecdsa } from './ecdsa'
import { Hash } from './hash'
import { HashCache } from './hash-cache'
import { KeyPair } from './key-pair'
import { PubKey } from './pub-key'
import { Script } from './script'
import { Sig } from './sig'
import { Struct } from './struct'
import { TxIn, TxInLike } from './tx-in'
import { TxOut, TxOutSchema } from './tx-out'
import { VarInt } from './var-int'
import { Workers } from './workers'

export interface TxSchema {
    versionBytesNum: number
    txIns: TxInLike[]
    txOuts: TxOutSchema[]
    nLockTime: number
}

export class Tx extends Struct implements Record<keyof TxSchema, unknown> {
    /**
     * Max bitcoin supply.
     */
    public static readonly MAX_MONEY = 21000000 * 1e8

    /**
     * This is defined on Interp, but Tx cannot depend on Interp - must redefine here.
     */
    public static readonly SCRIPT_ENABLE_SIGHASH_FORKID = 1 << 16

    /**
     * Version number.
     */
    public versionBytesNum = 1

    /**
     * Transaction inputs.
     */
    public txIns: TxIn[] = []

    /**
     * Transaction outputs.
     */
    public txOuts: TxOut[] = []

    /**
     * Lock time.
     */
    public nLockTime = 0

    constructor(
        data: {
            versionBytesNum?: number
            txInsVi?: VarInt
            txIns?: TxIn[]
            txOutsVi?: VarInt
            txOuts?: TxOut[]
            nLockTime?: number
        } = {}
    ) {
        super()
        if (data.versionBytesNum !== undefined) {
            this.setVersion(data.versionBytesNum)
        }
        if (data.txIns !== undefined) {
            for (const txIn of data.txIns) {
                this.addTxIn(txIn)
            }
        }
        if (data.txOuts !== undefined) {
            for (const txOut of data.txOuts) {
                this.addTxOut(txOut)
            }
        }
        if (data.nLockTime !== undefined) {
            this.setLocktime(data.nLockTime)
        }
    }

    public static fromBr(br: Br): Tx {
        const versionBytesNum = br.readUInt32LE()

        const txInsNum = br.readVarIntNum()
        const txIns: TxIn[] = []
        for (let i = 0; i < txInsNum; i++) {
            txIns.push(TxIn.fromBr(br))
        }

        const txOutsNum = br.readVarIntNum()
        const txOuts: TxOut[] = []
        for (let i = 0; i < txOutsNum; i++) {
            txOuts.push(TxOut.fromBr(br))
        }

        const nLockTime = br.readUInt32LE()
        return new this({ versionBytesNum, txIns, txOuts, nLockTime })
    }

    public toBw(bw?: Bw): Bw {
        if (!bw) {
            bw = new Bw()
        }
        bw.writeUInt32LE(this.versionBytesNum)
        bw.writeVarIntNum(this.txIns.length)
        for (let i = 0; i < this.txIns.length; i++) {
            this.txIns[i].toBw(bw)
        }
        bw.writeVarIntNum(this.txOuts.length)
        for (let i = 0; i < this.txOuts.length; i++) {
            this.txOuts[i].toBw(bw)
        }
        bw.writeUInt32LE(this.nLockTime)
        return bw
    }

    public static fromJSON(json: TxSchema): Tx {
        const txIns: TxIn[] = []
        for (const txIn of json.txIns) {
            txIns.push(new TxIn().fromJSON(txIn))
        }
        const txOuts: TxOut[] = []
        for (const txOut of json.txOuts) {
            txOuts.push(TxOut.fromJSON(txOut))
        }
        return new this({
            versionBytesNum: json.versionBytesNum,
            txIns,
            txOuts,
            nLockTime: json.nLockTime,
        })
    }

    public toJSON(): TxSchema {
        return {
            versionBytesNum: this.versionBytesNum,
            txIns: this.txIns.map((txIn) => txIn.toJSON()),
            txOuts: this.txOuts.map((txOut) => txOut.toJSON()),
            nLockTime: this.nLockTime,
        }
    }

    // https://github.com/Bitcoin-UAHF/spec/blob/master/replay-protected-sighash.md
    public hashPrevouts(): Buffer {
        const bw = new Bw()
        for (const i in this.txIns) {
            const txIn = this.txIns[i]
            bw.write(txIn.txHashBuf) // outpoint (1/2)
            bw.writeUInt32LE(txIn.txOutNum) // outpoint (2/2)
        }
        return Hash.sha256Sha256(bw.toBuffer())
    }

    public hashSequence(): Buffer {
        const bw = new Bw()
        for (const i in this.txIns) {
            const txIn = this.txIns[i]
            bw.writeUInt32LE(txIn.nSequence)
        }
        return Hash.sha256Sha256(bw.toBuffer())
    }

    public hashOutputs(): Buffer {
        const bw = new Bw()
        for (const i in this.txOuts) {
            const txOut = this.txOuts[i]
            bw.write(txOut.toBuffer())
        }
        return Hash.sha256Sha256(bw.toBuffer())
    }

    /**
     * For a normal transaction, subScript is usually the scriptPubKey. For a
     * p2sh transaction, subScript is usually the redeemScript. If you're not
     * normal because you're using OP_CODESEPARATORs, you know what to do.
     */
    public sighash(
        nHashType: number,
        nIn: number,
        subScript: Script,
        valueBn?: Bn,
        flags = 0,
        hashCache = new HashCache()
    ): Buffer {
        // start with UAHF part (Bitcoin SV)
        // https://github.com/Bitcoin-UAHF/spec/blob/master/replay-protected-sighash.md
        if (nHashType & Sig.SIGHASH_FORKID && flags & Tx.SCRIPT_ENABLE_SIGHASH_FORKID) {
            let hashPrevouts = Buffer.alloc(32, 0)
            let hashSequence = Buffer.alloc(32, 0)
            let hashOutputs = Buffer.alloc(32, 0)

            if (!(nHashType & Sig.SIGHASH_ANYONECANPAY)) {
                hashPrevouts = hashCache.prevoutsHashBuf
                    ? hashCache.prevoutsHashBuf
                    : (hashCache.prevoutsHashBuf = this.hashPrevouts())
            }

            if (
                !(nHashType & Sig.SIGHASH_ANYONECANPAY) &&
                (nHashType & 0x1f) !== Sig.SIGHASH_SINGLE &&
                (nHashType & 0x1f) !== Sig.SIGHASH_NONE
            ) {
                hashSequence = hashCache.sequenceHashBuf
                    ? hashCache.sequenceHashBuf
                    : (hashCache.sequenceHashBuf = this.hashSequence())
            }

            if ((nHashType & 0x1f) !== Sig.SIGHASH_SINGLE && (nHashType & 0x1f) !== Sig.SIGHASH_NONE) {
                hashOutputs = hashCache.outputsHashBuf
                    ? hashCache.outputsHashBuf
                    : (hashCache.outputsHashBuf = this.hashOutputs())
            } else if ((nHashType & 0x1f) === Sig.SIGHASH_SINGLE && nIn < this.txOuts.length) {
                hashOutputs = Hash.sha256Sha256(this.txOuts[nIn].toBuffer())
            }

            const bw = new Bw()
            bw.writeUInt32LE(this.versionBytesNum)
            bw.write(hashPrevouts)
            bw.write(hashSequence)
            bw.write(this.txIns[nIn].txHashBuf) // outpoint (1/2)
            bw.writeUInt32LE(this.txIns[nIn].txOutNum) // outpoint (2/2)
            bw.writeVarIntNum(subScript.toBuffer().length)
            bw.write(subScript.toBuffer())
            bw.writeUInt64LEBn(valueBn)
            bw.writeUInt32LE(this.txIns[nIn].nSequence)
            bw.write(hashOutputs)
            bw.writeUInt32LE(this.nLockTime)
            bw.writeUInt32LE(nHashType >>> 0)

            return new Br(Hash.sha256Sha256(bw.toBuffer())).readReverse()
        }

        // original bitcoin code follows - not related to UAHF (Bitcoin SV)
        const txcopy: Tx = this.clone()

        subScript = new Script().fromBuffer(subScript.toBuffer())
        subScript.removeCodeseparators()

        for (let i = 0; i < txcopy.txIns.length; i++) {
            txcopy.txIns[i] = TxIn.fromBuffer(txcopy.txIns[i].toBuffer()).setScript(new Script())
        }

        txcopy.txIns[nIn] = TxIn.fromBuffer(txcopy.txIns[nIn].toBuffer()).setScript(subScript)

        if ((nHashType & 31) === Sig.SIGHASH_NONE) {
            txcopy.txOuts.length = 0

            for (let i = 0; i < txcopy.txIns.length; i++) {
                if (i !== nIn) {
                    txcopy.txIns[i].nSequence = 0
                }
            }
        } else if ((nHashType & 31) === Sig.SIGHASH_SINGLE) {
            // The SIGHASH_SINGLE bug.
            // https://bitcointalk.org/index.php?topic=260595.0
            if (nIn > txcopy.txOuts.length - 1) {
                return Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex')
            }

            txcopy.txOuts.length = nIn + 1

            for (let i = 0; i < txcopy.txOuts.length; i++) {
                if (i < nIn) {
                    txcopy.txOuts[i] = new TxOut({
                        valueBn: new Bn().fromBuffer(Buffer.from('ffffffffffffffff', 'hex')),
                        script: new Script(),
                    })
                }
            }

            for (let i = 0; i < txcopy.txIns.length; i++) {
                if (i !== nIn) {
                    txcopy.txIns[i].nSequence = 0
                }
            }
        }
        // else, SIGHASH_ALL

        if (nHashType & Sig.SIGHASH_ANYONECANPAY) {
            txcopy.txIns[0] = txcopy.txIns[nIn]
            txcopy.txIns.length = 1
        }

        const buf = new Bw().write(txcopy.toBuffer()).writeInt32LE(nHashType).toBuffer()
        return new Br(Hash.sha256Sha256(buf)).readReverse()
    }

    public async asyncSighash(
        nHashType: number,
        nIn: number,
        subScript: Script,
        valueBn?: Bn,
        flags = 0,
        hashCache?: HashCache
    ): Promise<Buffer> {
        const workersResult = await Workers.asyncObjectMethod(this, 'sighash', [
            nHashType,
            nIn,
            subScript,
            valueBn,
            flags,
            hashCache,
        ])
        return workersResult.resbuf
    }

    // This function returns a signature but does not update any inputs
    public sign(
        keyPair: KeyPair,
        nHashType = Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID,
        nIn: number,
        subScript: Script,
        valueBn?: Bn,
        flags = Tx.SCRIPT_ENABLE_SIGHASH_FORKID,
        hashCache?: HashCache
    ): Sig {
        const hashBuf = this.sighash(nHashType, nIn, subScript, valueBn, flags, hashCache)
        const sig = Ecdsa.sign(hashBuf, keyPair, 'little').fromObject({
            nHashType,
        })
        return sig
    }

    public async asyncSign(
        keyPair: KeyPair,
        nHashType = Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID,
        nIn: number,
        subScript: Script,
        valueBn?: Bn,
        flags = Tx.SCRIPT_ENABLE_SIGHASH_FORKID,
        hashCache?: HashCache
    ): Promise<Sig> {
        const workersResult = await Workers.asyncObjectMethod(this, 'sign', [
            keyPair,
            nHashType,
            nIn,
            subScript,
            valueBn,
            flags,
            hashCache,
        ])
        return new Sig().fromFastBuffer(workersResult.resbuf)
    }

    // This function takes a signature as input and does not parse any inputs
    public verify(
        sig: Sig,
        pubKey: PubKey,
        nIn: number,
        subScript: Script,
        enforceLowS = false,
        valueBn?: Bn,
        flags = Tx.SCRIPT_ENABLE_SIGHASH_FORKID,
        hashCache?: HashCache
    ): boolean {
        const hashBuf = this.sighash(sig.nHashType, nIn, subScript, valueBn, flags, hashCache)
        return Ecdsa.verify(hashBuf, sig, pubKey, 'little', enforceLowS)
    }

    public async asyncVerify(
        sig: Sig,
        pubKey: PubKey,
        nIn: number,
        subScript: Script,
        enforceLowS = false,
        valueBn?: Bn,
        flags = Tx.SCRIPT_ENABLE_SIGHASH_FORKID,
        hashCache?: HashCache
    ): Promise<boolean> {
        const workersResult = await Workers.asyncObjectMethod(this, 'verify', [
            sig,
            pubKey,
            nIn,
            subScript,
            enforceLowS,
            valueBn,
            flags,
            hashCache,
        ])
        return JSON.parse(workersResult.resbuf.toString())
    }

    public hash(): Buffer {
        return Hash.sha256Sha256(this.toBuffer())
    }

    public async asyncHash(): Promise<Buffer> {
        const workersResult = await Workers.asyncObjectMethod(this, 'hash', [])
        return workersResult.resbuf
    }

    public id(): string {
        return new Br(this.hash()).readReverse().toString('hex')
    }

    public async asyncId(): Promise<string> {
        const workersResult = await Workers.asyncObjectMethod(this, 'id', [])
        return JSON.parse(workersResult.resbuf.toString())
    }

    public addTxIn(txHashBuf: TxIn): this
    public addTxIn(txHashBuf: Buffer, txOutNum: number, script: Script, nSequence: number): this
    public addTxIn(txHashBuf: Buffer | TxIn, txOutNum?: number, script?: Script, nSequence?: number): this {
        let txIn: TxIn
        if (txHashBuf instanceof TxIn) {
            txIn = txHashBuf
        } else {
            txIn = new TxIn().fromObject({ txHashBuf, txOutNum, nSequence }).setScript(script)
        }
        this.txIns.push(txIn)
        return this
    }

    public addTxOut(valueBn: TxOut): this
    public addTxOut(valueBn: Bn, script: Script): this
    public addTxOut(valueBn: Bn | TxOut, script?: Script): this {
        let txOut: TxOut
        if (valueBn instanceof TxOut) {
            txOut = valueBn
        } else {
            txOut = new TxOut({ valueBn }).setScript(script)
        }
        this.txOuts.push(txOut)
        return this
    }

    /**
     * Analagous to bitcoind's IsCoinBase function in transaction.h
     */
    public isCoinbase(): boolean {
        return this.txIns.length === 1 && this.txIns[0].hasNullInput()
    }

    /**
     * BIP 69 sorting. Be sure to sign after sorting.
     */
    public sort(): this {
        this.txIns.sort((first, second) => {
            return (
                new Br(first.txHashBuf).readReverse().compare(new Br(second.txHashBuf).readReverse()) ||
                first.txOutNum - second.txOutNum
            )
        })

        this.txOuts.sort((first, second) => {
            return (
                first.valueBn.sub(second.valueBn).toNumber() ||
                first.script.toBuffer().compare(second.script.toBuffer())
            )
        })

        return this
    }

    /**
     * Set transaction version number.
     */
    public setVersion(value: number): this {
        if (value >>> 0 !== value) {
            throw new Error('Version must be a uint32')
        }
        this.versionBytesNum = value
        return this
    }

    /**
     * Set transaction locktime.
     */
    public setLocktime(value: number): this {
        if (value >>> 0 !== value) {
            throw new Error('Locktime must be a uint32')
        }
        this.nLockTime = value
        return this
    }
}
