/**
 * Private Key
 * ===========
 *
 * A private key is used for signing transactions (or messages). The primary
 * way to use this is new PrivKey().fromRandom(), or new PrivKey().fromBuffer(buf).
 */
import { Bn } from './bn'
import { Point } from './point'
import { Constants, NetworkConstants } from './constants'
import { Base58Check } from './base-58-check'
import { Random } from './random'
import { Struct } from './struct'

export class PrivKey extends Struct {
    public bn: Bn
    public compressed: boolean
    public Constants: NetworkConstants['PrivKey']

    constructor(bn?: Bn, compressed?: boolean, constants?: NetworkConstants['PrivKey']) {
        super({ bn, compressed })
        constants = constants || Constants.Default.PrivKey
        this.Constants = constants
    }

    public fromJSON(json: string): this {
        this.fromHex(json)
        return this
    }

    public toJSON(): string {
        return this.toHex()
    }

    public fromRandom(): this {
        let privBuf: Buffer, bn: Bn, condition: boolean

        do {
            privBuf = Random.getRandomBuffer(32)
            bn = new Bn().fromBuffer(privBuf)
            condition = bn.lt(Point.getN())
        } while (!condition)

        this.fromObject({
            bn: bn,
            compressed: true,
        })
        return this
    }

    public static fromRandom(): PrivKey {
        return new this().fromRandom()
    }

    public toBuffer(): Buffer {
        let compressed = this.compressed

        if (compressed === undefined) {
            compressed = true
        }

        const privBuf = this.bn.toBuffer({ size: 32 })
        let buf
        if (compressed) {
            buf = Buffer.concat([Buffer.from([this.Constants.versionByteNum]), privBuf, Buffer.from([0x01])])
        } else {
            buf = Buffer.concat([Buffer.from([this.Constants.versionByteNum]), privBuf])
        }

        return buf
    }

    public fromBuffer(buf: Buffer): this {
        if (buf.length === 1 + 32 + 1 && buf[1 + 32 + 1 - 1] === 1) {
            this.compressed = true
        } else if (buf.length === 1 + 32) {
            this.compressed = false
        } else {
            throw new Error('Length of privKey buffer must be 33 (uncompressed pubKey) or 34 (compressed pubKey)')
        }

        if (buf[0] !== this.Constants.versionByteNum) {
            throw new Error('Invalid versionByteNum byte')
        }

        return this.fromBn(new Bn().fromBuffer(buf.slice(1, 1 + 32)))
    }

    public toBn(): Bn {
        return this.bn
    }

    public fromBn(bn: Bn): this {
        this.bn = bn
        return this
    }

    public static fromBn(bn: Bn): PrivKey {
        return new this().fromBn(bn)
    }

    public validate(): this {
        if (!this.bn.lt(Point.getN())) {
            throw new Error('Number must be less than N')
        }
        if (typeof this.compressed !== 'boolean') {
            throw new Error('Must specify whether the corresponding public key is compressed or not (true or false)')
        }
        return this
    }

    /**
     * Output the private key a Wallet Import Format (Wif) string.
     */
    public toWif(): string {
        return Base58Check.encode(this.toBuffer())
    }

    /**
     * Input the private key from a Wallet Import Format (Wif) string.
     */
    public fromWif(str: string): this {
        return this.fromBuffer(Base58Check.decode(str))
    }

    public static fromWif(str: string): PrivKey {
        return new this().fromWif(str)
    }

    public toString(): string {
        return this.toWif()
    }

    public fromString(str: string): this {
        return this.fromWif(str)
    }

    public static readonly Mainnet = class extends PrivKey {
        constructor(bn?: Bn, compressed?: boolean) {
            super(bn, compressed, Constants.Mainnet.PrivKey)
        }
    }

    public static readonly Testnet = class extends PrivKey {
        constructor(bn?: Bn, compressed?: boolean) {
            super(bn, compressed, Constants.Testnet.PrivKey)
        }
    }
}
