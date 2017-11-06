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
        response.push(bp.response.text('Metrics: ' + getProperty(d, 'metrics'), true));
        response.push(bp.response.text('Economic buyer: ' + getProperty(d, 'economic_buyer'), true));
        response.push(bp.response.text('Decision process: ' + getProperty(d, 'decision_process'), true));
        response.push(bp.response.text('Decision criteria: ' + getProperty(d, 'decision_critera'), true));
        response.push(bp.response.text('Identify pain: ' + getProperty(d, 'identify_pain'), true));
        response.push(bp.response.text('Champion: ' + getProperty(d, 'champion'), true));

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
      var photo = config.defaultImage;
      if (contact.properties.photo) {
        response.push(bp.response.image(contact.properties.photo.value, true));
        photo = contact.properties.photo;
      }
      if ( contact.properties.firstname &&  contact.properties.lastname) {
        response.push(bp.response.text('Here\'s all I know about ' + contact.properties.firstname.value + ' ' + contact.properties.lastname.value, true));

      } else if ( contact.properties.firstname) {
        response.push(bp.response.text('Here\'s all I know about ' + contact.properties.firstname.value, true));

      }

      var jobtitle = '', company = '', companyUrl = false, bio = '';
      if (contact.properties.jobtitle) {
        jobtitle = contact.properties.jobtitle.value;
      }
      if (contact['associated-company']) {
        if (contact['associated-company'].properties.name) {
          company = contact['associated-company'].properties.name.value;
        }
        if (contact['associated-company'].properties.description) {
          bio = contact['associated-company'].properties.description.value.substring(0, 630) + '...';
        }
        if (contact['associated-company'].properties.website) {
          companyUrl = contact['associated-company'].properties.website.value;
        }
        if (contact['associated-company'].properties.website) {
          companyUrl = contact['associated-company'].properties.website.value;
        }
        jobtitle = contact.properties.jobtitle.value;
      }
      if (jobtitle || company) {
        response.push(bp.response.text(jobtitle + ' @ ' + company, true));
      }
      response.push(bp.response.text(contact.properties.email.value, true));
      response.push(bp.response.text('They were last contacted ' + date(notes_last_updated), true));
      var score = contact.properties.hubspotscore.value * 1;
      if (score < 0) {
        score = score + ' 👎'
      }
      if (score > 0) {
        score = score + ' 👍'
      }
      response.push(bp.response.text('Their score is ' + score, true));
      if (bio) {
        response.push(bp.response.text(bio, true));
      }
      var carousel = [];

      if (contact.properties.num_associated_deals && contact.properties.num_associated_deals.value  * 1) {
        carousel.push(bp.response.carouselCardLink({
          title: 'See all ' + contact.properties.num_associated_deals.value + ' deals',
          payload: 'contact_deals:' + contact.vid,
          buttonTitle: config.buttonTitle,
          image_url: photo
        }, 'postback'));
      }

      // view on hubspot
      carousel.push(bp.response.carouselCardLink({
        title: 'View them on hubspot',
        url: contact['profile-url'],
        buttonTitle: config.buttonTitle,
        image_url: 'https://www.leadsquared.com/wp-content/uploads/2017/08/hubspot-logo.jpg'
      }, 'web_url'));
      // view on linkedin
      if (contact.properties.linkedinbio && contact.properties.linkedinbio.value) {

        carousel.push(bp.response.carouselCardLink({
          title: 'Stalk them on LinkedIn',
          url: contact.properties.linkedinbio.value,
          buttonTitle: config.buttonTitle,
          image_url: 'https://brand.linkedin.com/etc/designs/linkedin/katy/global/clientlibs/img/default-share.png'
        }, 'web_url'));
      }
      // view on twitter
      if (contact.properties.twitterhandle && contact.properties.twitterhandle.value) {
        carousel.push(bp.response.carouselCardLink({
          title: 'Stalk them on Twitter',
          url: 'http://twitter.com/' + contact.properties.twitterhandle.value,
          buttonTitle: config.buttonTitle,
          image_url: 'https://kt-media-knowtechie.netdna-ssl.com/wp-content/uploads/2017/05/twitter.png'
        }, 'web_url'));
      }
      console.log(carousel);
      // view on facebook
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
          bp.response.text('I can\'t find anyone by the name of "' + query + '" 😡', true)
        ]
      ));
      return;
    }
    res.json(bp.response.multipart(
      [
        bp.response.text('I\'ve found ' + countText + ' matching "' + query + '" 💼', true),
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
  try {
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
        this.query(req, res, textMessage);
        return;

    }
  } catch (e) {
    console.log(e);
  }
  return res.json({});
};

module.exports = new BPHubspot();
