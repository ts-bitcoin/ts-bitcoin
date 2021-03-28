/* eslint-disable @typescript-eslint/no-shadow */
/**
 * Script Interpreter
 * ==================
 *
 * Bitcoin transactions contain scripts. Each input has a script called the
 * scriptSig, and each output has a script called the scriptPubKey. To validate
 * an input, the ScriptSig is executed, then with the same stack, the
 * scriptPubKey from the output corresponding to that input is run. The primary
 * way to use this class is via the verify function:
 *
 * new Interp().verify( ... )
 *
 * In some ways, the script interpreter is one of the most poorly architected
 * components of Yours Bitcoin because of the giant switch statement in step(). But
 * that is deliberately so to make it similar to bitcoin core, and thus easier
 * to audit.
 */
import { Bn } from './bn'
import { Br } from './br'
import { Bw } from './bw'
import { cmp } from './cmp'
import { Hash } from './hash'
import { OpCode } from './op-code'
import { PubKey } from './pub-key'
import { Script } from './script'
import { Sig } from './sig'
import { Struct } from './struct'
import { Tx, TxLike } from './tx'
import { TxIn } from './tx-in'

interface InterpLike {
    script: string
    tx?: TxLike
    nIn: number
    stack: string[]
    altStack: string[]
    pc: number
    pBeginCodeHash: number
    nOpCount: number
    ifStack: boolean[]
    errStr: string
    flags: number
}

export class Interp extends Struct {
    public static readonly true = Buffer.from([1])
    public static readonly false = Buffer.from([])

    public static readonly MAX_SCRIPT_ELEMENT_SIZE = 520
    public static readonly LOCKTIME_THRESHOLD = 500000000 // Tue Nov  5 00:53:20 1985 UTC

    // flags taken from bitcoin core
    // bitcoin core commit: b5d1b1092998bc95313856d535c632ea5a8f9104
    public static readonly SCRIPT_VERIFY_NONE = 0

    // Evaluate P2SH subScripts (softfork safe, Bip16).
    public static readonly SCRIPT_VERIFY_P2SH = 1 << 0

    // Passing a non-strict-DER signature or one with undefined hashtype to a checksig operation causes script failure.
    // Passing a pubKey that is not (0x04 + 64 bytes) or (0x02 or 0x03 + 32 bytes) to checksig causes that pubKey to be
    // skipped (not softfork safe: this flag can widen the validity of OP_CHECKSIG OP_NOT).
    public static readonly SCRIPT_VERIFY_STRICTENC = 1 << 1

    // Passing a non-strict-DER signature to a checksig operation causes script failure (softfork safe, Bip62 rule 1)
    public static readonly SCRIPT_VERIFY_DERSIG = 1 << 2

    // Passing a non-strict-DER signature or one with S > order/2 to a checksig operation causes script failure
    // (softfork safe, Bip62 rule 5).
    public static readonly SCRIPT_VERIFY_LOW_S = 1 << 3

    // verify dummy stack item consumed by CHECKMULTISIG is of zero-length (softfork safe, Bip62 rule 7).
    public static readonly SCRIPT_VERIFY_NULLDUMMY = 1 << 4

    // Using a non-push operator in the scriptSig causes script failure (softfork safe, Bip62 rule 2).
    public static readonly SCRIPT_VERIFY_SIGPUSHONLY = 1 << 5

    // Require minimal encodings for all push operations (OP_0... OP_16, OP_1NEGATE where possible, direct
    // pushes up to 75 bytes, OP_PUSHDATA up to 255 bytes, OP_PUSHDATA2 for anything larger). Evaluating
    // any other push causes the script to fail (Bip62 rule 3).
    // In addition, whenever a stack element is interpreted as a number, it must be of minimal length (Bip62 rule 4).
    // (softfork safe)
    public static readonly SCRIPT_VERIFY_MINIMALDATA = 1 << 6

    // Discourage use of NOPs reserved for upgrades (NOP1-10)
    //
    // Provided so that nodes can avoid accepting or mining transactions
    // containing executed NOP's whose meaning may change after a soft-fork,
    // thus rendering the script invalid; with this flag set executing
    // discouraged NOPs fails the script. This verification flag will never be
    // a mandatory flag applied to scripts in a block. NOPs that are not
    // executed, e.g.  within an unexecuted IF ENDIF block, are *not* rejected.
    public static readonly SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS = 1 << 7

    // Require that only a single stack element remains after evaluation. This
    // changes the success criterion from "At least one stack element must
    // remain, and when interpreted as a boolean, it must be true" to "Exactly
    // one stack element must remain, and when interpreted as a boolean, it must
    // be true".  (softfork safe, Bip62 rule 6)
    // Note: CLEANSTACK should never be used without P2SH.
    public static readonly SCRIPT_VERIFY_CLEANSTACK = 1 << 8

    // Verify CHECKLOCKTIMEVERIFY
    //
    // See Bip65 for details.
    public static readonly SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY = 1 << 9

    // support CHECKSEQUENCEVERIFY opCode
    //
    // See Bip112 for details
    public static readonly SCRIPT_VERIFY_CHECKSEQUENCEVERIFY = 1 << 10

    // used for UAHF
    // https://github.com/Bitcoin-UAHF/spec/blob/master/replay-protected-sighash.md
    public static readonly SCRIPT_ENABLE_SIGHASH_FORKID = 1 << 16

    // These are the things we wish to verify by default. At the time of writing,
    // P2SH and CHECKLOCKTIMEVERIFY are both active, but CHECKSEQUENCEVERIFY is
    // not.
    public static readonly defaultFlags = Interp.SCRIPT_VERIFY_P2SH | Interp.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY
    // Interp.defaultFlags = Interp.SCRIPT_VERIFY_P2SH | Interp.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY | Interp.SCRIPT_VERIFY_CHECKSEQUENCEVERIFY

    public script: Script
    public tx: Tx
    public nIn: number
    public stack: Buffer[]
    public altStack: Buffer[]
    public pc: number
    public pBeginCodeHash: number
    public nOpCount: number
    public ifStack: boolean[]
    public errStr: string
    public flags: number
    public valueBn: Bn

    constructor(
        script?: Script,
        tx?: Tx,
        nIn?: number,
        stack: Buffer[] = [],
        altStack: Buffer[] = [],
        pc = 0,
        pBeginCodeHash = 0,
        nOpCount = 0,
        ifStack: boolean[] = [],
        errStr = '',
        flags = Interp.defaultFlags,
        valueBn: Bn = new Bn(0)
    ) {
        super({
            script,
            tx,
            nIn,
            stack,
            altStack,
            pc,
            pBeginCodeHash,
            nOpCount,
            ifStack,
            errStr,
            flags,
            valueBn,
        })
    }

    public initialize(): this {
        this.script = new Script()
        this.stack = []
        this.altStack = []
        this.pc = 0
        this.pBeginCodeHash = 0
        this.nOpCount = 0
        this.ifStack = []
        this.errStr = ''
        this.flags = Interp.defaultFlags
        return this
    }

    public fromJSON(json: InterpLike): this {
        this.fromJSONNoTx(json)
        this.tx = json.tx ? new Tx().fromJSON(json.tx) : undefined
        return this
    }
    /**
     * Convert JSON containing everything but the tx to an interp object.
     */
    public fromJSONNoTx(json: InterpLike): this {
        this.fromObject({
            script: json.script !== undefined ? new Script().fromJSON(json.script) : undefined,
            nIn: json.nIn,
        })
        this.stack = []
        for (const hex of json.stack) {
            this.stack.push(Buffer.from(hex, 'hex'))
        }
        this.altStack = []
        for (const hex of json.altStack) {
            this.altStack.push(Buffer.from(hex, 'hex'))
        }
        this.fromObject({
            pc: json.pc,
            pBeginCodeHash: json.pBeginCodeHash,
            nOpCount: json.nOpCount,
            ifStack: json.ifStack,
            errStr: json.errStr,
            flags: json.flags,
        })
        return this
    }

