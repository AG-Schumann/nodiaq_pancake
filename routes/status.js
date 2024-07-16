// routes/status.js
var express = require('express');
var url = require('url');
var ObjectId = require('mongodb').ObjectID;
var router = express.Router();
var common = require('./common');


router.get('/', common.ensureAuthenticated, function(req, res) {
  let config = common.GetRenderConfig(req);
  res.render('status', config);
});


async function getStatus(req) {
  const db = req.db;
  const ret = {
    daqstatus: await base.currentStatus(),
    daqmsg: '',
    spatchstatus: '',
    daqworklist: '',
    spatchmsg: '',
    runprogress: '0',
    run_duration: '1',
    straxstatus: '',
    straxmsg: '',
    ledstatus: ''
  };

  try {
    // Get the latest log message
    const latestLog = await db.collection('log').find({}).sort({_id: -1}).limit(1).toArray();
    if (latestLog.length > 0) {
      ret.daqmsg = latestLog[0].message;
    }

    // Get DAQ Dispatcher status
    let statusDoc = await db.collection('system_control').findOne({subsystem: 'daqspatcher'});
    if (statusDoc) {
      ret.spatchstatus = statusDoc.status;
      ret.daqworklist = statusDoc.worklist;
      ret.spatchmsg = statusDoc.msg || '';
    }

    if (ret.daqstatus === 'running') {
      const runStart = await db.collection('runs').aggregate([
        {$match: {start: {$exists: true}}},
        {$sort: {_id: -1}},
        {$limit: 1}
      ]).toArray();

      if (runStart.length > 0) {
        const run_start = runStart[0].start;
        const run_duration = statusDoc.duration;
        const runtime = (new Date() - new Date(run_start)) / 1000;
        ret.runprogress = runtime;
        ret.run_duration = run_duration;
      }
    }

    // Get Straxinator status
    statusDoc = await db.collection('system_control').findOne({subsystem: 'straxinator'});
    if (statusDoc) {
      ret.straxstatus = statusDoc.status;
      ret.straxmsg = statusDoc.msg || '';
    }

    // Get Pulser status
    statusDoc = await db.collection('system_control').findOne({subsystem: 'pulser'});
    if (statusDoc) {
      ret.ledstatus = statusDoc.status;
      // ret.ledmsg = statusDoc.msg || '';
    }

    return ret;
  } catch (err) {
    console.error(err);
    throw new Error('Failed to get status');
  }
}

router.get('/get_status', common.ensureAuthenticated, async function(req, res) {
  try {
    const status = await getStatus(req);
    res.json(status);
  } catch (err) {
    console.log(err.message);
    res.json({});
  }
});


router.get('/get_detector_status', common.ensureAuthenticated, function(req, res){
  req.db.get('status').find({}, {"sort": {"_id": -1}, "limit": 1})
  .then( docs => {
    if (docs.length == 0)
      return res.json({});
    docs[0]['checkin'] = parseInt((new Date() - docs[0]['time'])/1000, 10);
    return res.json(docs[0]);
  })
  .catch(err => {console.log(err.message); return res.json({});});
});

function objectIdWithTimestamp(timestamp) {
  //https://stackoverflow.com/questions/8749971/can-i-query-mongodb-objectid-by-date
  // Convert string date to Date object (otherwise assume timestamp is a date)
  if (typeof(timestamp) == 'string') {
    timestamp = new Date(timestamp);
  }
  // Convert date object to hex seconds since Unix epoch
  var hexSeconds = Math.floor(timestamp/1000).toString(16);
  // Create an ObjectId with that hex timestamp
  var constructedObjectId = ObjectId(hexSeconds + "0000000000000000");
  return constructedObjectId;
}

router.get('/get_reader_history', common.ensureAuthenticated, function(req,res){
  // TODO: I don't even want to start on this right now
  var q = url.parse(req.url, true).query;
  var limit  = parseInt(q.limit);
  var resolution = parseInt(q.res);

  if(typeof limit == 'undefined')
    limit = 86400; // 1d into past
  if(typeof res == 'undefined')
    resolution = 60; //1m
  var t = new Date() - limit*1000;
  var id = objectIdWithTimestamp(t);
  // Fancy-pants aggregation to take binning into account
  req.db.get('status').aggregate([
    {$match: {"_id": {"$gt": id}}},
    {$project: {
      time_bin: {
        $trunc: {
          $divide : [
            {$convert: {input: {$subtract: [{$toDate: "$_id"}, t]},
              to: 'decimal'
            }
            },
            1000*resolution
          ]
        }
      },
      insertion_time: {$toDate: "$_id"}, _id: 1, rate: 1, buffer_length: 1, host: 1
    }},
    {$group: {
      _id: '$time_bin',
      rate: {$avg: '$rate'},
      buff: {$avg: '$buffer_length'},
      host: {$first: '$host'}
    }},
    {$project: {
      _id: 1,
      time: {$convert: {input: {$add: [{$multiply: ['$_id', resolution, 1000]}, t]},
        'to': 'long'
      }},
      rate: 1,
      buff: 1,
      host: 1,
    }},
    {$sort: {time: 1}},
    {$group: {
      _id: '$host',
      rates: {$push: '$rate'},
      buffs: {$push: '$buff'},
      times: {$push: '$time'},
    }},
    {$project: {
      host: '$_id',
      rate: {$zip: {inputs: ['$times', '$rates']}},
      buff: {$zip: {inputs: ['$times', '$buff']}},
    }},
  ])
  .then( docs => {
    var ret = {};
    docs.forEach(doc => {ret[doc.host] = doc;});
    return res.json(ret);
  })
  .catch(err => {console.log(err.message); return res.json({});});
});

module.exports = router;
