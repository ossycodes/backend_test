const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken')
const Constants = require('./status')
const UserModel = require('../models/user.js');
require('dotenv').config();

exports.config = {
  jwt: process.env.JWT_SECRET,
  blockchain: '',
  mongo: '',
  host: '',
  amqp_url: '',
  port: '',
  appNairaAccount: '',
  contract:  '',
  coinbaseKey:''
}

if (process.env.NODE_ENV === 'development') {
  this.config.blockchain = process.env.GANACHE
  this.config.mongo = process.env.MONGO_LAB_DEV_EXCHANGE
  this.config.host = `http://localhost:${process.env.PORT}/v1/`
  this.config.db = 'STTP'
  this.config.amqp_url = `${process.env.AMQP_URL}`
  this.config.port = `${process.env.PORT}`
  this.config.contract = process.env.TEST_CONTRACT_ADDRESS
  this.config.appNairaAccount = process.env.TEST_APP_ESCROW_ACCOUNT
  this.config.coinbaseKey = process.env.COINBASE_KEY
} else {
  this.config.blockchain = process.env.GETH
  this.config.mongo = process.env.MONGO_LAB_PROD_EXCHANGE
  this.config.host = `http://localhost:${process.env.PORT}/v1/`
  this.config.db = 'STTP'
  this.config.amqp_url = `${process.env.AMQP_URL}`
  this.config.port = `${process.env.PORT}`
  this.config.contract = process.env.CONTRACT_ADDRESS
  this.config.appNairaAccount = process.env.APP_ESCROW_ACCOUNT
}

exports.sendMail = (params, callback) => {
  const email = params.email;
  // let from_email = params.from_email;
  const body = params.body;
  const subject = params.subject;
  if (email == null || body == null || subject == null) {
    return {
      status: 'failed',
      err: 'the required parameters were not supplied'
    };
  }
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    service: 'Gmail',
    auth: {
      user: 'dikejude49@gmail.com',
      pass: 'dyke2010'
    }
  });

  const mailOptions = {
    from: 'Sterling Support <support@sterlingbankng.com>',
    to: email,
    subject,
    html: body
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      callback(error, null);
    } else {
      callback(error, info.response);
    }
  });
};

exports.generateTransactionReference = () => {
  // 463309364588305
  let text = '';
  const possible = '0123456789';
  for (let i = 0; i < 15; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
  return ''.concat(text);
};

exports.paramsNotValid = (...args) => args.map(param => param !== undefined && param != null && param !== '').includes(false);

/**
 * Check token was sent
 */
exports.checkToken = async (req) => {
  try {
    let token = null;
    if (req.headers.authorization) {
      token = req.headers.authorization;
      const tokenArray = token.split(' ');
      token = tokenArray[1];
    }
    if (req.query.token) {
      token = req.query.token;
    }
    if (req.body.token) {
      token = req.body.token
    }
    if (!token) {
      return {
        status: 'failed',
        data: Constants.UNAUTHORIZED,
        message: 'Not authorized'
      };
    }
    const decryptedToken = await jwt.verify(token, this.config.jwt);
    console.log(decryptedToken)
    const user = await UserModel.findById(decryptedToken.id)
    if(user){
      return {
        status: 'success',
        data: decryptedToken
      }
    }
    return {
      status: 'failed',
      data: Constants.UNAUTHORIZED,
      message: 'Invalid token'
    };
  } catch (error) {
    console.log(error)
    if (error.name === 'TokenExpiredError') {
      return {
        status: 'failed',
        data: Constants.UNAUTHORIZED,
        message: 'Token expired'
      };
    }
    return {
      status: 'failed',
      data: Constants.UNAUTHORIZED,
      message: 'failed to authenticate token'
    }
  }
};

/**
 * Create Jwt token
 */
exports.createToken = (email, id, type) => {
  try {
    const jwtToken = jwt.sign({ email, id, type }, this.config.jwt, { expiresIn: 60 * 60 * 24 });
    return jwtToken
  } catch (error) {
    return false;
  }
};
