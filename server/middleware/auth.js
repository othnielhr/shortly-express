const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  // console.log(req.body);
  if (req.cookies && req.cookies.shortlyid) {
    //has cookie in header
    // console.log('found cookie');
    var hash = req.cookies.shortlyid;
    models.Sessions.get({hash})
      .then(inTable => {
        // console.log(inTable);
        if (inTable) {
          req.session = inTable;
          // console.log(req.session);
          next();
        } else {
          //delete cookie
          models.Sessions.create()
            .then((data) => {
              // console.log(data);
              var id = data.insertId;
              models.Sessions.get({id})
                .then((sessionData) => {
                  // console.log(sessionData);
                  req.session = sessionData;
                  // console.log(req);
                  res.cookie('shortlyid', req.session.hash);
                  next();
                });
            });
        }
      });
  } else {
    models.Sessions.create()
      .then((data) => {
        // console.log(data);
        var id = data.insertId;
        models.Sessions.get({id})
          .then((sessionData) => {
            // console.log(sessionData);
            req.session = sessionData;
            // console.log(req);
            res.cookie('shortlyid', req.session.hash);
            next();
          });
      });
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

module.exports.verifySession = (req, res, callback) => {
  // console.log(req.session);
  if (models.Sessions.isLoggedIn(req.session)) {
    callback();
  } else {
    res.redirect('/login');
  }
};

