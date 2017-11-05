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

module.exports = BPRequest;
