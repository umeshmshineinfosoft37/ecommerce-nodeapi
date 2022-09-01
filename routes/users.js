const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken')
const config = require('../configs/jwt-config')
const ensureAuthenticated = require('../modules/ensureAuthenticated')
const User = require('../models/User');
const Cart = require('../models/Cart');
const CartClass = require('../modules/Cart')
const Product = require('../models/Product')
const Variant = require('../models/Variant')
const Wishlist = require("../models/Wishlist");
const TypedError = require('../modules/ErrorHandler');
const { json } = require('body-parser');


//POST /signin
router.post('/signin', function (req, res, next) {
  const { fullname, email, password, verifyPassword } = req.body
  req.checkBody('fullname', 'fullname is required').notEmpty();
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('verifyPassword', 'verifyPassword is required').notEmpty();
  
  let missingFieldErrors = req.validationErrors();
  if (missingFieldErrors) {
    let err = new TypedError('signin error', 400, 'missing_field', {
      errors: missingFieldErrors,
    })
    return next(err)
  }
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('password', 'Passwords have to match').equals(req.body.verifyPassword);
  let invalidFieldErrors = req.validationErrors()
  if (invalidFieldErrors) {
    let err = new TypedError('signin error', 400, 'invalid_field', {
      errors: invalidFieldErrors,
    })
    return next(err)
  }
  var newUser = new User({
    fullname: fullname,
    password: password,
    email: email
  });
  User.getUserByEmail(email, function (error, user) {
    if (error) return next(err)
    if (user) {
      let err = new TypedError('signin error', 409, 'invalid_field', {
        message: "user is existed"
      })
      return next(err)
    }
    User.createUser(newUser, function (err, user) {
      if (err) return next(err);
      res.json({ message: 'user created' })
    });
  })
});

//POST /login
router.post('/login', function (req, res, next) {
  const { email, password } = req.body || {}
  if (!email || !password) {
    let err = new TypedError('login error', 400, 'missing_field', { message: "missing username or password" })
    return next(err)
  }
  User.getUserByEmail(email, function (err, user) {
    if (err) return next(err)
    if (!user) {
      let err = new TypedError('login error', 403, 'invalid_field', { message: "Incorrect email or password" })
      return next(err)
    }
    User.comparePassword(password, user.password, function (err, isMatch) {
      if (err) return next(err)
      if (isMatch) {
        let token = jwt.sign(
          { email: email },
          config.secret,
          { expiresIn: '7d' }
        )
        res.status(200).json({
          user_token: {
            user_id: user.id,
            user_name: user.fullname,
            token: token,
            expire_in: '7d'
          }
        })
      } else {
        let err = new TypedError('login error', 403, 'invalid_field', { message: "Incorrect email or password" })
        return next(err)
      }
    })
  })
})

//GET cart
router.get('/:userId/cart', ensureAuthenticated, function (req, res, next) {
  let userId = req.params.userId
  Cart.getCartByUserId(userId, function (err, cart) {
    if (err) return next(err)
    if (cart.length < 1) {
      let err = new TypedError('cart error', 404, 'not_found', { message: "create a cart first" })
      return next(err)
    }
    const temp=[]
    if (cart.length > 0) {
    Object.keys(cart[0].items).forEach(function(key, index) {
      temp.push(cart[0].items[key])
    })
  }
    const tempRes = JSON.parse(JSON.stringify({cart: cart[0]}));
    tempRes.cart.items =temp;
    return res.json({ ...tempRes })
  })
})

//POST cart
router.post('/:userId/cart', ensureAuthenticated, function (req, res, next) {
  let userId = req.params.userId
  let { productId, increase, decrease } = req.body
  Cart.getCartByUserId(userId, function (err, c) {
    if (err) return next(err)
    let oldCart = new CartClass(c[0] || { userId })
    
    // no cart save empty cart to database then return response
    if (c.length < 1 && !productId) {
      return Cart.createCart(oldCart.generateModel(), function (err, resultCart) {
        if (err) return next(err)
        return res.status(201).json({ cart: resultCart })
      })
    }
    Product.findById(productId, function (e, product) {
      if (e) {
        e.status = 406;
        return next(e);
      }
      if (product) {
        if (decrease) {
          oldCart.decreaseQty(product.id);
        } else if (increase) {
          oldCart.increaseQty(product.id);
        } else {
          oldCart.add(product, product.id);
        }
        let newCart = oldCart.generateModel()
        Cart.updateCartByUserId(
          userId,
          newCart,
          function (err, result) {
            if (err) return next(err)
            return res.status(200).json({ cart: result })
          })
      } else {
        // apply variant
        Variant.getVariantByID(productId, function (e, variant) {
          if (e) {
            e.status = 406;
            return next(e);
          }
          if (variant) {
            Product.getProductByID(variant.productID, function (e, p) {
              let color = (variant.color) ? "- " + variant.color : "";
              let size = (variant.size) ? "- " + variant.size : "";
              variant.title = p.title + " " + color + size
              variant.price = p.price
              if (decrease) {
                oldCart.decreaseQty(variant.id);
              } else if (increase) {
                oldCart.increaseQty(variant.id);
              } else {
                oldCart.add(variant, variant.id);
              }
              let newCart = oldCart.generateModel()
              Cart.updateCartByUserId(
                userId,
                newCart,
                function (err, result) {
                  if (err) return next(err)
                  res.status(200).json({ cart: result })
                })
            })
          }
          // no product and no variant find
          else {
            let err = new TypedError('/cart', 400, 'invalid_field', {
              message: "invalid request body"
            })
            return next(err)
          }
        })
      }
    })
  })
})

