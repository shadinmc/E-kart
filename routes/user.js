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

router.post('/remove-product', (req, res) => {
  userHelpers.removeProduct(req.body).then(() => {
    res.json({ status: true });
  });
});
router.post('/change-product-quantity', async (req, res) => {
  const { cart, product, count } = req.body;
  await userHelpers.changeProductQuantity(req.body);

  // 🧮 get the updated cart to fetch latest quantity + total
  const cartDetails = await userHelpers.getCartProducts(cart);
  const productData = cartDetails.find(p => p.product._id.toString() === product);

  const total = await userHelpers.getCartCount(cart);

  res.json({
    status: true,
    updatedQuantity: product.quantity,
    total: total
  });
});


// router.post('/change-product-quantity',(req,res,next)=>{
//   userHelpers.changeProductQuantity(req.body).then(()=>{
//     res.json({status:true})
//   })
// })
module.exports = router;
