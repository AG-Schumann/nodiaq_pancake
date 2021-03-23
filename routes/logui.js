// routes/logui.js
var express = require("express");
var url = require("url");
var router = express.Router();

function ensureAuthenticated(req, res, next) {
  return req.isAuthenticated() ? next() : res.redirect('/login');
}

router.get('/', ensureAuthenticated, function(req, res) {
  res.render('logui', req.template_info_base);
});

router.get('/areThereErrors', ensureAuthenticated, function(req, res){
  var db=req.db;
  var collection=db.get('log');
  var error_codes = [2, 3, 4]; //warning, error, fatal
  collection.count_documents({"priority": {"$in": error_codes}})
  .then( val => res.json({"error_docs": val}))
  .catch(err => {console.log(err.message); return res.json({"error_docs", -1});});
});

router.get('/getMessages', ensureAuthenticated, function(req, res){
  var db = req.db;
  var collection = db.get('log');
  var q = url.parse(req.url, true).query;
  var limit = q.limit;
  var include = q.get_priorities;
  if (typeof include == 'undefined')
    include = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
  else
    include = include.map(Number);

  if (typeof limit == 'undefined')
    limit = 100; //sure, why not
  collection.aggregate([
    {$match: {priority: {$in: include}}},
    {$sort: {_id: -1}},
    {$limit: limit},
    {$addFields: {time: {$toDate: '$_id'}}},
  ])
  .then(docs => res.json(docs))
  .catch(err => {console.log(err.message); return res.json([]);});
});

router.post('/new_log_message', ensureAuthenticated, (req, res) => {
  var db = req.db;
  var collection = db.get("log");
  var p = 5;
  if(typeof req.body.priority != 'undefined')
    p=parseInt(req.body.priority);
  var idoc = {
    "user": req.user.last_name,
    "message": req.body.entry,
    "priority": p,
    "time": new Date()
  }
  collection.insertOne(idoc);
  return res.json(idoc);
});

router.post('/acknowledge_errors', ensureAuthenticated, (req, res) => {
  var db = req.db;
  var collection = db.get("log");
  var error_codes = [2, 3, 4]; //warning, error, fatal
  var matchdoc = {"priority": {"$in": error_codes}};
  var updatedoc = {
    "$inc": {"priority": 10},
    "$set": {
      "closing_user": req.user.lngs_ldap_uid,
      "closing_message": req.body.message,
      "closing_date": new Date()
    }
  };
  collection.updateMany(matchdoc, updatedoc)
  .then( result => res.json(200))
  .catch(err => {console.log(err.message); return res.status(400).send('Failed to update db');});
});

module.exports = router;
