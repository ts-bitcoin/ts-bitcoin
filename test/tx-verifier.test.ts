import should = require('should')
import { Bn } from '../src/bn'
import { Br } from '../src/br'
import { Interp } from '../src/interp'
import { Script } from '../src/script'
import { Tx } from '../src/tx'
import { TxOut } from '../src/tx-out'
import { TxOutMap } from '../src/tx-out-map'
import { TxVerifier } from '../src/tx-verifier'
import * as txInvalid from './vectors/bitcoind/tx_invalid.json'
import * as txValid from './vectors/bitcoind/tx_valid.json'
import * as coolestTxVector from './vectors/coolest-tx-ever-sent.json'
import * as sighashSingleVector from './vectors/sighash-single-bug.json'

describe('TxVerifier', () => {
    it('should make a new txVerifier', () => {
        let txVerifier = new TxVerifier()
        ;(txVerifier instanceof TxVerifier).should.equal(true)
        txVerifier = new TxVerifier()
        ;(txVerifier instanceof TxVerifier).should.equal(true)
        txVerifier = new TxVerifier(new Tx())
        should.exist(txVerifier.tx)
    })

    describe('#getDebugObject', () => {
        it('should get an object with these properties', () => {
            const vector = txInvalid[10]
            const inputs = (vector[0] as any) as number[]
            const txhex = (vector[1] as any) as string
            const flags = Interp.getFlags(vector[2] as any)

            const txOutMap = new TxOutMap()
            for (const input of inputs) {
                let txOutNum = input[1]
                if (txOutNum === -1) {
                    txOutNum = 0xffffffff // bitcoind casts -1 to an unsigned int
                }
                const txOut = TxOut.fromProperties(new Bn(0), new Script().fromBitcoindString(input[2]))
                const txHashBuf = new Br(Buffer.from(input[0], 'hex')).readReverse()
                txOutMap.set(txHashBuf, txOutNum, txOut)
            }

            const tx = Tx.fromBuffer(Buffer.from(txhex, 'hex'))
            const txVerifier = new TxVerifier(tx, txOutMap)
            const verified = txVerifier.verify(flags)
            verified.should.equal(false)
            const debugObject = txVerifier.getDebugObject()
            should.exist(debugObject.errStr)
            should.exist(debugObject.interpFailure)
        })
    })

    describe('#getDebugString', () => {
        it('should get an object with these properties', () => {
            const vector = txInvalid[10]
            const inputs = (vector[0] as any) as number[]
            const txhex = (vector[1] as any) as string
            const flags = Interp.getFlags(vector[2] as any)

            const txOutMap = new TxOutMap()
            for (const input of inputs) {
                let txOutNum = input[1]
                if (txOutNum === -1) {
                    txOutNum = 0xffffffff // bitcoind casts -1 to an unsigned int
                }
                const txOut = TxOut.fromProperties(new Bn(0), new Script().fromBitcoindString(input[2]))
                const txHashBuf = new Br(Buffer.from(input[0], 'hex')).readReverse()
                txOutMap.set(txHashBuf, txOutNum, txOut)
            }

            const tx = Tx.fromBuffer(Buffer.from(txhex, 'hex'))
            const txVerifier = new TxVerifier(tx, txOutMap)
            const verified = txVerifier.verify(flags)
            verified.should.equal(false)
            const debugString = txVerifier.getDebugString()
            debugString.should.equal(
                '{\n  "errStr": "input 0 failed script verify",\n  "interpFailure": {\n    "errStr": "SCRIPT_ERR_CHECKSIGVERIFY",\n    "scriptStr": "OP_DUP OP_HASH160 20 0x5b6462475454710f3c22f5fdf0b40704c92f25c3 OP_EQUALVERIFY OP_CHECKSIGVERIFY OP_1 OP_PUSHDATA1 71 0x3044022067288ea50aa799543a536ff9306f8e1cba05b9c6b10951175b924f96732555ed022026d7b5265f38d21541519e4a1e55044d5b9e17e15cdbaf29ae3792e99e883e7a01",\n    "pc": 4,\n    "stack": [\n      ""\n    ],\n    "altStack": [],\n    "opCodeStr": "OP_CHECKSIGVERIFY"\n  }\n}'
            )
        })
    })

    describe('vectors', () => {
        it('should validate the coolest transaction ever', () => {
            // This test vector was given to me by JJ of bcoin. It is a transaction
            // with code seperators in the input. It also uses what used to be
            // OP_NOP2 but is now OP_CHECKLOCKTIMEVERIFY, so the
            // OP_CHECKLOCKTIMEVERIFY flag cannot be enabled to verify this tx.
            const flags = 0
            const tx = Tx.fromHex(coolestTxVector.tx)
            const intx0 = Tx.fromHex(coolestTxVector.intx0)
            const intx1 = Tx.fromHex(coolestTxVector.intx1)
            const txOutMap = new TxOutMap()
            txOutMap.setTx(intx0)
            txOutMap.setTx(intx1)
            const txVerifier = new TxVerifier(tx, txOutMap)
            const str = txVerifier.verifyStr(flags)
            str.should.equal(false)
        })

        it('should validate this sighash single test vector', () => {
            // This test vector was given to me by JJ of bcoin. It is a transaction
            // on testnet, not mainnet. It highlights the famous "sighash single bug"
            // which is where sighash single returns a transaction hash of all 00s in
            // the case where there are more inputs than outputs. Peter Todd has
            // written about the sighash single bug here:
            // https://lists.linuxfoundation.org/pipermail/bitcoin-dev/2014-November/006878.html
            const flags = 0
            const tx = Tx.fromHex(sighashSingleVector.tx)
            const intx0 = Tx.fromHex(sighashSingleVector.intx0)
            const intx1 = Tx.fromHex(sighashSingleVector.intx1)
            const txOutMap = new TxOutMap()
            txOutMap.setTx(intx0)
            txOutMap.setTx(intx1)
            const txVerifier = new TxVerifier(tx, txOutMap)
            const str = txVerifier.verifyStr(flags)
            str.should.equal(false)
        })
    })

    describe('TxVerifier Vectors', () => {
        let c = 0
        // eslint-disable-next-line ban/ban
        txValid.forEach((vector) => {
            if (vector.length === 1) {
                return
            }
            c++
            it('should verify txValid vector ' + c, () => {
                const inputs = (vector[0] as any) as number[]
                const txhex = (vector[1] as any) as string
                const flags = Interp.getFlags(vector[2] as any)

                const txOutMap = new TxOutMap()
                for (const input of inputs) {
                    let txOutNum = input[1]
                    if (txOutNum === -1) {
                        txOutNum = 0xffffffff // bitcoind casts -1 to an unsigned int
                    }
                    const txOut = TxOut.fromProperties(new Bn(0), new Script().fromBitcoindString(input[2]))
                    const txHashBuf = new Br(Buffer.from(input[0], 'hex')).readReverse()
                    txOutMap.set(txHashBuf, txOutNum, txOut)
                }

                const tx = Tx.fromBuffer(Buffer.from(txhex, 'hex'))
                const verified = TxVerifier.verify(tx, txOutMap, flags)
                verified.should.equal(true)
            })

            it('should async verify txValid vector ' + c, async () => {
                const inputs = (vector[0] as any) as number[]
                const txhex = (vector[1] as any) as string
                const flags = Interp.getFlags(vector[2] as any)

                const txOutMap = new TxOutMap()
                for (const input of inputs) {
                    let txOutNum = input[1]
                    if (txOutNum === -1) {
                        txOutNum = 0xffffffff // bitcoind casts -1 to an unsigned int
                    }
                    const txOut = TxOut.fromProperties(new Bn(0), new Script().fromBitcoindString(input[2]))
                    const txHashBuf = new Br(Buffer.from(input[0], 'hex')).readReverse()
                    txOutMap.set(txHashBuf, txOutNum, txOut)
                }

                const tx = Tx.fromBuffer(Buffer.from(txhex, 'hex'))
                const verified = await TxVerifier.asyncVerify(tx, txOutMap, flags)
                verified.should.equal(true)
            })
        })

        c = 0
        // eslint-disable-next-line ban/ban
        txInvalid.forEach((vector) => {
            if (vector.length === 1) {
                return
            }
            c++
            it('should unverify txInvalid vector ' + c, () => {
                const inputs = (vector[0] as any) as number[]
                const txhex = (vector[1] as any) as string
                const flags = Interp.getFlags(vector[2] as any)

                const txOutMap = new TxOutMap()
                for (const input of inputs) {
                    let txOutNum = input[1]
                    if (txOutNum === -1) {
                        txOutNum = 0xffffffff // bitcoind casts -1 to an unsigned int
                    }
                    const txOut = TxOut.fromProperties(new Bn(0), new Script().fromBitcoindString(input[2]))
                    const txHashBuf = new Br(Buffer.from(input[0], 'hex')).readReverse()
                    txOutMap.set(txHashBuf, txOutNum, txOut)
                }

                const tx = Tx.fromBuffer(Buffer.from(txhex, 'hex'))

                const verified = TxVerifier.verify(tx, txOutMap, flags)
                verified.should.equal(false)
            })

            it('should async unverify txInvalid vector ' + c, async () => {
                const inputs = (vector[0] as any) as number[]
                const txhex = (vector[1] as any) as string
                const flags = Interp.getFlags(vector[2] as any)

                const txOutMap = new TxOutMap()
                for (const input of inputs) {
                    let txOutNum = input[1]
                    if (txOutNum === -1) {
                        txOutNum = 0xffffffff // bitcoind casts -1 to an unsigned int
                    }
                    const txOut = TxOut.fromProperties(new Bn(0), new Script().fromBitcoindString(input[2]))
                    const txHashBuf = new Br(Buffer.from(input[0], 'hex')).readReverse()
                    txOutMap.set(txHashBuf, txOutNum, txOut)
                }

                const tx = Tx.fromBuffer(Buffer.from(txhex, 'hex'))

                const verified = await TxVerifier.asyncVerify(tx, txOutMap, flags)
                verified.should.equal(false)
            })
        })
    })
})
