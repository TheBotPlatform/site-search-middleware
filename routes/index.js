var express = require('express');
var router = express.Router();
var BPSiteSearch = require('../modules/BPSiteSearch');

var config = {
  baseUrl: 'https://thebotplatform.com/help/1/en/search?q=',
  defaultImage: 'https://app.thebotplatform.com/img/login-bg.jpg',
  siteStructure: {
    container: '.search-result',
    title: 'h3 a',
    link: 'h3 a',
  },
  taxonomy: 'doc',
  buttonTitle: 'Learn more'
}

router.post('/', function(req, res, next) {
  try {
    BPSiteSearch.run(req, res, config);
  } catch (e) {
    console.log(e);
  }
});

/* GET home page. */
router.get('/', function(req, res, next) {
  BPSiteSearch.run(req, res, config);
});

module.exports = router;
