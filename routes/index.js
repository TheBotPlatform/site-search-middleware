var express = require('express');
var router = express.Router();
var BPEmail = require('../modules/BPEmail');
var BPSiteSearch = require('../modules/BPSiteSearch');
var BPHubspot = require('../modules/BPHubspot');

var config = require('../config');

router.post('/', function(req, res, next) {
  try {
    BPSiteSearch.run(req, res, config);
  } catch (e) {
    console.log(e);
  }
});

router.post('/hubspot', function(req, res, next) {
  try {
    BPHubspot.run(req, res, config);
  } catch (e) {
    console.log(e);
  }
});

/* GET home page. */
router.get('/', function(req, res, next) {
  BPSiteSearch.run(req, res, config);
});

router.post('/single', function(req, res, next) {
  BPSiteSearch.single(req, res, config);
});

// http://localhost:3000/email?email=hello@thebotplatform.com&postback=@BP:MESSAGE:16085
router.post('/email', function(req, res, next) {
  config.mailgun = {
    apiKey: 'APIKEY',
    domain: 'DOMAIN',
    from: 'The Bot Platform <EMAIL>'
  };
  BPEmail.email(req, res, config);
});

module.exports = router;
