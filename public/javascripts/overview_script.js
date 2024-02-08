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

