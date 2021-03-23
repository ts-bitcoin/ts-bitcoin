/**
 * Big Number
 * ==========
 *
 * Since javascript numbers are only precise up to 53 bits, and bitcoin is
 * based on cryptography that uses 256 bit numbers, we must use a big number
 * library. The library we use at the moment is Fedor Indutny's bn.js library.
 * Since big numbers are extremely useful, we provide some very basic wrappers
 * for his big number class and expose it. The wrappers merely allow you to do,
 * say, bn.cmp(num) instead of just bn.cmp(bn), which is nice. The primary way
 * to use this is:
 * const bn = Bn(str) // str is base 10
 * const bn = Bn(num)
 * const bn = Bn().fromBuffer(buf)
 * const bn = Bn().fromSm(buf); // sign+magnitude format, first bit is sign
 *
 * For little endian, pass in an options value:
 * const bn = Bn().fromBuffer(buf, {endian: 'little'})
 * const bn = Bn().fromSm(buf, {endian: 'little'})
 *
 * Getting output:
 * const str = Bn().toString() // produces base 10 string
 * const buf = Bn().toBuffer() // produces buffer representation
 * const buf = Bn().toBuffer({size: 32}) //produced 32 byte buffer
 */
import * as _Bn from 'bn.js'

function BnLegacy(n, base, ...rest) {
    if (!(this instanceof BnLegacy)) {
        return new (BnLegacy as any)(n, base, ...rest)
    }
    _Bn.call(this, n, base, ...rest)
}

Object.keys(_Bn).forEach(function (key) {
    BnLegacy[key] = _Bn[key]
})
;(BnLegacy as any).prototype = Object.create(_Bn.prototype)
BnLegacy.prototype.constructor = BnLegacy

function reverseBuf(buf) {
    const buf2 = Buffer.alloc(buf.length)
    for (let i = 0; i < buf.length; i++) {
        buf2[i] = buf[buf.length - 1 - i]
    }
    return buf2
}

BnLegacy.prototype.fromHex = function (hex, opts) {
    return this.fromBuffer(Buffer.from(hex, 'hex'), opts)
}

BnLegacy.prototype.toHex = function (opts) {
    return this.toBuffer(opts).toString('hex')
}

BnLegacy.prototype.toJSON = function () {
    return this.toString()
}

BnLegacy.prototype.fromJSON = function (str) {
    const bn = (BnLegacy as any)(str)
    bn.copy(this)
    return this
}

BnLegacy.prototype.fromNumber = function (n) {
    const bn = (BnLegacy as any)(n)
    bn.copy(this)
    return this
}

BnLegacy.prototype.toNumber = function () {
    return parseInt(this.toString(10), 10)
}

BnLegacy.prototype.fromString = function (str, base) {
    const bn = BnLegacy(str, base)
    bn.copy(this)
    return this
}

BnLegacy.fromBuffer = function (buf, opts = { endian: 'big' }) {
    if (opts.endian === 'little') {
        buf = reverseBuf(buf)
    }
    const hex = buf.toString('hex')
    const bn = new (BnLegacy as any)(hex, 16)
    return bn
}

BnLegacy.prototype.fromBuffer = function (buf, opts) {
    const bn = BnLegacy.fromBuffer(buf, opts)
    bn.copy(this)

    return this
}

BnLegacy.prototype.toBuffer = function (opts = { size: undefined, endian: 'big' }) {
    let buf
    if (opts.size) {
        const hex = this.toString(16, 2)
        const natlen = hex.length / 2
        buf = Buffer.from(hex, 'hex')

        if (natlen === opts.size) {
            // pass
        } else if (natlen > opts.size) {
            buf = buf.slice(natlen - buf.length, buf.length)
        } else if (natlen < opts.size) {
            const rbuf = Buffer.alloc(opts.size)
            for (let i = 0; i < buf.length; i++) {
                rbuf[rbuf.length - 1 - i] = buf[buf.length - 1 - i]
            }
            for (let i = 0; i < opts.size - natlen; i++) {
                rbuf[i] = 0
            }
            buf = rbuf
        }
    } else {
        const hex = this.toString(16, 2)
        buf = Buffer.from(hex, 'hex')
    }

    if (opts.endian === 'little') {
        buf = reverseBuf(buf)
    }
    const longzero = Buffer.from([0])
    if (Buffer.compare(buf, longzero) === 0) {
        return Buffer.from([])
    }
    return buf
}

