var BotPlatform = require('../BotPlatform');
var Fuse = require('fuse.js');
var scraperjs = require('scraperjs');

var BPSiteSearch = function() {};

BPSiteSearch.prototype.singleResult = function(req, res, result) {

  var startingCount = result[1] * 1;
  var url = result.slice(2).join(':');

  var bp = this.bp;
  var config = this.config;
  var title = false;
  scraperjs.StaticScraper.create(url)
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
        newContent.push(bp.response.text('Did this help?', true));
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
      bp.response.set = {
        '$last_single': title,
        '$last_url': url
      };

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

      bp.response.set = {
        '$last_search': query,
      };

      if (! items || count === 0) {
        res.json(bp.response.multipart(
          [
            bp.response.text('Sorry, I can\'t find any ' + config.taxonomy + ' for "' + query + '" 😞', true)
          ]
        ));
        return;
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

BPSiteSearch.prototype.single = function(req, res, config) {
  this.isSingleSearch = true;

  // return res.json({hello: 3});

  var searchUrl = req.query.url;
  var queryElement = req.query.element;

  this.bp = BotPlatform.init(req, res);
  this.config = config;
  var postback = this.bp.request.getPostback();
  var textMessage = this.bp.request.getMessage();

  var bp = this.bp;
  // if it's a button or a quick reply
  if (postback) {
    return res.json({});
  } else if (textMessage) { // if it's just plain text
    scraperjs.StaticScraper.create(searchUrl)
    .scrape(function($) {

      var items = $(queryElement).map(function() {
        return {title: $(this).text(), resp: $(this).next().text()};
      });


      var commonWords = [
        'what',
        'how',
        'i',
        'do',
      ];

      for (var i = 0; i < commonWords; i++) {
        textMessage = textMessage.replace(commonWords[i], '');
      }

      var options = {
        keys: ['title'],
        id: 'resp',
        // tokenize: true,
        threshold: 0.5,
        includeMatches: true,
        shouldSort: true,
        includeScore: true,
      }
      var fuse = new Fuse(items, options)

      return fuse.search(textMessage);
    }).then(function(items) {
      if (items.length === 0) {
        res.json(bp.response.multipart([bp.response.text('Nothing found for: ' + textMessage)]));
      } else {
        var text = items[0].item.split('. ');

        var response = [
            bp.response.text('We think we\'ve found an answer for you.', true),
            bp.response.text(items[0].matches[0].value, true),
          ];
        for (var i = 0; i < text.length; i++) {
          response.push(bp.response.text(text[i], true));
        }

        res.json(bp.response.multipart(response));
        // res.json({ message: { text: 'Nothing found for: ' + textMessage}});
      }
    });
  } else {
    res.json({});
  }

};

module.exports = new BPSiteSearch();
