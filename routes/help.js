var express = require("express");
var url = require("url");
var router = express.Router();
var gp = '';

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    return res.redirect(gp+'/login');
}

router.get('/', ensureAuthenticated, function(req, res) {
    res.render('help', req.template_info_base);
});

router.get('/monitor', ensureAuthenticated, function(req, res) {
    res.render('help_monitor', req.template_info_base);
});



module.exports = router;