BnLegacy.prototype.toFastBuffer = BnLegacy.prototype.toBuffer

BnLegacy.fromFastBuffer = BnLegacy.fromBuffer
BnLegacy.prototype.fromFastBuffer = BnLegacy.prototype.fromBuffer

/**
 * Signed magnitude buffer. Most significant bit represents sign (0 = positive,
 * 1 = negative).
 */
BnLegacy.prototype.fromSm = function (buf, opts = { endian: 'big' }) {
    if (buf.length === 0) {
        this.fromBuffer(Buffer.from([0]))
    }

    const endian = opts.endian
    if (endian === 'little') {
        buf = reverseBuf(buf)
    }

    if (buf[0] & 0x80) {
        buf[0] = buf[0] & 0x7f
        this.fromBuffer(buf)
        this.neg().copy(this)
    } else {
        this.fromBuffer(buf)
    }
    return this
}

BnLegacy.prototype.toSm = function (opts = { endian: 'big' }) {
    const endian = opts.endian

    let buf
    if (this.cmp(0) === -1) {
        buf = this.neg().toBuffer()
        if (buf[0] & 0x80) {
            buf = Buffer.concat([Buffer.from([0x80]), buf])
        } else {
            buf[0] = buf[0] | 0x80
        }
    } else {
        buf = this.toBuffer()
        if (buf[0] & 0x80) {
            buf = Buffer.concat([Buffer.from([0x00]), buf])
        }
    }

    if (buf.length === 1 && buf[0] === 0) {
        buf = Buffer.from([])
    }

    if (endian === 'little') {
        buf = reverseBuf(buf)
    }

    return buf
}

/**
 * Produce a BnLegacy from the "bits" value in a blockheader. Analagous to Bitcoin
 * Core's uint256 SetCompact method. bits is assumed to be UInt32.
 */
BnLegacy.prototype.fromBits = function (bits, opts = { strict: false }) {
    // To performed bitwise operations in javascript, we need to convert to a
    // signed 32 bit value.
    let buf = Buffer.alloc(4)
    buf.writeUInt32BE(bits, 0)
    bits = buf.readInt32BE(0)
    if (opts.strict && bits & 0x00800000) {
        throw new Error('negative bit set')
    }
    const nsize = bits >> 24
    const nword = bits & 0x007fffff
    buf = Buffer.alloc(4)
    buf.writeInt32BE(nword)
    if (nsize <= 3) {
        buf = buf.slice(1, nsize + 1)
    } else {
        const fill = Buffer.alloc(nsize - 3)
        fill.fill(0)
        buf = Buffer.concat([buf, fill])
    }
    this.fromBuffer(buf)
    if (bits & 0x00800000) {
        ;(BnLegacy as any)(0).sub(this).copy(this)
    }
    return this
}

/**
 * Convert BnLegacy to the "bits" value in a blockheader. Analagous to Bitcoin
 * Core's uint256 GetCompact method. bits is a UInt32.
 */
BnLegacy.prototype.toBits = function () {
    let buf
    if (this.lt(0)) {
        buf = this.neg().toBuffer()
    } else {
        buf = this.toBuffer()
    }
    let nsize = buf.length
    let nword
    if (nsize > 3) {
        nword = Buffer.concat([Buffer.from([0]), buf.slice(0, 3)]).readUInt32BE(0)
    } else if (nsize <= 3) {
        const blank = Buffer.alloc(3 - nsize + 1)
        blank.fill(0)
        nword = Buffer.concat([blank, buf.slice(0, nsize)]).readUInt32BE(0)
    }
    if (nword & 0x00800000) {
        // The most significant bit denotes sign. Do not want unless number is
        // actually negative.
        nword >>= 8
        nsize++
    }
    if (this.lt(0)) {
        nword |= 0x00800000
    }
    const bits = (nsize << 24) | nword
    // convert bits to UInt32 before returning
    buf = Buffer.alloc(4)
    buf.writeInt32BE(bits, 0)
    return buf.readUInt32BE(0)
}

