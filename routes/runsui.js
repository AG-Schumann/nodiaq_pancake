var express = require("express");
var url = require("url");
var router = express.Router();
var gp = '';

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    return res.redirect(gp+'/login');
}

router.get('/', ensureAuthenticated, function(req, res) {
    res.render('runsui', { title: 'Runs UI', user: req.user });
});

router.get('/get_run_doc', ensureAuthenticated, function(req, res){
    var db = req.runs_db;
    var q = url.parse(req.url, true).query;
    var num = q.run;
    if(typeof num !== 'undefined')
	num = parseInt(num, 10);
    if(typeof num === "undefined")
	return res.send(JSON.stringify({}));
    if(typeof q.experiment === "undefined" || q.experiment === "xenonnt"){
	var collection = db.get(process.env.RUNS_MONGO_COLLECTION);
	collection.find({"number": num}, function(e, docs){
		if(docs.length ===0)
		  return res.send(JSON.stringify({}));
		return res.send(JSON.stringify(docs[0]));
	});
    }
    else if(q.experiment === "xenon1t"){
	var collection = db.get(process.env.RUNS_MONGO_COLLECTION_1T);
	collection.find({"number": num}, function(e, docs){
	    if(docs.length ===0)
		return res.send(JSON.stringify({}));
	    return res.send(JSON.stringify(docs[0]));
	});
    }
});
router.post('/addtags', ensureAuthenticated, function(req, res){
    var db = req.runs_db;
    var collection = db.get(process.env.RUNS_MONGO_COLLECTION);

    var runs = req.body.runs;
    var tag = req.body.tag;
    var user = req.user.last_name;

    // Convert runs to int
    runsint = [];
    for(var i=0; i<runs.length; i+=1)
	runsint.push(parseInt(runs[i], 10));
    console.log(runsint);
    // Update many
    collection.update({"number": {"$in": runsint}},
		      {"$push": {"tags": {"date": new Date(), "user": user,
					  "name": tag}}},
		      {multi:true}, function(){
			  return res.sendStatus(200);
		      });

});

router.post('/removetag', ensureAuthenticated, function(req, res){
    var db = req.runs_db;
    var collection = db.get(process.env.RUNS_MONGO_COLLECTION);

    var run = req.body.run;
    var tag = req.body.tag;
    var user = req.user.last_name;

    // Convert runs to int
    runint = parseInt(run);
    // Update one
    collection.update({"number": runint},
		      {"$pull": {"tags": {"name": tag, "user": user}}},
		      {multi:false}, function(){
			  return res.sendStatus(200);
		      });
});


router.post('/addcomment', ensureAuthenticated, function(req, res){
    var db = req.runs_db;
    var collection = db.get(process.env.RUNS_MONGO_COLLECTION);

    var runs = req.body.runs;
    var comment = req.body.comment;
    var user = req.user.last_name;

    // Convert runs to int
    var runsint = [];
    for(var i=0; i<runs.length; i+=1)
	  runsint.push(parseInt(runs[i], 10));
    //console.log(runsint);
    // Update many
    collection.update({"number": {"$in": runsint}},
		      {"$push": {"comments": {"date": new Date(), "user": user,
					  "comment": comment}}},
		      {multi:true}, function(){
			  return res.sendStatus(200);
		      });

});

router.get('/runsfractions', ensureAuthenticated, function(req, res){
    var db = req.runs_db;
    var collection = db.get(process.env.RUNS_MONGO_COLLECTION);
    var q = url.parse(req.url, true).query;
    var days = q.days;
    if( typeof days === 'undefined')
	days = 30;
    
    var querydays = new Date(new Date() - days*24*3600*1000);
    collection.find({"start": {"$gt": querydays}},
		    function(e, docs){
			ret = {};
			for(var i in docs){
			    if(!(docs[i]['mode'] in ret))
				ret[docs[i]['mode']] = 0;
			    if(!('end' in docs[i]) || !('start' in docs[i]))
				continue; // still running or crashed
			    ret[docs[i]['mode']] += (docs[i]['end'].getTime()-
						     docs[i]['start'].getTime())/1000;
			}
			return res.send(JSON.stringify(ret));
		    });
    
    
});

module.exports = router;
