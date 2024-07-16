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

function FillDAQStatusInfo(){
  $.getJSON("status/get_daq_status", function(data){
      if($("#status").length){
        $("#daqgoal").html(data['goal']);
        $("#daqmsg").html(data['msg']);
        $("#daqstatus").html(data['status']);
      }
//    }).fail(function(jqXHR, textStatus, errorThrown) {
//      console.log("Error fetching DAQ status: " + textStatus);
    });
}

function FillStatusInfo(){
  var req1 = $.getJSON("status/get_daq_status");
  var req2 = $.getJSON("status/get_dispatcher_status");
  var req3 = $.getJSON("status/get_straxinator_status");
  $.when(req1,req2,req3).done(function(res1,res2,res3) {
    var data1 = res1[0];
    var data2 = res2[0];
    var data3 = res3[0];
    $("#daqgoal").html(data1['goal']);
    $("#daqmsg").html(data1['msg']);
    $("#daqstatus").html(data1['status']);
    $("#spatchgoal").html(data2['goal']);
    $("#spatchmsg").html(data2['msg']);
    $("#spatchstatus").html(data2['status']);
    $("#straxgoal").html(data3['goal']);
    $("#straxmsg").html(data3['msg']);
    $("#straxstatus").html(data3['status']);
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
