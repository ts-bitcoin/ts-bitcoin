/**
 * Peer-to-Peer Network Message
 * ============================
 *
 * A message on the bitcoin p2p network.
 */
import { Br } from './br'
import { Bw } from './bw'
import { Constants, getConstants, NetworkConstants } from './constants'
import { Hash } from './hash'
import { Struct } from './struct'
import { cmp } from './cmp'

export class Msg extends Struct {
    public constants: NetworkConstants
    public magicNum: number

    public cmdbuf: Buffer
    public datasize: number
    public checksumbuf: Buffer
    public dataBuf: Buffer

    constructor(
        magicNum?: number,
        cmdbuf?: Buffer,
        datasize?: number,
        checksumbuf?: Buffer,
        dataBuf?: Buffer,
        constants?: NetworkConstants
    ) {
        super()
        this.constants = constants || Constants.Default
        this.magicNum = this.constants.Msg.magicNum
        this.fromObject({ magicNum, cmdbuf, datasize, checksumbuf, dataBuf })
    }

    public setCmd(cmdname: string): this {
        this.cmdbuf = Buffer.alloc(12)
        this.cmdbuf.fill(0)
        this.cmdbuf.write(cmdname)
        return this
    }

    public getCmd(): string {
        let end = this.cmdbuf.length
        for (let i = end; i > 0; i--) {
            if (this.cmdbuf[i - 1] !== 0) {
                end = i
                break
            }
        }
        return this.cmdbuf.toString('utf8', 0, end)
    }

    public static checksum(dataBuf: Buffer): Buffer {
        return Hash.sha256Sha256(dataBuf).slice(0, 4)
    }

    public static async asyncChecksum(dataBuf: Buffer): Promise<Buffer> {
        const hashBuf = await Hash.asyncSha256Sha256(dataBuf)
        return hashBuf.slice(0, 4)
    }

    public setData(dataBuf: Buffer): this {
        this.dataBuf = dataBuf
        this.datasize = dataBuf.length
        this.checksumbuf = Msg.checksum(dataBuf)
        return this
    }

    public async asyncSetData(dataBuf: Buffer): Promise<this> {
        this.dataBuf = dataBuf
        this.datasize = dataBuf.length
        this.checksumbuf = await Msg.asyncChecksum(dataBuf)
        return this
    }

    /**
     * An iterator to produce a message from a series of buffers. Set opts.strict
     * to throw an error if an invalid message occurs in stream.
     */
    public *genFromBuffers(opts: { strict?: boolean } = {}): Generator<number, any, Buffer> {
        let res = yield* this.expect(4)
        this.magicNum = new Br(res.buf).readUInt32BE()
        if (opts.strict && this.magicNum !== this.constants.Msg.magicNum) {
            throw new Error('invalid magicNum')
        }
        res = yield* this.expect(12, res.remainderbuf)
        this.cmdbuf = new Br(res.buf).read(12)
        res = yield* this.expect(4, res.remainderbuf)
        this.datasize = new Br(res.buf).readUInt32BE()
        if (opts.strict && this.datasize > this.constants.MaxSize) {
            throw new Error('message size greater than maxsize')
        }
        res = yield* this.expect(4, res.remainderbuf)
        this.checksumbuf = new Br(res.buf).read(4)
        res = yield* this.expect(this.datasize, res.remainderbuf)
        this.dataBuf = new Br(res.buf).read(this.datasize)
        return res.remainderbuf
    }

    public fromBr(br: Br): this {
        this.magicNum = br.readUInt32BE()
        this.constants = getConstants(this.magicNum)
        this.cmdbuf = br.read(12)
        this.datasize = br.readUInt32BE()
        this.checksumbuf = br.read(4)
        this.dataBuf = br.read()
        return this
    }

    public toBw(bw?: Bw): Bw {
        if (!bw) {
            bw = new Bw()
        }
        bw.writeUInt32BE(this.magicNum)
        bw.write(this.cmdbuf)
        bw.writeUInt32BE(this.datasize)
        bw.write(this.checksumbuf)
        bw.write(this.dataBuf)
        return bw
    }

    public fromJSON(json: {
        magicNum: number
        cmdbuf: string
        datasize: number
        checksumbuf: string
        dataBuf: string
    }): this {
        this.magicNum = json.magicNum
        this.constants = getConstants(this.magicNum)
        this.cmdbuf = Buffer.from(json.cmdbuf, 'hex')
        this.datasize = json.datasize
        this.checksumbuf = Buffer.from(json.checksumbuf, 'hex')
        this.dataBuf = Buffer.from(json.dataBuf, 'hex')
        return this
    }

    public toJSON() {
        return {
            magicNum: this.magicNum,
            cmdbuf: this.cmdbuf.toString('hex'),
            datasize: this.datasize,
            checksumbuf: this.checksumbuf.toString('hex'),
            dataBuf: this.dataBuf.toString('hex'),
        }
    }

    public isValid(): boolean {
        // TODO: Add more checks
        const checksumbuf = Msg.checksum(this.dataBuf)
        return cmp(checksumbuf, this.checksumbuf)
    }

    public async asyncIsValid(): Promise<boolean> {
        // TODO: Add more checks
        const checksumbuf = await Msg.asyncChecksum(this.dataBuf)
        return cmp(checksumbuf, this.checksumbuf)
    }

    public validate(): this {
        if (!this.isValid()) {
            throw new Error('invalid message')
        }
        return this
    }

    public async asyncValidate(): Promise<void> {
        const isValid = await this.asyncIsValid()
        if (isValid !== true) {
            throw new Error('invalid message')
        }
    }

    public static Mainnet: typeof Msg

    public static Testnet: typeof Msg

    public static Regtest: typeof Msg

    public static STN: typeof Msg
}

Msg.Mainnet = class extends Msg {
    constructor(magicNum: number, cmdbuf: Buffer, datasize: number, checksumbuf: Buffer, dataBuf: Buffer) {
        super(magicNum, cmdbuf, datasize, checksumbuf, dataBuf, Constants.Mainnet)
    }
}

Msg.Testnet = class extends Msg {
    constructor(magicNum?: number, cmdbuf?: Buffer, datasize?: number, checksumbuf?: Buffer, dataBuf?: Buffer) {
        super(magicNum, cmdbuf, datasize, checksumbuf, dataBuf, Constants.Testnet)
    }
}

Msg.Regtest = class extends Msg {
    constructor(magicNum?: number, cmdbuf?: Buffer, datasize?: number, checksumbuf?: Buffer, dataBuf?: Buffer) {
        super(magicNum, cmdbuf, datasize, checksumbuf, dataBuf, Constants.Regtest)
    }
}

Msg.STN = class extends Msg {
    constructor(magicNum?: number, cmdbuf?: Buffer, datasize?: number, checksumbuf?: Buffer, dataBuf?: Buffer) {
        super(magicNum, cmdbuf, datasize, checksumbuf, dataBuf, Constants.STN)
    }
}
