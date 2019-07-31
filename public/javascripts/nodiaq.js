var gp = "";

function FYouButton(buttonid){
    $("#"+buttonid).mouseover(function(){
        var t = ($(window).height()-80)*Math.random() + 80;
        var l = ($(window).width()-40)*Math.random();
        console.log(t);
        $("#"+buttonid).css({'z-index': 10, //'height': '31px',
                             'top': t, 'left': l, 'position':'absolute'});

        var rand = Math.random() * 30;
        if(rand<1){
            var ahahah = document.getElementById("ahahah");
            ahahah.pause();
            ahahah.currentTime = 0;
            ahahah.play();
        }

    });
}

var statii = ["IDLE", "ARMING", "ARMED", "RUNNING", "ERROR", "UNKNOWN"];

function DetectorInfoLoop(){
    FillDetectorInfo('tpc');
    FillDetectorInfo('muon_veto');
    FillDetectorInfo('neutron_veto');
    setTimeout(DetectorInfoLoop, 10000);
}

function FillDetectorInfo(det){
    $.getJSON("status/get_detector_status?detector="+det,
	      function(data){
		  document.getElementById(det+"_status").innerHTML = statii[data['status']];
		  document.getElementById(det+"_mode").innerHTML = data['mode'];
		  document.getElementById(det+"_run").innerHTML = data['number'];
		  document.getElementById(det+"_rate").innerHTML = data['rate'].toFixed(2);
		  document.getElementById(det+"_readers").innerHTML = data['readers'];
	      });
}

function CheckForErrors(){
	$.getJSON("logui/areThereErrors", 
		  function(data){
		      if(data['error_docs']>0){
			  if(!($("#errorbar").hasClass("active")))
			      $("#errorbar").addClass("active");
			  document.flashDatButton=true;
			  
			  // Disable start run button if there are errors
			  if(document.getElementById("submit_changes")!=null 
			     && !($("#submit_changes").hasClass("FYOU"))){
			      FYouButton('submit_changes');
			      $("#submit_changes").addClass("FYOU");
			  }
		      }
		      else{
			  if($("#errorbar").hasClass("active"))
			      $("#errorbar").removeClass('active');
			  document.flashDatButton=false;
			  
			  // Re-enable button that would let you start a run
			  if($("#submit_changes").hasClass("FYOU")){
			      $("#submit_changes").unbind("mouseover");
			      $("#submit_changes").removeClass("FYOU");
			  }
		      }
		      setTimeout(CheckForErrors, 5000);
		  });
}
function DrawActiveLink(page){
    var pages = [
	"#lindex", "#lplaylist", "#lstatus", "#lhosts", "#loptions", "#lruns",
	"#llog", "#lusers", "#lhelp", "#laccount", "#lcontrol", "#lshifts", "#lmonitor"
    ];
    for(var i in pages){
    	console.log(pages[i]);
		if(pages[i] !== page)
	    	$(pages[i]).removeClass("active");
		else
	    	$(pages[i]).addClass("active");
    }
}


function hexToRgb(hex) {                                                                        
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
function SetNavbar(fc){
    console.log(fc);
    var hcol = hexToRgb(fc);
    console.log(hcol);
    if(hcol!=null){
      complement = "#eeeeee";
      if((hcol['r']+hcol['g']+hcol['b'])/3 > 128)
         complement="#333333";
    $("#sidebar").css("cssText", "background-color: " + fc +
		 "!important;color:"+complement+" !important");
		$(".colored").css("cssText", "background-color: " + fc +
			 "!important;color:"+complement+" !important");
			 $(".anticolored").css("cssText", "background-color: " + complement +
			 "!important");
	//$("#navbar > .navbar-brand").css("cssText", "color: "+ complement+ "!important");
	//$(".nav-item > a").css("cssText", "color:"+complement+"!important");
    }
}