// This is analogous to the constructor for CScriptNum in bitcoind. Many ops
// in bitcoind's script interpreter use CScriptNum, which is not really a
// proper bignum. Instead, an error is thrown if trying to input a number
// bigger than 4 bytes. We copy that behavior here. There is one exception -
// in CHECKLOCKTIMEVERIFY, the numbers are allowed to be up to 5 bytes long.
// We allow for setting that variable here for use in CHECKLOCKTIMEVERIFY.
BnLegacy.prototype.fromScriptNumBuffer = function (buf, fRequireMinimal, nMaxNumSize) {
    if (nMaxNumSize === undefined) {
        nMaxNumSize = 4
    }
    if (buf.length > nMaxNumSize) {
        throw new Error('script number overflow')
    }
    if (fRequireMinimal && buf.length > 0) {
        // Check that the number is encoded with the minimum possible
        // number of bytes.
        //
        // If the most-significant-byte - excluding the sign bit - is zero
        // then we're not minimal. Note how this test also rejects the
        // negative-zero encoding, 0x80.
        if ((buf[buf.length - 1] & 0x7f) === 0) {
            // One exception: if there's more than one byte and the most
            // significant bit of the second-most-significant-byte is set
            // it would conflict with the sign bit. An example of this case
            // is +-255, which encode to 0xff00 and 0xff80 respectively.
            // (big-endian).
            if (buf.length <= 1 || (buf[buf.length - 2] & 0x80) === 0) {
                throw new Error('non-minimally encoded script number')
            }
        }
    }
    return this.fromSm(buf, { endian: 'little' })
}

// The corollary to the above, with the notable exception that we do not throw
// an error if the output is larger than four bytes. (Which can happen if
// performing a numerical operation that results in an overflow to more than 4
// bytes).
BnLegacy.prototype.toScriptNumBuffer = function () {
    return this.toSm({ endian: 'little' })
}

BnLegacy.prototype.neg = function () {
    const _neg = _Bn.prototype.neg.call(this)
    const neg = Object.create(BnLegacy.prototype)
    _neg.copy(neg)
    return neg
}

BnLegacy.prototype.add = function (bn) {
    const _bn = _Bn.prototype.add.call(this, bn)
    bn = Object.create(BnLegacy.prototype)
    _bn.copy(bn)
    return bn
}

BnLegacy.prototype.sub = function (bn) {
    const _bn = _Bn.prototype.sub.call(this, bn)
    bn = Object.create(BnLegacy.prototype)
    _bn.copy(bn)
    return bn
}

BnLegacy.prototype.mul = function (bn) {
    const _bn = _Bn.prototype.mul.call(this, bn)
    bn = Object.create(BnLegacy.prototype)
    _bn.copy(bn)
    return bn
}

/**
 * to be used if this is positive.
 */
BnLegacy.prototype.mod = function (bn) {
    const _bn = _Bn.prototype.mod.call(this, bn)
    bn = Object.create(BnLegacy.prototype)
    _bn.copy(bn)
    return bn
}

/**
 * to be used if this is negative.
 */
BnLegacy.prototype.umod = function (bn) {
    const _bn = _Bn.prototype.umod.call(this, bn)
    bn = Object.create(BnLegacy.prototype)
    _bn.copy(bn)
    return bn
}

BnLegacy.prototype.invm = function (bn) {
    const _bn = _Bn.prototype.invm.call(this, bn)
    bn = Object.create(BnLegacy.prototype)
    _bn.copy(bn)
    return bn
}

BnLegacy.prototype.div = function (bn) {
    const _bn = _Bn.prototype.div.call(this, bn)
    bn = Object.create(BnLegacy.prototype)
    _bn.copy(bn)
    return bn
}

BnLegacy.prototype.ushln = function (bits) {
    const _bn = _Bn.prototype.ushln.call(this, bits)
    const bn = Object.create(BnLegacy.prototype)
    _bn.copy(bn)
    return bn
}

BnLegacy.prototype.ushrn = function (bits) {
    const _bn = _Bn.prototype.ushrn.call(this, bits)
    const bn = Object.create(BnLegacy.prototype)
    _bn.copy(bn)
    return bn
}

BnLegacy.prototype.cmp = function (bn) {
    return _Bn.prototype.cmp.call(this, bn)
}

/**
 * All the standard big number operations operate on other big numbers. e.g.,
 * bn1.add(bn2). But it is frequenly valuble to add numbers or strings, e.g.
 * bn.add(5) or bn.add('5'). The decorator wraps all methods where this would
 * be convenient and makes that possible.
 */
