var express = require('express');
const restAPI = require('../restapi/restapi.js');
var router = express.Router();

router.post('/checkUserStatus', function(req, res) {
  restAPI.checkUserStatus(req, res);
});

router.post('/connectWithFriend', function(req, res) {
  restAPI.connectWithFriend(req, res);
});

router.post('/connectWithCode', function(req, res) {
  restAPI.connectWithCode(req, res);
});

router.post('/cancelMatch', function(req, res) {
  restAPI.cancelMatch(req, res);
});

router.post('/drawFinished', function(req, res) {
  restAPI.drawFinished(req, res);
});

router.post('/reportUser', function(req, res) {
  restAPI.reportUser(req, res);
});

router.post('/requestSubject', function(req, res) {
  restAPI.requestSubject(req, res);
});

router.post('/bugReport', function(req, res) {
  restAPI.bugReport(req, res);
});

router.post('/IAPSuccess', function(req, res) {
  restAPI.IAPSuccess(req, res);
});

router.post('/purchaseCoin', function(req, res) {
  restAPI.purchaseCoin(req, res);
});

router.post('/buyHint', function(req, res) {
  restAPI.buyHint(req, res);
});

router.post('/sendEmail', function(req, res) {
  restAPI.sendEmail(req, res);
});

module.exports = router;
