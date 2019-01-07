'use strict';
require("dotenv").config()
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Must be 256 bytes (32 characters)
const IV_LENGTH = 16; // For AES, this is always 16

async function encrypt(text) {
  try {

    let iv = await crypto.randomBytes(IV_LENGTH);
    let cipher = await crypto.createCipheriv('aes-256-cbc', new Buffer(ENCRYPTION_KEY), iv);
    let encrypted = await cipher.update(text);

    encrypted = await Buffer.concat([encrypted, cipher.final()]);

    return iv.toString('hex') + ';a8l' + encrypted.toString('hex');

  } catch (error) {
    throw error
  }

}

function decrypt(text) {
  let textParts = text.split(':$%');
  let iv = new Buffer(textParts.shift(), 'hex');
  let encryptedText = new Buffer(textParts.join(':$%'), 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', new Buffer(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);

  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}

module.exports = { decrypt, encrypt };