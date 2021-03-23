/**
 * Transaction Output Map
 * ======================
 *
 * A map from a transaction hash and output number to that particular output.
 * Note that the map is from the transaction *hash*, which is the value that
 * occurs in the blockchain, not the id, which is the reverse of the hash. The
 * TxOutMap is necessary when signing a transction to get the script and value
 * of that output which is plugged into the sighash algorithm.
 */
import { Struct } from './struct'
import { Tx } from './tx'
import { TxOut } from './tx-out'

type TxOutMapLike = { [label: string]: string }

export class TxOutMap extends Struct {
    public map: Map<string, TxOut>

    constructor(map: Map<string, TxOut> = new Map()) {
        super({ map })
    }

    public toJSON(): TxOutMapLike {
        const json = {}
        this.map.forEach((txOut, label) => {
            json[label] = txOut.toHex()
        })
        return json
    }

    public fromJSON(json: TxOutMapLike): this {
        Object.keys(json).forEach((label) => {
            this.map.set(label, TxOut.fromHex(json[label]))
        })
        return this
    }

    public set(txHashBuf: Buffer, txOutNum: number, txOut: TxOut): this {
        const label = txHashBuf.toString('hex') + ':' + txOutNum
        this.map.set(label, txOut)
        return this
    }

    public get(txHashBuf: Buffer, txOutNum: number): TxOut {
        const label = txHashBuf.toString('hex') + ':' + txOutNum
        return this.map.get(label)
    }

    public setTx(tx: Tx): this {
        const txhashhex = tx.hash().toString('hex')
        tx.txOuts.forEach((txOut, index) => {
            const label = txhashhex + ':' + index
            this.map.set(label, txOut)
        })
        return this
    }
}
