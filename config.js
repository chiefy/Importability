
var config = {
  // for local development, using redistogo on heroku remotely
  redis : { url : 'redis://index:password@127.0.0.1:6379' },
  readability :
  {
	host : 'www.readability.com',
	endpoint : '/api/rest/v1/',
	key : 'your_key',
	secret : 'your_secret'
  }  
};

module.exports = config;