function decorate(name) {
    BnLegacy.prototype['_' + name] = BnLegacy.prototype[name]
    const f = function (b) {
        if (typeof b === 'string') {
            b = new (BnLegacy as any)(b)
        } else if (typeof b === 'number') {
            b = new (BnLegacy as any)(b.toString())
        }
        return this['_' + name](b)
    }
    BnLegacy.prototype[name] = f
}

BnLegacy.prototype.eq = function (b) {
    return this.cmp(b) === 0
}

BnLegacy.prototype.neq = function (b) {
    return this.cmp(b) !== 0
}

BnLegacy.prototype.gt = function (b) {
    return this.cmp(b) > 0
}

BnLegacy.prototype.geq = function (b) {
    return this.cmp(b) >= 0
}

BnLegacy.prototype.lt = function (b) {
    return this.cmp(b) < 0
}

BnLegacy.prototype.leq = function (b) {
    return this.cmp(b) <= 0
}

decorate('add')
decorate('sub')
decorate('mul')
decorate('mod')
decorate('invm')
decorate('div')
decorate('cmp')
decorate('gt')
decorate('geq')
decorate('lt')
decorate('leq')

/**
 * Use hack to type legacy bn class.
 *
 * TODO: Refactor by properly extending from bn.js.
 */

type Endianness = 'le' | 'be'
type IPrimeName = 'k256' | 'p224' | 'p192' | 'p25519'

interface MPrime {
    name: string
    p: BnDefinition
    n: number
    k: BnDefinition
}

interface ReductionContext {
    m: number
    prime: MPrime
    [key: string]: any
}

class BnDefinition {
    static BnLegacy: typeof BnDefinition
    static wordSize: 26

    constructor(
        number?: number | string | number[] | Uint8Array | Buffer | BnDefinition,
        base?: number | 'hex',
        endian?: Endianness
    ) {}

    /**
     * @description  create a reduction context
     */
    static red(reductionContext: BnDefinition | IPrimeName): ReductionContext {
        return 0 as any
    }

    /**
     * @description  create a reduction context  with the Montgomery trick.
     */
    static mont(num: BnDefinition): ReductionContext {
        return 0 as any
    }

    /**
     * @description returns true if the supplied object is a BnDefinition.js instance
     */
    static isBnDefinition(b: any): b is BnDefinition {
        return 0 as any
    }

    /**
     * @description returns the maximum of 2 BnDefinition instances.
     */
    static max(left: BnDefinition, right: BnDefinition): BnDefinition {
        return 0 as any
    }

    /**
     * @description returns the minimum of 2 BnDefinition instances.
     */
    static min(left: BnDefinition, right: BnDefinition): BnDefinition {
        return 0 as any
    }

    fromHex(hex: string, opts?: { endian: 'big' | 'little' }): BnDefinition {
        return 0 as any
    }

    toHex(opts?: { size?: number; endian?: 'big' | 'little' }): string {
        return 0 as any
    }

    fromJSON(str: string): BnDefinition {
        return 0 as any
    }

    fromNumber(n: number): BnDefinition {
        return 0 as any
    }

    fromString(str: string, base?: number): BnDefinition {
        return 0 as any
    }

    fromBuffer(buf: Buffer, opts?: { endian: 'big' | 'little' }): BnDefinition {
        return 0 as any
    }

    static fromBuffer(buf: Buffer, opts?: { endian: 'big' | 'little' }): BnDefinition {
        return 0 as any
    }

    fromFastBuffer(buf: Buffer, opts?: { endian: 'big' | 'little' }): BnDefinition {
        return 0 as any
    }

    /**
     * Signed magnitude buffer. Most significant bit represents sign (0 = positive,
     * 1 = negative).
     */
    fromSm(buf: Buffer, opts?: { endian: 'big' | 'little' }): BnDefinition {
        return 0 as any
    }

    toSm(opts?: { endian: 'big' | 'little' }): Buffer {
        return 0 as any
    }

    /**
     * Produce a BnDefinition from the "bits" value in a blockheader. Analagous to Bitcoin
     * Core's uint256 SetCompact method. bits is assumed to be UInt32.
     */
    fromBits(bits: number, opts?: { strict: boolean }): BnDefinition {
        return 0 as any
    }

