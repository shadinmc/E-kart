var express = require('express');
var router = express.Router();
var db = require('../config/connection')
var productHelpers = require('../helpers/product-helpers');
const { response } = require('../app');

/* GET users listing. */
router.get('/', function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    res.render('admin/view-products', { admin: true, products })
  })
})

router.get('/add-product', function (req, res) {
  res.render('admin/add-product')

})
router.post('/add-product', (req, res) => {

  productHelpers.addProduct(req.body, (id) => {
    let image = req.files.image
    console.log(id)
    image.mv('./public/product-images/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.render('admin/add-product')
      }
      else {
        console.log(err);
      }
    })

  })
})
router.get('/delete-product/:id', (req, res) => {
  let prodId = req.params.id;
  productHelpers.deleteProduct(prodId).then((response) => {
    res.redirect('/admin');
  }).catch((error) => {
    console.error('Error deleting product:', error);
    res.status(500).send('Error deleting product');
  });
});

router.get('/edit-product/:id', async (req, res)=>{
  let product =await productHelpers.getProductDetails(req.params.id)
  console.log(product)
  res.render('admin/edit-product',{product})
})
router.post('/edit-product/:id', (req, res) => {
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
  res.redirect('/admin')
  })
})


module.exports = router;