    public fromBr(br: Br): this {
        const jsonNoTxBufLEn = br.readVarIntNum()
        const jsonNoTxBuf = br.read(jsonNoTxBufLEn)
        this.fromJSONNoTx(JSON.parse(jsonNoTxBuf.toString()))
        const txbuflen = br.readVarIntNum()
        if (txbuflen > 0) {
            const txbuf = br.read(txbuflen)
            this.tx = new Tx().fromFastBuffer(txbuf)
        }
        return this
    }

    public toJSON(): InterpLike {
        const json = this.toJSONNoTx()
        json.tx = this.tx ? this.tx.toJSON() : undefined
        return json
    }

    /**
     * Convert everything but the tx to JSON.
     */
    public toJSONNoTx(): InterpLike {
        const stack: string[] = []
        for (const buf of this.stack) {
            stack.push(buf.toString('hex'))
        }
        const altStack: string[] = []
        for (const buf of this.altStack) {
            altStack.push(buf.toString('hex'))
        }
        return {
            script: this.script ? this.script.toJSON() : undefined,
            nIn: this.nIn,
            stack,
            altStack,
            pc: this.pc,
            pBeginCodeHash: this.pBeginCodeHash,
            nOpCount: this.nOpCount,
            ifStack: this.ifStack,
            errStr: this.errStr,
            flags: this.flags,
        }
    }

    public toBw(bw?: Bw): Bw {
        if (!bw) {
            bw = new Bw()
        }
        const jsonNoTxBuf = Buffer.from(JSON.stringify(this.toJSONNoTx()))
        bw.writeVarIntNum(jsonNoTxBuf.length)
        bw.write(jsonNoTxBuf)
        if (this.tx) {
            const txbuf = this.tx.toFastBuffer()
            bw.writeVarIntNum(txbuf.length)
            bw.write(txbuf)
        } else {
            bw.writeVarIntNum(0)
        }
        return bw
    }

    /**
     * In order to make auduting the script interpreter easier, we use the same
     * constants as bitcoin core, including the flags, which customize the
     * operation of the interpreter.
     */
    public static getFlags(flagstr: string): number {
        let flags = 0
        if (flagstr.indexOf('NONE') !== -1) {
            flags = flags | Interp.SCRIPT_VERIFY_NONE
        }
        if (flagstr.indexOf('P2SH') !== -1) {
            flags = flags | Interp.SCRIPT_VERIFY_P2SH
        }
        if (flagstr.indexOf('STRICTENC') !== -1) {
            flags = flags | Interp.SCRIPT_VERIFY_STRICTENC
        }
        if (flagstr.indexOf('DERSIG') !== -1) {
            flags = flags | Interp.SCRIPT_VERIFY_DERSIG
        }
        if (flagstr.indexOf('LOW_S') !== -1) {
            flags = flags | Interp.SCRIPT_VERIFY_LOW_S
        }
        if (flagstr.indexOf('NULLDUMMY') !== -1) {
            flags = flags | Interp.SCRIPT_VERIFY_NULLDUMMY
        }
        if (flagstr.indexOf('SIGPUSHONLY') !== -1) {
            flags = flags | Interp.SCRIPT_VERIFY_SIGPUSHONLY
        }
        if (flagstr.indexOf('MINIMALDATA') !== -1) {
            flags = flags | Interp.SCRIPT_VERIFY_MINIMALDATA
        }
        if (flagstr.indexOf('DISCOURAGE_UPGRADABLE_NOPS') !== -1) {
            flags = flags | Interp.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS
        }
        if (flagstr.indexOf('CLEANSTACK') !== -1) {
            flags = flags | Interp.SCRIPT_VERIFY_CLEANSTACK
        }
        if (flagstr.indexOf('CHECKLOCKTIMEVERIFY') !== -1) {
            flags = flags | Interp.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY
        }
        if (flagstr.indexOf('CHECKSEQUENCEVERIFY') !== -1) {
            flags = flags | Interp.SCRIPT_VERIFY_CHECKSEQUENCEVERIFY
        }
        if (flagstr.indexOf('SIGHASH_FORKID') !== -1) {
            flags = flags | Interp.SCRIPT_ENABLE_SIGHASH_FORKID
        }
        return flags
    }

    public static castToBool(buf: Buffer): boolean {
        for (let i = 0; i < buf.length; i++) {
            if (buf[i] !== 0) {
                // can be negative zero
                if (i === buf.length - 1 && buf[i] === 0x80) {
                    return false
                }
                return true
            }
        }
        return false
    }

    /**
     * Translated from bitcoin core's CheckSigEncoding
     */
    public checkSigEncoding(buf: Buffer): boolean {
        // Empty signature. Not strictly DER encoded, but allowed to provide a
        // compact way to provide an invalid signature for use with CHECK(MULTI)SIG
        if (buf.length === 0) {
            return true
        }
        if (
            (this.flags &
                (Interp.SCRIPT_VERIFY_DERSIG | Interp.SCRIPT_VERIFY_LOW_S | Interp.SCRIPT_VERIFY_STRICTENC)) !==
                0 &&
            !Sig.IsTxDer(buf)
        ) {
            this.errStr = 'SCRIPT_ERR_SIG_DER'
            return false
        } else if ((this.flags & Interp.SCRIPT_VERIFY_LOW_S) !== 0) {
            const sig = new Sig().fromTxFormat(buf)
            if (!sig.hasLowS()) {
                this.errStr = 'SCRIPT_ERR_SIG_DER'
                return false
            }
        } else if ((this.flags & Interp.SCRIPT_VERIFY_STRICTENC) !== 0) {
            const sig = new Sig().fromTxFormat(buf)
            if (!sig.hasDefinedHashType()) {
                this.errStr = 'SCRIPT_ERR_SIG_HASHTYPE'
                return false
            }
        }
        return true
    }

    /**
     * Translated from bitcoin core's CheckPubKeyEncoding
     */
    public checkPubKeyEncoding(buf: Buffer): boolean {
        if ((this.flags & Interp.SCRIPT_VERIFY_STRICTENC) !== 0 && !PubKey.isCompressedOrUncompressed(buf)) {
            this.errStr = 'SCRIPT_ERR_PUBKEYTYPE'
            return false
        }
        return true
    }

    /**
     * Translated from bitcoin core's CheckLockTime
     */
    public checkLockTime(nLockTime: number): boolean {
        // There are two kinds of nLockTime: lock-by-blockheight
        // and lock-by-blocktime, distinguished by whether
        // nLockTime < LOCKTIME_THRESHOLD.
        //
        // We want to compare apples to apples, so fail the script
        // unless the type of nLockTime being tested is the same as
        // the nLockTime in the transaction.
        if (
            !(
                (this.tx.nLockTime < Interp.LOCKTIME_THRESHOLD && nLockTime < Interp.LOCKTIME_THRESHOLD) ||
                (this.tx.nLockTime >= Interp.LOCKTIME_THRESHOLD && nLockTime >= Interp.LOCKTIME_THRESHOLD)
            )
        ) {
            return false
        }

        // Now that we know we're comparing apples-to-apples, the
        // comparison is a simple numeric one.
        if (nLockTime > this.tx.nLockTime) {
            return false
        }

        // Finally the nLockTime feature can be disabled and thus
        // CHECKLOCKTIMEVERIFY bypassed if every txIn has been
        // finalized by setting nSequence to maxint. The
        // transaction would be allowed into the blockchain, making
        // the opCode ineffective.
        //
        // Testing if this vin is not final is sufficient to
        // prevent this condition. Alternatively we could test all
        // inputs, but testing just this input minimizes the data
        // required to prove correct CHECKLOCKTIMEVERIFY execution.
        if (TxIn.SEQUENCE_FINAL === this.tx.txIns[this.nIn].nSequence) {
            return false
        }

        return true
    }

