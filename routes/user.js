var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
var userHelpers = require('../helpers/user-helpers')


/* GET home page. */
router.get('/', function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    res.render('user/view-products', { products })
  })
})
router.get('/login', (req, res) => {
  res.render('user/login')
})
router.get('/signup', (req, res) => {
  res.render('user/signup')
})

router.post('/signup', (req, res) => {
  userHelpers.doSignup(req.body).then((response) => {
    console.log("User signed up successfully:", response);
    res.redirect('/');
  }).catch((err) => {
    console.error("Signup failed:", err);
    res.status(500).send("Signup failed");
  });
});

module.exports = router;
