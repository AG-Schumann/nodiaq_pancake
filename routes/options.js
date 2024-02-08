// routes/options_script.js
var express = require("express");
var url = require("url");
var router = express.Router();
var gp = '';
const SCRIPT_VERSION = '20210622';
var common = require('./common');


router.get('/', common.ensureAuthenticated, function(req, res) {
  let config = common.GetRenderConfig(req);
  res.render('options', config);
});

router.get("/options_list", common.ensureAuthenticated, function(req, res){
  // get names of all runmodes
  req.db.get('options').distinct('name')
      .then(docs => res.json(docs))
      .catch(err => {console.log(err.message); return res.json([]);});
});

router.get("/options_json", common.ensureAuthenticated, function(req, res){
  var query = url.parse(req.url, true).query;
  var name = query.name;
  if(typeof name == "undefined")
    return res.json({"ERROR": "No name provided"});
  req.db.get('options').findOne({"name": name})
  .then( doc => res.json(doc))
  .catch(error => res.json({"error": error.message}));
});

router.post("/set_run_mode", common.ensureAuthenticated, function(req, res){
  doc = JSON.parse(req.body.doc);
  if (typeof doc._id != 'undefined')
    delete doc._id;
  doc['last_modified'] = new Date();
  if (typeof req.body.version == 'undefined' || req.body.version != SCRIPT_VERSION)
    return res.json({res: "Please hard-reload your page (shift-f5 or equivalent)"});
  if(typeof doc['name'] === 'undefined')
    return res.redirect("/options");
  req.db.get('options').remove({name: doc['name']})
    .then( () => req.db.get('options').insert(doc, {}))
    .then( () => res.status(200).json({}))
    .catch(err => {console.log(err.message); return res.json({"err": err.message});});
});

router.get("/remove_run_mode", common.ensureAuthenticated, function(req, res){
  var query = url.parse(req.url, true).query;
  var name = query.name;
  req.db.get('options').remove({'name': name})
  .then( () => res.status(200).json({}))
  .catch(err => {console.log(err.message); return res.json({err: err.message});});
});

module.exports = router;
