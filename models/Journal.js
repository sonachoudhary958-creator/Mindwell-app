const CryptoJS = require("crypto-js");

const encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, process.env.SECRET_KEY).toString();
};

const decrypt = (cipherText) => {
  const bytes = CryptoJS.AES.decrypt(cipherText, process.env.SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};
const mongoose = require("mongoose");

const journalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    encryptedContent: {
      type: String,
      required: true,
    },
    mood: Number,
    energy: Number,
  },
  { timestamps: true },
);
module.exports = mongoose.model("Journal", journalSchema);
