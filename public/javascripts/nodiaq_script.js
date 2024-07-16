var statii = ["IDLE", "ARMING", "ARMED", "RUNNING", "ERROR", "UNKNOWN"];

function FillDetectorInfo(){
  $.getJSON("status/get_detector_status", function(data){
      if($("#status").length){
        $("#mode").html(data['run_mode']);
        $("#run_number").html(data['current_run_id']);
        $("#status").html(statii[data['status']]);
        $("#rate").html(data['rate'].toFixed(2));
      }
    });
}

function FillStatusInfo() {
  $.getJSON("status/get_status", function(data) {
    if ($("#daqstatus").length) {
      $("#daqstatus").html(data['daqstatus']);
      $("#daqmsg").html(data['daqmsg']);
      $("#spatchstatus").html(data['spatchstatus']);
      $("#daqworklist").html(data['daqworklist']);
      $("#spatchmsg").html(data['spatchmsg']);
      $("#runprogress").html(data['runprogress']);
      $("#run_duration").html(data['run_duration']);
      $("#straxstatus").html(data['straxstatus']);
      $("#straxmsg").html(data['straxmsg']);
      $("#ledstatus").html(data['ledstatus']);
      // Add any other fields as necessary
    }
  }).fail(function(jqXHR, textStatus, errorThrown) {
    console.log("Error fetching status: " + textStatus);
  });
}

function CheckForErrors(){
  $.getJSON("logui/areThereErrors", function(data){
    if(data['error_docs']>0){
      if(!($("#errorbar").hasClass("active")))
        $("#errorbar").addClass("active");
        let height = $('#errorbar').height() + 10;
      $('.main-container').css('height', 'calc(100vh - ' + height + 'px)');
      //$('.main-container').css('height', 'calc(100vh - 100px)');

    }
    else{
      if($("#errorbar").hasClass("active"))
        $("#errorbar").removeClass('active');
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
