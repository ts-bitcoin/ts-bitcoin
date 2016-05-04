/* global describe,it */
'use strict'
let Address = require('../lib/address')
let Constants = require('../lib/constants')
let Hash = require('../lib/hash')
let PrivKey = require('../lib/priv-key')
let PubKey = require('../lib/pub-key')
let Script = require('../lib/script')
let asink = require('asink')
let should = require('chai').should()

describe('Address', function () {
  let pubKeyHash = new Buffer('3c3fa3d4adcaf8f52d5b1843975e122548269937', 'hex')
  let version = 0
  let buf = Buffer.concat([new Buffer([0]), pubKeyHash])
  let str = '16VZnHwRhwrExfeHFHGjwrgEMq8VcYPs9r'

  it('should satisfy these basic API features', function () {
    let address = new Address()
    should.exist(address)
    address = Address()
    should.exist(address)
    address = Address(version, pubKeyHash)
    should.exist(address)
    Address().constructor.should.equal(Address().constructor)
    Address.TestNet().constructor.should.equal(Address.TestNet().constructor)
  })

  describe('@isValid', function () {
    it('should validate this valid address string', function () {
      Address.isValid(str).should.equal(true)
    })

    it('should invalidate this valid address string', function () {
      Address.isValid(str.substr(1)).should.equal(false)
    })
  })

  describe('#fromHex', function () {
    it('should make an address from a hex string', function () {
      Address().fromHex(buf.toString('hex')).toBuffer().slice(1).toString('hex').should.equal(pubKeyHash.toString('hex'))
      Address().fromHex(buf.toString('hex')).toString().should.equal(str)
    })
  })

  describe('#fromBuffer', function () {
    it('should make an address from a buffer', function () {
      Address().fromBuffer(buf).toBuffer().slice(1).toString('hex').should.equal(pubKeyHash.toString('hex'))
      Address().fromBuffer(buf).toString().should.equal(str)
    })

    it('should throw for invalid buffers', function () {
      (function () {
        Address().fromBuffer(Buffer.concat([buf, new Buffer([0])]))
      }).should.throw('address buffers must be exactly 21 bytes')
      ;(function () {
        let buf2 = new Buffer(buf)
        buf2[0] = 50
        Address().fromBuffer(buf2)
      }).should.throw('invalid version byte')
    })
  })

  describe('#fromPubKeyHashBuf', function () {
    it('should make an address from a hashBuf', function () {
      let buf = new Buffer(20)
      buf.fill(0)
      let address = Address().fromPubKeyHashBuf(buf)
      address.toString().should.equal('1111111111111111111114oLvT2')
    })
  })

  describe('#fromPubKey', function () {
    it('should make this address from a compressed pubKey', function () {
      let pubKey = new PubKey()
      pubKey.fromDer(new Buffer('0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004', 'hex'))
      let address = new Address()
      address.fromPubKey(pubKey)
      address.toString().should.equal('19gH5uhqY6DKrtkU66PsZPUZdzTd11Y7ke')
    })

    it('should make this address from an uncompressed pubKey', function () {
      let pubKey = new PubKey()
      pubKey.fromDer(new Buffer('0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004', 'hex'))
      let address = new Address()
      pubKey.compressed = false
      address.fromPubKey(pubKey, 'mainnet')
      address.toString().should.equal('16JXnhxjJUhxfyx4y6H4sFcxrgt8kQ8ewX')
    })
  })

  describe('#asyncFromPubKey', function () {
    it('should asynchronously convert pubKey to address same as fromPubKey', function () {
      return asink(function * () {
        let pubKey = PubKey().fromPrivKey(PrivKey().fromRandom())
        let address1 = Address().fromPubKey(pubKey)
        let address2 = yield Address().asyncFromPubKey(pubKey)
        address1.toString().should.equal(address2.toString())
      }, this)
    })
  })

  describe('#fromPrivKey', function () {
    it('should make this address from a compressed pubKey', function () {
      let privKey = PrivKey().fromRandom()
      let pubKey = PubKey().fromPrivKey(privKey)
      let address = Address().fromPrivKey(privKey)
      let address2 = Address().fromPubKey(pubKey)
      address.toString().should.equal(address2.toString())
    })
  })

  describe('#asyncFromPrivKey', function () {
    it('should asynchronously convert privKey to address same as fromPrivKey', function () {
      return asink(function * () {
        let privKey = PrivKey().fromRandom()
        let address1 = Address().fromPrivKey(privKey)
        let address2 = yield Address().asyncFromPrivKey(privKey)
        address1.toString().should.equal(address2.toString())
      }, this)
    })
  })

  describe('#fromRedeemScriptHashBuf', function () {
    it('should make this address from a script', function () {
      let script = Script().fromString('OP_CHECKMULTISIG')
      let hashBuf = Hash.sha256ripemd160(script.toBuffer())
      let address = Address().fromRedeemScriptHashBuf(hashBuf)
      address.toString().should.equal('3BYmEwgV2vANrmfRymr1mFnHXgLjD6gAWm')
    })
  })

  describe('#fromRedeemScript', function () {
    it('should make this address from a script', function () {
      let script = Script().fromString('OP_CHECKMULTISIG')
      let address = Address().fromRedeemScript(script)
      address.toString().should.equal('3BYmEwgV2vANrmfRymr1mFnHXgLjD6gAWm')
    })

    it('should make this address from other script', function () {
      let script = Script().fromString('OP_CHECKSIG OP_HASH160')
      let address = Address().fromRedeemScript(script)
      address.toString().should.equal('347iRqVwks5r493N1rsLN4k9J7Ljg488W7')
    })
  })

  describe('#asyncFromRedeemScript', function () {
    it('should derive the same as fromRedeemScript', function () {
      return asink(function * () {
        let script = Script().fromString('OP_CHECKMULTISIG')
        let address1 = Address().fromRedeemScript(script)
        let address2 = yield Address().asyncFromRedeemScript(script)
        address1.toString().should.equal(address2.toString())
      }, this)
    })
  })

  describe('#fromString', function () {
    it('should derive from this known address string mainnet', function () {
      let address = new Address()
      address.fromString(str)
      address.toBuffer().slice(1).toString('hex').should.equal(pubKeyHash.toString('hex'))
    })

    it('should derive from this known address string testnet', function () {
      let address = new Address.TestNet()
      address.fromString('mm1X5M2QWyHVjn7txrF7mmtZDpjCXzoa98')
      address.version = Constants.TestNet.Address['pubKeyHash']
      address.fromString(address.toString())
      address.toString().should.equal('mm1X5M2QWyHVjn7txrF7mmtZDpjCXzoa98')
    })

    it('should derive from this known address string mainnet scripthash', function () {
      let address = new Address()
      address.fromString(str)
      address.version = Constants.MainNet.Address['scripthash']
      address.fromString(address.toString())
      address.toString().should.equal('37BahqRsFrAd3qLiNNwLNV3AWMRD7itxTo')
    })

    it('should derive from this known address string testnet scripthash', function () {
      let address = new Address.TestNet()
      address.fromString('2MxjnmaMtsJfyFcyG3WZCzS2RihdNuWqeX4')
      address.version = Constants.TestNet.Address['scripthash']
      address.fromString(address.toString())
      address.toString().should.equal('2MxjnmaMtsJfyFcyG3WZCzS2RihdNuWqeX4')
    })
  })

  describe('#asyncFromString', function () {
    it('should derive the same as fromString', function () {
      return asink(function * () {
        let address1 = Address().fromString(str)
        let address2 = yield Address().asyncFromString(str)
        address1.toString().should.equal(address2.toString())
      }, this)
    })
  })

  describe('#isValid', function () {
    it('should describe this valid address as valid', function () {
      let address = new Address()
      address.fromString('37BahqRsFrAd3qLiNNwLNV3AWMRD7itxTo')
      address.isValid().should.equal(true)
    })

    it('should describe this address with unknown version as invalid', function () {
      let address = new Address()
      address.fromString('37BahqRsFrAd3qLiNNwLNV3AWMRD7itxTo')
      address.version = 1
      address.isValid().should.equal(false)
    })
  })

  describe('#type', function () {
    it('should give pubKeyHash for this address', function () {
      let addr = Address().fromString(str)
      addr.type().should.equal('pubKeyHash')
      addr.version = 1
      addr.type().should.equal('unknown')
    })

    it('should give scripthash for this address', function () {
      let addr = Address().fromString('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy')
      addr.type().should.equal('scripthash')
    })
  })

  describe('#toHex', function () {
    it('should output this known hash', function () {
      let address = new Address()
      address.fromString(str)
      address.toHex().slice(2).should.equal(pubKeyHash.toString('hex'))
    })
  })

  describe('#toBuffer', function () {
    it('should output this known hash', function () {
      let address = new Address()
      address.fromString(str)
      address.toBuffer().slice(1).toString('hex').should.equal(pubKeyHash.toString('hex'))
    })
  })

  describe('#toScript', function () {
    it('should convert this address into known scripts', function () {
      let addrbuf = new Buffer(21)
      addrbuf.fill(0)
      let addr = Address().fromBuffer(addrbuf)
      let script = addr.toScript()
      script.toString().should.equal('OP_DUP OP_HASH160 20 0x0000000000000000000000000000000000000000 OP_EQUALVERIFY OP_CHECKSIG')

      addr.version = Constants.MainNet.Address['scripthash']
      script = addr.toScript()
      script.toString().should.equal('OP_HASH160 20 0x0000000000000000000000000000000000000000 OP_EQUAL')

      addr.version = 50
      ;(function () {
        script = addr.toScript()
      }).should.throw('script must be either pubKeyHash or scripthash')
    })
  })

  describe('#toString', function () {
    it('should output the same thing that was input', function () {
      let address = new Address()
      address.fromString(str)
      address.toString().should.equal(str)
    })
  })

  describe('#asyncToString', function () {
    it('should output the same as toString', function () {
      return asink(function * () {
        let str1 = Address().fromString(str).toString()
        let str2 = yield Address().fromString(str).asyncToString()
        str1.should.equal(str2)
      }, this)
    })
  })

  describe('#validate', function () {
    it('should not throw an error on this valid address', function () {
      let address = new Address()
      address.fromString(str)
      should.exist(address.validate())
    })

    it('should throw an error on this invalid version', function () {
      let address = new Address()
      address.fromString(str)
      address.version = 1
      ;(function () {
        address.validate()
      }).should.throw('invalid version')
    })

    it('should throw an error on this invalid version', function () {
      let address = new Address()
      address.fromString(str)
      address.hashBuf = Buffer.concat([address.hashBuf, new Buffer([0])])
      ;(function () {
        address.validate()
      }).should.throw('hashBuf must be a buffer of 20 bytes')
    })
  })
})
