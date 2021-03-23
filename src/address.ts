/**
 * Bitcoin Address
 * ===============
 *
 * A bitcoin address. Normal use cases:
 * const address = new Address().fromPubKey(pubKey)
 * const address = new Address().fromString(string)
 * const string = address.toString()
 * const script = address.toTxOutScript()
 * const isValid = Address.isValid(string)
 *
 * Can also do testnet:
 * const address = Address.Testnet()
 *
 * Note that an Address and an Addr are two completely different things. An
 * Address is what you send bitcoin to. An Addr is an ip address and port that
 * you connect to over the internet.
 */
import { Base58Check } from './base-58-check'
import { Constants, NetworkConstants } from './constants'
import { Hash } from './hash'
import { OpCode } from './op-code'
import { PubKey } from './pub-key'
import { PrivKey } from './priv-key'
import { Script } from './script'
import { Struct } from './struct'
import { Workers } from './workers'

interface AddressLike {
    versionByteNum: number
    hashBuf: string
}

export class Address extends Struct {
    public versionByteNum: number
    public hashBuf: Buffer
    public Constants: NetworkConstants['Address']

    constructor(versionByteNum?: number, hashBuf?: Buffer, constants?: NetworkConstants['Address']) {
        super({ versionByteNum, hashBuf })
        this.Constants = constants || Constants.Default.Address
    }

    public fromBuffer(buf: Buffer): this {
        if (buf.length !== 1 + 20) {
            throw new Error('address buffers must be exactly 21 bytes')
        }
        if (buf[0] !== this.Constants.pubKeyHash) {
            throw new Error('address: invalid versionByteNum byte')
        }
        this.versionByteNum = buf[0]
        this.hashBuf = buf.slice(1)
        return this
    }

    public fromPubKeyHashBuf(hashBuf: Buffer): this {
        this.hashBuf = hashBuf
        this.versionByteNum = this.Constants.pubKeyHash
        return this
    }

    public static fromPubKeyHashBuf(hashBuf: Buffer): Address {
        return new this().fromPubKeyHashBuf(hashBuf)
    }

    public fromPubKey(pubKey: PubKey): this {
        const hashBuf = Hash.sha256Ripemd160(pubKey.toBuffer())
        return this.fromPubKeyHashBuf(hashBuf)
    }

    public static fromPubKey(pubKey: PubKey): Address {
        return new this().fromPubKey(pubKey)
    }

    public async asyncFromPubKey(pubKey: PubKey): Promise<this> {
        const args = [pubKey]
        const workersResult = await Workers.asyncObjectMethod(this, 'fromPubKey', args)
        return this.fromFastBuffer(workersResult.resbuf)
    }

    public static asyncFromPubKey(pubKey: PubKey): Promise<Address> {
        return new this().asyncFromPubKey(pubKey)
    }

    public fromPrivKey(privKey: PrivKey): this {
        const pubKey = new PubKey().fromPrivKey(privKey)
        const hashBuf = Hash.sha256Ripemd160(pubKey.toBuffer())
        return this.fromPubKeyHashBuf(hashBuf)
    }

    public static fromPrivKey(privKey): Address {
        return new this().fromPrivKey(privKey)
    }

    public async asyncFromPrivKey(privKey: PrivKey): Promise<this> {
        const args = [privKey]
        const workersResult = await Workers.asyncObjectMethod(this, 'fromPrivKey', args)
        return this.fromFastBuffer(workersResult.resbuf)
    }

    public static asyncFromPrivKey(privKey: PrivKey): Address {
        return new this().fromPrivKey(privKey)
    }

    public fromRandom(): this {
        const randomPrivKey = new PrivKey().fromRandom()
        return this.fromPrivKey(randomPrivKey)
    }

    public static fromRandom(): Address {
        return new this().fromRandom()
    }

    public async asyncFromRandom(): Promise<this> {
        const args = []
        const workersResult = await Workers.asyncObjectMethod(this, 'fromRandom', args)
        return this.fromFastBuffer(workersResult.resbuf)
    }

    public static asyncFromRandom(): Address {
        return new this().fromRandom()
    }

    public fromString(str: string): this {
        const buf = Base58Check.decode(str)
        return this.fromBuffer(buf)
    }

    public async asyncFromString(str: string): Promise<this> {
        const args = [str]
        const workersResult = await Workers.asyncObjectMethod(this, 'fromString', args)
        return this.fromFastBuffer(workersResult.resbuf)
    }

    public static isValid(addrstr: string): boolean {
        let address
        try {
            address = new Address().fromString(addrstr)
        } catch (e) {
            return false
        }
        return address.isValid()
    }

    public isValid(): boolean {
        try {
            this.validate()
            return true
        } catch (e) {
            return false
        }
    }

    public toTxOutScript(): Script {
        const script = new Script()
        script.writeOpCode(OpCode.OP_DUP)
        script.writeOpCode(OpCode.OP_HASH160)
        script.writeBuffer(this.hashBuf)
        script.writeOpCode(OpCode.OP_EQUALVERIFY)
        script.writeOpCode(OpCode.OP_CHECKSIG)

        return script
    }

    public fromTxInScript(script: Script): this {
        const pubKeyHashBuf = Hash.sha256Ripemd160(script.chunks[1].buf || Buffer.from('00'.repeat(32), 'hex'))
        return this.fromPubKeyHashBuf(pubKeyHashBuf)
    }

    public static fromTxInScript(script: Script): Address {
        return new this().fromTxInScript(script)
    }

    public fromTxOutScript(script: Script): this {
        return this.fromPubKeyHashBuf(script.chunks[2].buf)
    }

    public static fromTxOutScript(script: Script): Address {
        return new this().fromTxOutScript(script)
    }

    public toBuffer(): Buffer {
        const versionByteBuf = Buffer.from([this.versionByteNum])
        const buf = Buffer.concat([versionByteBuf, this.hashBuf])
        return buf
    }

    public toJSON(): AddressLike {
        const json: AddressLike = {} as any
        if (this.hashBuf) {
            json.hashBuf = this.hashBuf.toString('hex')
        }
        if (typeof this.versionByteNum !== 'undefined') {
            json.versionByteNum = this.versionByteNum
        }
        return json
    }

    public fromJSON(json: AddressLike): this {
        if (json.hashBuf) {
            this.hashBuf = Buffer.from(json.hashBuf, 'hex')
        }
        if (typeof json.versionByteNum !== 'undefined') {
            this.versionByteNum = json.versionByteNum
        }
        return this
    }

    public toString(): string {
        return Base58Check.encode(this.toBuffer())
    }

    public async asyncToString(): Promise<string> {
        const args = []
        const workersResult = await Workers.asyncObjectMethod(this, 'toString', args)
        return JSON.parse(workersResult.resbuf.toString())
    }

    public validate(): this {
        if (!Buffer.isBuffer(this.hashBuf) || this.hashBuf.length !== 20) {
            throw new Error('hashBuf must be a buffer of 20 bytes')
        }
        if (this.versionByteNum !== this.Constants.pubKeyHash) {
            throw new Error('invalid versionByteNum')
        }
        return this
    }

    public static readonly Mainnet = class extends Address {
        constructor(versionByteNum?: number, hashBuf?: Buffer) {
            super(versionByteNum, hashBuf, Constants.Mainnet.Address)
        }
    }

    public static readonly Testnet = class extends Address {
        constructor(versionByteNum?: number, hashBuf?: Buffer) {
            super(versionByteNum, hashBuf, Constants.Testnet.Address)
        }
    }
}
