
var express = require("express");
var url = require("url");
var router = express.Router();
const SCRIPT_VERSION = '20211103';
var common = require('./common');


router.get('/', common.ensureAuthenticated, function(req, res) {
  let config = common.GetRenderConfig(req);
  res.render('runsui', config);
});

router.get('/get_runs_table', common.ensureAuthenticated, function getData (req, res) {

  var conditions = {};
  if (typeof req.query['conditions'] !== 'undefined')
    conditions = JSON.parse(req.query['conditions']);
  // Date filtering
  if (req.query['date_min'] !== undefined && !('start' in Object.keys(conditions))) {
    if (req.query['date_max'] !== undefined) {
      // both min and max
      conditions['start'] = {
        "$gt": new Date(req.query['date_min']),
        "$lt": new Date(req.query['date_max'])
      };
    } else {
      // only min
      conditions['start'] = {"$gt": new Date(req.query['date_min'])};
    }
  }
  else if (req.query['date_max'] !== undefined)  {
    //only max
    conditions['start'] = {"$lt": new Date(req.query['date_max'])};
  }
  req.runs_coll.find(conditions)
      .then(docs => res.json(docs))
      .catch(err => {console.log(err.message); return res.json([]);});
});

router.get('/get_run_doc', common.ensureAuthenticated, function(req, res){
  var q = url.parse(req.url, true).query;
  var num = q.run;
  var mode = q.mode
  if(typeof num !== 'undefined')
    num = parseInt(num, 10);
  if(typeof num === "undefined")
    return res.json({});
  req.runs_coll.findOne({"run_id": num, "mode": mode})
  .then( doc => res.json(doc === null ? {} : doc))
  .catch(err => {console.log(err.message); return res.json({});});
});

router.post('/addtag', common.ensureAuthenticated, function(req, res){
  var run = req.body.number;
  var mode = req.body.mode;
  var tag = req.body.tag;
  if (typeof req.body.version == 'undefined' || req.body.version != SCRIPT_VERSION)
    return res.json({err: "Please hard-reload your page (shift-f5 or equivalent)"});
  if (tag[0] === '_') // underscore tags are protected
    return res.sendStatus(403);

  var user = req.user.username;
  if (typeof user == 'undefined' || user == 'not set') {
    return res.json({err: "Invalid user credentials"});
  }

  // Convert runs to int
  var runsint = parseInt(run);
  // Update many
  var query = {'run_id': runsint, 'mode': mode};
  var update = {$addToSet: {tags: {date: new Date(), user: user, name: tag}}};
  req.runs_coll.update(query, update)
  .then( () => res.status(200).json({}))
  .catch(err => {console.log(err.message); return res.status(200).json({err: err.message});});
});

router.post('/removetag', common.ensureAuthenticated, function(req, res){
  var run = req.body.run;
  var mode = req.body.mode;
  var tag = req.body.tag;
  var tag_user = req.body.user;
  if (typeof req.body.version == 'undefined' || req.body.version != SCRIPT_VERSION)
    return res.json({err: "Please hard-reload your page (shift-f5 or equivalent)"});
  if (tag[0] === '_') { // underscore tags are protected
    return res.sendStatus(403);
  }
  var query = {'run_id': parseInt(run, 10), 'mode': mode};
  var update = {$pull: {tags: {name: tag, user: tag_user}},
    $push: {deleted_tags: {name: tag, user: tag_user, deleted_by: req.user.username, date: new Date()}}};
  req.runs_coll.update(query, update)
  .then(() => res.status(200).json({}))
  .catch(err => {console.log(err.message); return res.status(200).json({err: err.message});});
});

router.post('/addcomment', common.ensureAuthenticated, function(req, res){
  var run = req.body.runid;
  var mode = req.body.mode;
  var comment = req.body.comment;
  if (typeof req.body.version == 'undefined' || req.body.version != SCRIPT_VERSION)
    return res.json({err: "Please hard-reload your page (shift-f5 or equivalent)"});
  var user = req.user.username;
  if (typeof user == 'undefined' || user == 'not set') {
    return res.json({err: "Invalid user credentials"});
  }
  // Convert runs to int
  var runsint = parseInt(run);
  var query = {'run_id': runsint, 'mode': mode};
  var update = {$push: {'comments': {'date': new Date(), 'user': user, 'comment': comment}}};
  req.runs_coll.update(query, update)
      .then( () => res.status(200).json({}))
      .catch(err => {console.log(err.message); return res.status(200).json({err: err.message});});
});

router.get('/runsfractions', common.ensureAuthenticated, function(req, res){
  var q = url.parse(req.url, true).query;
  var days = q.days;
  if( typeof days === 'undefined')
    days = 30;
  var total = days*86400*1000;
  var querydays = new Date(new Date() - total);
  req.runs_coll.aggregate([
    {$match : {start : {$gt : querydays}}},
    {$project : {mode : 1, user : 1, start : 1, end : 1}},
    {$group : {
      _id : '$mode',
      runtime : {
        $sum : {
          $divide : [
            {$subtract : [
              {$ifNull : ['$end', new Date()]},
              '$start'
            ]}, // subtract
            total] // divide
        } // sum
      } // runtime
    }}])
  .then(docs => res.json(docs))
  .catch(err => {console.log(err.message); return res.json([]);});
});



module.exports = router;