    /**
     * Convert BnDefinition to the "bits" value in a blockheader. Analagous to Bitcoin
     * Core's uint256 GetCompact method. bits is a UInt32.
     */
    toBits(): number {
        return 0 as any
    }

    // This is analogous to the constructor for CScriptNum in bitcoind. Many ops
    // in bitcoind's script interpreter use CScriptNum, which is not really a
    // proper bignum. Instead, an error is thrown if trying to input a number
    // bigger than 4 bytes. We copy that behavior here. There is one exception -
    // in CHECKLOCKTIMEVERIFY, the numbers are allowed to be up to 5 bytes long.
    // We allow for setting that variable here for use in CHECKLOCKTIMEVERIFY.
    fromScriptNumBuffer(buf: Buffer, fRequireMinimal?: boolean, nMaxNumSize?: number): BnDefinition {
        return 0 as any
    }

    // The corollary to the above, with the notable exception that we do not throw
    // an error if the output is larger than four bytes. (Which can happen if
    // performing a numerical operation that results in an overflow to more than 4
    // bytes).
    toScriptNumBuffer(): Buffer {
        return 0 as any
    }

    /**
     * @description  clone number
     */
    clone(): BnDefinition {
        return 0 as any
    }

    /**
     * @description  convert to base-string and pad with zeroes
     */
    toString(base?: number | 'hex', length?: number): string {
        return 0 as any
    }

    /**
     * @description convert to Javascript Number (limited to 53 bits)
     */
    toNumber(): number {
        return 0 as any
    }

    /**
     * @description convert to JSON compatible hex string (alias of toString(16))
     */
    toJSON(): string {
        return 0 as any
    }

    /**
     * @description  convert to byte Array, and optionally zero pad to length, throwing if already exceeding
     */
    toArray(endian?: Endianness, length?: number): number[] {
        return 0 as any
    }

    /**
     * @description convert to an instance of `type`, which must behave like an Array
     */
    toArrayLike(ArrayType: typeof Buffer, endian?: Endianness, length?: number): Buffer
    toArrayLike(ArrayType: any[], endian?: Endianness, length?: number): any[]
    toArrayLike(ArrayType: typeof Buffer | any[], endian?: Endianness, length?: number): Buffer | any[] {
        return 0 as any
    }

    /**
     * @description  convert to Node.js Buffer (if available). For compatibility with browserify and similar tools, use this instead: a.toArrayLike(Buffer, endian, length)
     */
    toBuffer(opts?: { size?: number; endian?: 'big' | 'little' }): Buffer {
        return 0 as any
    }
    toFastBuffer(opts?: { size?: number; endian?: 'big' | 'little' }): Buffer {
        return 0 as any
    }

    /**
     * @description get number of bits occupied
     */
    bitLength(): number {
        return 0 as any
    }

    /**
     * @description return number of less-significant consequent zero bits (example: 1010000 has 4 zero bits)
     */
    zeroBits(): number {
        return 0 as any
    }

    /**
     * @description return number of bytes occupied
     */
    byteLength(): number {
        return 0 as any
    }

    /**
     * @description  true if the number is negative
     */
    isNeg(): boolean {
        return 0 as any
    }

    /**
     * @description  check if value is even
     */
    isEven(): boolean {
        return 0 as any
    }

    /**
     * @description   check if value is odd
     */
    isOdd(): boolean {
        return 0 as any
    }

    /**
     * @description  check if value is zero
     */
    isZero(): boolean {
        return 0 as any
    }

    /**
     * @description compare numbers and return `-1 (a < b)`, `0 (a == b)`, or `1 (a > b)` depending on the comparison result
     */
    cmp(b: BnDefinition | number): -1 | 0 | 1 {
        return 0 as any
    }

    /**
     * @description compare numbers and return `-1 (a < b)`, `0 (a == b)`, or `1 (a > b)` depending on the comparison result
     */
    ucmp(b: BnDefinition): -1 | 0 | 1 {
        return 0 as any
    }

    /**
     * @description compare numbers and return `-1 (a < b)`, `0 (a == b)`, or `1 (a > b)` depending on the comparison result
     */
    cmpn(b: number): -1 | 0 | 1 {
        return 0 as any
    }

    /**
     * @description a less than b
     */
    lt(b: BnDefinition | number): boolean {
        return 0 as any
    }

    /**
     * @description a less than b
     */
    ltn(b: number): boolean {
        return 0 as any
    }

