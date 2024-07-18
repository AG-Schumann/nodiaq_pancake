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
  collection.find({detector: {$ne: 'include'}}, {fields: "name description -_id"})
      .then((docs) => res.json(docs))
      .catch((err) => {
        console.log(err.message);
        return res.json({error: err.message});
      });
});


function GetControlDoc(collection) {
  const projection = { active: 1, mode: 1, user: 1, duration: 1, comment: 1, softstop: 1, _id: 0 };
  return collection.findOne({ subsystem: 'daqspatcher' }, { projection })
    .then(doc => {
      if (!doc) {
        console.log('Document not found');
        return {};
      }
      return doc;
    })
    .catch(err => {
      console.log('Error fetching document:', err.message);
      return {};
    });
}

router.get("/get_control_doc", common.ensureAuthenticated, function(req, res){
  var collection = req.db.get("system_control");
  GetControlDoc(collection)
    .then(doc => res.json(doc))
    .catch(err => {console.log(err.message); return res.json({});});
});

router.post('/set_control_docs', common.ensureAuthenticated, function(req, res){
  var collection = req.db.get("system_control");
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
      if (typeof newdoc[key] != 'undefined' && newdoc[key] != olddoc[key]){
        collection.update({subsystem:'daqspatcher'}, {$set:{[key]: key == 'duration' ? parseInt(newdoc[key]) : (key == 'active' || key == 'softstop') ? newdoc[key] == 'true' : newdoc[key]}});
      }
    }

    return res.status(200).json({});
  })
    .catch(err => {
      console.log(err.message);
    });
});

module.exports = router;
