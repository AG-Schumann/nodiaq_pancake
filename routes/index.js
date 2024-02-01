var express = require('express');
var router = express.Router();
var common = require('./common');


/* GET home page. */
router.get('/', common.ensureAuthenticated, function(req, res) {
    var config = common.GetRenderConfig(req);
    res.render('index', config);
});

router.get('/template_info', common.ensureAuthenticated, function(req, res) {
  return res.json(req.template_info_base);
});

router.get('/login', function(req, res){
    var config = common.GetRenderConfig(req);
    res.render('login', config);
});

router.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

module.exports = router;
