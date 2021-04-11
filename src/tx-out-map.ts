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
import { StructLegacy } from './struct-legacy'
import { Tx } from './tx'
import { TxOut } from './tx-out'

export interface TxOutMapLike {
    [label: string]: string
}

export class TxOutMap extends StructLegacy {
    public map: Map<string, TxOut>

    constructor(map: Map<string, TxOut> = new Map()) {
        super({ map })
    }

    public toJSON(): TxOutMapLike {
        const json = {}
        for (const [label, txOut] of this.map.entries()) {
            json[label] = txOut.toHex()
        }
        return json
    }

    public fromJSON(json: TxOutMapLike): this {
        for (const label of Object.keys(json)) {
            this.map.set(label, TxOut.fromHex(json[label]))
        }
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
        for (const [index, txOut] of tx.txOuts.entries()) {
            const label = txhashhex + ':' + index
            this.map.set(label, txOut)
        }
        return this
    }
}
