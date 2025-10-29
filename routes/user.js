var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
var userHelpers = require('../helpers/user-helpers');
const { response } = require('../app');

const verifyLogin = (req, res, next) => {
  if (req.session.userLoggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}
/* GET home page. */
router.get('/', async function (req, res, next) {
  let user = req.session.user
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    console.log(cartCount)
  }
  productHelpers.getAllProducts().then((products) => {
    res.render('user/view-products', { products, user, cartCount })
  })
})
router.get('/login', (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/login', { "loginErr": req.session.userLoginErr })
    req.session.userLoginErr = false
  }
});


router.post('/signup', (req, res) => {
  userHelpers.doSignup(req.body).then((response) => {
    console.log("User signed up successfully:", response);
    req.session.user = response
    req.session.userLoggedIn = true
    res.redirect('/');
  }).catch((err) => {
    console.error("Signup failed:", err);
    res.status(500).send("Signup failed");
  });
});
router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user
      req.session.userLoggedIn = true
      res.redirect('/');
    } else {
      req.session.userLoginErr = "Invalid Username or Password"
      res.redirect('/login');
    }
  })
});
router.get('/logout', (req, res) => {
  req.session.user=null
  req.session.userLoggedIn=false

  res.redirect('/')

})
router.get('/cart', verifyLogin, async (req, res) => {
  let products = await userHelpers.getCartProducts(req.session.user._id)
  products.forEach(p => {
    p.totalPrice = parseInt(p.product.Price) * parseInt(p.quantity);
    console.log(p.totalPrice)

  });
  res.render('user/cart', { products, user: req.session.user })
})
router.get('/add-to-cart/:id', (req, res) => {
  console.log('api call')
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
  })
})

router.post('/remove-product', (req, res) => {
  userHelpers.removeProduct(req.body).then(() => {
    res.json({ status: true });
  });
});


router.post('/change-product-quantity', (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then((response) => {
    console.log(response)
    res.json({ response })
  })
})
router.get('/place-order', verifyLogin, async (req, res) => {
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order', { total })
})
router.post('/place-order', verifyLogin, async (req, res) => {
  const userId = req.session.user._id;
  const products = await userHelpers.getCartProducts(userId);
  const total = await userHelpers.getTotalAmount(userId);

  // Create the order once
  const orderId = await userHelpers.placeOrder({ ...req.body, userId }, products, total);

  if (req.body['paymentMethod'] === 'cod') {
    return res.json({ onlinePayment: false });
  } else {
    const razorpayOrder = await userHelpers.generateRazorPay(orderId, total);
    res.json({
      onlinePayment: true,
      orderId: orderId,
      razorpayOrder,
    });
  }


}
);

router.get('/order-success', verifyLogin, async (req, res) => {
  const userId = req.session.user._id
  await userHelpers.deleteCart(userId)
  res.render('user/order-success', { user: req.session.user })
})
router.get('/orders', verifyLogin, async (req, res) => {
  let userId = req.session.user._id
  let orders = await userHelpers.getUserOrders(userId)
  res.render('user/orders', { user: req.session.user._id, orders })
})
router.get('/order-details/:id', verifyLogin, async (req, res) => {
  try {
    let orderId = req.params.id;
    let order = await userHelpers.getOrderDetails(orderId);
    res.render('user/order-details', { user: req.session.user._id, order });
  } catch (err) {
    console.log('Error fetching order details:', err);
    res.status(500).send('Error loading order details');
  }
});
router.post('/verify-payment', (req, res) => {
  console.log(req.body)
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err)
    res.json({ status: false })
  })
})


module.exports = router;