    /**
     * @description a less than or equals b
     */
    lte(b: BnDefinition): boolean {
        return 0 as any
    }

    /**
     * @description a less than or equals b
     */
    lten(b: number): boolean {
        return 0 as any
    }

    /**
     * @description a greater than b
     */
    gt(b: BnDefinition | number): boolean {
        return 0 as any
    }

    /**
     * @description a greater than b
     */
    gtn(b: number): boolean {
        return 0 as any
    }

    /**
     * @description a greater than or equals b
     */
    gte(b: BnDefinition): boolean {
        return 0 as any
    }

    /**
     * @description a greater than or equals b
     */
    gten(b: number): boolean {
        return 0 as any
    }

    /**
     * @description a equals b
     */
    eq(b: BnDefinition | number): boolean {
        return 0 as any
    }

    /**
     * @description a equals b
     */
    eqn(b: number): boolean {
        return 0 as any
    }

    /**
     * @description convert to two's complement representation, where width is bit width
     */
    toTwos(width: number): BnDefinition {
        return 0 as any
    }

    /**
     * @description  convert from two's complement representation, where width is the bit width
     */
    fromTwos(width: number): BnDefinition {
        return 0 as any
    }

    /**
     * @description negate sign
     */
    neg(): BnDefinition {
        return 0 as any
    }

    /**
     * @description negate sign
     */
    ineg(): BnDefinition {
        return 0 as any
    }

    /**
     * @description absolute value
     */
    abs(): BnDefinition {
        return 0 as any
    }

    /**
     * @description absolute value
     */
    iabs(): BnDefinition {
        return 0 as any
    }

    /**
     * @description addition
     */
    add(b: BnDefinition | number): BnDefinition {
        return 0 as any
    }

    /**
     * @description  addition
     */
    iadd(b: BnDefinition): BnDefinition {
        return 0 as any
    }

    /**
     * @description addition
     */
    addn(b: number): BnDefinition {
        return 0 as any
    }

    /**
     * @description addition
     */
    iaddn(b: number): BnDefinition {
        return 0 as any
    }

    /**
     * @description subtraction
     */
    sub(b: BnDefinition | number): BnDefinition {
        return 0 as any
    }

    /**
     * @description subtraction
     */
    isub(b: BnDefinition): BnDefinition {
        return 0 as any
    }

    /**
     * @description subtraction
     */
    subn(b: number): BnDefinition {
        return 0 as any
    }

    /**
     * @description subtraction
     */
    isubn(b: number): BnDefinition {
        return 0 as any
    }

    /**
     * @description multiply
     */
    mul(b: BnDefinition): BnDefinition {
        return 0 as any
    }

    /**
     * @description multiply
     */
    imul(b: BnDefinition): BnDefinition {
        return 0 as any
    }

    /**
     * @description multiply
     */
    muln(b: number): BnDefinition {
        return 0 as any
    }

    /**
     * @description multiply
     */
    imuln(b: number): BnDefinition {
        return 0 as any
    }

    /**
     * @description square
     */
    sqr(): BnDefinition {
        return 0 as any
    }

    /**
     * @description square
     */
    isqr(): BnDefinition {
        return 0 as any
    }

    /**
     * @description raise `a` to the power of `b`
     */
    pow(b: BnDefinition): BnDefinition {
        return 0 as any
    }

    /**
     * @description divide
     */
    div(b: BnDefinition): BnDefinition {
        return 0 as any
    }

    /**
     * @description divide
     */
    divn(b: number): BnDefinition {
        return 0 as any
    }

    /**
     * @description divide
     */
    idivn(b: number): BnDefinition {
        return 0 as any
    }

    /**
     * @description reduct
     */
    mod(b: BnDefinition): BnDefinition {
        return 0 as any
    }

    /**
     * @description reduct
     */
    umod(b: BnDefinition): BnDefinition {
        return 0 as any
    }

    /**
     * @deprecated
     * @description reduct
     */
    modn(b: number): number {
        return 0 as any
    }

    /**
     * @description reduct
     */
    modrn(b: number): number {
        return 0 as any
    }

    /**
     * @description  rounded division
     */
    divRound(b: BnDefinition): BnDefinition {
        return 0 as any
    }

    /**
     * @description or
     */
    or(b: BnDefinition): BnDefinition {
        return 0 as any
    }

