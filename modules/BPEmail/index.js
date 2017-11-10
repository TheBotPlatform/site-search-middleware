var BotPlatform = require('../BotPlatform');

var BPEmail = function() {};

BPEmail.prototype.email = function(req, res, config) {

  this.bp = BotPlatform.init(req, res);
  this.config = config;
  var postback = this.bp.request.getPostback();
  var textMessage = this.bp.request.getMessage();
  // http://localhost:3000/email?email=sydlawrence@gmail.com&postback=@BP:MESSAGE:27

  var email = req.query.email;
  var requiredPostback = req.query.postback;

  var bp = this.bp;
  try {
    if (postback && postback === requiredPostback) {

      var mailgun = require('mailgun-js')({apiKey: config.mailgun.apiKey, domain: config.mailgun.domain});

      var text = JSON.stringify(req.body.fbuser.state.vars, true);

      var data = {
        from: config.mailgun.from,
        to: email,
        subject: 'New form submission from The Bot Platform',
        text: text
      };

      mailgun.messages().send(data, function (error, body) {
        console.log(body);
      });


      return res.json({});
    } else { // if it's just plain text

      res.json({});
    }
  } catch (e) {
    console.log(e);
  }

};

module.exports = new BPEmail();
