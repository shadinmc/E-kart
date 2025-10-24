var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
var userHelpers = require('../helpers/user-helpers');
const { response } = require('../app');
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}
/* GET home page. */
router.get('/',async function (req, res, next) {
  let user = req.session.user
  let cartCount=null
  if(req.session.user){
  cartCount =await userHelpers.getCartCount(req.session.user._id)
  console.log(cartCount)
  }
  productHelpers.getAllProducts().then((products) => {
    res.render('user/view-products', { products, user,cartCount })
  })
})
router.get('/login', (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/login', { "loginErr": req.session.loginErr })
    req.session.loginErr = false
  }
});


router.post('/signup', (req, res) => {
  userHelpers.doSignup(req.body).then((response) => {
    console.log("User signed up successfully:", response);
    req.session.loggedIn=true
    req.session.user=response
    res.redirect('/');
  }).catch((err) => {
    console.error("Signup failed:", err);
    res.status(500).send("Signup failed");
  });
});
router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/');
    } else {
      req.session.loginErr = "Invalid Username or Password"
      res.redirect('/login');
    }
  })
});
router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')

})
router.get('/cart',verifyLogin,async (req, res) => {
  let products=await userHelpers.getCartProducts(req.session.user._id)
  res.render('user/cart',{products,user:req.session.user})
})
router.get('/add-to-cart/:id',(req,res)=>{
  console.log('api call')
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })
})
router.post('/change-product-quantity', async (req, res) => {
  const { productId, change } = req.body;
  const userId = req.session.user._id;
  const count = parseInt(change);

  const result = await userHelpers.changeProductQuantity(userId, productId, count);
  const cartCount = await userHelpers.getCartCount(userId);

  res.json({ removeProduct: result.removeProduct, cartCount });
});

router.post('/remove-product', async (req, res) => {
  const { productId } = req.body;
  const userId = req.session.user._id;

  await userHelpers.removeProductFromCart(userId, productId);
  const cartCount = await userHelpers.getCartCount(userId);

  res.json({ status: true, cartCount });
});


module.exports = router;
