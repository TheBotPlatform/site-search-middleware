var config = {
  baseUrl: 'https://www.mobileworldcongress.com/exhibition/2018-exhibitors/?keyword=',
  defaultImage: 'https://app.thebotplatform.com/img/login-bg.jpg',
  siteStructure: {
    container: '.listing-holder .listing', // the individual item in the search result page
    title: '.box-title',
    subtitle: '.list-location',
    link: false, // the child element in the search result, false if it's the element itself
    singleContent: '.custom-main, .hentry'
  },
  taxonomy: 'exhibitor',
  respondIfNone: false, // should the bot still respond if no results
  buttonTitle: 'Find out more',
  shouldAskForFeedback: true,
  feedbackMessages: {
    good: '@BP:MESSAGE:15625', // to trigger if they say it's a bad response
    bad: '@BP:MESSAGE:15629' // to trigger if they say it's a good response
  },
  perPage: 6,
  keepGoingQuickReply: 'Keep going...',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/603.3.8 (KHTML, like Gecko)', // used to spoof user agent if blocking on site
};

module.exports = config;
