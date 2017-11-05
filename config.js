var config = {
  baseUrl: 'https://thebotplatform.com/help/1/en/search?q=',
  defaultImage: 'https://app.thebotplatform.com/img/login-bg.jpg',
  siteStructure: {
    container: '.search-result',
    title: 'h3 a',
    link: 'h3 a',
    singleContent: '#topic-header, #topic-body'
  },
  taxonomy: 'doc',
  buttonTitle: 'Read more',
  feedbackMessages: {
    good: '15625',
    bad: '15629'
  },
  perPage: 6,
  keepGoingQuickReply: 'Keep going...',
  hubspotKey: ''
};

module.exports = config;
