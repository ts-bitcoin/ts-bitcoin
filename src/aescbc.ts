/**
 * Aescbc (experimental)
 * =====================
 *
 * This is a convenience class for using Aes with Cbc. This is a low-level tool
 * that does not include authentication. You should only use this if you are
 * authenticating your data somehow else.
 */
import { Aes } from './aes'
import { Cbc } from './cbc'
import { Random } from './random'

export class Aescbc {
    public static encrypt(messageBuf: Buffer, cipherKeyBuf: Buffer, ivBuf: Buffer, concatIvBuf = true): Buffer {
        ivBuf = ivBuf || Random.getRandomBuffer(128 / 8)
        const ctBuf = Cbc.encrypt(messageBuf, ivBuf, Aes, cipherKeyBuf)
        if (concatIvBuf) {
            return Buffer.concat([ivBuf, ctBuf])
        } else {
            return ctBuf
        }
    }

    public static decrypt(encBuf: Buffer, cipherKeyBuf: Buffer, ivBuf?: Buffer): Buffer {
        if (!ivBuf) {
            ivBuf = encBuf.slice(0, 128 / 8)
            const ctBuf = encBuf.slice(128 / 8)
            return Cbc.decrypt(ctBuf, ivBuf, Aes, cipherKeyBuf)
        } else {
            const ctBuf = encBuf
            return Cbc.decrypt(ctBuf, ivBuf, Aes, cipherKeyBuf)
        }
    }
}
