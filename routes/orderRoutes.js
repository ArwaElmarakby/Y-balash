// const express = require('express');
// const router = express.Router();
// const { getOrderStatistics } = require('../controllers/orderController');

// router.get('/statistics', getOrderStatistics);

// module.exports = router;





// // routes/orderRoutes.js
// const express = require('express');
// const router = express.Router();
// const { getAllOrders } = require('../controllers/orderController');

// router.get('/all', getAllOrders);

// module.exports = router;




// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { getPaidOrders } = require('../controllers/orderController');

router.get('/paid', getPaidOrders);

module.exports = router;