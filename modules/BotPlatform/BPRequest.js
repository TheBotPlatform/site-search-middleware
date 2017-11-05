var BPRequest = function(req, res) {
  this.req = req;
  this.res = res;
};

BPRequest.prototype.getMessage = function() {
  try {
    if (this.req.body.item && this.req.body.item.message && this.req.body.item.message.text) {
      return this.req.body.item.message.text;
    } else {
      return false;
    }
  } catch (e) {
    console.log(e);
    return false;
  }
  return false;
};

BPRequest.prototype.getPostback = function() {
  console.log(this.req.body);
  try {
    if (this.req.body.item && this.req.body.item.postback && this.req.body.item.postback.payload) {
      return this.req.body.item.postback.payload;
    } else if (this.req.body.item && this.req.body.item.message && this.req.body.item.message.quick_reply) {
      return this.req.body.item.message.quick_reply.payload;
    } else {
      return false;
    }
  } catch (e) {
    console.log(e);
    return false;
  }
  return false;
}

module.exports = BPRequest;
