var BotPlatform = require('../BotPlatform');
var scraperjs = require('scraperjs');

var BPSiteSearch = function() {};

BPSiteSearch.prototype.singleResult = function(req, res, result) {

  var startingCount = result[1] * 1;
  var url = result.slice(2).join(':');

  var bp = this.bp;
  var config = this.config;
  scraperjs.StaticScraper.create(url)
    .scrape(function($) {
      var x = $(config.siteStructure.singleContent).find('h1, h2, h3, h4, h5, p, li').map(function() {
        if ($(this).find('img').length > 0) {
          return bp.response.image($(this).find('img').attr('src'), true);
        } else if ($(this).text().trim()) {
          return bp.response.text($(this).text().trim(), true);
        } else {
          return {};
        }
      }).get();

      return x;
    })
    .then(function(content) {
      var newContent = [];
      for (var i = startingCount; i < startingCount + config.perPage; i++) {
        if (content[i]) {
          newContent.push(content[i]);
        }
      }

      if (content.length > startingCount + config.perPage) {
        newContent[newContent.length - 1].quick_replies = [
          {
            content_type: 'text',
            title: config.keepGoingQuickReply,
            payload: 'result:' + (startingCount + config.perPage) + ':' + url
          }
        ];
      } else {
        newContent.push(bp.response.text('Did this help?', true))
        newContent[newContent.length - 1].quick_replies = [
          {
            content_type: 'text',
            title: '👍',
            payload: '@BP:MESSAGE:' + config.feedbackMessages.good
          },

          {
            content_type: 'text',
            title: '👎',
            payload: '@BP:MESSAGE:' + config.feedbackMessages.bad
          }
        ];
      }
      res.json(bp.response.multipart(newContent));


    });;
};

BPSiteSearch.prototype.query = function(req, res, query) {
  var bp = this.bp;
  var config = this.config;
  var searchUrl = config.baseUrl + query;

  scraperjs.StaticScraper.create(searchUrl)
    .scrape(function($) {
      return $(config.siteStructure.container).map(function() {
        return bp.response.carouselCardLink({
          title: $(this).find(config.siteStructure.title).text(),
          payload: 'result:0:' + $(this).find(config.siteStructure.link).attr('href'),
          buttonTitle: config.buttonTitle,
          image_url: config.defaultImage
        }, 'postback');
      }).get();
    })
    .then(function(items) {
      var getTaxonomyCount = function(items, noun) {
        if (items.length === 1) {
          return '1 ' + noun;
        }
        if (items.length > 10) {
          return 'more than 10 ' + noun + 's';
        }
        return items.length + ' ' + noun + 's';
      };

      var count = items.length;
      var countText = getTaxonomyCount(items, config.taxonomy);

      if (count > 10) {
        items = items.slice(0, 9);
        items.push(bp.response.carouselCardLink({
          title: 'View all ' + countText + ' ' + config.taxonomy + 's',
          url: searchUrl,
          buttonTitle: 'View all ' + countText,
          image_url: config.defaultImage
        }));
      }

      if (! items) {
        return res.json(
          bp.response.text('Sorry, I can\'t find any ' + config.taxonomy + 's for "' + query + '" 😞')
        );
      }

      res.json(bp.response.multipart(
        [
          bp.response.text('There are ' + countText + ' related to "' + query + '". I hope this helps 😀', true),
          bp.response.carousel(items, true)
        ]
      ));
    });
}

BPSiteSearch.prototype.run = function(req, res, config) {
  var bp = BotPlatform.init(req, res);
  this.bp = bp;
  this.config = config;
  var postback = bp.request.getPostback();
  var query = bp.request.getMessage();
  if (postback) {
    postback = postback.split(':');
    if (postback[0] === 'result') {
      this.singleResult(req, res, postback);
      return;
    }
  } else if (query) {
    try {
      this.query(req, res, query);
      return;
    } catch (e) {
      console.log(e);
    }
  }
  return res.json({});
};

module.exports = new BPSiteSearch();
