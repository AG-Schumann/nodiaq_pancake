function DrawPie(pie_div, ndays){
  $.getJSON("/runsui/runsfractions?days="+ndays, function(data){
    if(typeof(document.piechart) != 'undefined')
      document.piechart.destroy;
    var series = data.map(entry => ({name: entry._id, y: entry.runtime}));
    var tot = data.reduce((total, entry) => total + entry.runtime, 0);
    series.push({"name" : "idle", "y" : 1.0-tot});
    document.piechart = Highcharts.chart(pie_div, {
      chart: {
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false,
        type: 'pie'
      },
      credits: {enabled: false},
      title: {text: null},
      tooltip: {
        pointFormat: '{series.name}: <b>{point.percentage:.2f}%</b>'
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b>: {point.percentage:.2f} %',
            style: {
              color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
            }
          }
        }
      },
      series: [{
        name: 'Modes',
        colorByPoint: true,
        data: series,
      }]
    }); // Highcharts.chart
  }); // getJSON
}

function DrawStatusPlot(){
  var history = $("#menu_status_history_s").val();
  var resolution = $("#menu_status_resolution_s").val();
  var limit = parseInt(history);
  $.getJSON("status/get_reader_history?limit="+limit+"&res="+resolution, function(data){
    if (typeof data.err != 'undefined') {
      console.log("Error: " + data.err);
      return;
    }
    var series = [];
    var yaxis_label = "State";
    for (var key in data) {
      var statuses = {
        "type": "line",
        "name": key+" status",
        "data": data[key]['status']};
      series.push(statuses);
    }
    var chart_opts2 = {
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
    document.StatusPlot = Highcharts.chart('status_chart', chart_opts2);
  });
}


function DrawRatePlot(){
  var history = $("#menu_rate_history_s").val();
  var resolution = $("#menu_rate_resolution_s").val();
  var limit = parseInt(history);
  $.getJSON("status/get_reader_history?limit="+limit+"&res="+resolution, function(data){
    if (typeof data.err != 'undefined') {
      console.log("Error: " + data.err);
      return;
    }
    var series = [];
    var yaxis_label = "MB/s";
    for (var key in data) {
      var rates = {
        "type": "line",
        "name": key+" rate",
        "data": data[key]['rate']};
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
    document.RatePlot = Highcharts.chart('rate_chart', chart_opts);
  });
}