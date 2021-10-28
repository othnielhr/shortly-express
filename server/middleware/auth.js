const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  // console.log(req);
  if (req.headers.cookie) {
    //has cookie in header
  } else {
    models.Sessions.create()
      .then((data) => {
        var id = data.insertId;
        models.Sessions.get({id})
          .then((sessionData) => {
            req.session = sessionData;
            res.cookie('shortlyid', req.session.hash);
            next();
          });
      });
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

