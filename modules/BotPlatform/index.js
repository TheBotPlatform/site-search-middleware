var BPRequest = require('./BPRequest.js');
var BPResponse = require('./BPResponse.js');
var BotPlatform = {};

var BP = function(req, res) {
  this.request = new BPRequest(req, res);
  this.response = new BPResponse(req, res);
};

BotPlatform.init = function(req, res) {
  return new BP(req, res);
};

module.exports = BotPlatform;
