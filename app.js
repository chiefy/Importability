/**
 * Module dependencies.
 */
 
var express = require('express'),
    redisStore = require('connect-redis')(express);  
    everyauth = require('everyauth'),
    format = require('util').format,
    csv = require('csv'),
    https = require('https'),
    url = require('url'),
    querystring = require('querystring');


// Basic config which includes API keys, redis info etc.
var config = require('./config');

var app = module.exports = express.createServer();

everyauth.helpExpress(app);

var User = { id : 1 };

everyauth.readability
  .consumerKey(config.readability.key)
  .consumerSecret(config.readability.secret)
  .findOrCreateUser( function(sess, accessToken, accessSecret, reader) {
    User.readability = reader;
    return reader;
  })
  .redirectPath('/')

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser({uploadDir:'/var/tmp'}));
  app.use(express.methodOverride());
  app.use(express.cookieParser());

  var redisUrl = process.env.REDISTOGO_URL ? url.parse(process.env.REDISTOGO_URL) : url.parse(config.redis.url);
  var redisAuth = redisUrl.auth.split(':');

  app.set('redisHost', redisUrl.hostname);
  app.set('redisPort', redisUrl.port);
  app.set('redisDb', redisAuth[0]);
  app.set('redisPass', redisAuth[1]);
  app.use(express.session(
            {
              cookie: { maxAge: 3600000 }, // one hour
              secret: "i love pork chops",
              store: new redisStore({
                host: app.set('redisHost'),
                port: app.set('redisPort'),
                db: app.set('redisDb'),
                pass: app.set('redisPass')
              })
            })
        );
  
  app.use(everyauth.middleware());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});
 
app.configure('development', function() {
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  })); 
  everyauth.debug = true;
});
 
app.configure('production', function(){
  app.use(express.errorHandler()); 
  everyauth.debug = false;  
});

 
// Routes
app.get('/', function(req, res){
      res.render('index', {
          title: 'Importability'
      });
});

app.get('/import', function(req,res) {
    if(req.session.importData && req.loggedIn) {
       res.render('import', {
        title: 'Preview Import',
        links: req.session.importData
       });
    } else {
      res.redirect('/');
    }
});

app.get('/add/:url',function(req,res) {
  if(!req.loggedIn) {
      res.redirect('/');
  }

  var post_data = {
        'url': req.params.url
  },
  
  callback = function(error,data,apires) {
      var resData = { result: -1 };
        res.setHeader("Content-Type", "application/json");
        if(apires.statusCode === 202) {
          resData.result = 1;
        } else if(apires.statusCode === 409) {
          resData.result = 0;
        }
        res.write(JSON.stringify(resData));
        res.end();
  };
 
 everyauth.readability.oauth.post('https://'+config.readability.host+config.readability.endpoint+'bookmarks',
                                  req.session.auth.readability.accessToken,
                                  req.session.auth.readability.accessTokenSecret,
                                  post_data,
                                  callback);
});

app.post('/upload', function(req,res,next) {
  var dataObj = [];
  
  csv()
    .fromPath(req.files.csv_file.path, { "columns":true } )
    .on('data',function(data,index){
      data.id = index;
      dataObj.push(data);
    })
    .on('end',function(count){
      req.session.importData = dataObj;
      res.redirect('/import');
    })
    .on('error',function(error) {
      // do something
    });
});

var port = process.env.PORT || 3000;
app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
