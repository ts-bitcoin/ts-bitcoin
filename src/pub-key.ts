/**
 * Public Key
 * ==========
 *
 * A public key corresponds to a private key. If you have a private key, you
 * can find the corresponding public key with new PubKey().fromPrivKey(privKey).
 */
import { Bn } from './bn'
import { Bw } from './bw'
import { Point } from './point'
import { PrivKey } from './priv-key'
import { Struct } from './struct'
import { Workers } from './workers'

export class PubKey extends Struct {
    public point: Point
    public compressed: boolean

    constructor(point?: Point, compressed?: boolean) {
        super({ point, compressed })
    }

    public fromJSON(json: string): this {
        this.fromFastHex(json)
        return this
    }

    public toJSON(): string {
        return this.toFastHex()
    }

    public fromPrivKey(privKey: PrivKey): this {
        this.fromObject({
            point: Point.getG().mul(privKey.bn),
            compressed: privKey.compressed,
        })
        return this
    }

    public static fromPrivKey(privKey: PrivKey): PubKey {
        return new this().fromPrivKey(privKey)
    }

    public async asyncFromPrivKey(privKey: PrivKey): Promise<this> {
        const workersResult = await Workers.asyncObjectMethod(this, 'fromPrivKey', [privKey])
        return this.fromFastBuffer(workersResult.resbuf)
    }

    public static asyncFromPrivKey(privKey: PrivKey): Promise<PubKey> {
        return new this().asyncFromPrivKey(privKey)
    }

    public fromBuffer(buf: Buffer, strict?: boolean): this {
        return this.fromDer(buf, strict)
    }

    public async asyncFromBuffer(buf: Buffer, strict?: boolean): Promise<this> {
        const args = [buf, strict]
        const workersResult = await Workers.asyncObjectMethod(this, 'fromBuffer', args)
        return this.fromFastBuffer(workersResult.resbuf)
    }

    public fromFastBuffer(buf: Buffer): this {
        if (buf.length === 0) {
            return this
        }
        const compressed = Boolean(buf[0])
        buf = buf.slice(1)
        this.fromDer(buf)
        this.compressed = compressed
        return this
    }

    /**
     * In order to mimic the non-strict style of OpenSSL, set strict = false. For
     * information and what prefixes 0x06 and 0x07 mean, in addition to the normal
     * compressed and uncompressed public keys, see the message by Peter Wuille
     * where he discovered these "hybrid pubKeys" on the mailing list:
     * http://sourceforge.net/p/bitcoin/mailman/message/29416133/
     */
    public fromDer(buf: Buffer, strict?: boolean): this {
        if (strict === undefined) {
            strict = true
        } else {
            strict = false
        }
        if (buf[0] === 0x04 || (!strict && (buf[0] === 0x06 || buf[0] === 0x07))) {
            const xbuf = buf.slice(1, 33)
            const ybuf = buf.slice(33, 65)
            if (xbuf.length !== 32 || ybuf.length !== 32 || buf.length !== 65) {
                throw new Error('LEngth of x and y must be 32 bytes')
            }
            const x = new Bn(xbuf)
            const y = new Bn(ybuf)
            this.point = new Point(x, y)
            this.compressed = false
        } else if (buf[0] === 0x03) {
            const xbuf = buf.slice(1)
            const x = new Bn(xbuf)
            this.fromX(true, x)
            this.compressed = true
        } else if (buf[0] === 0x02) {
            const xbuf = buf.slice(1)
            const x = new Bn(xbuf)
            this.fromX(false, x)
            this.compressed = true
        } else {
            throw new Error('Invalid DER format pubKey')
        }
        return this
    }

    public static fromDer(buf: Buffer, strict?: boolean): PubKey {
        return new this().fromDer(buf, strict)
    }

    public fromString(str: string): this {
        this.fromDer(Buffer.from(str, 'hex'))
        return this
    }

    public fromX(odd: boolean, x: Bn): this {
        if (typeof odd !== 'boolean') {
            throw new Error('Must specify whether x is odd or not (true or false)')
        }
        this.point = Point.fromX(odd, x)
        return this
    }

    public static fromX(odd: boolean, x: Bn): PubKey {
        return new this().fromX(odd, x)
    }

    public toBuffer(): Buffer {
        const compressed = this.compressed === undefined ? true : this.compressed
        return this.toDer(compressed)
    }

    public toFastBuffer(): Buffer {
        if (!this.point) {
            return Buffer.alloc(0)
        }
        const bw = new Bw()
        const compressed = this.compressed === undefined ? true : Boolean(this.compressed)
        bw.writeUInt8(Number(compressed))
        bw.write(this.toDer(false))
        return bw.toBuffer()
    }

    public toDer(compressed?: boolean): Buffer {
        compressed = compressed === undefined ? this.compressed : compressed
        if (typeof compressed !== 'boolean') {
            throw new Error('Must specify whether the public key is compressed or not (true or false)')
        }

        const x = this.point.getX()
        const y = this.point.getY()

        const xbuf = x.toBuffer({ size: 32 })
        const ybuf = y.toBuffer({ size: 32 })

        let prefix
        if (!compressed) {
            prefix = Buffer.from([0x04])
            return Buffer.concat([prefix, xbuf, ybuf])
        } else {
            const odd = ybuf[ybuf.length - 1] % 2
            if (odd) {
                prefix = Buffer.from([0x03])
            } else {
                prefix = Buffer.from([0x02])
            }
            return Buffer.concat([prefix, xbuf])
        }
    }

    public toString(): string {
        const compressed = this.compressed === undefined ? true : this.compressed
        return this.toDer(compressed).toString('hex')
    }

    /**
     * Translated from bitcoind's IsCompressedOrUncompressedPubKey
     */
    public static isCompressedOrUncompressed(buf: Buffer): boolean {
        if (buf.length < 33) {
            //  Non-canonical public key: too short
            return false
        }
        if (buf[0] === 0x04) {
            if (buf.length !== 65) {
                //  Non-canonical public key: invalid length for uncompressed key
                return false
            }
        } else if (buf[0] === 0x02 || buf[0] === 0x03) {
            if (buf.length !== 33) {
                //  Non-canonical public key: invalid length for compressed key
                return false
            }
        } else {
            //  Non-canonical public key: neither compressed nor uncompressed
            return false
        }
        return true
    }

    // https://www.iacr.org/archive/pkc2003/25670211/25670211.pdf
    public validate(): this {
        if (this.point.isInfinity()) {
            throw new Error('point: Point cannot be equal to Infinity')
        }
        if (this.point.eq(new Point(new Bn(0), new Bn(0)))) {
            throw new Error('point: Point cannot be equal to 0, 0')
        }
        this.point.validate()
        return this
    }
}
