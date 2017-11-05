var BPResponse = function(req, res) {
  this.req = req;
  this.res = res;
};

BPResponse.prototype.getUserId = function() {
  if (this.req.body && this.req.body.item) {
    return this.req.body.item.sender.id;
  }
  return 'DEMO';
};

BPResponse.prototype.getRecipient = function() {
  return {
    id: this.getUserId()
  };
};

BPResponse.prototype.multipart = function(items) {
  return {
    recipient: this.getRecipient(),
    message: {
      raw: {
        multipart: items
      }
    }
  };
};
BPResponse.prototype.text = function(text, isMultipart) {
  var part = {text: text};
  if (isMultipart) {
    return part;
  }
  return {
    message: part
  };
};
BPResponse.prototype.carousel = function(items, isMultipart) {
  var part = {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'generic',
        elements: items
      }
    }
  };
  if (isMultipart) {
    return part;
  }
  return {
    message: part
  };
};

BPResponse.prototype.carouselCardLink = function(obj) {
  return {
    title: obj.title,
    image_url: obj.image_url,
    default_action: {
      type: 'web_url',
      url: obj.url
    },
    buttons: [{
      type: 'web_url',
      url: obj.url,
      title: obj.buttonTitle,

    }]
  };
};

module.exports = BPResponse;
