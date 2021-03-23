/**
 * Inv
 * ===
 *
 * Inventory - used in p2p messages.
 */
import { Br } from './br'
import { Bw } from './bw'
import { Struct } from './struct'

export class Inv extends Struct {
    public static readonly MSG_TX = 1
    public static readonly MSG_BLOCK = 2
    public static readonly MSG_FILTERED_BLOCK = 3

    public typeNum: number
    public hashBuf: Buffer

    constructor(typeNum?: number, hashBuf?: Buffer) {
        super({ typeNum, hashBuf })
    }

    public fromBr(br: Br): this {
        this.typeNum = br.readUInt32LE()
        this.hashBuf = br.read(32)
        return this
    }

    public toBw(bw?: Bw): Bw {
        if (!bw) {
            bw = new Bw()
        }
        bw.writeUInt32LE(this.typeNum)
        bw.write(this.hashBuf)
        return bw
    }

    public isTx(): boolean {
        return this.typeNum === Inv.MSG_TX
    }

    public isBlock(): boolean {
        return this.typeNum === Inv.MSG_BLOCK
    }

    public isFilteredBlock(): boolean {
        return this.typeNum === Inv.MSG_FILTERED_BLOCK
    }
}
