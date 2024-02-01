// public/javascripts/status_script.js
var CHECKIN_TIMEOUT=10;
document.ceph_chart = null;
document.last_time_charts = {};
document.reader_data = {};

var readers = [];
var controllers = [];

function RedrawRatePlot(){
  var history = $("#menu_history_s").val();
  var resolution = $("#menu_resolution_s").val();
  document.reader_data = {};
  DrawProgressRate(0);
  var limit = parseInt(history);
  var seen_so_far = 0;
  readers.forEach(reader => {
    $.getJSON("status/get_reader_history?limit="+limit+"&res="+resolution+"&reader="+reader, 
      function(data){
        if (typeof data.err != 'undefined') {
          console.log("Error: " + data.err);
          return;
        }
        for (var key in data) {
          document.reader_data[key] = data[key];
        }
        DrawProgressRate(++seen_so_far/readers.length);
        // we use seen_so_far instead of Object.keys(reader_data) because if get_reader_history returns nothing then
        // reader_data doesn't get longer, so we never reach 100% and the plot never gets drawn
        if(seen_so_far == readers.length){
          DrawInitialRatePlot();
        }
      });
  });
}

function DrawProgressRate(frac){
  var rate_chart = '#rate_chart';
  if(frac == 0){
    $(rate_chart).html('<br><br><br><div class="progress"><div id="PBAR" class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div></div><p class="text-center"><strong>Polling data for chart</strong></p>');
  }
  else if(frac == 1)
    $(rate_chart).html("");
  else{
    prog = Math.floor(100*frac);
    $('#PBAR').css('width', prog+'%').attr('aria-valuenow', prog);
  }
}

function DrawInitialRatePlot(){

  // Convert data dict to highcharts format
  var series = [];
  var yaxis_label = "";
  for(var key in document.reader_data){
    var rates = {};
    if($("#menu_variable_s").val() == "rate") {
      rates = {"type": "line", 
        "name": key+" rate", 
        "data": document.reader_data[key]['rate']};
      yaxis_label = "MB/s";
    } else if($("#menu_variable_s").val() == "buff") {
      rates = {"type": "area", 
        "name": key+" buffer", 
        "data": document.reader_data[key]['buff']};
      yaxis_label = "MB";
    }
    series.push(rates);

  }

  var chart_opts = {
    chart: {
      zoomType: 'xy',
      //            margin: [5, 5, 20, 80],
    },
    plotOptions: {
      series: {
        fillOpacity: 0.3,
        lineWidth: 1
      },
    },
    credits: {
      enabled: false,
    },
    title: {
      text: '',
    },
    xAxis: {
      type: 'datetime',
    },
    yAxis: {
      title: {
        text: yaxis_label,
      },
      min: 0,
    },
    legend: {
      enabled: true,
    },
    series: series,
  };
  var div = 'rate_chart';
  document.RatePlot = Highcharts.chart(div, chart_opts);
}
