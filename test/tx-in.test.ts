/* eslint-disable @typescript-eslint/no-shadow */
import should = require('should')
import { Address } from '../src/address'
import { Bn } from '../src/bn'
import { Br } from '../src/br'
import { KeyPair } from '../src/key-pair'
import { Script } from '../src/script'
import { TxIn } from '../src/tx-in'
import { TxOut } from '../src/tx-out'
import { VarInt } from '../src/var-int'

describe('TxIn', () => {
    const txHashBuf = Buffer.alloc(32)
    txHashBuf.fill(0)
    const txOutNum = 0
    const script = new Script().fromString('OP_CHECKMULTISIG')
    const scriptVi = VarInt.fromNumber(script.toBuffer().length)
    const nSequence = 0
    const txIn = new TxIn().fromObject({
        txHashBuf,
        txOutNum,
        scriptVi,
        script,
        nSequence,
    })

    const txIn2Hex = 'f2bc60825b513c5a94eb9997858dfddacc901b00e0091403affe5bd366a99a8c0000000001ae00000000'
    const txIn2TxHash = '8c9aa966d35bfeaf031409e0001b90ccdafd8d859799eb945a3c515b8260bcf2'

    it('should make a new txIn', () => {
        let txIn = new TxIn()
        should.exist(txIn)
        txIn = new TxIn()
        should.exist(txIn)
        const txHashBuf = Buffer.alloc(32)
        txHashBuf.fill(0)
        new TxIn(txHashBuf, 0).txHashBuf.length.should.equal(32)
    })

    describe('#initialize', () => {
        it('should default to 0xffffffff nSequence', () => {
            new TxIn().nSequence.should.equal(0xffffffff)
        })
    })

    describe('#fromObject', () => {
        it('should set these vars', () => {
            const txIn = new TxIn().fromObject({
                txHashBuf,
                txOutNum,
                scriptVi,
                script,
                nSequence,
            })
            should.exist(txIn.txHashBuf)
            should.exist(txIn.txOutNum)
            should.exist(txIn.scriptVi)
            should.exist(txIn.script)
            should.exist(txIn.nSequence)
        })
    })

    describe('#fromProperties', () => {
        it('should make a new txIn', () => {
            const txIn = new TxIn().fromProperties(txHashBuf, txOutNum, script, nSequence)
            should.exist(txIn.scriptVi)
        })
    })

    describe('@fromProperties', () => {
        it('should make a new txIn', () => {
            const txIn = TxIn.fromProperties(txHashBuf, txOutNum, script, nSequence)
            should.exist(txIn.scriptVi)
        })
    })

    describe('#setScript', () => {
        it('should calculate the varInt size correctly', () => {
            const txIn2 = new TxIn().fromJSON(txIn.toJSON())
            txIn2
                .setScript(new Script().fromString('OP_RETURN OP_RETURN OP_RETURN'))
                .scriptVi.toNumber()
                .should.equal(3)
        })
    })

    describe('#fromJSON', () => {
        it('should set these vars', () => {
            const txIn2 = new TxIn().fromJSON(txIn.toJSON())
            should.exist(txIn2.txHashBuf)
            should.exist(txIn2.txOutNum)
            should.exist(txIn2.scriptVi)
            should.exist(txIn2.script)
            should.exist(txIn2.nSequence)
        })
    })

    describe('#toJSON', () => {
        it('should set these vars', () => {
            const json = txIn.toJSON()
            should.exist(json.txHashBuf)
            should.exist(json.txOutNum)
            should.exist(json.scriptVi)
            should.exist(json.script)
            should.exist(json.nSequence)
        })
    })

    describe('#fromHex', () => {
        it('should convert this known buffer', () => {
            const hex = '00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000'
            const txIn = new TxIn().fromHex(hex)
            txIn.scriptVi.toNumber().should.equal(1)
            txIn.script.toString().should.equal('OP_CHECKMULTISIG')
        })
    })

    describe('#fromBuffer', () => {
        it('should convert this known buffer', () => {
            const hex = '00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000'
            const buf = Buffer.from(hex, 'hex')
            const txIn = new TxIn().fromBuffer(buf)
            txIn.scriptVi.toNumber().should.equal(1)
            txIn.script.toString().should.equal('OP_CHECKMULTISIG')
        })
    })

    describe('#fromBr', () => {
        it('should convert this known buffer', () => {
            const hex = '00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000'
            const buf = Buffer.from(hex, 'hex')
            const br = new Br(buf)
            const txIn = new TxIn().fromBr(br)
            txIn.scriptVi.toNumber().should.equal(1)
            txIn.script.toString().should.equal('OP_CHECKMULTISIG')
        })
    })

    describe('#toHex', () => {
        it('should convert this known hex', () => {
            txIn.toHex().should.equal(
                '00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000'
            )
        })
    })

    describe('#toBuffer', () => {
        it('should convert this known buffer', () => {
            txIn.toBuffer()
                .toString('hex')
                .should.equal('00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000')
        })
    })

    describe('#toBw', () => {
        it('should convert this known buffer', () => {
            txIn.toBw()
                .toBuffer()
                .toString('hex')
                .should.equal('00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000')
        })
    })

    describe('#fromPubKeyHashTxOut', () => {
        it('should convert from pubKeyHash out', () => {
            const keyPair = new KeyPair().fromRandom()
            const address = new Address().fromPubKey(keyPair.pubKey)
            const txOut = TxOut.fromProperties(new Bn(1000), new Script().fromPubKeyHash(address.hashBuf))
            const txHashBuf = Buffer.alloc(32)
            txHashBuf.fill(0)
            const txOutNum = 0
            const txIn = new TxIn().fromPubKeyHashTxOut(txHashBuf, txOutNum, txOut, keyPair.pubKey)
            should.exist(txIn)
        })
    })

    describe('#txid', () => {
        it('should convert txHashBuf to little-endian hash', () => {
            new TxIn().fromBuffer(Buffer.from(txIn2Hex, 'hex')).txid().should.equal(txIn2TxHash)
        })
    })
})