    /**
     * Translated from bitcoin core's CheckSequence.
     */
    public checkSequence(nSequence: number): boolean {
        // Relative lock times are supported by comparing the passed
        // in operand to the sequence number of the input.
        const txToSequence = this.tx.txIns[this.nIn].nSequence

        // Fail if the transaction's version number is not set high
        // enough to trigger Bip 68 rules.
        if (this.tx.versionBytesNum < 2) {
            return false
        }

        // Sequence numbers with their most significant bit set are not
        // consensus constrained. Testing that the transaction's sequence
        // number do not have this bit set prevents using this property
        // to get around a CHECKSEQUENCEVERIFY check.
        if (txToSequence & TxIn.SEQUENCE_LOCKTIME_DISABLE_FLAG) {
            return false
        }

        // Mask off any bits that do not have consensus-enforced meaning
        // before doing the integer comparisons
        const nLockTimeMask = TxIn.SEQUENCE_LOCKTIME_TYPE_FLAG | TxIn.SEQUENCE_LOCKTIME_MASK
        const txToSequenceMasked = txToSequence & nLockTimeMask
        const nSequenceMasked = nSequence & nLockTimeMask

        // There are two kinds of nSequence: lock-by-blockheight
        // and lock-by-blocktime, distinguished by whether
        // nSequenceMasked < CTxIn::SEQUENCE_LOCKTIME_TYPE_FLAG.
        //
        // We want to compare apples to apples, so fail the script
        // unless the type of nSequenceMasked being tested is the same as
        // the nSequenceMasked in the transaction.
        if (
            !(
                (txToSequenceMasked < TxIn.SEQUENCE_LOCKTIME_TYPE_FLAG &&
                    nSequenceMasked < TxIn.SEQUENCE_LOCKTIME_TYPE_FLAG) ||
                (txToSequenceMasked >= TxIn.SEQUENCE_LOCKTIME_TYPE_FLAG &&
                    nSequenceMasked >= TxIn.SEQUENCE_LOCKTIME_TYPE_FLAG)
            )
        ) {
            return false
        }

        // Now that we know we're comparing apples-to-apples, the
        // comparison is a simple numeric one.
        if (nSequenceMasked > txToSequenceMasked) {
            return false
        }

        return true
    }

    /**
     * Based on bitcoin core's EvalScript function, with the inner loop moved to
     * Interp.prototype.step()
     * bitcoin core commit: b5d1b1092998bc95313856d535c632ea5a8f9104
     */
    public *eval(): Generator<boolean, void, unknown> {
        if (this.script.toBuffer().length > 10000) {
            this.errStr = 'SCRIPT_ERR_SCRIPT_SIZE'
            yield false
        }

        try {
            while (this.pc < this.script.chunks.length) {
                const fSuccess = this.step()
                if (!fSuccess) {
                    yield false
                } else {
                    yield fSuccess
                }
            }

            // Size limits
            if (this.stack.length + this.altStack.length > 1000) {
                this.errStr = 'SCRIPT_ERR_STACK_SIZE'
                yield false
            }
        } catch (e) {
            this.errStr = 'SCRIPT_ERR_UNKNOWN_ERROR: ' + e
            yield false
        }

        if (this.ifStack.length > 0) {
            this.errStr = 'SCRIPT_ERR_UNBALANCED_CONDITIONAL'
            yield false
        }

        yield true
    }

