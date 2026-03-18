const CryptoJS = require("crypto-js");

const encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, process.env.SECRET_KEY).toString();
};

const decrypt = (cipherText) => {
  const bytes = CryptoJS.AES.decrypt(cipherText, process.env.SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};
module.exports = { encrypt, decrypt };
