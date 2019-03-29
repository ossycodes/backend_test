const express = require('express');
const AuthController = require('../controllers/auth')
const UserController = require('../controllers/user');
const TransactionController = require('../controllers/transaction');
const ScheduleController = require('../controllers/schedule');
const DividendController = require('../controllers/dividend');
const TokenController = require('../controllers/token');
const middleware = require('../helpers/middleware')
const testController = require("../controllers/test");
const walletController = require("../controllers/wallet");
const sanitize = require("../helpers/sanitization.js");
const validate = require("../helpers/validation.js");

const router = express.Router();

/**
 * Auth Routes
 */
// router.get('/users/token', AuthController.token);
router.post('/users/create', AuthController.addUsers);
router.post('/users/login', AuthController.login);
router.post('/users/send-token', AuthController.sendToken);
router.patch('/users/reset-pass', AuthController.resetPass);
router.patch('/users/change-pass', middleware.isUser, AuthController.changePass);
router.patch('/users/activate/:id', AuthController.activate);
router.patch('/users/deactivate/:id', middleware.isAdmin, AuthController.deactivate);
router.get("/test", testController.sample);


/**
 * User Model routes
 */
router.get('/users/type', middleware.isAdmin, AuthController.types);
router.get('/users/group', middleware.isAdmin, AuthController.groups);
router.get('/users/employment-status', middleware.isAdmin, AuthController.employment);

/**
 * User Exchange Routes
 */
router.get('/users/balance', middleware.isUser, UserController.balance);
router.get('/users/transactions', middleware.isUser, TransactionController.user);
// router.post('/users/fund', middleware.isUser, UserController.fund); // who handles payment?
// router.post('/users/withdraw', middleware.isUser, UserController.withdraw);
router.post('/users/exchange/buy', middleware.isUser, TokenController.buy);
router.post('/users/exchange/sell', middleware.isUser, TokenController.sell);
router.get('/users/exchange/buybook', middleware.isUser, TokenController.buyOrderBook);
router.get('/users/exchange/sellbook', middleware.isUser, TokenController.sellOrderBook);
router.get('/users/exchange/cancel/:id', middleware.isUser, TokenController.cancel);
// TODO: Add to tests
router.get('/users/exchange/price', middleware.isUser, TokenController.getPrice);
// TODO: Add to tests
router.get('/users/exchange/trades', middleware.isUser, TokenController.userTrades);
// router.get('/users/exchange/trades/all', middleware.isUser, TokenController.allTrades);
// router.post('/users/buy-back', middleware.isUser, UserController.buyBack);

/** 
 * Naira Wallet Routes
 */
router.get('/wallet/get_wallet/:id', middleware.isUser, walletController.getWallet);
router.post('/wallet/activate_account/:id', middleware.isUser, validate.wallet, sanitize.wallet(), walletController.activateAccount);
router.post('/wallet/add_account/:id', middleware.isUser, validate.wallet, sanitize.wallet(), walletController.addAccount);
router.post('/wallet/remove_account/:id', middleware.isUser, validate.wallet, sanitize.wallet(), walletController.removeAccount);
router.post('/wallet/fund_account/:id', middleware.isUser, validate.walletAction, sanitize.wallet(), walletController.fundFromAccount);
router.post('/wallet/fund_card/:id', middleware.isUser, validate.fundCard, sanitize.wallet(), walletController.fundFromCard);
router.post('/wallet/withdraw/:id', middleware.isUser, validate.walletAction, sanitize.wallet(), walletController.withdraw);

/**
 * User Profile Routes
 */
router.get('/users/bank', middleware.isUser, UserController.bank);
// router.patch('/users/bank', middleware.isUser, UserController.changeBank);
router.patch('/users/', middleware.isUser, UserController.update);
router.get('/users/:id', middleware.isUser, UserController.one);
router.get('/users/', UserController.all);

/**
 * Admin Routes
 */
router.patch('/users/:id/type', middleware.isAdmin, UserController.changeType);
router.patch('/users/:id/group', middleware.isAdmin, UserController.changeGroup);
router.patch('/users/:id/employment-status', middleware.isAdmin, UserController.changeEmployment);

router.get('/admin/schedule/', middleware.isAdmin, ScheduleController.all);
router.post('/admin/schedule/', middleware.isAdmin, ScheduleController.create);
router.get('/admin/schedule/:schedule_id', middleware.isAdmin, ScheduleController.one);
router.patch('/admin/schedule/:schedule_id', middleware.isAdmin, ScheduleController.update);
router.patch('/admin/schedule/enable/:schedule_id', middleware.isAdmin, ScheduleController.enable);
router.patch('/admin/schedule/disable/:schedule_id', middleware.isAdmin, ScheduleController.enable);

router.get('/admin/dividend/', middleware.isAdmin, DividendController.all);
router.post('/admin/dividend/', middleware.isAdmin, DividendController.create);
router.get('/admin/dividend/:dividend_id', middleware.isAdmin, DividendController.one);
router.patch('/admin/dividend/:dividend_id', middleware.isAdmin, DividendController.update);
router.patch('/admin/dividend/enable/:dividend_id', middleware.isAdmin, DividendController.enable);
router.patch('/admin/dividend/disable/:dividend_id', middleware.isAdmin, DividendController.disable);

router.get('/admin/transactions', middleware.isAdmin, TransactionController.all);

router.get('/admin/token/', middleware.isAdmin, TokenController.init);
// TODO: Add to tests
router.get('/admin/token/trades', middleware.isAdmin, TokenController.allTrades);
router.patch('/admin/token/', middleware.isAdmin, TokenController.setPrice);
module.exports = router;
