var statii = ["IDLE", "ARMING", "ARMED", "RUNNING", "ERROR", "UNKNOWN"];
var detectors = {};

function FillDetectorInfo(){
  $.getJSON("status/get_detector_status", function(data){
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