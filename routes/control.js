// routes.control.js
var express = require("express");
var url = require("url");
var router = express.Router();
const SCRIPT_VERSION = '20210922';
var common = require('./common');

router.get('/', common.ensureAuthenticated, function(req, res) {
  var config = common.GetRenderConfig(req);
  res.render('control', config);
});



router.get('/modes', common.ensureAuthenticated, function(req, res){
  var collection = req.db.get("options");
  var q = url.parse(req.url, true).query;
  var detector = q.detector;
  collection.aggregate([
    {$match: {detector: {$ne: 'include'}}},
    {$addFields: {_detector: '$detector'}},
    {$unwind: '$detector'},
    {$sort: {name: 1}},
    {$group: {
        _id: '$detector',
        options: {$push: '$name'},
        desc: {$push: '$description'},
        link: {$push: {$cond: [{$isArray: '$_detector'}, '$_detector', ['$_detector']]}}
      }},
    {$project: {configs: {$zip: {inputs: ['$options', '$desc', '$link']}}}}
  ]).then( (docs) => res.json(docs))
      .catch( (err) => {console.log(err.message); return res.json({error: err.message})});
});


function GetControlDoc(collection) {
  var keys = ['active', 'comment', 'mode', 'remote', 'softstop', 'stop_after'];
  var detector = 'tpc'; // TODO: whatever the keys are in the one-detector-DAQ
  var p = keys.map(k => collection.findOne({key: `${detector}.${k}`}, {sort: {_id: -1}}));
  return Promise.all(p).then(values => {
    console.log(values);
    var ret = {detector: detector};
    var latest = values[0].time;
    var user = values[0].user;
    values.forEach(doc => {
      console.log(doc);
      ret[doc.field] = doc.field == 'stop_after' ? parseInt(doc.value) : doc.value;
      if (doc.time > latest) {
        user = doc.user;
        latest = doc.time;
      }
    });
    ret['user'] = user;
    return ret;
  }).catch(err => {console.log(err.message); return {};});
}

router.get("/get_control_doc", common.ensureAuthenticated, function(req, res){
  // TODO: Rewrite this for one detector
  var collection = req.db.get("detector_control");
  GetControlDoc(collection)
    .then(doc => res.json(doc))
    .catch(err => {console.log(err.message); return res.json({});});
});

router.post('/set_control_docs', common.ensureAuthenticated, function(req, res){
  // TODO: Rewrite this for one detector
  var collection = req.db.get("detector_control");
  var data = req.body.data;
  if (typeof data.version == 'undefined' || data.version != SCRIPT_VERSION)
    return res.json({'err': 'Please hard-reload your page (shift-f5 or equivalent)'});
  var count = 0;
  ['tpc', 'muon_veto', 'neutron_veto'].forEach(det => {
    GetControlDoc(collection, det).then(olddoc => {
      var newdoc = data[det];
      if (typeof newdoc == 'undefined') {
        if (++count >= 3) return res.status(200).json({});
        return;
      }
      for (var key in olddoc) {
        if (key == 'user' || key == 'detector')
          continue;
        if (typeof newdoc[key] != 'undefined' && newdoc[key] != olddoc[key]){
          collection.insert({detector: det, field: key, value: key == 'stop_after' ? parseInt(newdoc[key]) : newdoc[key], user: req.user.username, time: new Date(), key: `${det}.${key}`});
        }
      }
      if (++count >= 3) return res.status(200).json({});
    })
      .catch(err => {
        console.log(err.message);
        if (++count >= 3) return res.status(200).json({err: err.message});
      });
  }); // forEach
});

module.exports = router;
