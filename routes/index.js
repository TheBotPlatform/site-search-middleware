var express = require('express');
var router = express.Router();
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

module.exports = router;
