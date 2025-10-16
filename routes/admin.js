var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')

/* GET users listing. */
router.get('/', function (req, res, next) {
  let products = [
    {
      name: "Iphone 17",
      category: "Mobile",
      Description: "Apple Phone",
      image: "https://th.bing.com/th/id/OIP.ZpQdGWT-BTB0vDo2XLfv7AHaEK?w=328&h=184&c=7&r=0&o=7&cb=12&dpr=1.3&pid=1.7&rm=3"
    },
    {
      name: "Oppo",
      category: "Mobile",
      Description: "Android Phone",
      image: "https://th.bing.com/th/id/OIP.eTq-f3J89Wv4yWStZHeuywHaEK?w=298&h=180&c=7&r=0&o=7&cb=12&dpr=1.3&pid=1.7&rm=3"
    },
    {
      name: "MacBook",
      category: "Laptop",
      Description: "High Efficiency m2 chip",
      image: "https://th.bing.com/th/id/OIP.6pbbCNkIfwwX99p0Al5lIwHaFj?w=206&h=180&c=7&r=0&o=7&cb=12&dpr=1.3&pid=1.7&rm=3"
    },
    {
      name: "DSLR",
      category: "camera",
      Description: "high pixel photos",
      image: "https://th.bing.com/th/id/OIP.1T2suIb6elvh4sXgtKVrJQHaE8?w=235&h=150&c=6&o=7&cb=12&dpr=1.3&pid=1.7&rm=3"
    },
  ]
  res.render('admin/view-products', { admin: true, products });
});
router.get('/add-product', function (req, res) {
  res.render('admin/add-product')

})
router.post('/add-product', (req, res) => {

  productHelpers.addProduct(req.body, (id) => {
    let image = req.files.image
    console.log(id)
    image.mv('./public/product-images/'+ id +'.jpg', (err, done) => {
      if (!err) {
        res.render('admin/add-product')
      }
      else{
        console.log(err);
      }
    })

  });
});

/*router.post('/add-product', (req, res) => {
  console.log("Files received:", req.files)
  console.log("Body received:", req.body)
  res.send("Check your console")
})
*/
module.exports = router;
