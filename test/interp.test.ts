import should = require('should')
import { Bn } from '../src/bn'
import { Interp } from '../src/interp'
import { KeyPair } from '../src/key-pair'
import { Script } from '../src/script'
import { Sig } from '../src/sig'
import { Tx } from '../src/tx'
import * as bitcoinABCScriptTests from './vectors/bitcoin-abc/script_tests.json'
import * as bitcoinSVScriptTests from './vectors/bitcoin-sv/script_tests.json'
import * as bitcoindScriptInvalid from './vectors/bitcoind/script_invalid.json'
import * as bitcoindScriptValid from './vectors/bitcoind/script_valid.json'

describe('Interp', () => {
    it('should make a new interp', () => {
        let interp = new Interp()
        ;(interp instanceof Interp).should.equal(true)
        interp.stack.length.should.equal(0)
        interp.altStack.length.should.equal(0)
        interp.pc.should.equal(0)
        interp.pBeginCodeHash.should.equal(0)
        interp.nOpCount.should.equal(0)
        interp.ifStack.length.should.equal(0)
        interp.errStr.should.equal('')
        interp.flags.should.equal(Interp.defaultFlags)
        interp = new Interp()
        ;(interp instanceof Interp).should.equal(true)
        interp.stack.length.should.equal(0)
        interp.altStack.length.should.equal(0)
        interp.pc.should.equal(0)
        interp.pBeginCodeHash.should.equal(0)
        interp.nOpCount.should.equal(0)
        interp.ifStack.length.should.equal(0)
        interp.errStr.should.equal('')
        interp.flags.should.equal(Interp.defaultFlags)
    })

    describe('#fromJSON', () => {
        it('should convert a json to an interp', () => {
            const interp = new Interp().fromObject({
                script: new Script(),
                stack: ['00'],
                altStack: ['00'],
            })
            const json = interp.toJSON()
            const interp2 = new Interp().fromJSON(json)
            should.exist(interp2.script)
            should.exist(interp2.stack[0])
            should.exist(interp2.altStack[0])
        })
    })

    describe('#fromFastBuffer', () => {
        it('should convert an interp buf to an interp', () => {
            const interp = new Interp().fromObject({
                script: new Script(),
                stack: ['00'],
                altStack: ['00'],
            })
            const buf = interp.toFastBuffer()
            const interp2 = new Interp().fromFastBuffer(buf)
            should.exist(interp2.script)
            should.exist(interp2.stack[0])
            should.exist(interp2.altStack[0])
        })

        it('should convert an interp buf to an interp', () => {
            const interp = new Interp().fromObject({
                script: new Script(),
                stack: ['00'],
                altStack: ['00'],
                tx: new Tx(),
            })
            const buf = interp.toFastBuffer()
            const interp2 = new Interp().fromFastBuffer(buf)
            should.exist(interp2.script)
            should.exist(interp2.stack[0])
            should.exist(interp2.altStack[0])
        })
    })

    describe('#toJSON', () => {
        it('should convert an interp to json', () => {
            const interp = new Interp().fromObject({ script: new Script() })
            const json = interp.toJSON()
            should.exist(json.script)
            should.not.exist(json.tx)
        })
    })

    describe('#toFastBuffer', () => {
        it('should convert an interp to buf with no tx', () => {
            const interp = new Interp().fromObject({ script: new Script() })
            Buffer.isBuffer(interp.toFastBuffer()).should.equal(true)
        })

        it('should convert an interp to buf with a tx', () => {
            const interp = new Interp().fromObject({
                script: new Script(),
                tx: new Tx(),
            })
            Buffer.isBuffer(interp.toFastBuffer()).should.equal(true)
        })
    })

    describe('@castToBool', () => {
        it('should cast these bufs to bool correctly', () => {
            Interp.castToBool(new Bn(0).toSm({ endian: 'little' })).should.equal(false)
            Interp.castToBool(Buffer.from('0080', 'hex')).should.equal(false) // negative 0
            Interp.castToBool(new Bn(1).toSm({ endian: 'little' })).should.equal(true)
            Interp.castToBool(new Bn(-1).toSm({ endian: 'little' })).should.equal(true)

            const buf = Buffer.from('00', 'hex')
            const bool = new Bn().fromSm(buf, { endian: 'little' }).cmp(0) !== 0
            Interp.castToBool(buf).should.equal(bool)
        })
    })

    describe('#getDebugObject', () => {
        it('should get a failure explanation object', () => {
            const scriptSig = Script.fromBitcoindString(
                '0x47 0x3044022057292e2d4dfe775becdd0a9e6547997c728cdf35390f6a017da56d654d374e4902206b643be2fc53763b4e284845bfea2c597d2dc7759941dce937636c9d341b71ed01'
            )
            const scriptPubKey = Script.fromBitcoindString(
                '0x41 0x0679be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8 CHECKSIG'
            )
            const flags =
                Interp.SCRIPT_VERIFY_P2SH |
                Interp.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY |
                Interp.SCRIPT_VERIFY_CHECKSEQUENCEVERIFY

            const hashBuf = Buffer.alloc(32)
            hashBuf.fill(0)
            const credtx = new Tx()
            credtx.addTxIn(hashBuf, 0xffffffff, new Script().writeString('OP_0 OP_0'), 0xffffffff)
            credtx.addTxOut(new Bn(0), scriptPubKey)

            const idbuf = credtx.hash()
            const spendtx = new Tx()
            spendtx.addTxIn(idbuf, 0, new Script(), 0xffffffff)
            spendtx.addTxOut(new Bn(0), new Script())

            const interp = new Interp()
            interp.verify(scriptSig, scriptPubKey, spendtx, 0, flags)
            const debugObject = interp.getDebugObject()
            should.exist(debugObject.errStr)
            should.exist(debugObject.scriptStr)
            should.exist(debugObject.pc)
            should.exist(debugObject.opCodeStr)
        })
    })

    describe('#getDebugString', () => {
        it('should get a failure explanation object', () => {
            const scriptSig = Script.fromBitcoindString(
                '0x47 0x3044022057292e2d4dfe775becdd0a9e6547997c728cdf35390f6a017da56d654d374e4902206b643be2fc53763b4e284845bfea2c597d2dc7759941dce937636c9d341b71ed01'
            )
            const scriptPubKey = Script.fromBitcoindString(
                '0x41 0x0679be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8 CHECKSIG'
            )
            const flags =
                Interp.SCRIPT_VERIFY_P2SH |
                Interp.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY |
                Interp.SCRIPT_VERIFY_CHECKSEQUENCEVERIFY

            const hashBuf = Buffer.alloc(32)
            hashBuf.fill(0)
            const credtx = new Tx()
            credtx.addTxIn(hashBuf, 0xffffffff, new Script().writeString('OP_0 OP_0'), 0xffffffff)
            credtx.addTxOut(new Bn(0), scriptPubKey)

            const idbuf = credtx.hash()
            const spendtx = new Tx()
            spendtx.addTxIn(idbuf, 0, new Script(), 0xffffffff)
            spendtx.addTxOut(new Bn(0), new Script())

            const interp = new Interp()
            interp.verify(scriptSig, scriptPubKey, spendtx, 0, flags)
            const debugString = interp.getDebugString()
            debugString.should.equal(
                '{\n  "errStr": "",\n  "scriptStr": "65 0x0679be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8 OP_CHECKSIG",\n  "pc": 1,\n  "stack": [\n    "01"\n  ],\n  "altStack": [],\n  "opCodeStr": "OP_CHECKSIG"\n}'
            )
        })
    })

    describe('#verify', () => {
        it('should has correct stack size after verify', () => {
            const interp = new Interp()
            const script = Script.fromAsmString('OP_1')
            interp.script = script
            interp.verify()
            should.equal(interp.stack.length, 1)
        })

        it('should verify or unverify these trivial scripts from script_valid.json', () => {
            let verified
            verified = new Interp().verify(
                new Script().writeString('OP_1'),
                new Script().writeString('OP_1'),
                new Tx(),
                0
            )
            verified.should.equal(true)
            verified = new Interp().verify(
                new Script().writeString('OP_1'),
                new Script().writeString('OP_0'),
                new Tx(),
                0
            )
            verified.should.equal(false)
            verified = new Interp().verify(
                new Script().writeString('OP_0'),
                new Script().writeString('OP_1'),
                new Tx(),
                0
            )
            verified.should.equal(true)
            verified = new Interp().verify(
                new Script().writeString('OP_CODESEPARATOR'),
                new Script().writeString('OP_1'),
                new Tx(),
                0
            )
            verified.should.equal(true)
            verified = new Interp().verify(
                new Script().writeString(''),
                new Script().writeString('OP_DEPTH OP_0 OP_EQUAL'),
                new Tx(),
                0
            )
            verified.should.equal(true)
            verified = new Interp().verify(
                new Script().writeString('OP_1 OP_2'),
                new Script().writeString('OP_2 OP_EQUALVERIFY OP_1 OP_EQUAL'),
                new Tx(),
                0
            )
            verified.should.equal(true)
            verified = new Interp().verify(
                new Script().writeString('9 0x000000000000000010'),
                new Script().writeString(''),
                new Tx(),
                0
            )
            verified.should.equal(true)
            verified = new Interp().verify(
                new Script().writeString('OP_1'),
                new Script().writeString('OP_15 OP_ADD OP_16 OP_EQUAL'),
                new Tx(),
                0
            )
            verified.should.equal(true)
            verified = new Interp().verify(
                new Script().writeString('OP_0'),
                new Script().writeString('OP_IF OP_VER OP_ELSE OP_1 OP_ENDIF'),
                new Tx(),
                0
            )
            verified.should.equal(true)
        })

        it('should verify this new pay-to-pubKey script', () => {
            const keyPair = new KeyPair().fromRandom()
            const scriptPubKey = new Script().writeBuffer(keyPair.pubKey.toDer(true)).writeString('OP_CHECKSIG')

            const hashBuf = Buffer.alloc(32)
            hashBuf.fill(0)
            const credtx = new Tx()
            credtx.addTxIn(hashBuf, 0xffffffff, new Script().writeString('OP_0 OP_0'), 0xffffffff)
            credtx.addTxOut(new Bn(0), scriptPubKey)

            const idbuf = credtx.hash()
            const spendtx = new Tx()
            spendtx.addTxIn(idbuf, 0, new Script(), 0xffffffff)
            spendtx.addTxOut(new Bn(0), new Script())

            const sig = spendtx.sign(keyPair, Sig.SIGHASH_ALL, 0, scriptPubKey, new Bn(0))
            const scriptSig = new Script().writeBuffer(sig.toTxFormat())
            spendtx.txIns[0].setScript(scriptSig)

            const interp = new Interp()
            const verified = interp.verify(scriptSig, scriptPubKey, spendtx, 0)
            verified.should.equal(true)
        })

        it('should verify this pay-to-pubKey script from script_valid.json', () => {
            const scriptSig = new Script().fromBitcoindString(
                '0x47 0x3044022007415aa37ce7eaa6146001ac8bdefca0ddcba0e37c5dc08c4ac99392124ebac802207d382307fd53f65778b07b9c63b6e196edeadf0be719130c5db21ff1e700d67501'
            )
            const scriptPubKey = new Script().fromBitcoindString(
                '0x41 0x0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8 CHECKSIG'
            )

            const hashBuf = Buffer.alloc(32)
            hashBuf.fill(0)
            const credtx = new Tx()
            credtx.addTxIn(hashBuf, 0xffffffff, new Script().writeString('OP_0 OP_0'), 0xffffffff)
            credtx.addTxOut(new Bn(0), scriptPubKey)

            const idbuf = credtx.hash()
            const spendtx = new Tx()
            spendtx.addTxIn(idbuf, 0, scriptSig, 0xffffffff)
            spendtx.addTxOut(new Bn(0), new Script())

            const interp = new Interp()
            const verified = interp.verify(scriptSig, scriptPubKey, spendtx, 0, 0)
            verified.should.equal(true)
        })
    })

    describe('Interp vectors', () => {
        let c

        c = 0
        // eslint-disable-next-line ban/ban
        bitcoinABCScriptTests.forEach((vector) => {
            if (vector.length === 1) {
                return
            }
            c++
            it('should verify bitcoindScriptValid vector ' + c, () => {
                // ["Format is: [scriptSig, scriptPubKey, flags, expected_scripterror, ... comments]"],
                // Test vectors for SIGHASH_FORKID
                const scriptSig = new Script().fromBitcoindString(vector[0])
                const scriptPubKey = new Script().fromBitcoindString(vector[1])
                const flags = Interp.getFlags(vector[2])
                const expectedError = vector[3]

                const hashBuf = Buffer.alloc(32)
                hashBuf.fill(0)
                const credtx = new Tx()
                credtx.addTxIn(hashBuf, 0xffffffff, new Script().writeString('OP_0 OP_0'), 0xffffffff)
                credtx.addTxOut(new Bn(0), scriptPubKey)

                const idbuf = credtx.hash()
                const spendtx = new Tx()
                spendtx.addTxIn(idbuf, 0, scriptSig, 0xffffffff)
                spendtx.addTxOut(new Bn(0), new Script())

                const interp = new Interp()
                const valueBn = new Bn(0)
                const verified = interp.verify(scriptSig, scriptPubKey, spendtx, 0, flags, valueBn)
                try {
                    if (expectedError === 'OK') {
                        verified.should.equal(true)
                    } else {
                        verified.should.equal(false)
                    }
                } catch (err) {
                    console.log(vector)
                    throw new Error('failure' + err.message)
                }
            })
        })

        c = 0
        // eslint-disable-next-line ban/ban
        bitcoinSVScriptTests.forEach((vector) => {
            if (vector.length === 1) {
                return
            }
            c++
            it('should verify bitcoinSVScriptTests vector ' + c, () => {
                // ["Format is: [scriptSig, scriptPubKey, flags, expected_scripterror, ... comments]"],
                const scriptSig = new Script().fromBitcoindString(vector[0])
                const scriptPubKey = new Script().fromBitcoindString(vector[1])
                const flags = Interp.getFlags(vector[2])
                const expectedError = vector[3]

                const hashBuf = Buffer.alloc(32)
                hashBuf.fill(0)
                const credtx = new Tx()
                credtx.addTxIn(hashBuf, 0xffffffff, new Script().writeString('OP_0 OP_0'), 0xffffffff)
                credtx.addTxOut(new Bn(0), scriptPubKey)

                const idbuf = credtx.hash()
                const spendtx = new Tx()
                spendtx.addTxIn(idbuf, 0, scriptSig, 0xffffffff)
                spendtx.addTxOut(new Bn(0), new Script())

                const interp = new Interp()
                const valueBn = new Bn(0)
                const verified = interp.verify(scriptSig, scriptPubKey, spendtx, 0, flags, valueBn)
                try {
                    if (expectedError === 'OK') {
                        verified.should.equal(true)
                    } else {
                        verified.should.equal(false)
                    }
                } catch (err) {
                    console.log(vector)
                    throw new Error('failure' + err.message)
                }
            })
        })

        c = 0
        // eslint-disable-next-line ban/ban
        bitcoindScriptValid.forEach((vector) => {
            if (vector.length === 1) {
                return
            }
            c++
            it('should verify bitcoindScriptValid vector ' + c, () => {
                const scriptSig = new Script().fromBitcoindString(vector[0])
                const scriptPubKey = new Script().fromBitcoindString(vector[1])
                const flags = Interp.getFlags(vector[2])

                const hashBuf = Buffer.alloc(32)
                hashBuf.fill(0)
                const credtx = new Tx()
                credtx.addTxIn(hashBuf, 0xffffffff, new Script().writeString('OP_0 OP_0'), 0xffffffff)
                credtx.addTxOut(new Bn(0), scriptPubKey)

                const idbuf = credtx.hash()
                const spendtx = new Tx()
                spendtx.addTxIn(idbuf, 0, scriptSig, 0xffffffff)
                spendtx.addTxOut(new Bn(0), new Script())

                const interp = new Interp()
                const verified = interp.verify(scriptSig, scriptPubKey, spendtx, 0, flags)
                verified.should.equal(true)
            })
        })

        c = 0
        // eslint-disable-next-line ban/ban
        bitcoindScriptInvalid.forEach((vector) => {
            if (vector.length === 1) {
                return
            }
            c++
            it('should unverify bitcoindScriptInvalid vector ' + c, () => {
                const scriptSig = new Script().fromBitcoindString(vector[0])
                const scriptPubKey = new Script().fromBitcoindString(vector[1])
                const flags = Interp.getFlags(vector[2])

                const hashBuf = Buffer.alloc(32)
                hashBuf.fill(0)
                const credtx = new Tx()
                credtx.addTxIn(hashBuf, 0xffffffff, new Script().writeString('OP_0 OP_0'), 0xffffffff)
                credtx.addTxOut(new Bn(0), scriptPubKey)

                const idbuf = credtx.hash()
                const spendtx = new Tx()
                spendtx.addTxIn(idbuf, 0, scriptSig, 0xffffffff)
                spendtx.addTxOut(new Bn(0), new Script())

                const interp = new Interp()
                const verified = interp.verify(scriptSig, scriptPubKey, spendtx, 0, flags)
                verified.should.equal(false)
            })
        })
    })
})
