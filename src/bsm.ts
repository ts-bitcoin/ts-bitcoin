/**
 * Bitcoin Signed Message
 * ======================
 *
 * "Bitcoin Signed Message" just refers to a standard way of signing and
 * verifying an arbitrary message. The standard way to do this involves using a
 * "Bitcoin Signed Message:\n" prefix, which this code does. You are probably
 * interested in the static Bsm.sign( ... ) and Bsm.verify( ... ) functions,
 * which deal with a base64 string representing the compressed format of a
 * signature.
 */
import { Address } from './address'
import { Bw } from './bw'
import { cmp } from './cmp'
import { Ecdsa } from './ecdsa'
import { Hash } from './hash'
import { KeyPair } from './key-pair'
import { Sig } from './sig'
import { StructLegacy } from './struct-legacy'
import { Workers } from './workers'

export class Bsm extends StructLegacy {
    public static readonly magicBytes = Buffer.from('Bitcoin Signed Message:\n')

    public messageBuf: Buffer
    public keyPair: KeyPair
    public sig: Sig
    public address: Address
    public verified: boolean

    constructor(messageBuf?: Buffer, keyPair?: KeyPair, sig?: Sig, address?: Address, verified?: boolean) {
        super({ messageBuf, keyPair, sig, address, verified })
    }

    public static magicHash(messageBuf: Buffer): Buffer {
        if (!Buffer.isBuffer(messageBuf)) {
            throw new Error('messageBuf must be a buffer')
        }
        const bw = new Bw()
        bw.writeVarIntNum(Bsm.magicBytes.length)
        bw.write(Bsm.magicBytes)
        bw.writeVarIntNum(messageBuf.length)
        bw.write(messageBuf)
        const buf = bw.toBuffer()

        const hashBuf = Hash.sha256Sha256(buf)

        return hashBuf
    }

    public static async asyncMagicHash(messageBuf: Buffer): Promise<Buffer> {
        const args = [messageBuf]
        const workersResult = await Workers.asyncClassMethod(Bsm, 'magicHash', args)
        return workersResult.resbuf
    }

    public static sign(messageBuf: Buffer, keyPair: KeyPair): string {
        const m = new Bsm(messageBuf, keyPair)
        m.sign()
        const sigbuf = m.sig.toCompact()
        const sigstr = sigbuf.toString('base64')
        return sigstr
    }

    public static async asyncSign(messageBuf: Buffer, keyPair: KeyPair): Promise<string> {
        const args = [messageBuf, keyPair]
        const workersResult = await Workers.asyncClassMethod(Bsm, 'sign', args)
        const sigstr = JSON.parse(workersResult.resbuf.toString())
        return sigstr
    }

    public static verify(messageBuf: Buffer, sigstr: string, address: Address): boolean {
        const sigbuf = Buffer.from(sigstr, 'base64')
        const message = new Bsm()
        message.messageBuf = messageBuf
        message.sig = new Sig().fromCompact(sigbuf)
        message.address = address

        return message.verify().verified
    }

    public static async asyncVerify(messageBuf: Buffer, sigstr: string, address: Address): Promise<boolean> {
        const args = [messageBuf, sigstr, address]
        const workersResult = await Workers.asyncClassMethod(Bsm, 'verify', args)
        const res = JSON.parse(workersResult.resbuf.toString())
        return res
    }

    public sign(): this {
        const hashBuf = Bsm.magicHash(this.messageBuf)
        const ecdsa = new Ecdsa().fromObject({
            hashBuf,
            keyPair: this.keyPair,
        })
        ecdsa.sign()
        ecdsa.calcrecovery()
        this.sig = ecdsa.sig
        return this
    }

    public verify(): this {
        const hashBuf = Bsm.magicHash(this.messageBuf)

        const ecdsa = new Ecdsa()
        ecdsa.hashBuf = hashBuf
        ecdsa.sig = this.sig
        ecdsa.keyPair = new KeyPair()
        ecdsa.keyPair.pubKey = ecdsa.sig2PubKey()

        if (!ecdsa.verify()) {
            this.verified = false
            return this
        }

        const address = new Address().fromPubKey(ecdsa.keyPair.pubKey)
        // TODO: what if livenet/testnet mismatch?
        if (cmp(address.hashBuf, this.address.hashBuf)) {
            this.verified = true
        } else {
            this.verified = false
        }

        return this
    }
}
