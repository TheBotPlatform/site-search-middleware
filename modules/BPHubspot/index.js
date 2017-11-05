var BotPlatform = require('../BotPlatform');

var BPHubspot = function() {};

var Hubspot = require('hubspot');
var hubspot = new Hubspot({ apiKey: process.env.HUBSPOT_API_KEY });
var date = function(time) {
  return ((new Date(time * 1)) + '').split(':')[0];
};
var getTaxonomyCount = function(items, noun) {
  if (items.length === 1) {
    return '1 ' + noun;
  }
  if (items.length > 10) {
    return 'more than 10 ' + noun + 's';
  }
  return items.length + ' ' + noun + 's';
};

BPHubspot.prototype.singleContactDeals = function(req, res, result) {
  var id = result[1];
  var bp = this.bp;
  hubspot._request({
    method: 'GET',
    path: '/deals/v1/deal/associated/contact/' + id + '/paged',
    qs: { properties: ['dealname', 'dealstage', 'amount', 'launch_date', 'metrics', 'identify_pain', 'closedate'] }
  }, function(e, deals) {
    var response = [];
    var getProperty = function(d, prop) {
      if (d.properties[prop]) {
        return d.properties[prop].value;
      }
      return '';
    };
    deals.deals.sort(function(a, b) {
      if (getProperty(a, 'closedate') < getProperty(b, 'closedate')) {
        return -1;
      }
      return 1;
    });
    deals.deals.forEach(function(d) {

      try {

        var text = getProperty(d, 'dealname') + '\n' +
                  'Amount: £' + getProperty(d, 'amount') + '\n' +
                  'Close: ' + date(getProperty(d, 'closedate')) + '\n' +
                  'Launch: ' + date(getProperty(d, 'launch_date'));
        response.push(bp.response.textButtons(text, [{
          type: 'web_url',
          url: 'https://app.hubspot.com/contacts/' + d.portalId + '/deal/' + d.dealId + '/',
          title: 'View on hubspot'
        }], true));
      } catch (e) {
        console.log(e);
      }
    });
    res.json(bp.response.multipart(response));
  });

};

BPHubspot.prototype.singleContact = function(req, res, result) {

  var id = result[1];

  var bp = this.bp;
  var config = this.config;
  try {
    hubspot.contacts.getById(id * 1, function(e, contact) {
      var notes_last_updated = 0;
      if (contact.properties.notes_last_contacted) {
        notes_last_updated = contact.properties.notes_last_contacted.value;
      }
      var response = [];
      if (contact.properties.photo) {
        response.push(bp.response.image(contact.properties.photo.value, true));
      }

      response.push(bp.response.text(contact.properties.email.value, true));
      response.push(bp.response.text('Last contact: ' + date(notes_last_updated), true));
      response.push(bp.response.text('Score: ' + contact.properties.hubspotscore.value, true));

      var carousel = [];

      if (contact.properties.num_associated_deals && contact.properties.num_associated_deals.value  * 1) {
        carousel.push(bp.response.carouselCardLink({
          title: 'See ' + contact.properties.num_associated_deals.value + ' deals',
          payload: 'contact_deals:' + contact.vid,
          buttonTitle: config.buttonTitle,
          image_url: photo
        }, 'postback'));
      }

      // view on hubspot
      carousel.push(bp.response.carouselCardLink({
        title: 'View on hubspot',
        url: contact['profile-url'],
        buttonTitle: config.buttonTitle,
        image_url: 'https://www.leadsquared.com/wp-content/uploads/2017/08/hubspot-logo.jpg'
      }, 'web_url'));
      response.push(bp.response.carousel(carousel, true));
      res.json(bp.response.multipart(response));

    });
  } catch (e) {console.log(e);}

  return;

};

BPHubspot.prototype.query = function(req, res, query) {
  var bp = this.bp;
  var config = this.config;

  hubspot.contacts.search(query, function(e, contacts) {
    var items = [];
    contacts.contacts.forEach(function(contact) {
      var jobtitle = '', email = '', firstname = '', lastname = '';
      if (contact.properties.jobtitle) {
        jobtitle = contact.properties.jobtitle.value;
      }
      if (contact.properties.email) {
        email = contact.properties.email.value;
      }
      if (contact.properties.firstname) {
        firstname = contact.properties.firstname.value;
      }
      if (contact.properties.lastname) {
        lastname = contact.properties.lastname.value;
      }
      var photo = config.defaultImage;
      if (contact.properties.photo) {
        photo = contact.properties.photo.value;
      }
      items.push(bp.response.carouselCardLink({
        title: firstname + ' ' + lastname + '.',
        subtitle: jobtitle + ' - ' + email,
        payload: 'contact:' + contact.vid,
        buttonTitle: config.buttonTitle,
        image_url: photo
      }, 'postback'));
    });
    var count = items.length;
    var countText = getTaxonomyCount(items, 'contact');

    if (count > 10) {
      items = items.slice(0, 10);
    }
    if (! items || count === 0) {
      res.json(bp.response.multipart(
        [
          bp.response.text('I can\'t find anyone by the name of "' + query + '" 😞', true)
        ]
      ));
      return;
    }
    res.json(bp.response.multipart(
      [
        bp.response.text('I\'ve found ' + countText + ' related to "' + query + '" 😀', true),
        bp.response.carousel(items, true)
      ]
    ));
  });
};

BPHubspot.prototype.run = function(req, res, config) {
  this.bp = BotPlatform.init(req, res);
  this.config = config;
  var postback = this.bp.request.getPostback();
  var textMessage = this.bp.request.getMessage();

  // if it's a button or a quick reply
  if (postback) {
    postback = postback.split(':');
    if (postback[0] === 'contact') {
      this.singleContact(req, res, postback);
      return;
    } else if (postback[0] === 'contact_deals') {
      this.singleContactDeals(req, res, postback);
      return;
    } else {
      console.log(postback);
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

module.exports = new BPHubspot();