    /**
     * Based on the inner loop of bitcoin core's EvalScript function
     */
    public step(): boolean {
        const fRequireMinimal = (this.flags & Interp.SCRIPT_VERIFY_MINIMALDATA) !== 0

        // bool fExec = !count(ifStack.begin(), ifStack.end(), false)
        const fExec = !(this.ifStack.indexOf(false) + 1)

        //
        // Read instruction
        //
        const chunk = this.script.chunks[this.pc]
        this.pc++
        const opCodeNum = chunk.opCodeNum
        if (opCodeNum === undefined) {
            this.errStr = 'SCRIPT_ERR_BAD_OPCODE'
            return false
        }
        if (chunk.buf && chunk.buf.length > Interp.MAX_SCRIPT_ELEMENT_SIZE) {
            this.errStr = 'SCRIPT_ERR_PUSH_SIZE'
            return false
        }

        // Note how OpCode.OP_RESERVED does not count towards the opCode limit.
        if (opCodeNum > OpCode.OP_16 && ++this.nOpCount > 201) {
            this.errStr = 'SCRIPT_ERR_OP_COUNT'
            return false
        }

        if (
            opCodeNum === OpCode.OP_LEFT ||
            opCodeNum === OpCode.OP_RIGHT ||
            opCodeNum === OpCode.OP_2MUL ||
            opCodeNum === OpCode.OP_2DIV
        ) {
            this.errStr = 'SCRIPT_ERR_DISABLED_OPCODE'
            return false
        }

        if (fExec && opCodeNum >= 0 && opCodeNum <= OpCode.OP_PUSHDATA4) {
            if (fRequireMinimal && !this.script.checkMinimalPush(this.pc - 1)) {
                this.errStr = 'SCRIPT_ERR_MINIMALDATA'
                return false
            }
            if (!chunk.buf) {
                this.stack.push(Interp.false)
            } else if (chunk.len !== chunk.buf.length) {
                throw new Error('LEngth of push value not equal to length of data')
            } else {
                this.stack.push(chunk.buf)
            }
        } else if (fExec || (OpCode.OP_IF <= opCodeNum && opCodeNum <= OpCode.OP_ENDIF)) {
            switch (opCodeNum) {
                //
                // Push value
                //
                case OpCode.OP_1NEGATE:
                case OpCode.OP_1:
                case OpCode.OP_2:
                case OpCode.OP_3:
                case OpCode.OP_4:
                case OpCode.OP_5:
                case OpCode.OP_6:
                case OpCode.OP_7:
                case OpCode.OP_8:
                case OpCode.OP_9:
                case OpCode.OP_10:
                case OpCode.OP_11:
                case OpCode.OP_12:
                case OpCode.OP_13:
                case OpCode.OP_14:
                case OpCode.OP_15:
                case OpCode.OP_16:
                    {
                        // ( -- value)
                        // ScriptNum bn((int)opCode - (int)(OpCode.OP_1 - 1))
                        const n = opCodeNum - (OpCode.OP_1 - 1)
                        const buf = new Bn(n).toScriptNumBuffer()
                        this.stack.push(buf)
                        // The result of these opCodes should always be the minimal way to push the data
                        // they push, so no need for a CheckMinimalPush here.
                    }
                    break

                //
                // Control
                //
                case OpCode.OP_NOP:
                    break

                case OpCode.OP_CHECKLOCKTIMEVERIFY:
                    {
                        if (!(this.flags & Interp.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY)) {
                            // not enabled; treat as a NOP2
                            if (this.flags & Interp.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS) {
                                this.errStr = 'SCRIPT_ERR_DISCOURAGE_UPGRADABLE_NOPS'
                                return false
                            }
                            break
                        }

                        if (this.stack.length < 1) {
                            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                            return false
                        }

                        // Note that elsewhere numeric opCodes are limited to
                        // operands in the range -2**31+1 to 2**31-1, however it is
                        // legal for opCodes to produce results exceeding that
                        // range. This limitation is implemented by CScriptNum's
                        // default 4-byte limit.
                        //
                        // If we kept to that limit we'd have a year 2038 problem,
                        // even though the nLockTime field in transactions
                        // themselves is uint32 which only becomes meaningless
                        // after the year 2106.
                        //
                        // Thus as a special case we tell CScriptNum to accept up
                        // to 5-byte bignums, which are good until 2**39-1, well
                        // beyond the 2**32-1 limit of the nLockTime field itself.
                        const nLockTimebuf = this.stack[this.stack.length - 1]
                        const nLockTimebn = new Bn().fromScriptNumBuffer(nLockTimebuf, fRequireMinimal, 5)
                        const nLockTime = nLockTimebn.toNumber()

                        // In the rare event that the argument may be < 0 due to
                        // some arithmetic being done first, you can always use
                        // 0 MAX CHECKLOCKTIMEVERIFY.
                        if (nLockTime < 0) {
                            this.errStr = 'SCRIPT_ERR_NEGATIVE_LOCKTIME'
                            return false
                        }

                        // Actually compare the specified lock time with the transaction.
                        if (!this.checkLockTime(nLockTime)) {
                            this.errStr = 'SCRIPT_ERR_UNSATISFIED_LOCKTIME'
                            return false
                        }
                    }
                    break

                case OpCode.OP_CHECKSEQUENCEVERIFY:
                    {
                        if (!(this.flags & Interp.SCRIPT_VERIFY_CHECKSEQUENCEVERIFY)) {
                            // not enabled; treat as a NOP3
                            if (this.flags & Interp.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS) {
                                this.errStr = 'SCRIPT_ERR_DISCOURAGE_UPGRADABLE_NOPS'
                                return false
                            }
                            break
                        }

                        if (this.stack.length < 1) {
                            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                            return false
                        }

                        // nSequence, like nLockTime, is a 32-bit unsigned integer
                        // field. See the comment in CHECKLOCKTIMEVERIFY regarding
                        // 5-byte numeric operands.
                        const nSequencebuf = this.stack[this.stack.length - 1]
                        const nSequencebn = new Bn().fromScriptNumBuffer(nSequencebuf, fRequireMinimal, 5)
                        const nSequence = nSequencebn.toNumber()

                        // In the rare event that the argument may be < 0 due to
                        // some arithmetic being done first, you can always use
                        // 0 MAX CHECKSEQUENCEVERIFY.
                        if (nSequence < 0) {
                            this.errStr = 'SCRIPT_ERR_NEGATIVE_LOCKTIME'
                            return false
                        }

                        // To provide for future soft-fork extensibility, if the
                        // operand has the disabled lock-time flag set,
                        // CHECKSEQUENCEVERIFY behaves as a NOP.
                        if ((nSequence & TxIn.SEQUENCE_LOCKTIME_DISABLE_FLAG) !== 0) {
                            break
                        }

                        // Compare the specified sequence number with the input.
                        if (!this.checkSequence(nSequence)) {
                            this.errStr = 'SCRIPT_ERR_UNSATISFIED_LOCKTIME'
                            return false
                        }
                    }
                    break

                case OpCode.OP_NOP1:
                case OpCode.OP_NOP3:
                case OpCode.OP_NOP4:
                case OpCode.OP_NOP5:
                case OpCode.OP_NOP6:
                case OpCode.OP_NOP7:
                case OpCode.OP_NOP8:
                case OpCode.OP_NOP9:
                case OpCode.OP_NOP10:
                    if (this.flags & Interp.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS) {
                        this.errStr = 'SCRIPT_ERR_DISCOURAGE_UPGRADABLE_NOPS'
                        return false
                    }
                    break

                case OpCode.OP_IF:
                case OpCode.OP_NOTIF:
                    {
                        // <expression> if [statements] [else [statements]] endif
                        // bool fValue = false
                        let fValue = false
                        if (fExec) {
                            if (this.stack.length < 1) {
                                this.errStr = 'SCRIPT_ERR_UNBALANCED_CONDITIONAL'
                                return false
                            }
                            const buf = this.stack.pop()
                            fValue = Interp.castToBool(buf)
                            if (opCodeNum === OpCode.OP_NOTIF) {
                                fValue = !fValue
                            }
                        }
                        this.ifStack.push(fValue)
                    }
                    break

                case OpCode.OP_ELSE:
                    if (this.ifStack.length === 0) {
                        this.errStr = 'SCRIPT_ERR_UNBALANCED_CONDITIONAL'
                        return false
                    }
                    this.ifStack[this.ifStack.length - 1] = !this.ifStack[this.ifStack.length - 1]
                    break

                case OpCode.OP_ENDIF:
                    if (this.ifStack.length === 0) {
                        this.errStr = 'SCRIPT_ERR_UNBALANCED_CONDITIONAL'
                        return false
                    }
                    this.ifStack.pop()
                    break

                case OpCode.OP_VERIFY:
                    {
                        // (true -- ) or
                        // (false -- false) and return
                        if (this.stack.length < 1) {
                            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                            return false
                        }
                        const buf = this.stack[this.stack.length - 1]
                        const fValue = Interp.castToBool(buf)
                        if (fValue) {
                            this.stack.pop()
                        } else {
                            this.errStr = 'SCRIPT_ERR_VERIFY'
                            return false
                        }
                    }
                    break

                case OpCode.OP_RETURN: {
                    this.errStr = 'SCRIPT_ERR_OP_RETURN'
                    return false
                }
                // unreachable code: break

                //
                // Stack ops
                //
                case OpCode.OP_TOALTSTACK:
                    if (this.stack.length < 1) {
                        this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                        return false
                    }
                    this.altStack.push(this.stack.pop())
                    break

                case OpCode.OP_FROMALTSTACK:
                    if (this.altStack.length < 1) {
                        this.errStr = 'SCRIPT_ERR_INVALID_ALTSTACK_OPERATION'
                        return false
                    }
                    this.stack.push(this.altStack.pop())
                    break

                case OpCode.OP_2DROP:
                    // (x1 x2 -- )
                    if (this.stack.length < 2) {
                        this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                        return false
                    }
                    this.stack.pop()
                    this.stack.pop()
                    break

                case OpCode.OP_2DUP:
                    {
                        // (x1 x2 -- x1 x2 x1 x2)
                        if (this.stack.length < 2) {
                            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                            return false
                        }
                        const buf1 = this.stack[this.stack.length - 2]
                        const buf2 = this.stack[this.stack.length - 1]
                        this.stack.push(buf1)
                        this.stack.push(buf2)
                    }
                    break

                case OpCode.OP_3DUP:
                    {
                        // (x1 x2 x3 -- x1 x2 x3 x1 x2 x3)
                        if (this.stack.length < 3) {
                            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                            return false
                        }
                        const buf1 = this.stack[this.stack.length - 3]
                        const buf2 = this.stack[this.stack.length - 2]
                        const buf3 = this.stack[this.stack.length - 1]
                        this.stack.push(buf1)
                        this.stack.push(buf2)
                        this.stack.push(buf3)
                    }
                    break

                case OpCode.OP_2OVER:
                    {
                        // (x1 x2 x3 x4 -- x1 x2 x3 x4 x1 x2)
                        if (this.stack.length < 4) {
                            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                            return false
                        }
                        const buf1 = this.stack[this.stack.length - 4]
                        const buf2 = this.stack[this.stack.length - 3]
                        this.stack.push(buf1)
                        this.stack.push(buf2)
                    }
                    break

                case OpCode.OP_2ROT:
                    {
                        // (x1 x2 x3 x4 x5 x6 -- x3 x4 x5 x6 x1 x2)
                        if (this.stack.length < 6) {
                            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                            return false
                        }
                        const spliced = this.stack.splice(this.stack.length - 6, 2)
                        this.stack.push(spliced[0])
                        this.stack.push(spliced[1])
                    }
                    break

                case OpCode.OP_2SWAP:
                    {
                        // (x1 x2 x3 x4 -- x3 x4 x1 x2)
                        if (this.stack.length < 4) {
                            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                            return false
                        }
                        const spliced = this.stack.splice(this.stack.length - 4, 2)
                        this.stack.push(spliced[0])
                        this.stack.push(spliced[1])
                    }
                    break

                case OpCode.OP_IFDUP:
                    {
                        // (x - 0 | x x)
                        if (this.stack.length < 1) {
                            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                            return false
                        }
                        const buf = this.stack[this.stack.length - 1]
                        const fValue = Interp.castToBool(buf)
                        if (fValue) {
                            this.stack.push(buf)
                        }
                    }
                    break

                case OpCode.OP_DEPTH:
                    {
                        // -- stacksize
                        const buf = new Bn(this.stack.length).toScriptNumBuffer()
                        this.stack.push(buf)
                    }
                    break

                case OpCode.OP_DROP:
                    // (x -- )
                    if (this.stack.length < 1) {
                        this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                        return false
                    }
                    this.stack.pop()
                    break

                case OpCode.OP_DUP:
                    // (x -- x x)
                    if (this.stack.length < 1) {
                        this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                        return false
                    }
                    this.stack.push(this.stack[this.stack.length - 1])
                    break

                case OpCode.OP_NIP:
                    // (x1 x2 -- x2)
                    if (this.stack.length < 2) {
                        this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                        return false
                    }
                    this.stack.splice(this.stack.length - 2, 1)
                    break

                case OpCode.OP_OVER:
                    // (x1 x2 -- x1 x2 x1)
                    if (this.stack.length < 2) {
                        this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                        return false
                    }
                    this.stack.push(this.stack[this.stack.length - 2])
                    break

                case OpCode.OP_PICK:
                case OpCode.OP_ROLL:
                    {
                        // (xn ... x2 x1 x0 n - xn ... x2 x1 x0 xn)
                        // (xn ... x2 x1 x0 n - ... x2 x1 x0 xn)
                        if (this.stack.length < 2) {
                            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                            return false
                        }
                        let buf = this.stack[this.stack.length - 1]
                        const bn = new Bn().fromScriptNumBuffer(buf, fRequireMinimal)
                        const n = bn.toNumber()
                        this.stack.pop()
                        if (n < 0 || n >= this.stack.length) {
                            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                            return false
                        }
                        buf = this.stack[this.stack.length - n - 1]
                        if (opCodeNum === OpCode.OP_ROLL) {
                            this.stack.splice(this.stack.length - n - 1, 1)
                        }
                        this.stack.push(buf)
                    }
                    break

                case OpCode.OP_ROT:
                    {
                        // (x1 x2 x3 -- x2 x3 x1)
                        //  x2 x1 x3  after first swap
                        //  x2 x3 x1  after second swap
                        if (this.stack.length < 3) {
                            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                            return false
                        }
                        const x1 = this.stack[this.stack.length - 3]
                        const x2 = this.stack[this.stack.length - 2]
                        const x3 = this.stack[this.stack.length - 1]
                        this.stack[this.stack.length - 3] = x2
                        this.stack[this.stack.length - 2] = x3
                        this.stack[this.stack.length - 1] = x1
                    }
                    break

                case OpCode.OP_SWAP:
                    {
                        // (x1 x2 -- x2 x1)
                        if (this.stack.length < 2) {
                            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                            return false
                        }
                        const x1 = this.stack[this.stack.length - 2]
                        const x2 = this.stack[this.stack.length - 1]
                        this.stack[this.stack.length - 2] = x2
                        this.stack[this.stack.length - 1] = x1
                    }
                    break

                case OpCode.OP_TUCK:
                    // (x1 x2 -- x2 x1 x2)
                    if (this.stack.length < 2) {
                        this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                        return false
                    }
                    this.stack.splice(this.stack.length - 2, 0, this.stack[this.stack.length - 1])
                    break

                case OpCode.OP_SIZE:
                    {
                        // (in -- in size)
                        if (this.stack.length < 1) {
                            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                            return false
                        }
                        const bn = new Bn(this.stack[this.stack.length - 1].length)
                        this.stack.push(bn.toScriptNumBuffer())
                    }
                    break

                //
                // Bitwise logic
                //
                case OpCode.OP_OR:
                case OpCode.OP_AND:
                case OpCode.OP_XOR:
                    // (x1 x2 -- out)
                    if (this.stack.length < 2) {
                        this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                        return false
                    }
                    const buf1 = this.stack[this.stack.length - 2]
                    const buf2 = this.stack[this.stack.length - 1]

                    if (buf1.length !== buf2.length) {
                        this.errStr = 'SCRIPT_ERR_INVALID_OPERAND_SIZE'
                        return false
                    }

                    switch (opCodeNum) {
                        case OpCode.OP_AND:
                            for (let i = 0; i < buf1.length; i++) {
                                buf1[i] &= buf2[i]
                            }
                            break
                        case OpCode.OP_OR:
                            for (let i = 0; i < buf1.length; i++) {
                                buf1[i] |= buf2[i]
                            }
                            break
                        case OpCode.OP_XOR:
                            for (let i = 0; i < buf1.length; i++) {
                                buf1[i] ^= buf2[i]
                            }
                            break
                    }

                    // pop out buf2
                    this.stack.pop()
                    break
                case OpCode.OP_INVERT:
                    // (x -- out)
                    if (this.stack.length < 1) {
                        this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                        return false
                    }
                    const buf = this.stack[this.stack.length - 1]
                    for (let i = 0; i < buf.length; i++) {
                        buf[i] = ~buf[i]
                    }
                    break
                case OpCode.OP_LSHIFT:
                case OpCode.OP_RSHIFT: {
                    // (x n -- out)
                    if (this.stack.length < 2) {
                        this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                        return false
                    }

                    const buf1 = this.stack[this.stack.length - 2]
                    let value = new Bn(buf1)
                    const n = new Bn()
                        .fromScriptNumBuffer(this.stack[this.stack.length - 1], fRequireMinimal)
                        .toNumber()
                    if (n < 0) {
                        this.errStr = 'SCRIPT_ERR_INVALID_NUMBER_RANGE'
                        return false
                    }

                    this.stack.pop()
                    this.stack.pop()

                    switch (opCodeNum) {
                        case OpCode.OP_LSHIFT:
                            value = value.ushln(n)
                            break
                        case OpCode.OP_RSHIFT:
                            value = value.ushrn(n)
                            break
                    }

                    let buf2 = value.toBuffer().slice(-buf1.length)
                    if (buf2.length < buf1.length) {
                        buf2 = Buffer.concat([Buffer.alloc(buf1.length - buf2.length), buf2])
                    }

                    this.stack.push(buf2)
                    break
                }
                case OpCode.OP_EQUAL:
                case OpCode.OP_EQUALVERIFY:
                    // case OpCode.OP_NOTEQUAL: // use OpCode.OP_NUMNOTEQUAL
                    {
                        // (x1 x2 - bool)
                        if (this.stack.length < 2) {
                            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                            return false
                        }
                        const buf1 = this.stack[this.stack.length - 2]
                        const buf2 = this.stack[this.stack.length - 1]
                        const fEqual = cmp(buf1, buf2)
                        // OpCode.OP_NOTEQUAL is disabled because it would be too easy to say
                        // something like n != 1 and have some wiseguy pass in 1 with extra
                        // zero bytes after it (numerically, 0x01 == 0x0001 == 0x000001)
                        // if (opCode == OpCode.OP_NOTEQUAL)
                        //  fEqual = !fEqual
                        this.stack.pop()
                        this.stack.pop()
                        this.stack.push(fEqual ? Interp.true : Interp.false)
                        if (opCodeNum === OpCode.OP_EQUALVERIFY) {
                            if (fEqual) {
                                this.stack.pop()
                            } else {
                                this.errStr = 'SCRIPT_ERR_EQUALVERIFY'
                                return false
                            }
                        }
                    }
                    break

                //
                // Numeric
                //
                case OpCode.OP_1ADD:
                case OpCode.OP_1SUB:
                case OpCode.OP_NEGATE:
                case OpCode.OP_ABS:
                case OpCode.OP_NOT:
                case OpCode.OP_0NOTEQUAL:
                    {
                        // (in -- out)
                        if (this.stack.length < 1) {
                            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                            return false
                        }
                        const buf = this.stack[this.stack.length - 1]
                        let bn = new Bn().fromScriptNumBuffer(buf, fRequireMinimal)
                        switch (opCodeNum) {
                            case OpCode.OP_1ADD:
                                bn = bn.add(1)
                                break
                            case OpCode.OP_1SUB:
                                bn = bn.sub(1)
                                break
                            case OpCode.OP_NEGATE:
                                bn = bn.neg()
                                break
                            case OpCode.OP_ABS:
                                if (bn.lt(0)) {
                                    bn = bn.neg()
                                }
                                break
                            case OpCode.OP_NOT:
                                bn = new Bn(~~bn.eq(0))
                                break
                            case OpCode.OP_0NOTEQUAL:
                                bn = new Bn(~~bn.neq(0))
                                break
                            // default:      assert(!"invalid opCode"); break; // TODO: does this ever occur?
                        }
                        this.stack.pop()
                        this.stack.push(bn.toScriptNumBuffer())
                    }
                    break

                case OpCode.OP_ADD:
                case OpCode.OP_SUB:
                case OpCode.OP_MUL:
                case OpCode.OP_DIV:
                case OpCode.OP_MOD:
                case OpCode.OP_BOOLAND:
                case OpCode.OP_BOOLOR:
                case OpCode.OP_NUMEQUAL:
                case OpCode.OP_NUMEQUALVERIFY:
                case OpCode.OP_NUMNOTEQUAL:
                case OpCode.OP_LESSTHAN:
                case OpCode.OP_GREATERTHAN:
                case OpCode.OP_LESSTHANOREQUAL:
                case OpCode.OP_GREATERTHANOREQUAL:
                case OpCode.OP_MIN:
                case OpCode.OP_MAX:
                    {
                        // (x1 x2 -- out)
                        if (this.stack.length < 2) {
                            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                            return false
                        }
                        const bn1 = new Bn().fromScriptNumBuffer(this.stack[this.stack.length - 2], fRequireMinimal)
                        const bn2 = new Bn().fromScriptNumBuffer(this.stack[this.stack.length - 1], fRequireMinimal)
                        let bn = new Bn(0)

                        switch (opCodeNum) {
                            case OpCode.OP_ADD:
                                bn = bn1.add(bn2)
                                break

                            case OpCode.OP_SUB:
                                bn = bn1.sub(bn2)
                                break

                            case OpCode.OP_MUL:
                                bn = bn1.mul(bn2)
                                break

                            case OpCode.OP_DIV:
                                if (bn2.eq(0)) {
                                    this.errStr = 'SCRIPT_ERR_DIV_BY_ZERO'
                                    return false
                                }
                                bn = bn1.div(bn2)
                                break

                            case OpCode.OP_MOD:
                                if (bn2.eq(0)) {
                                    this.errStr = 'SCRIPT_ERR_DIV_BY_ZERO'
                                    return false
                                }
                                bn = bn1.mod(bn2)
                                break

                            // case OpCode.OP_BOOLAND:       bn = (bn1 != bnZero && bn2 != bnZero); break
                            case OpCode.OP_BOOLAND:
                                bn = new Bn(~~(bn1.neq(0) && bn2.neq(0)))
                                break
                            // case OpCode.OP_BOOLOR:        bn = (bn1 != bnZero || bn2 != bnZero); break
                            case OpCode.OP_BOOLOR:
                                bn = new Bn(~~(bn1.neq(0) || bn2.neq(0)))
                                break
                            // case OpCode.OP_NUMEQUAL:      bn = (bn1 == bn2); break
                            case OpCode.OP_NUMEQUAL:
                                bn = new Bn(~~bn1.eq(bn2))
                                break
                            // case OpCode.OP_NUMEQUALVERIFY:    bn = (bn1 == bn2); break
                            case OpCode.OP_NUMEQUALVERIFY:
                                bn = new Bn(~~bn1.eq(bn2))
                                break
                            // case OpCode.OP_NUMNOTEQUAL:     bn = (bn1 != bn2); break
                            case OpCode.OP_NUMNOTEQUAL:
                                bn = new Bn(~~bn1.neq(bn2))
                                break
                            // case OpCode.OP_LESSTHAN:      bn = (bn1 < bn2); break
                            case OpCode.OP_LESSTHAN:
                                bn = new Bn(~~bn1.lt(bn2))
                                break
                            // case OpCode.OP_GREATERTHAN:     bn = (bn1 > bn2); break
                            case OpCode.OP_GREATERTHAN:
                                bn = new Bn(~~bn1.gt(bn2))
                                break
                            // case OpCode.OP_LESSTHANOREQUAL:   bn = (bn1 <= bn2); break
                            case OpCode.OP_LESSTHANOREQUAL:
                                bn = new Bn(~~bn1.leq(bn2))
                                break
                            // case OpCode.OP_GREATERTHANOREQUAL:  bn = (bn1 >= bn2); break
                            case OpCode.OP_GREATERTHANOREQUAL:
                                bn = new Bn(~~bn1.geq(bn2))
                                break
                            case OpCode.OP_MIN:
                                bn = bn1.lt(bn2) ? bn1 : bn2
                                break
                            case OpCode.OP_MAX:
                                bn = bn1.gt(bn2) ? bn1 : bn2
                                break
                            // default:           assert(!"invalid opCode"); break; //TODO: does this ever occur?
                        }
                        this.stack.pop()
                        this.stack.pop()
                        this.stack.push(bn.toScriptNumBuffer())

                        if (opCodeNum === OpCode.OP_NUMEQUALVERIFY) {
                            // if (CastToBool(stacktop(-1)))
                            if (Interp.castToBool(this.stack[this.stack.length - 1])) {
                                this.stack.pop()
                            } else {
                                this.errStr = 'SCRIPT_ERR_NUMEQUALVERIFY'
                                return false
                            }
                        }
                    }
                    break

                case OpCode.OP_WITHIN:
                    {
                        // (x min max -- out)
                        if (this.stack.length < 3) {
                            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                            return false
                        }
                        const bn1 = new Bn().fromScriptNumBuffer(this.stack[this.stack.length - 3], fRequireMinimal)
                        const bn2 = new Bn().fromScriptNumBuffer(this.stack[this.stack.length - 2], fRequireMinimal)
                        const bn3 = new Bn().fromScriptNumBuffer(this.stack[this.stack.length - 1], fRequireMinimal)
                        // bool fValue = (bn2 <= bn1 && bn1 < bn3)
                        const fValue = bn2.leq(bn1) && bn1.lt(bn3)
                        this.stack.pop()
                        this.stack.pop()
                        this.stack.pop()
                        this.stack.push(fValue ? Interp.true : Interp.false)
                    }
                    break

                //
                // Crypto
                //
                case OpCode.OP_RIPEMD160:
                case OpCode.OP_SHA1:
                case OpCode.OP_SHA256:
                case OpCode.OP_HASH160:
                case OpCode.OP_HASH256:
                    {
                        // (in -- hash)
                        if (this.stack.length < 1) {
                            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                            return false
                        }
                        const buf = this.stack[this.stack.length - 1]
                        // valtype vchnew Hash((opCode == OpCode.OP_RIPEMD160 || opCode == OpCode.OP_SHA1 || opCode == OpCode.OP_HASH160) ? 20 : 32)
                        let bufHash
                        if (opCodeNum === OpCode.OP_RIPEMD160) {
                            bufHash = Hash.ripemd160(buf)
                        } else if (opCodeNum === OpCode.OP_SHA1) {
                            bufHash = Hash.sha1(buf)
                        } else if (opCodeNum === OpCode.OP_SHA256) {
                            bufHash = Hash.sha256(buf)
                        } else if (opCodeNum === OpCode.OP_HASH160) {
                            bufHash = Hash.sha256Ripemd160(buf)
                        } else if (opCodeNum === OpCode.OP_HASH256) {
                            bufHash = Hash.sha256Sha256(buf)
                        }
                        this.stack.pop()
                        this.stack.push(bufHash)
                    }
                    break

                case OpCode.OP_CODESEPARATOR:
                    // Hash starts after the code separator
                    this.pBeginCodeHash = this.pc
                    break

                case OpCode.OP_CHECKSIG:
                case OpCode.OP_CHECKSIGVERIFY:
                    {
                        // (sig pubKey -- bool)
                        if (this.stack.length < 2) {
                            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                            return false
                        }

                        const bufSig = this.stack[this.stack.length - 2]
                        const bufPubKey = this.stack[this.stack.length - 1]

                        // Subset of script starting at the most recent codeseparator
                        // CScript scriptCode(pBeginCodeHash, pend)
                        const subScript = new Script().fromObject({
                            chunks: this.script.chunks.slice(this.pBeginCodeHash),
                        })

                        // https://github.com/Bitcoin-UAHF/spec/blob/master/replay-protected-sighash.md
                        const nHashType = bufSig.length > 0 ? bufSig.readUInt8(bufSig.length - 1) : 0
                        if (nHashType & Sig.SIGHASH_FORKID) {
                            if (!(this.flags & Interp.SCRIPT_ENABLE_SIGHASH_FORKID)) {
                                this.errStr = 'SCRIPT_ERR_ILLEGAL_FORKID'
                                return false
                            }
                        } else {
                            subScript.findAndDelete(new Script().writeBuffer(bufSig))
                        }

                        if (!this.checkSigEncoding(bufSig) || !this.checkPubKeyEncoding(bufPubKey)) {
                            // serror is set
                            return false
                        }

                        let fSuccess
                        try {
                            const sig = new Sig().fromTxFormat(bufSig)
                            const pubKey = new PubKey().fromBuffer(bufPubKey, false)
                            fSuccess = this.tx.verify(
                                sig,
                                pubKey,
                                this.nIn,
                                subScript,
                                Boolean(this.flags & Interp.SCRIPT_VERIFY_LOW_S),
                                this.valueBn,
                                this.flags
                            )
                        } catch (e) {
                            // invalid sig or pubKey
                            fSuccess = false
                        }

                        this.stack.pop()
                        this.stack.pop()
                        // stack.push_back(fSuccess ? vchTrue : vchFalse)
                        this.stack.push(fSuccess ? Interp.true : Interp.false)
                        if (opCodeNum === OpCode.OP_CHECKSIGVERIFY) {
                            if (fSuccess) {
                                this.stack.pop()
                            } else {
                                this.errStr = 'SCRIPT_ERR_CHECKSIGVERIFY'
                                return false
                            }
                        }
                    }
                    break

                case OpCode.OP_CHECKMULTISIG:
                case OpCode.OP_CHECKMULTISIGVERIFY:
                    {
                        // ([sig ...] num_of_signatures [pubKey ...] num_of_pubKeys -- bool)

                        let i = 1
                        if (this.stack.length < i) {
                            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                            return false
                        }

                        let nKeysCount = new Bn()
                            .fromScriptNumBuffer(this.stack[this.stack.length - i], fRequireMinimal)
                            .toNumber()
                        if (nKeysCount < 0 || nKeysCount > 20) {
                            this.errStr = 'SCRIPT_ERR_PUBKEY_COUNT'
                            return false
                        }
                        this.nOpCount += nKeysCount
                        if (this.nOpCount > 201) {
                            this.errStr = 'SCRIPT_ERR_OP_COUNT'
                            return false
                        }
                        // int ikey = ++i
                        let ikey = ++i
                        i += nKeysCount
                        if (this.stack.length < i) {
                            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                            return false
                        }

                        let nSigsCount = new Bn()
                            .fromScriptNumBuffer(this.stack[this.stack.length - i], fRequireMinimal)
                            .toNumber()
                        if (nSigsCount < 0 || nSigsCount > nKeysCount) {
                            this.errStr = 'SCRIPT_ERR_SIG_COUNT'
                            return false
                        }
                        // int isig = ++i
                        let isig = ++i
                        i += nSigsCount
                        if (this.stack.length < i) {
                            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                            return false
                        }

                        // Subset of script starting at the most recent codeseparator
                        const subScript = new Script().fromObject({
                            chunks: this.script.chunks.slice(this.pBeginCodeHash),
                        })

                        for (let k = 0; k < nSigsCount; k++) {
                            const bufSig = this.stack[this.stack.length - isig - k]

                            // https://github.com/Bitcoin-UAHF/spec/blob/master/replay-protected-sighash.md
                            const nHashType = bufSig.length > 0 ? bufSig.readUInt8(bufSig.length - 1) : 0
                            if (nHashType & Sig.SIGHASH_FORKID) {
                                if (!(this.flags & Interp.SCRIPT_ENABLE_SIGHASH_FORKID)) {
                                    this.errStr = 'SCRIPT_ERR_ILLEGAL_FORKID'
                                    return false
                                }
                            } else {
                                // Drop the signature, since there's no way for a signature to sign itself
                                subScript.findAndDelete(new Script().writeBuffer(bufSig))
                            }
                        }

                        let fSuccess = true
                        while (fSuccess && nSigsCount > 0) {
                            // valtype& vchSig  = stacktop(-isig)
                            const bufSig = this.stack[this.stack.length - isig]
                            // valtype& vchPubKey = stacktop(-ikey)
                            const bufPubKey = this.stack[this.stack.length - ikey]

                            if (!this.checkSigEncoding(bufSig) || !this.checkPubKeyEncoding(bufPubKey)) {
                                // serror is set
                                return false
                            }

                            let fOk
                            try {
                                const sig = new Sig().fromTxFormat(bufSig)
                                const pubKey = new PubKey().fromBuffer(bufPubKey, false)
                                fOk = this.tx.verify(
                                    sig,
                                    pubKey,
                                    this.nIn,
                                    subScript,
                                    Boolean(this.flags & Interp.SCRIPT_VERIFY_LOW_S),
                                    this.valueBn,
                                    this.flags
                                )
                            } catch (e) {
                                // invalid sig or pubKey
                                fOk = false
                            }

                            if (fOk) {
                                isig++
                                nSigsCount--
                            }
                            ikey++
                            nKeysCount--

                            // If there are more signatures left than keys left,
                            // then too many signatures have failed
                            if (nSigsCount > nKeysCount) {
                                fSuccess = false
                            }
                        }

                        // Clean up stack of actual arguments
                        while (i-- > 1) {
                            this.stack.pop()
                        }

                        // A bug causes CHECKMULTISIG to consume one extra argument
                        // whose contents were not checked in any way.
                        //
                        // Unfortunately this is a potential source of mutability,
                        // so optionally verify it is exactly equal to zero prior
                        // to removing it from the stack.
                        if (this.stack.length < 1) {
                            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                            return false
                        }
                        if (this.flags & Interp.SCRIPT_VERIFY_NULLDUMMY && this.stack[this.stack.length - 1].length) {
                            this.errStr = 'SCRIPT_ERR_SIG_NULLDUMMY'
                            return false
                        }
                        this.stack.pop()

                        // stack.push_back(fSuccess ? vchTrue : vchFalse)
                        this.stack.push(fSuccess ? Interp.true : Interp.false)

                        if (opCodeNum === OpCode.OP_CHECKMULTISIGVERIFY) {
                            if (fSuccess) {
                                this.stack.pop()
                            } else {
                                this.errStr = 'SCRIPT_ERR_CHECKMULTISIGVERIFY'
                                return false
                            }
                        }
                    }
                    break

                //
                // Byte string operations
                //
                case OpCode.OP_CAT:
                    if (this.stack.length < 2) {
                        this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                        return false
                    }

                    const vch1 = this.stack[this.stack.length - 2]
                    const vch2 = this.stack[this.stack.length - 1]

                    this.stack[this.stack.length - 2] = Buffer.concat([vch1, vch2])
                    this.stack.pop()
                    break

                case OpCode.OP_SPLIT:
                    if (this.stack.length < 2) {
                        this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION'
                        return false
                    }

                    const data = this.stack[this.stack.length - 2]
                    const position = new Bn().fromScriptNumBuffer(this.stack[this.stack.length - 1], fRequireMinimal)

                    if (position.lt(0) || position.gt(data.length)) {
                        this.errStr = 'SCRIPT_ERR_INVALID_SPLIT_RANGE'
                        return false
                    }

                    const n1 = data.slice(0, position.toNumber())
                    const n2 = data.slice(position.toNumber())

                    this.stack.pop()
                    this.stack.pop()

                    this.stack.push(n1)
                    this.stack.push(n2)

                    break

                default:
                    this.errStr = 'SCRIPT_ERR_BAD_OPCODE'
                    return false
            }
        }

        return true
    }

