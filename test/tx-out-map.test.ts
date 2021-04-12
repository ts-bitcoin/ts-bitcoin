import should = require('should')
import { Bn } from '../src/bn'
import { Script } from '../src/script'
import { Tx } from '../src/tx'
import { TxOut } from '../src/tx-out'
import { TxOutMap } from '../src/tx-out-map'

describe('TxOutMap', () => {
    const txHashBuf = Buffer.alloc(32)
    txHashBuf.fill(0)
    const label = txHashBuf.toString('hex') + ':' + '0'
    const txOut = new TxOut({ valueBn: new Bn(0), script: new Script('OP_RETURN' as any) })
    const map: Map<string, TxOut> = new Map()
    map.set(label, txOut)
    const tx = Tx.fromHex(
        '0100000001795b88d47a74e3be0948fc9d1b4737f96097474d57151afa6f77c787961e47cc120000006a47304402202289f9e1ae2ed981cd0bf62f822f6ae4aea40c65c7339d90643cea90de93ad1502205c8a08b3265f9ba7e99057d030d5b91c889a1b99f94a3a5b79d7daaada2409b6012103798b51f980e7a3690af6b43ce3467db75bede190385702c4d9d48c0a735ff4a9ffffffff01c0a83200000000001976a91447b8e62e008f82d95d1f565055a8243cc243d32388ac00000000'
    )

    it('should make a new txOutMap', () => {
        let txOutMap = new TxOutMap()
        txOutMap = new TxOutMap(map)
        should.exist(txOutMap)
        should.exist(txOutMap.map)
    })

    describe('#fromObject', () => {
        it('should set a map', () => {
            const txOutMap = new TxOutMap().fromObject({ map })
            txOutMap.map.get(label).toHex().should.equal(txOut.toHex())
            txOutMap.fromObject({})
            txOutMap.map.get(label).toHex().should.equal(txOut.toHex())
        })
    })

    describe('#toJSON', () => {
        it('convert to json', () => {
            const txOutMap = new TxOutMap().set(txHashBuf, 0, txOut).set(txHashBuf, 1, txOut).set(txHashBuf, 2, txOut)
            const json = txOutMap.toJSON()
            Object.keys(json).length.should.equal(3)
        })
    })

    describe('#fromJSON', () => {
        it('convert to/from json roundtrip', () => {
            const txOutMap = new TxOutMap().set(txHashBuf, 0, txOut).set(txHashBuf, 1, txOut).set(txHashBuf, 2, txOut)
            const txOutMap2 = new TxOutMap().fromJSON(txOutMap.toJSON())
            txOutMap2.get(txHashBuf, 0).toHex().should.equal(txOutMap.get(txHashBuf, 0).toHex())
            txOutMap2.get(txHashBuf, 1).toHex().should.equal(txOutMap.get(txHashBuf, 1).toHex())
            txOutMap2.get(txHashBuf, 2).toHex().should.equal(txOutMap.get(txHashBuf, 2).toHex())
        })
    })

    describe('#set', () => {
        it('should set a txOut to the txOutMap', () => {
            const txOutMap = new TxOutMap().set(txHashBuf, 0, txOut)
            should.exist(txOutMap.map.get(label))
        })
    })

    describe('#get', () => {
        it('should get a txOut', () => {
            const txOutMap = new TxOutMap().fromObject({ map })
            txOutMap.get(txHashBuf, 0).toHex().should.equal(txOut.toHex())
        })
    })

    describe('#setTx', () => {
        it('should set all outputs from a tx', () => {
            const txOutMap = new TxOutMap().setTx(tx)
            const txHashBuf2 = tx.hash()
            const txOut2 = tx.txOuts[0]
            txOutMap.get(txHashBuf2, 0).toHex().should.equal(txOut2.toHex())
        })
    })
})