    /**
     * @description or
     */
    ior(b: BnDefinition): BnDefinition {
        return 0 as any
    }

    /**
     * @description or
     */
    uor(b: BnDefinition): BnDefinition {
        return 0 as any
    }

    /**
     * @description or
     */
    iuor(b: BnDefinition): BnDefinition {
        return 0 as any
    }

    /**
     * @description and
     */
    and(b: BnDefinition): BnDefinition {
        return 0 as any
    }

    /**
     * @description and
     */
    iand(b: BnDefinition): BnDefinition {
        return 0 as any
    }

    /**
     * @description and
     */
    uand(b: BnDefinition): BnDefinition {
        return 0 as any
    }

    /**
     * @description and
     */
    iuand(b: BnDefinition): BnDefinition {
        return 0 as any
    }

    /**
     * @description and (NOTE: `andln` is going to be replaced with `andn` in future)
     */
    andln(b: number): BnDefinition {
        return 0 as any
    }

    /**
     * @description xor
     */
    xor(b: BnDefinition): BnDefinition {
        return 0 as any
    }

    /**
     * @description xor
     */
    ixor(b: BnDefinition): BnDefinition {
        return 0 as any
    }

    /**
     * @description xor
     */
    uxor(b: BnDefinition): BnDefinition {
        return 0 as any
    }

    /**
     * @description xor
     */
    iuxor(b: BnDefinition): BnDefinition {
        return 0 as any
    }

    /**
     * @description set specified bit to 1
     */
    setn(b: number): BnDefinition {
        return 0 as any
    }

    /**
     * @description shift left
     */
    shln(b: number): BnDefinition {
        return 0 as any
    }

    /**
     * @description shift left
     */
    ishln(b: number): BnDefinition {
        return 0 as any
    }

    /**
     * @description shift left
     */
    ushln(b: number): BnDefinition {
        return 0 as any
    }

    /**
     * @description shift left
     */
    iushln(b: number): BnDefinition {
        return 0 as any
    }

    /**
     * @description shift right
     */
    shrn(b: number): BnDefinition {
        return 0 as any
    }

    /**
     * @description shift right (unimplemented https://github.com/indutny/bn.js/blob/master/lib/bn.js#L2086)
     */
    ishrn(b: number): BnDefinition {
        return 0 as any
    }

    /**
     * @description shift right
     */
    ushrn(b: number): BnDefinition {
        return 0 as any
    }
    /**
     * @description shift right
     */

    iushrn(b: number): BnDefinition {
        return 0 as any
    }
    /**
     * @description  test if specified bit is set
     */

    testn(b: number): boolean {
        return 0 as any
    }
    /**
     * @description clear bits with indexes higher or equal to `b`
     */

    maskn(b: number): BnDefinition {
        return 0 as any
    }
    /**
     * @description clear bits with indexes higher or equal to `b`
     */

    imaskn(b: number): BnDefinition {
        return 0 as any
    }
    /**
     * @description add `1 << b` to the number
     */
    bincn(b: number): BnDefinition {
        return 0 as any
    }

    /**
     * @description not (for the width specified by `w`)
     */
    notn(w: number): BnDefinition {
        return 0 as any
    }

    /**
     * @description not (for the width specified by `w`)
     */
    inotn(w: number): BnDefinition {
        return 0 as any
    }

    /**
     * @description GCD
     */
    gcd(b: BnDefinition): BnDefinition {
        return 0 as any
    }

    /**
     * @description Extended GCD results `({ a: ..., b: ..., gcd: ... })`
     */
    egcd(b: BnDefinition): { a: BnDefinition; b: BnDefinition; gcd: BnDefinition } {
        return 0 as any
    }

    /**
     * @description inverse `a` modulo `b`
     */
    invm(b: BnDefinition): BnDefinition {
        return 0 as any
    }

    neq(b: BnDefinition | number): boolean {
        return 0 as any
    }
    geq(b: BnDefinition | number): boolean {
        return 0 as any
    }
    leq(b: BnDefinition | number): boolean {
        return 0 as any
    }

    copy(b: BnDefinition): void {}

    static _prime(name: IPrimeName): MPrime {
        return 0 as any
    }

    toRed(reductionContext: ReductionContext): any {
        return 0 as any
    }
}

export const Bn: typeof BnDefinition = BnLegacy as any
export type Bn = BnDefinition
