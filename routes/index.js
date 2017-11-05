var express = require('express');
var router = express.Router();
  var xpath = require('xpath')
  , dom = require('xmldom').DOMParser
 var request = require('request');

 var scraperjs = require('scraperjs');


var fetchFromSheet = function(req, res) {
  var term = 'ads';
  try {
    if (req.body.item && req.body.item.message && req.body.item.message.text) {
      term = req.body.item.message.text;
    } else {
      return res.json({});
    }
  } catch (e) {
      return res.json({});
  }

  var url = 'https://thebotplatform.com/help/1/en/search?q=' + term;
  var USER_ID = '1285973801516836';
  if (req.body && req.body.item) {
    USER_ID = req.body.item.sender.id;
  }
  if (!term) {
    res.json({});
  }

  scraperjs.StaticScraper.create(url)
    .scrape(function($) {
        return $(".search-result").map(function() {
          var title = $(this).find('h3 a').text();
          var url = $(this).find('h3 a').attr('href');

          return {
            title: title,
            image_url: 'https://app.thebotplatform.com/img/login-bg.jpg',
            default_action: {
              type: 'web_url',
              url: url
            },
            buttons: [{
              type: 'web_url',
              url: url,
              title: 'Learn more',

            }]
          };
        }).get();
    })
    .then(function(news) {
      if (news.length > 10) {
        news = news.slice(0, 10);
      }

      // console.log();
      if (! news) {
        return res.json({message: {text: 'Sorry, I can\'t find any docs for "' + term + '" 👩‍⚕️'}});
      }

      var response = {
        recipient: {
          id: USER_ID
        },

        message: {
          raw: {
            multipart: [
              {
                text: 'I\'ve found ' + news.length + ' docs related to "' + term + '". I hope this has been helpful 👩‍⚕️!'
              },
              {
                attachment: {
                  type: 'template',
                  payload: {
                    template_type: 'generic',
                    elements: news
                  }
                }
              }
            ]
          }
        }
      }
      console.log(response.message.raw);

      res.json(response);
      // console.log(news);
    });

}

router.post('/', function(req, res, next) {
  fetchFromSheet(req, res);
});

/* GET home page. */
router.get('/', function(req, res, next) {
  fetchFromSheet(req, res);
});

module.exports = router;
