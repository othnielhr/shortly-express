const auth = require('./auth');
const models = require('../models');

const parseCookies = (req, res, next) => {
  // console.log(req);
  var cookieObj = {};
  if (req.headers.cookie) {
    var cookieStr = req.headers.cookie;
    // console.log(cookieStr);
    var cookieArr = cookieStr.split('; ');
    // console.log(cookieArr);
    cookieArr.forEach((data) => {
      var splitCookie = data.split('=');
      // console.log(splitCookie);
      cookieObj[splitCookie[0]] = splitCookie[1];
    });
  }
  req.cookies = cookieObj;
  // console.log(req.cookies);
  next();
};

module.exports = parseCookies;