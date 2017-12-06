var BPResponse = function(req, res) {
  this.req = req;
  this.res = res;
  this.set = false;
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
  var response = {
    recipient: this.getRecipient(),
    message: {
      raw: {
        multipart: items
      }
    }
  };
  if (this.set) {
    response.set = this.set;
    this.set = false;
  }
  return response;
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
BPResponse.prototype.textButtons = function(text, buttons, isMultipart) {
  var part = {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: text,
        buttons: buttons
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
BPResponse.prototype.image = function(url, isMultipart) {
  var part = {
    attachment: {
      type: 'image',
      payload: {
        url: url,
        is_reusable: false
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
BPResponse.prototype.list = function(items, isMultipart) {
  var part = {
    attachment: {
      type: 'template',
      top_element_style: 'compact',
      payload: {
        template_type: 'list',
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

BPResponse.prototype.carouselCard = function(obj) {
  return obj;
};

BPResponse.prototype.carouselCardLink = function(obj, type) {
  if (type == undefined) {
    type = 'web_url';
  }

  if (type === 'web_url') {
    obj.default_action = {
      type: type,
      url: obj.url
    };
    obj.buttons = [{
      type: type,
      url: obj.url,
      title: obj.buttonTitle,
    }];
  } else if (type === 'postback') {
    obj.buttons = [{
      type: type,
      payload: obj.payload,
      title: obj.buttonTitle,
    }];
  }
  if (obj.extraButtons) {
    for (var i = 0; i < obj.extraButtons.length; i++) {
      obj.buttons.push(obj.extraButtons[i]);
    }
    delete obj.extraButtons;
  }
  delete obj.buttonTitle;
  delete obj.url;
  delete obj.payload;
  return this.carouselCard(obj);
};

module.exports = BPResponse;
