/**
 * Module dependencies.
 */
 
var express = require('express'),
    everyauth = require('everyauth'),
    format = require('util').format,
    csv = require('csv'),
    https = require('https'),
    querystring = require('querystring');
    
var app = module.exports = express.createServer();

everyauth.helpExpress(app);


var myURL = "http://node.local:3000",
    User = { id: 1 };
// Configuration

var readability_options  = {
  host: 'www.readability.com',
  endpoint: '/api/rest/v1/',
  key: "tehsuck",
  secret: "dVJVVx2bFKtxHL3AmMJ6TQbakR4Ga4BQ",
};

everyauth.readability
  .consumerKey(readability_options.key)
  .consumerSecret(readability_options.secret)
  .findOrCreateUser( function(sess, accessToken, accessSecret, reader) {
    User['readability'] = reader;
    return reader;
  })
  .redirectPath('/')

everyauth.debug = true;  

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser({uploadDir:'/var/tmp'}));
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: "i love pork chops" }));
  app.use(everyauth.middleware());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});
 
app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});
 
app.configure('production', function(){
  app.use(express.errorHandler()); 
});

 
// Routes
 
app.get('/', function(req, res){
      console.log("logged in: ",req.loggedIn);
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
    if(req.loggedIn) {
      var post_data = {
        'url': req.params.url
      };
      var callback = function(error,data,apires) {
        console.log("returned ",apires);
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
      
      everyauth.readability.oauth.post('https://'+readability_options.host+readability_options.endpoint+'bookmarks',
                                       req.session.auth.readability.accessToken,
                                       req.session.auth.readability.accessTokenSecret,
                                       post_data,
                                       callback);
    } else {
      res.redirect('/');
    }
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
      console.log("error parsing csv",error);
    });
  
  console.log(format('\nuploaded %s (%d Kb) to %s as %s'
    , req.files.csv_file.name
    , req.files.csv_file.size / 1024 | 0 
    , req.files.csv_file.path
    , req.body.title));
});

var port = process.env.PORT || 3000;
app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
