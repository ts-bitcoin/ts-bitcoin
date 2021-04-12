/* eslint-disable @typescript-eslint/no-shadow */
import should = require('should')
import { Address } from '../src/address'
import { Bn } from '../src/bn'
import { Br } from '../src/br'
import { KeyPair } from '../src/key-pair'
import { Script } from '../src/script'
import { TxIn } from '../src/tx-in'
import { TxOut } from '../src/tx-out'

describe('TxIn', () => {
    const txHashBuf = Buffer.alloc(32)
    txHashBuf.fill(0)
    const txOutNum = 0
    const script = new Script().fromString('OP_CHECKMULTISIG')
    const nSequence = 0
    const txIn = new TxIn({
        txHashBuf,
        txOutNum,
        script,
        nSequence,
    })

    it('should make a new txIn', () => {
        let txIn = new TxIn()
        should.exist(txIn)
        txIn = new TxIn()
        should.exist(txIn)
        const txHashBuf = Buffer.alloc(32)
        txHashBuf.fill(0)
        new TxIn({ txHashBuf }).txHashBuf.length.should.equal(32)
    })

    describe('#initialize', () => {
        it('should default to 0xffffffff nSequence', () => {
            new TxIn().nSequence.should.equal(0xffffffff)
        })
        it('should set these vars', () => {
            const txIn = new TxIn({
                txHashBuf,
                txOutNum,
                script,
                nSequence,
            })
            should.exist(txIn.txHashBuf)
            should.exist(txIn.txOutNum)
            should.exist(txIn.script)
            should.exist(txIn.nSequence)
        })
    })

    describe('#setScript', () => {
        it('should calculate the varInt size correctly', () => {
            const txIn2 = TxIn.fromJSON(txIn.toJSON())
            txIn2
                .setScript(new Script().fromString('OP_RETURN OP_RETURN OP_RETURN'))
                .script.toBuffer()
                .length.should.equal(3)
        })
    })

    describe('#fromJSON', () => {
        it('should set these vars', () => {
            const txIn2 = TxIn.fromJSON(txIn.toJSON())
            should.exist(txIn2.txHashBuf)
            should.exist(txIn2.txOutNum)
            should.exist(txIn2.script)
            should.exist(txIn2.nSequence)
        })
    })

    describe('#toJSON', () => {
        it('should set these vars', () => {
            const json = txIn.toJSON()
            should.exist(json.txHashBuf)
            should.exist(json.txOutNum)
            should.exist(json.script)
            should.exist(json.nSequence)
        })
    })

    describe('#fromHex', () => {
        it('should convert this known buffer', () => {
            const hex = '00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000'
            const txIn = TxIn.fromHex(hex)
            txIn.script.toString().should.equal('OP_CHECKMULTISIG')
        })
    })

    describe('#fromBuffer', () => {
        it('should convert this known buffer', () => {
            const hex = '00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000'
            const buf = Buffer.from(hex, 'hex')
            const txIn = TxIn.fromBuffer(buf)
            txIn.script.toString().should.equal('OP_CHECKMULTISIG')
        })
    })

    describe('#fromBr', () => {
        it('should convert this known buffer', () => {
            const hex = '00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000'
            const buf = Buffer.from(hex, 'hex')
            const br = new Br(buf)
            const txIn = TxIn.fromBr(br)
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
            const txOut = new TxOut({ valueBn: new Bn(1000), script: new Script().fromPubKeyHash(address.hashBuf) })
            const txHashBuf = Buffer.alloc(32)
            txHashBuf.fill(0)
            const txOutNum = 0
            const txIn = TxIn.fromPubKeyHashTxOut(txHashBuf, txOutNum, txOut, keyPair.pubKey)
            should.exist(txIn)
        })
    })
})
