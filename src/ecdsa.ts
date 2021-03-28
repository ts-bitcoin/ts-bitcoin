/**
 * Ecdsa
 * =====
 *
 * Ecdsa is the signature algorithm used by bitcoin. The way you probably want
 * to use this is with the static Ecdsa.sign( ... ) and Ecdsa.verify( ... )
 * functions. Note that in bitcoin, the hashBuf is little endian, so if you are
 * signing or verifying something that has to do with a transaction, you should
 * explicitly plug in that it is little endian as an option to the sign and
 * verify functions.
 *
 * This implementation of Ecdsa uses deterministic signatures as defined in RFC
 * 6979 as the default, which has become a defacto standard in bitcoin wallets
 * due to recurring security issues around using a value of k pulled from a
 * possibly faulty entropy pool. If you use the same value of k twice, someone
 * can derive your private key. Deterministic k prevents this without needing
 * an entropy pool.
 */
import { Bn } from './bn'
import { Br } from './br'
import { Hash } from './hash'
import { KeyPair } from './key-pair'
import { Point } from './point'
import { PubKey } from './pub-key'
import { Random } from './random'
import { Sig } from './sig'
import { Struct } from './struct'
import { Workers } from './workers'

interface EcdsaLike {
    sig: string
    keyPair: string
    hashBuf: string
    k: string
    endian: 'big' | 'little'
    verified: boolean
}

export class Ecdsa extends Struct {
    public sig: Sig
    public keyPair: KeyPair
    public hashBuf: Buffer
    public k: Bn
    public endian: 'big' | 'little'
    public verified: boolean

    constructor(sig?: Sig, keyPair?: KeyPair, hashBuf?: Buffer, k?: Bn, endian?: 'big' | 'little', verified?: boolean) {
        super({ sig, keyPair, hashBuf, k, endian, verified })
    }

    public toJSON(): EcdsaLike {
        return {
            sig: this.sig ? this.sig.toString() : undefined,
            keyPair: this.keyPair ? this.keyPair.toBuffer().toString('hex') : undefined,
            hashBuf: this.hashBuf ? this.hashBuf.toString('hex') : undefined,
            k: this.k ? this.k.toString() : undefined,
            endian: this.endian,
            verified: this.verified,
        }
    }

    public fromJSON(json: EcdsaLike): this {
        this.sig = json.sig ? new Sig().fromString(json.sig) : undefined
        this.keyPair = json.keyPair ? new KeyPair().fromBuffer(Buffer.from(json.keyPair, 'hex')) : undefined
        this.hashBuf = json.hashBuf ? Buffer.from(json.hashBuf, 'hex') : undefined
        this.k = json.k ? new Bn().fromString(json.k) : undefined
        this.endian = json.endian
        this.verified = json.verified
        return this
    }

    public toBuffer(): Buffer {
        const str = JSON.stringify(this.toJSON())
        return Buffer.from(str)
    }

    public fromBuffer(buf: Buffer): this {
        const json = JSON.parse(buf.toString())
        return this.fromJSON(json)
    }

    public calcrecovery(): this {
        for (let recovery = 0; recovery < 4; recovery++) {
            let Qprime
            this.sig.recovery = recovery
            try {
                Qprime = this.sig2PubKey()
            } catch (e) {
                continue
            }

            if (Qprime.point.eq(this.keyPair.pubKey.point)) {
                const compressed = this.keyPair.pubKey.compressed
                this.sig.compressed = this.keyPair.pubKey.compressed === undefined ? true : compressed
                return this
            }
        }

        this.sig.recovery = undefined
        throw new Error('Unable to find valid recovery factor')
    }

    public async asyncCalcrecovery(): Promise<this> {
        const workersResult = await Workers.asyncObjectMethod(this, 'calcrecovery', [])
        return this.fromFastBuffer(workersResult.resbuf)
    }

