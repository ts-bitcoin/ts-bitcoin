import { Bip39 } from './bip-39'
import { wordList } from './bip-39-jp-wordlist'

export class Bip39Jp extends Bip39 {
    constructor(mnemonic: string, seed: Buffer) {
        super(mnemonic, seed, wordList)
    }
}
