/**
 * PubKey Map
 * ==========
 *
 * A map from (transaction hash, output number) to (script chunk index, pubKey).
 * Whening signing a bitcoin transaction, we need to be able to sign an input
 * with the correct key and also we need to know where to put signature when we
 * get it. This mapping allows us to find the key for an associated input (which
 * is identified by tx output hash and number) with which to sign the
 * transaction and then also to know where to insert the signature into the
 * input script. This gets us the public key, and we need a different method to
 * get the private key. That is because we often know the public key to be used
 * but may not have access to the private key until the entire tx is sent to
 * where the private keys are.
 */
import { Struct } from './struct'
import { Sig } from './sig'

interface SigOperationsMapItem {
    nScriptChunk: number
    type: 'sig' | 'pubKey'
    addressStr: string
    nHashType: number
    log?: any
}

export class SigOperations extends Struct {
    public map: Map<string, SigOperationsMapItem[]>

    constructor(map: Map<string, SigOperationsMapItem[]> = new Map()) {
        super({ map })
    }

    public toJSON(): { [label: string]: SigOperationsMapItem[] } {
        const json = {}
        this.map.forEach((arr, label) => {
            json[label] = arr.map((obj) => ({
                nScriptChunk: obj.nScriptChunk,
                type: obj.type, // 'sig' or 'pubKey'
                addressStr: obj.addressStr,
                nHashType: obj.nHashType,
                log: obj.log,
            }))
        })
        return json
    }

    public fromJSON(json: { [label: string]: SigOperationsMapItem[] }): this {
        Object.keys(json).forEach((label) => {
            this.map.set(
                label,
                json[label].map((obj) => ({
                    nScriptChunk: obj.nScriptChunk,
                    type: obj.type,
                    addressStr: obj.addressStr,
                    nHashType: obj.nHashType,
                    log: obj.log,
                }))
            )
        })
        return this
    }

    /**
     * Set an address to in the map for use with single-sig.
     *
     * @param {Buffer} txHashBuf The hash of a transsaction. Note that this is
     * *not* the reversed transaction id, but is the raw hash.
     * @param {Number} txOutNum The output number, a.k.a. the "vout".
     * @param {Number} nScriptChunk The index of the chunk of the script where
     * we are going to place the signature.
     * @param {String} addressStr The addressStr coresponding to this (txHashBuf,
     * txOutNum, nScriptChunk) where we are going to sign and insert the
     * signature or public key.
     * @param {Number} nHashType Usually = Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID
     */
    public setOne(
        txHashBuf: Buffer,
        txOutNum: number,
        nScriptChunk: number,
        type: 'sig' | 'pubKey' = 'sig',
        addressStr: string,
        nHashType: number = Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID
    ): this {
        const label = txHashBuf.toString('hex') + ':' + txOutNum
        const obj = { nScriptChunk, type, addressStr, nHashType }
        this.map.set(label, [obj])
        return this
    }

    /**
     * Set a bunch of addresses for signing an input such as for use with multi-sig.
     *
     * @param {Buffer} txHashBuf The hash of a transsaction. Note that this is
     * *not* the reversed transaction id, but is the raw hash.
     * @param {Number} txOutNum The output number, a.k.a. the "vout".
     * @param {Array} arr Must take the form of [{nScriptChunk, type, addressStr, nHashType}, ...]
     */
    public setMany(txHashBuf: Buffer, txOutNum: number, arr: SigOperationsMapItem[]): this {
        const label = txHashBuf.toString('hex') + ':' + txOutNum
        arr = arr.map((obj) => ({
            type: obj.type || 'sig',
            nHashType: obj.nHashType || Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID,
            ...obj,
        }))
        this.map.set(label, arr)
        return this
    }

    public addOne(
        txHashBuf: Buffer,
        txOutNum: number,
        nScriptChunk: number,
        type: 'sig' | 'pubKey' = 'sig',
        addressStr: string,
        nHashType: number = Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID
    ): this {
        const arr = this.get(txHashBuf, txOutNum) || []
        arr.push({
            nScriptChunk,
            type,
            addressStr,
            nHashType,
        })
        this.setMany(txHashBuf, txOutNum, arr)
        return this
    }

    /**
     * Get an address from the map
     *
     * @param {Buffer} txHashBuf The hash of a transction. Note that this is *not*
     * the reversed transaction id, but is the raw hash.
     * @param {Number} txOutNum The output number, a.k.a. the "vout".
     * @param {Number} nScriptChunk The index of the chunk of the script where
     * we are going to place the signature.
     */
    public get(txHashBuf: Buffer, txOutNum: number): SigOperationsMapItem[] {
        const label = txHashBuf.toString('hex') + ':' + txOutNum
        return this.map.get(label)
    }
}