    /**
     * Calculates the recovery factor, and mutates sig so that it now contains
     * the recovery factor and the "compressed" variable. Throws an exception on
     * failure.
     */
    public static calcrecovery(sig: Sig, pubKey: PubKey, hashBuf: Buffer): Sig {
        const ecdsa = new Ecdsa().fromObject({
            sig,
            keyPair: new KeyPair().fromObject({ pubKey }),
            hashBuf,
        })
        return ecdsa.calcrecovery().sig
    }

    public static async asyncCalcrecovery(sig: Sig, pubKey: PubKey, hashBuf: Buffer): Promise<Sig> {
        const workersResult = await Workers.asyncClassMethod(Ecdsa, 'calcrecovery', [sig, pubKey, hashBuf])
        return new Sig().fromFastBuffer(workersResult.resbuf)
    }

    public fromString(str: string): this {
        const obj = JSON.parse(str)
        if (obj.hashBuf) {
            this.hashBuf = Buffer.from(obj.hashBuf, 'hex')
        }
        if (obj.keyPair) {
            this.keyPair = new KeyPair().fromString(obj.keyPair)
        }
        if (obj.sig) {
            this.sig = new Sig().fromString(obj.sig)
        }
        if (obj.k) {
            this.k = new Bn(obj.k, 10)
        }
        return this
    }

    public randomK(): this {
        const N = Point.getN()
        let k
        do {
            k = new Bn().fromBuffer(Random.getRandomBuffer(32))
        } while (!(k.lt(N) && k.gt(0)))
        this.k = k
        return this
    }

    /**
     * The traditional Ecdsa algorithm uses a purely random value of k. This has
     * the negative that when signing, your entropy must be good, or the private
     * key can be recovered if two signatures use the same value of k. It turns out
     * that k does not have to be purely random. It can be deterministic, so long
     * as an attacker can't guess it. RFC 6979 specifies how to do this using a
     * combination of the private key and the hash of the thing to be signed. It is
     * best practice to use this value, which can be tested for byte-for-byte
     * accuracy, and is resistant to a broken RNG. Note that it is actually the
     * case that bitcoin private keys have been compromised through that attack.
     * Deterministic k is a best practice.
     *
     * https://tools.ietf.org/html/rfc6979#section-3.2
     */
    public deterministicK(badrs?: number): this {
        let v = Buffer.alloc(32)
        v.fill(0x01)
        let k = Buffer.alloc(32)
        k.fill(0x00)
        const x = this.keyPair.privKey.bn.toBuffer({ size: 32 })
        k = Hash.sha256Hmac(Buffer.concat([v, Buffer.from([0x00]), x, this.hashBuf]), k)
        v = Hash.sha256Hmac(v, k)
        k = Hash.sha256Hmac(Buffer.concat([v, Buffer.from([0x01]), x, this.hashBuf]), k)
        v = Hash.sha256Hmac(v, k)
        v = Hash.sha256Hmac(v, k)
        let T = new Bn().fromBuffer(v)
        const N = Point.getN()

        // if r or s were invalid when this function was used in signing,
        // we do not want to actually compute r, s here for efficiency, so,
        // we can increment badrs. explained at end of RFC 6979 section 3.2
        if (badrs === undefined) {
            badrs = 0
        }
        // also explained in 3.2, we must ensure T is in the proper range (0, N)
        for (let i = 0; i < badrs || !(T.lt(N) && T.gt(0)); i++) {
            k = Hash.sha256Hmac(Buffer.concat([v, Buffer.from([0x00])]), k)
            v = Hash.sha256Hmac(v, k)
            v = Hash.sha256Hmac(v, k)
            T = new Bn().fromBuffer(v)
        }

        this.k = T
        return this
    }

