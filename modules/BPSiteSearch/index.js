var BotPlatform = require('../BotPlatform');
var scraperjs = require('scraperjs');

var BPSiteSearch = function() {};

BPSiteSearch.prototype.run = function(req, res, config) {
  var bp = BotPlatform.init(req, res);
  var message = bp.request.getMessage();
  if (!message) {
    return res.json({});
  }
  var searchUrl = config.baseUrl + message;

  scraperjs.StaticScraper.create(searchUrl)
    .scrape(function($) {
      return $(config.siteStructure.container).map(function() {
        return bp.response.carouselCardLink({
          title: $(this).find(config.siteStructure.title).text(),
          url: $(this).find(config.siteStructure.link).attr('href'),
          buttonTitle: config.buttonTitle,
          image_url: config.defaultImage
        });
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
          bp.response.text('Sorry, I can\'t find any ' + config.taxonomy + 's for "' + message + '" 😞')
        );
      }

      res.json(bp.response.multipart(
        [
          bp.response.text('There are ' + countText + ' related to "' + message + '". I hope this has helps 😀', true),
          bp.response.carousel(items, true)
        ]
      ));
    });
};

module.exports = new BPSiteSearch();
