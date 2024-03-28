// routes.control_script.js
var express = require("express");
var url = require("url");
var router = express.Router();
const SCRIPT_VERSION = '20210922';
var common = require('./common');

router.get('/', common.ensureAuthenticated, function(req, res) {
  let config = common.GetRenderConfig(req);
  res.render('control', config);
});

router.get('/modes', common.ensureAuthenticated, function(req, res){
  var collection = req.db.get("options");
  collection.find({}, {fields: "name description -_id"})
      .then((docs) => res.json(docs))
      .catch((err) => {
        console.log(err.message);
        return res.json({error: err.message});
      });
});

function GetControlDoc(collection) {
  //get the latest entry for each key
  var keys = ['active', 'comment', 'mode', 'softstop', 'stop_after'];
  var p = keys.map(k => collection.findOne({field: `${k}`}, {sort: {_id: -1}}));
  return Promise.all(p).then(values => {
    var latest = values[0].time;
    var user = values[0].user;
    let ret = {detector: 'tpc'}; // needed because of reasons
    values.forEach(doc => {
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
  var collection = req.db.get("detector_control");
  GetControlDoc(collection)
    .then(doc => res.json(doc))
    .catch(err => {console.log(err.message); return res.json({});});
});

router.post('/set_control_docs', common.ensureAuthenticated, function(req, res){
  var collection = req.db.get("detector_control");
  var data = req.body.data;
  if (typeof data.version == 'undefined' || data.version != SCRIPT_VERSION)
    return res.json({'err': 'Please hard-reload your page (shift-f5 or equivalent)'});
  GetControlDoc(collection).then(olddoc => {
    var newdoc = data['doc'];
    console.log(olddoc);
    console.log(newdoc);
    if (typeof newdoc == 'undefined') {
      return;
    }
    for (var key in olddoc) {
      if (key == 'user')
        continue;
      if (typeof newdoc[key] != 'undefined' && newdoc[key] != olddoc[key]){
        collection.insert({field: key, value: key == 'stop_after' ? parseInt(newdoc[key]) : newdoc[key],
          user: req.user.username, time: new Date(), key: `tpc.${key}`});
      }
    }
    return res.status(200).json({});
  })
    .catch(err => {
      console.log(err.message);
    });
});

module.exports = router;
