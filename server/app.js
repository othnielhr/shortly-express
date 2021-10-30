const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const models = require('./models');
const parseCookies = require('./middleware/cookieParser');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(parseCookies);
app.use(Auth.createSession);


app.get('/', Auth.verifySession, (req, res) => {
  // console.log(req.session);
  res.render('index');
});

app.get('/create', Auth.verifySession,
  (req, res) => {
    res.render('index');
  });

app.get('/links', Auth.verifySession,
  (req, res, next) => {
    models.Links.getAll()
      .then(links => {
        res.status(200).send(links);
      })
      .error(error => {
        res.status(500).send(error);
      });
  });

app.get('/signup', (req, res, next) => {
  res.render('signup');
});

app.post('/signup', (req, res, next) => {
  var username = req.body.username;
  var password = req.body.password;
  models.Users.get(username)
    .then(newUser => {
      if (newUser) {
        // console.log('existing user found');
        res.sendStatus(500);
      } else {
        if (password.length < 3) {
          console.log('password needs to be at least 3 characters long');
          throw (err);
        }
        return models.Users.create({username, password});
      }
    })
    .then(data => {
      // console.log('newUser: ', newUser);
      models.Sessions.update({hash: req.session.hash}, {userId: data.insertId})
        .then(data => {
          req.session.userId = data.insertId;
          req.session.user = {username};
          // console.log('here');
          res.redirect(200, '/');
        });
    })
    .catch(err => {
      res.redirect('/signup');
    });
});

app.get('/login', (req, res, next) => {
  // here
  res.render('login');
});

app.post('/login', (req, res, next) => {
  var username = req.body.username;
  var password = req.body.password;
  models.Users.get({username})
    .then(user => {
      if (user) {
        // console.log('user: ', user);
        if (models.Users.compare(password, user.password, user.salt)) {
          models.Sessions.update({hash: req.session.hash}, {userId: user.id})
            .then(data => {
              // console.log('data: ', data);
              req.session.userId = data.insertId;
              req.session.user = {username};
              // console.log(req.session);
              res.redirect('/');
            });
        } else {
          console.log('invalid password');
          res.redirect('/login');
        }
      } else {
        console.log('invalid username');
        res.redirect('/login');
      }
    })
    .catch(err => {
      console.log('catch');
      res.redirect(500, '/login');
    });
});

app.get('/logout', (req, res, next) => {
  models.Sessions.delete({hash: req.session.hash})
    .then(() => {
      res.cookie('shortlyid', null);
      // console.log('delete');
      res.redirect('/login');
    });
});

app.post('/links',
  (req, res, next) => {
    var url = req.body.url;
    if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
      return res.sendStatus(404);
    }

    return models.Links.get({ url })
      .then(link => {
        if (link) {
          throw link;
        }
        return models.Links.getUrlTitle(url);
      })
      .then(title => {
        return models.Links.create({
          url: url,
          title: title,
          baseUrl: req.headers.origin
        });
      })
      .then(results => {
        return models.Links.get({ id: results.insertId });
      })
      .then(link => {
        throw link;
      })
      .error(error => {
        res.status(500).send(error);
      })
      .catch(link => {
        res.status(200).send(link);
      });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/


/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