    /**
     * This function has the same interface as bitcoin core's VerifyScript and is
     * the function you want to use to know if a particular input in a
     * transaction is valid or not. It simply iterates over the results generated
     * by the results method.
     */
    public verify(
        scriptSig?: Script,
        scriptPubKey?: Script,
        tx?: Tx,
        nIn?: number,
        flags?: number,
        valueBn?: Bn
    ): boolean {
        const results = this.results(scriptSig, scriptPubKey, tx, nIn, flags, valueBn)
        for (const success of results) {
            if (!success) {
                return false
            }
        }
        return true
    }

    /**
     * Gives you the results of the execution each operation of the scripSig and
     * scriptPubKey corresponding to a particular input (nIn) for the concerned
     * transaction (tx). Each result can be either true or false. If true, then
     * the operation did not invalidate the transaction. If false, then the
     * operation has invalidated the script, and the transaction is not valid.
     * flags is a number that can pass in some special flags, such as whether or
     * not to execute the redeemScript in a p2sh transaction.
     *
     * This method is translated from bitcoin core's VerifyScript.  This function
     * is a generator, thus you can and need to iterate through it.  To
     * automatically return true or false, use the verify method.
     */
    public *results(scriptSig?: Script, scriptPubKey?: Script, tx?: Tx, nIn?: number, flags?: number, valueBn?: Bn) {
        let stackCopy

        this.fromObject({
            script: scriptSig,
            tx,
            nIn,
            flags,
            valueBn,
        })

        if ((flags & Interp.SCRIPT_VERIFY_SIGPUSHONLY) !== 0 && !scriptSig.isPushOnly()) {
            this.errStr = this.errStr || 'SCRIPT_ERR_SIG_PUSHONLY'
            yield false
        }

        yield* this.eval()

        if (flags & Interp.SCRIPT_VERIFY_P2SH) {
            stackCopy = this.stack.slice()
        }

        let stack = this.stack
        this.initialize()
        this.fromObject({
            script: scriptPubKey,
            stack,
            tx,
            nIn,
            flags,
            valueBn,
        })

        yield* this.eval()

        if (this.stack.length === 0) {
            this.errStr = this.errStr || 'SCRIPT_ERR_EVAL_FALSE'
            yield false
        }

        const buf = this.stack[this.stack.length - 1]
        if (!Interp.castToBool(buf)) {
            this.errStr = this.errStr || 'SCRIPT_ERR_EVAL_FALSE'
            yield false
        }

        // Additional validation for spend-to-script-hash transactions:
        if (flags & Interp.SCRIPT_VERIFY_P2SH && scriptPubKey.isScriptHashOut()) {
            // scriptSig must be literals-only or validation fails
            if (!scriptSig.isPushOnly()) {
                this.errStr = this.errStr || 'SCRIPT_ERR_SIG_PUSHONLY'
                yield false
            }

            // Restore stack.
            const tmp = stack
            stack = stackCopy
            stackCopy = tmp

            // stack cannot be empty here, because if it was the
            // P2SH  HASH <> EQUAL  scriptPubKey would be evaluated with
            // an empty stack and the EvalScript above would yield false.
            if (stack.length === 0) {
                throw new Error('internal error - stack copy empty')
            }

            const pubKeySerialized = stack[stack.length - 1]
            const scriptPubKey2 = new Script().fromBuffer(pubKeySerialized)
            stack.pop()

            this.initialize()
            this.fromObject({
                script: scriptPubKey2,
                stack,
                tx,
                nIn,
                flags,
                valueBn,
            })

            yield* this.eval()

            if (stack.length === 0) {
                this.errStr = this.errStr || 'SCRIPT_ERR_EVAL_FALSE'
                yield false
            }

            if (!Interp.castToBool(stack[stack.length - 1])) {
                this.errStr = this.errStr || 'SCRIPT_ERR_EVAL_FALSE'
                yield false
            } else {
                yield true
            }
        }

        // The CLEANSTACK check is only performed after potential P2SH evaluation,
        // as the non-P2SH evaluation of a P2SH script will obviously not result in
        // a clean stack (the P2SH inputs remain).
        if ((flags & Interp.SCRIPT_VERIFY_CLEANSTACK) !== 0) {
            // Disallow CLEANSTACK without P2SH, as otherwise a switch
            // CLEANSTACK->P2SH+CLEANSTACK would be possible, which is not a softfork
            // (and P2SH should be one).
            if (!(flags & Interp.SCRIPT_VERIFY_P2SH)) {
                throw new Error('cannot use CLEANSTACK without P2SH')
            }
            if (stack.length !== 1) {
                this.errStr = this.errStr || 'SCRIPT_ERR_CLEANSTACK'
                yield false
            }
        }

        yield true
    }

    /**
     * If the script has failed, this methods returns valuable debug
     * information about exactly where the script failed. It is a
     * JSON-compatible object so it can be easily stringified. pc refers to the
     * currently executing opcode.
     */
    public getDebugObject() {
        const pc = this.pc - 1 // pc is incremented immediately after getting
        return {
            errStr: this.errStr,
            scriptStr: this.script ? this.script.toString() : 'no script found',
            pc,
            stack: this.stack.map((buf) => buf.toString('hex')),
            altStack: this.altStack.map((buf) => buf.toString('hex')),
            opCodeStr: this.script ? OpCode.fromNumber(this.script.chunks[pc].opCodeNum).toString() : 'no script found',
        }
    }

    public getDebugString(): string {
        return JSON.stringify(this.getDebugObject(), null, 2)
    }
}
