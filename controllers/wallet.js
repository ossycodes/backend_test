const TransactionModel = require('../models/transaction');
const HttpStatus = require('../helpers/status');
const WalletModel = require('../models/wallet');
const {verifyAccount} = require('../helpers/ibs');
const {
  checkToken
} = require('../helpers/utils');


const walletController = {

  /**
     * Get User Naira Balance
     * @description Get User Naira Balance
     * @return {number} balance
     */
  async balance(req, res, next) {
    try {
      
      const userWallet = req.params.id

      const wallet = await WalletModel.findById(userWallet)
      console.log("wallet >> ", wallet)
      if (wallet) {
        return res.status(HttpStatus.OK).json({
          status: 'success',
          message: 'User naira wallet gotten successfully',
          data: wallet.balance
        })
      }
      return res.status(HttpStatus.BAD_REQUEST).json({
        status: 'failed',
        message: 'There is no wallet associated to this user',
        data: []
      })

    } catch (error) {
      console.log('error >> ', error)
      const err = {
        http: HttpStatus.SERVER_ERROR,
        status: 'failed',
        message: 'Error getting user naira wallet',
        devError: error
      }
      next(err)
    }
  },

    /**
   * Create Use
   * @description Create a user
   * @param {string} fname        First name
   */
  async fund(req, res, next) {
    try {
    
        const userWallet = req.params.id
        const transaction = await new TransactionModel()
        const wallet = await WalletModel.find({user :userWallet })

        // Call SOAP Endpoint
        
        // var args = {ReferenceID: 1, RequestType: 102, FromAccount: args.FromAccount, ToAccount: args.ToAccount, Amount : args.Amount,  PaymentReference : "IFO Bolanle"};
        var args = {ReferenceID: 1, RequestType: 102, Account: "0070134307"};
        const soapResponse = await soap(args)
        console.log("soapResponse >> ", soapResponse)

    //     transaction.user: userWallet
    //     transaction.type: transaction.TransactionType.FUND
    //     from: ""
    //     to: "" 
    //     volume: { type: Schema.Types.Number }
    //     amount: { type: Schema.Types.Number }
    //     status: transaction.TransactionStatus.Completed

    //     await transaction.save()

    //     wallet.balance = ,
    //     wallet.transactions.push(transaction.id)

    //     await wallet.save()

    //   const userWallet = await new WalletModel.create({
    //     user: user.id,
    //     balance: 0,
    //     account_number: req.body.account
    //   })

    //   console.log("userWallet >> " , userWallet)

    //   return res.status(HttpStatus.OK).json({ status: 'success', message: 'Account funded successfully!', data: userWallet });
    } catch (error) {
      console.log('error >> ', error)
      const err = {
        http: HttpStatus.SERVER_ERROR,
        status: 'failed',
        message: 'Could not fund wallet!',
        devError: error
      }
      next(err)
    }

  },

};

module.exports = walletController;
