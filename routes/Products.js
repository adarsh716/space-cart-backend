const express = require('express');
const { createProduct, fetchAllProducts, fetchProductById, updateProduct,countProuducts,fetchAllProductsDashboard } = require('../controller/Product');
const { Product } = require('../model/Product');

const router = express.Router();
router.post('/', createProduct)
      .get('/', fetchAllProducts)
      .get('/dash', fetchAllProductsDashboard)
      .get('/countproduct',countProuducts)
      .get('/:id', fetchProductById)
      .patch('/:id', updateProduct)
      //.get('/search',searchProduct)

exports.router = router;
