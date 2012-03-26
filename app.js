/**
 * Module dependencies.
 */
 
var express = require('express');
var everyauth = require('everyauth');
var app = module.exports = express.createServer();


var myURL = "http://node.local:3000";
// Configuration

var readability = {
  urls: {
    request_token : "https://www.readability.com/api/rest/v1/oauth/request_token/",
    access_token  : "https://www.readability.com/api/rest/v1/oauth/access_token/",
    authorize     : "https://www.readability.com/api/rest/v1/oauth/authorize/?oauth_token="
  },
  key: "tehsuck",
  secret: "dVJVVx2bFKtxHL3AmMJ6TQbakR4Ga4BQ",
  callback: myURL + "/readability_cb"
};

var usersByReadabilityId = {};

everyauth.readability
  .consumerKey(readability.key)
  .consumerSecret(readability.secret)
  .findOrCreateUser( function(sess, accessToken, accessSecret, reader) {
    return usersByReadabilityId[reader.username] || (usersByReadabilityId[reader.username] = reader);
  })
  .redirectPath('/')


everyauth.debug = true;  


app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({ secret: "i love pork chops" }));
  app.use(everyauth.middleware());
  app.use(app.router);
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  everyauth.helpExpress(app);
});
 
app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});
 
app.configure('production', function(){
  app.use(express.errorHandler()); 
});

 
// Routes
 
app.get('/', function(req, res){
    res.render('index', {
        title: 'Importability'
    });
});


 
var port = process.env.PORT || 3000;
app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
