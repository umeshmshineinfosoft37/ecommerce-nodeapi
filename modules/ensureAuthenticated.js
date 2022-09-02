const jwt = require('jsonwebtoken')
const config = require('../configs/jwt-config')
const TypedError = require('./ErrorHandler')
function ensureAuthenticated(req, res, next) {
  let token = ''
  if (req.headers['x-access-token'] || req.headers['authorization']) {
    token = req.headers['x-access-token'] || req.headers['authorization']
  }
  //OAuth 2.0 framework 'bearer' token type
  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length)
  }
  if (token) {
    jwt.verify(token, config.secret, (err, decoded) => {
      console.log("decoded==>",decoded)
      if (err) {
        let err = new TypedError('token', 401, 'invalid_field', {
          message: "Token is not valid"
        })
        return next(err)
      } else {
        //bind on request
        next()
      }
    })
  } else {
    let err = new TypedError('token', 401, 'invalid_field', {
      message: "Token is not supplied"
    })
    return next(err)
  }
};

function ensureAdminAuthenticated(req, res, next) {
  let token = ''
  if (req.headers['x-access-token'] || req.headers['authorization']) {
    token = req.headers['x-access-token'] || req.headers['authorization']
  }
  //OAuth 2.0 framework 'bearer' token type
  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length)
  }
  if (token) {
    jwt.verify(token, config.secret, (err, decoded) => {
      console.log("decoded==>",decoded)
      if (err) {
        let err = new TypedError('token', 401, 'invalid_field', {
          message: "Token is not valid"
        })
        
        return next(err)
      } else {
        //bind on request
        if(decoded.admin){
          next()
        }
        else{
          let err = new TypedError('token', 402, 'invalid_admin', {
            message: "Admin is not valid"
          })
          return next(err)
        }
      }
    })
  } else {
    let err = new TypedError('token', 401, 'invalid_field', {
      message: "Token is not supplied"
    })
    return next(err)
  }
};

module.exports = {ensureAuthenticated,ensureAdminAuthenticated}