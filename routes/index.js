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

// http://localhost:3000/email?email=sydlawrence@gmail.com&postback=@BP:MESSAGE:16085
router.post('/email', function(req, res, next) {
  config.mailgun = {
    apiKey: 'key-3e7fac6568ef30a5a8496e648b32cbb3',
    domain: 'mg.salutemusic.uk',
    from: 'The Bot Platform <thebotplatform@mg.salutemusic.uk>'
  };
  BPEmail.email(req, res, config);
});

module.exports = router;
