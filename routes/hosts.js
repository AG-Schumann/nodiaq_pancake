var express = require("express");
var url = require("url");
var router = express.Router();
var gp='';

function GetTemplateInfo(req) {
  var template_info = req.template_info_base;
  template_info['hosts'] = ['reader0', 'reader1', 'reader2', 'reader3', 'reader4',
    'reader5', 'eb0', 'eb1', 'eb2', 'eb3', 'eb4', 'eb5', 'oldmaster'];
  return template_info;
}

router.get('/', function(req, res) {
  res.render('hosts', GetTemplateInfo(req));
});

router.get('/template_info', function(req, res) {
  return res.json(GetTemplateInfo(req));
});

router.get("/get_host_status", function(req, res){
  var db = req.db;
  var collection = db.get('system_monitor');

  var q = url.parse(req.url, true).query;
  var host = q.host;

  collection.find({"host": host}, {"sort": {"_id": -1}, "limit": 1})
  .then(docs => {
    if (docs.length == 0)
      return res.json({});
    docs[0]['checkin'] = new Date() - docs[0]['time'];
    return res.json(docs[0]);
  }).catch(err => {console.log(err.message); res.json({});});
});

router.get("/get_host_history", function(req, res){
  var db = req.db;
  var collection = db.get("system_monitor");

  var q = url.parse(req.url, true).query;
  var host = q.host;
  var limit = parseInt(q.limit);
  if(typeof(limit)=="undefined")
    limit = 1;
  collection.find({"host": host}, {"sort": {"_id": -1}, "limit": limit})
    .then(docs => {
      if(docs.length==0)
        return res.json({});

      // Mem %, CPU %, Disk % on each disk
      r = {"mem": [], "cpu": [], "swap": []};
      names = {"mem": "Memory%", "cpu": "CPU%", "swap": "Swap%"};
      docs.forEach(doc => {
        var t = doc['time'].getTime();
        r["cpu"].unshift([t, doc['cpu_percent']]);
        r["mem"].unshift([t, doc['virtual_memory']['percent']]);
        r["swap"].unshift([t, doc['swap_memory']['percent']]);
        for(j in doc['disk']){
          if(!(j in r)){
            r[j] = [];
            names[j] = "Disk%("+j+")";
          }
          r[j].unshift([t, doc['disk'][j]['percent']]);
        }
      });
      ret = [];
      for(i in r)
        ret.push({"type": "line", "name": names[i], "data": r[i]})

      return res.json(ret);
    });
});

module.exports = router;
