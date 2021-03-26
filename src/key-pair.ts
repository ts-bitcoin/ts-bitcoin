/**
 * KeyPair
 * =======
 *
 * A keyPair is a collection of a private key and a public key.
 * const keyPair = new KeyPair().fromRandom()
 * const keyPair = new KeyPair().fromPrivKey(privKey)
 * const privKey = keyPair.privKey
 * const pubKey = keyPair.pubKey
 */
import { PrivKey as DefaultPrivKey, PrivKey } from './priv-key'
import { PubKey } from './pub-key'
import { Struct } from './struct'
import { Bw } from './bw'
import { Br } from './br'

interface KeyPairLike {
    privKey: string
    pubKey: string
}

export class KeyPair extends Struct {
    public privKey: DefaultPrivKey
    public pubKey: PubKey
    public PrivKey: typeof DefaultPrivKey

    constructor(privKey?: DefaultPrivKey, pubKey?: PubKey, PrivKey = DefaultPrivKey) {
        super({ privKey, pubKey })
        this.PrivKey = PrivKey
    }

    public fromJSON(json: KeyPairLike): this {
        if (json.privKey) {
            this.privKey = this.PrivKey.fromJSON(json.privKey)
        }
        if (json.pubKey) {
            this.pubKey = PubKey.fromJSON(json.pubKey)
        }
        return this
    }

    public fromBr(br: Br): this {
        const buflen1 = br.readUInt8()
        if (buflen1 > 0) {
            this.privKey = new this.PrivKey().fromFastBuffer(br.read(buflen1))
        }
        const buflen2 = br.readUInt8()
        if (buflen2 > 0) {
            this.pubKey = new PubKey().fromFastBuffer(br.read(buflen2))
        }
        return this
    }

    public toBw(bw?: Bw): Bw {
        if (!bw) {
            bw = new Bw()
        }
        if (this.privKey) {
            const privKeybuf = this.privKey.toFastBuffer()
            bw.writeUInt8(privKeybuf.length)
            bw.write(privKeybuf)
        } else {
            bw.writeUInt8(0)
        }
        if (this.pubKey) {
            const pubKeybuf = this.pubKey.toFastBuffer()
            bw.writeUInt8(pubKeybuf.length)
            bw.write(pubKeybuf)
        } else {
            bw.writeUInt8(0)
        }
        return bw
    }

    public fromString(str: string): this {
        return this.fromJSON(JSON.parse(str))
    }

    public toString(): string {
        return JSON.stringify(this.toJSON())
    }

    public toPublic(): KeyPair {
        const keyPair = new KeyPair().fromObject(this)
        keyPair.privKey = undefined
        return keyPair
    }

    public fromPrivKey(privKey: PrivKey): this {
        this.privKey = privKey
        this.pubKey = new PubKey().fromPrivKey(privKey)
        return this
    }

    public static fromPrivKey(privKey: PrivKey): KeyPair {
        return new this().fromPrivKey(privKey)
    }

    public async asyncFromPrivKey(privKey: PrivKey): Promise<this> {
        this.privKey = privKey
        this.pubKey = await new PubKey().asyncFromPrivKey(privKey)
        return this
    }

    public static asyncFromPrivKey(privKey: PrivKey): Promise<KeyPair> {
        return new this().asyncFromPrivKey(privKey)
    }

    public fromRandom(): this {
        this.privKey = new this.PrivKey().fromRandom()
        this.pubKey = new PubKey().fromPrivKey(this.privKey)
        return this
    }

    public static fromRandom(): KeyPair {
        return new this().fromRandom()
    }

    public async asyncFromRandom(): Promise<this> {
        this.privKey = new this.PrivKey().fromRandom()
        return this.asyncFromPrivKey(this.privKey)
    }

    public static asyncFromRandom(): Promise<KeyPair> {
        return new this().asyncFromRandom()
    }

    public static Mainnet: typeof KeyPair

    public static Testnet: typeof KeyPair
}

KeyPair.Mainnet = class extends KeyPair {
    constructor(privKey?: DefaultPrivKey, pubKey?: PubKey) {
        super(privKey, pubKey, DefaultPrivKey.Mainnet)
    }
}

KeyPair.Testnet = class extends KeyPair {
    constructor(privKey?: DefaultPrivKey, pubKey?: PubKey) {
        super(privKey, pubKey, DefaultPrivKey.Testnet)
    }
}
