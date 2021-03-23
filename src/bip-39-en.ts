import { Bip39 } from './bip-39'
import { wordList } from './bip-39-en-wordlist'

export class Bip39En extends Bip39 {
    constructor(mnemonic?: string, seed?: Buffer) {
        super(mnemonic, seed, wordList)
    }
}
