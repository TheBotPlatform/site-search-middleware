var BotPlatform = require('../BotPlatform');
var scraperjs = require('scraperjs');

var BPSiteSearch = function() {};

// used when retreiving a single result
BPSiteSearch.prototype.singleResult = function(req, res, result) {

  var startingCount = result[1] * 1;
  var url = result.slice(2).join(':');

  var bp = this.bp;
  var config = this.config;
  var title = false;
  scraperjs.StaticScraper.create({url: url, headers: {'User-Agent': config.userAgent}})
    .scrape(function($) {
      var x = $(config.siteStructure.singleContent).find('h1, h2, h3, h4, h5, p, li').map(function() {
        if (!title) {
          title = $(this).text().trim();
        }
        if ($(this).find('img').length > 0) {
          return bp.response.image($(this).find('img').attr('src'), true);
        } else if ($(this).text().trim()) {
          if ($(this).find('a').length > 0) {
            return bp.response.textButtons($(this).text().trim(), [
              {
                type: 'postback',
                payload: 'result:0:' + $(this).find('a').attr('href'),
                title: config.buttonTitle
              }
            ],true);
          } else {
            return bp.response.text($(this).text().trim(), true);
          }
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
        newContent.push(bp.response.textButtons('View the original page', [
          {
            type: 'web_url',
            url: url,
            title: 'View online'
          }
        ], true));
        if (shouldAskForFeedback) {
          newContent.push(bp.response.text('Did this help?', true));
          newContent[newContent.length - 1].quick_replies = [
            {
              content_type: 'text',
              title: '👍',
              payload: config.feedbackMessages.good
            },

            {
              content_type: 'text',
              title: '👎',
              payload: config.feedbackMessages.bad
            }
          ];
        }
      }
      bp.response.set = {
        '$last_single': title,
        '$last_url': url
      };

      res.json(bp.response.multipart(newContent));


    });;
};

// used to query a search url
BPSiteSearch.prototype.query = function(req, res, query) {
  var bp = this.bp;
  var config = this.config;
  var searchUrl = config.baseUrl + query;
  scraperjs.StaticScraper.create({url: searchUrl, headers: {'User-Agent': config.userAgent}})
    .scrape(function($) {
      return $(config.siteStructure.container).map(function() {

        var singleUrl = $(this).find(config.siteStructure.link).attr('href');
        if (config.siteStructure.link === false) {
          singleUrl = $(this).attr('href');
        }

        return bp.response.carouselCardLink({
          title: $(this).find(config.siteStructure.title).text(),
          subtitle: $(this).find(config.siteStructure.subtitle).text(),
          payload: 'result:0:' + singleUrl,
          buttonTitle: config.buttonTitle,
          extraButtons: [{
            title: 'View online',
            type: 'web_url',
            url: singleUrl
          }],
          image_url: config.defaultImage
        }, 'postback');
      }).get();
    })
    .then(function(items) {
      var getTaxonomyCount = function(items, noun) {
        if (items.length === 1) {
          return 'is 1 ' + noun;
        }
        if (items.length > 10) {
          return 'are more than 10 ' + noun + 's';
        }
        return 'are ' + items.length + ' ' + noun + 's';
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
        console.log(items);
      }

      bp.response.set = {
        '$last_search': query,
      };

      if (! items || count === 0) {
        res.json(false);
        return;
      }

      res.json(bp.response.multipart(
        [
          bp.response.text('There ' + countText + ' related to "' + query + '". I hope this helps 😀', true),
          bp.response.carousel(items, true)
        ]
      ));
    });
}

BPSiteSearch.prototype.run = function(req, res, config) {
  this.bp = BotPlatform.init(req, res);
  this.config = config;
  var postback = this.bp.request.getPostback();
  var textMessage = this.bp.request.getMessage();

  // if it's a button or a quick reply
  if (postback) {
    postback = postback.split(':');
    if (postback[0] === 'result') {
      this.singleResult(req, res, postback);
      return;
    }
  } else if (textMessage) { // if it's just plain text
    try {
      this.query(req, res, textMessage);
      return;
    } catch (e) {
      console.log(e);
    }
  }
  return res.json({});
};

module.exports = new BPSiteSearch();