    /**
     * Information about public key recovery:
     * https://bitcointalk.org/index.php?topic=6430.0
     * http://stackoverflow.com/questions/19665491/how-do-i-get-an-ecdsa-public-key-from-just-a-bitcoin-signature-sec1-4-1-6-k
     * This code was originally taken from BitcoinJS
     */
    public sig2PubKey(): PubKey {
        const recovery = this.sig.recovery
        if (!(recovery === 0 || recovery === 1 || recovery === 2 || recovery === 3)) {
            throw new Error('i must be equal to 0, 1, 2, or 3')
        }

        const e = new Bn().fromBuffer(this.hashBuf)
        const r = this.sig.r
        const s = this.sig.s

        // A set LSB signifies that the y-coordinate is odd
        const isYOdd = !!(recovery & 1)

        // The more significant bit specifies whether we should use the
        // first or second candidate key.
        const isSecondKey = recovery >> 1

        const n = Point.getN()
        const G = Point.getG()

        // 1.1 LEt x = r + jn
        const x = isSecondKey ? r.add(n) : r
        const R = Point.fromX(isYOdd, x)

        // 1.4 Check that nR is at infinity
        let errm = ''
        try {
            R.mul(n)
        } catch (err) {
            errm = err.message
        }
        if (errm !== 'point mul out of range') {
            throw new Error('nR is not a valid curve point')
        }

        // Compute -e from e
        const eNeg = e.neg().umod(n)

        // 1.6.1 Compute Q = r^-1 (sR - eG)
        // Q = r^-1 (sR + -eG)
        const rInv = r.invm(n)

        // const Q = R.multiplyTwo(s, G, eNeg).mul(rInv)
        const Q = R.mul(s).add(G.mul(eNeg)).mul(rInv)

        const pubKey = new PubKey(Q)
        pubKey.compressed = this.sig.compressed
        pubKey.validate()

        return pubKey
    }

    public async asyncSig2PubKey(): Promise<PubKey> {
        const workersResult = await Workers.asyncObjectMethod(this, 'sig2PubKey', [])
        return PubKey.fromFastBuffer(workersResult.resbuf)
    }

    public static sig2PubKey(sig: Sig, hashBuf: Buffer): PubKey {
        const ecdsa = new Ecdsa().fromObject({
            sig,
            hashBuf,
        })
        return ecdsa.sig2PubKey()
    }

    public static async asyncSig2PubKey(sig: Sig, hashBuf: Buffer): Promise<PubKey> {
        const ecdsa = new Ecdsa().fromObject({
            sig,
            hashBuf,
        })
        const pubKey = await ecdsa.asyncSig2PubKey()
        return pubKey
    }

    public verifyStr(enforceLowS = true): boolean | string {
        if (!Buffer.isBuffer(this.hashBuf) || this.hashBuf.length !== 32) {
            return 'hashBuf must be a 32 byte buffer'
        }

        try {
            this.keyPair.pubKey.validate()
        } catch (err) {
            return 'Invalid pubKey: ' + err
        }

        const r = this.sig.r
        const s = this.sig.s
        if (!(r.gt(0) && r.lt(Point.getN())) || !(s.gt(0) && s.lt(Point.getN()))) {
            return 'r and s not in range'
        }

        if (enforceLowS) {
            if (!this.sig.hasLowS()) {
                return 's is too high and does not satisfy low s contraint - see bip 62'
            }
        }

        const e = new Bn().fromBuffer(this.hashBuf, this.endian ? { endian: this.endian } : undefined)
        const n = Point.getN()
        const sinv = s.invm(n)
        const u1 = sinv.mul(e).mod(n)
        const u2 = sinv.mul(r).mod(n)

        const p = Point.getG().mulAdd(u1, this.keyPair.pubKey.point, u2)
        // const p = Point.getG().mulAdd(u1, this.keyPair.pubKey.point, u2)
        if (p.isInfinity()) {
            return 'p is infinity'
        }

        if (!(p.getX().mod(n).cmp(r) === 0)) {
            return 'Invalid signature'
        } else {
            return false
        }
    }

