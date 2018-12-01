const cl = require('chloride')
const util = require('icebreaker-network/lib/util')
module.exports ={
    generate:(encoding)=>{
        return cl.crypto_sign_keypair() 
    },
    encode:(keys,encoding)=>{
      return {  
          encoding:encoding,
          publicKey: util.encode(keys.publicKey, encoding||"base64"),
          secretKey: util.encode(keys.secretKey, encoding||"base64")
    }},
    decode:(keys,encoding)=>{
        return {
            encoding:encoding,
            publicKey: util.decode(keys.publicKey, encoding||"base64"),
            secretKey: util.decode(keys.secretKey, encoding||"base64")
      }}
     
}