//PUT cart
router.put('/:userId/cart', ensureAuthenticated, function (req, res, next) {
  let userId = req.params.userId
  let requestProduct = req.body
  let { productId, color, size } = requestProduct.product

  Cart.getCartByUserId(userId, function (err, c) {
    if (err) return next(err)
    let oldCart = new CartClass(c[0] || {})
    Product.getProductByID(productId, function (err, p) {
      if (err) return next(err)
      let newCart = oldCart.add(p, productId, { color, size })

      //exist cart in databse
      if (c.length > 0) {
        Cart.updateCartByUserId(
          userId,
          {
            items: newCart.items,
            totalQty: newCart.totalQty,
            totalPrice: newCart.totalPrice,
            userId: userId
          },
          function (err, result) {
            if (err) return next(err)
            res.json(result)
          })
      } else {
        //no cart in database
        newCart = new Cart({
          items: newCart.items,
          totalQty: newCart.totalQty,
          totalPrice: newCart.totalPrice,
          userId: userId
        })
        Cart.createCart(newCart, function (err, resultCart) {
          if (err) return next(err)
          res.status(201).json(resultCart)
        })
      }
    })
  })
})
//DELETE Cart
router.delete('/:userId/cart/:cartId', ensureAuthenticated, function (req, res, next) {
  let cartId = req.params.cartId
  Cart.removeCart(cartId, function (err, cart) {
    if (err) return next(err)
    if (cart.length < 1) {
      let err = new TypedError('cart error', 404, 'not_found', { message: "create a cart first" })
      return next(err)
    }
    res.status(200).json({ message: 'Cart Successfully deleted ' })
  })
})

//GET wishlist
router.get('/:userId/wishlist', ensureAuthenticated, async function (req, res, next) {
  let userId = req.params.userId
  try{
    const wishlistData = await Wishlist.findOne({user_id:"6305bdf9d8176a12a48f693d"}).populate("product").lean().exec();
      if(wishlistData){
        return res.status(200).json({wishlistData});
      }else{
        let err = new TypedError('wishlist error', 404, 'not_found', { message: "create a wishlist first" })
      return next(err)
      }
 }catch(e){
  if (err) return next(err)
}
})

// POST Wishlist
router.post('/:userId/wishlist', ensureAuthenticated, async function (req, res, next) {
  try{
    const userId= req.params.userId;
    const productId= req.body.productId;
    let isRemove=false;
    isRemove= req.body.isRemove;
    let wishlist = [];
    const already_wishlist =  await Wishlist.findOne({user_id:userId})
    if(already_wishlist && already_wishlist?.user_id.toString() === userId ){
      if(!isRemove){
      wishlist = await Wishlist.findOneAndUpdate(
        { _id: already_wishlist._id}, 
        {
          $addToSet:{
            product: { $each:[productId] },
          }
        }
      )
      }else{
        wishlist = await Wishlist.findOneAndUpdate(
          { _id: already_wishlist._id}, 
          {
            $pull:{
              product: productId,
            }
          }
      )
      }
    }else{
      wishlist = await Wishlist.create({
        product : req.body.productId,
        user_id : req.params.userId,
    });
    }
    if(wishlist){
      if(already_wishlist) wishlist =  await Wishlist.findOne({_id:already_wishlist?._id})
      res.status(200).json({wishlist});
    }

}catch(e){
    res.status(500).json({Message : e.message , Status : "Failed"});
    next(e)
}
})
//DELETE Wishlist
router.delete('/:userId/wishlist/:wishlistId', ensureAuthenticated, async function (req, res, next) {
  try {
  let wishlistId = req.params.wishlistId;
  const wishlistData = await Wishlist.deleteOne({_id:wishlistId});
  if(wishlistData){
    res.status(200).json({ message: 'Wishlist Successfully deleted ' })
  }

  } catch (error) {
    return next(error)
  }
  
  
})




module.exports = router;