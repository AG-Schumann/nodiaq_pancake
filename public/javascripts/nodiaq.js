var statii = ["IDLE", "ARMING", "ARMED", "RUNNING", "ERROR", "UNKNOWN"];
var detectors = {};

function SetDetectors() {
  $.getJSON("template_info", data => {
    data.detectors.forEach(val => {detectors[val[0]] = val[1];});
    DetectorInfoLoop(); // setInterval calls at the end of the loop timer
    setInterval(DetectorInfoLoop, 5000); // and this makes things feel slow
  });
}

function DetectorInfoLoop(){
  for (var key in detectors)
    FillDetectorInfo(key);
}

function FillDetectorInfo(det){
  $.getJSON("status/get_detector_status?detector="+det, function(data){
      if($("#status").length){
        $("#mode").html(data['mode']);
        $("#run_number").html(data['number']);
        $("#status").html(statii[data['status']]);
        $("#rate").html(data['rate'].toFixed(2));
      }
    });
}

function CheckForErrors(){
  $.getJSON("logui/areThereErrors", function(data){
    if(data['error_docs']>0){
      if(!($("#errorbar").hasClass("active")))
        $("#errorbar").addClass("active");
      document.flashDatButton=true;
      $('.main-container').css('height', 'calc(100vh-'+$('#errorbar').height()+'px)');

    }
    else{
      if($("#errorbar").hasClass("active"))
        $("#errorbar").removeClass('active');
      document.flashDatButton=false;
    }
  });
}

function DrawActiveLink(this_page){
  // Make selected Tab active in sidebar
  ["#lindex", "#loptions", "#lruns", "#llog", "#lcontrol"].forEach(page => {
    if (page !== this_page)
      $(page).removeClass('active');
    else
      $(page).addClass('active');
  });
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}