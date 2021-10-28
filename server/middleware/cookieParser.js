const parseCookies = (req, res, next) => {
  // console.log(req);
  if (req.headers.cookie) {
    var cookieStr = req.headers.cookie;
    // console.log(cookieStr);
    var cookieArr = cookieStr.split('; ');
    // console.log(cookieArr);
    cookieArr.forEach((data) => {
      var splitCookie = data.split('=');
      // console.log(splitCookie);
      req.cookies[splitCookie[0]] = splitCookie[1];
    });
  }
  next();
  // console.log(req.cookies);
};

module.exports = parseCookies;