    public sign(): this {
        const hashBuf = this.endian === 'little' ? new Br(this.hashBuf).readReverse() : this.hashBuf

        const privKey = this.keyPair.privKey

        const d = privKey.bn

        if (!hashBuf || !privKey || !d) {
            throw new Error('invalid parameters')
        }

        if (!Buffer.isBuffer(hashBuf) || hashBuf.length !== 32) {
            throw new Error('hashBuf must be a 32 byte buffer')
        }

        const N = Point.getN()
        const G = Point.getG()
        const e = new Bn().fromBuffer(hashBuf)

        // try different values of k until r, s are valid
        let badrs = 0
        let k
        let Q
        let r
        let s
        do {
            if (!this.k || badrs > 0) {
                this.deterministicK(badrs)
            }
            badrs++
            k = this.k
            Q = G.mul(k)
            r = Q.getX().mod(N)
            s = k
                .invm(N)
                .mul(e.add(d.mul(r)))
                .mod(N)
        } while (r.cmp(0) <= 0 || s.cmp(0) <= 0)

        // enforce low s
        // see Bip 62, "low S values in signatures"
        if (
            s.gt(
                new Bn().fromBuffer(
                    Buffer.from('7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0', 'hex')
                )
            )
        ) {
            s = Point.getN().sub(s)
        }
        this.sig = Sig.fromObject({
            r,
            s,
            compressed: this.keyPair.pubKey.compressed,
        })
        return this
    }

    public async asyncSign(): Promise<this> {
        const workersResult = await Workers.asyncObjectMethod(this, 'sign', [])
        return this.fromFastBuffer(workersResult.resbuf)
    }

    public signRandomK(): this {
        this.randomK()
        return this.sign()
    }

    public toString(): string {
        const obj: EcdsaLike = {} as any
        if (this.hashBuf) {
            obj.hashBuf = this.hashBuf.toString('hex')
        }
        if (this.keyPair) {
            obj.keyPair = this.keyPair.toString()
        }
        if (this.sig) {
            obj.sig = this.sig.toString()
        }
        if (this.k) {
            obj.k = this.k.toString()
        }
        return JSON.stringify(obj)
    }

    public verify(enforceLowS = true): this {
        if (!this.verifyStr(enforceLowS)) {
            this.verified = true
        } else {
            this.verified = false
        }
        return this
    }

    public async asyncVerify(enforceLowS = true): Promise<this> {
        const workersResult = await Workers.asyncObjectMethod(this, 'verify', [enforceLowS])
        return this.fromFastBuffer(workersResult.resbuf)
    }

    public static sign(hashBuf: Buffer, keyPair: KeyPair, endian?: 'big' | 'little'): Sig {
        return new Ecdsa()
            .fromObject({
                hashBuf,
                endian,
                keyPair,
            })
            .sign().sig
    }

    public static async asyncSign(hashBuf: Buffer, keyPair: KeyPair, endian?: 'big' | 'little'): Promise<Sig> {
        const ecdsa = new Ecdsa().fromObject({
            hashBuf,
            endian,
            keyPair,
        })
        await ecdsa.asyncSign()
        return ecdsa.sig
    }

    public static verify(
        hashBuf: Buffer,
        sig: Sig,
        pubKey: PubKey,
        endian?: 'big' | 'little',
        enforceLowS = true
    ): boolean {
        return new Ecdsa()
            .fromObject({
                hashBuf,
                endian,
                sig,
                keyPair: new KeyPair().fromObject({ pubKey }),
            })
            .verify(enforceLowS).verified
    }

    public static async asyncVerify(
        hashBuf: Buffer,
        sig: Sig,
        pubKey: PubKey,
        endian?: 'big' | 'little',
        enforceLowS = true
    ): Promise<boolean> {
        const ecdsa = new Ecdsa().fromObject({
            hashBuf,
            endian,
            sig,
            keyPair: new KeyPair().fromObject({ pubKey }),
        })
        await ecdsa.asyncVerify(enforceLowS)
        return ecdsa.verified
    }
}
