const SCRIPT_VERSION = '20211103';
var table;

function SearchTag(name){
  $("#mongoquery").val(`{"tags.name": "${name}"}`);
  CheckMongoQuery();
}

function CheckMongoQuery(){
  var query = $("#mongoquery").val();
  if(query === "")
    query = "{}";
  try{JSON.parse(query);}
  catch(e){
    alert("Your mongo query is not valid JSON!");
    return;
  }
  document.datatable_options['ajax']['data'] = {"conditions": query};
  $(document.datatable_div).DataTable().destroy();
  $(document.datatable_div).DataTable(document.datatable_options);
}

var detailButton = function(cell) {
  let data = cell.getRow().getData();
  return `<button style='padding:3px 5px;background-color:#ef476f;color:#eee' class='btn btn-defailt btn-xs' onclick='ShowDetail(${data.run_id}, "${data.mode}")'>show</button>`;
};

var getRunLength = function(cell) {
  let end = cell.getValue();
  let start = cell.getRow().getData().start;
  if(typeof(end) === "undefined" || end === "")
    return "not set"
  let tdiff = (new Date(end)).getTime() - (new Date(start)).getTime();
  var hours = Math.floor(tdiff/(1000*3600));
  var mins = Math.floor(tdiff/(1000*60)) - (60*hours);
  var secs = Math.floor(tdiff/(1000)) - (3600*hours + 60*mins);
  var ret = ("00" + hours.toString()).substr(-2) + ":" +
      ("00" + mins.toString()).substr(-2) + ":" +
      ("00" + secs.toString()).substr(-2);
  return ret;
}

var getTags = function (cell) {
  var ret = '';
  var tags = cell.getValue();
  if(typeof(tags) != "undefined"){
    ret =tags.reduce((tot, tag) => {
      var divclass = "badge-" + (tag["name"][0] === "_" ? "primary" : "secondary");
      var html = `<div class='inline-block mx-1'><span class='badge ${divclass}' style='cursor:pointer' onclick='SearchTag("${tag.name}")'>${tag.name}</span></div>`;
      return tot + html;
    }, "");
  }
  return ret;
}

function InitializeRunsTable() {
  table = new Tabulator('#runs_table', {
    layout: "fitColumns",
    pagination: "local",
    paginationSize: 24, // magic number based on my screen size
    columns:
        [
          {
            title: "Detail",
            width: 70,
            formatter: detailButton,
            vertAlign: "middle",
            hozAlign: "center",
            headerHozAlign: "center",
            headerSort: false
          },
          {
            title: "Run ID",
            width: 90,
            field: "run_id",
            sorter: "number",
            vertAlign: "middle",
            headerHozAlign: "center",
            hozAlign: "right"
          },
          {title: "Mode", field: "mode", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center"},
          {title: "User", field: "user", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center"},
          {title: 'Start (UTC)', field: "start", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center"},
          {
            title: 'Length',
            width: 90,
            field: "end",
            formatter: getRunLength,
            vertAlign: "middle",
            hozAlign: "center",
            headerHozAlign: "center"
          },
          {
            title: 'Tags',
            field: 'tags',
            formatter: getTags,
            vertAlign: "middle",
            hozAlign: "center",
            headerHozAlign: "center"
          },
          {title: 'Newest Comment', field: 'comment', vertAlign: "middle", hozAlign: "center", headerHozAlign: "center"}
        ],
  });
  table.setSort([
    {column: "start", dir: "desc"},
  ]);
  $('#datepicker_from').change(function () {
    UpdateRunsTable($('#datepicker_from').val(), $('#datepicker_to').val());
  });
  $('#datepicker_to').change(function () {
    UpdateRunsTable($('#datepicker_from').val(), $('#datepicker_to').val());
  });
  $('#add_tag_detail_button').click(function () {
    var tag = $("#newtag").val();
    if (typeof tag === "undefined" || tag == null || tag == '') {
      alert('Please specify a tag');
    } else if (tag.includes(' ')) {
      alert('Tags cannot include spaces');
    } else {
      if (tag === 'flash') document.getElementById("flash_whoa").play();
      var run = ($("#detail_Number").html());
      var mode = ($("#detail_Mode").html());
      if (typeof run !== "undefined" && typeof mode !== "undefined") {
        $.ajax({
          type: "POST",
          url: "runsui/addtag",
          data: {"version": SCRIPT_VERSION, "runid": run, "mode": mode, "tag": tag, "user": "web user"},
          success: (data) => {
            if (typeof data.err != 'undefined') alert(data.err);
            $("#newtag").val("");
            ShowDetail(run, mode);
            table.ajax.reload();
          },
          error: function (jqXHR, textStatus, errorThrown) {
            alert("Error, status = " + textStatus + ", " +
                "error thrown: " + errorThrown
            );
          }
        });
      }
    }
  });
  $('#add_comment_detail_button').click(function () {
    var comment = $("#newcomment").val();
    if (typeof comment === "undefined")
      console.log("No comment!")
    else {
      var run = ($("#detail_Number").html());
      var mode = ($("#detail_Mode").html());
      if (typeof run !== "undefined" && typeof mode !== "undefined") {
        $.ajax({
          type: "POST",
          url: "runsui/addcomment",
          data: {"version": SCRIPT_VERSION, "runid": run, "mode": mode, "comment": comment, "user": "web user"},
          success: (data) => {
            if (typeof data.err != 'undefined') alert(data.err);
            $("#newcomment").val("");
            ShowDetail(run, mode);
            table.ajax.reload();
          },
          error: function (jqXHR, textStatus, errorThrown) {
            alert("Error, status = " + textStatus + ", " +
                "error thrown: " + errorThrown
            );
          }
        });
      }
    }
  });
}

function UpdateRunsTable(from, to, conditions) {
  var conds = '';
  if (from != undefined)
    conds.length ? conds += `&date_min=${from}` : conds += `?date_min=${from}`;
  if (to != undefined)
    conds.length ? conds += `&date_max=${to}` : conds += `?date_max=${to}`;
  if (conditions != undefined)
    conds.length ? conds += `&conditions=${conditions}` : conds += `?conditions=${conditions}`;

  table.setData(`runsui/get_runs_table${conds}`, {limit: '500'});
}

function RemoveTag(run, mode, user, tag){
  // Remove ALL tags with a given text string
  if(typeof run === 'undefined' || typeof mode === 'undefined' || typeof user === 'undefined' || typeof tag === 'undefined')
    return;
  $.ajax({
    type: "POST",
    url: "runsui/removetag",
    data: {"run": run, "mode": mode, "user": user, "tag": tag, version: SCRIPT_VERSION},
    success: function(data){ if (typeof data.err != 'undefined') alert(data.err); ShowDetail(run, mode);},
    error: function(jqXHR, textStatus, errorThrown){
      alert("Error, status = " +textStatus + ", " + "error thrown: " + errorThrown);
    }
  });
}

function ShowDetail(run, mode){
  // people decided that it's a good idea to reuse run_ids. So we select via run_id AND mode and hope that's at least unique.
  $.getJSON(`runsui/get_run_doc?run=${run}&mode=${mode}`, function(data){
    // Set base data
    $("#detail_Number").html(data['run_id']);
    $("#detail_Start").html(moment(data['start']).utc().format('YYYY-MM-DD HH:mm'));
    $("#detail_End").html(data.end == null ? "Not set" : moment(data['end']).utc().format('YYYY-MM-DD HH:mm'));
    $("#detail_User").html(data['user']);
    $("#detail_Mode").html(data['mode']);
    $("#detail_Source").html(data['source']);

    // Tags, if any
    $("#detail_Tags").html(typeof data.tags == 'undefined' ? "" : data['tags'].reduce((total, tag) => {
      var row = `<tr><td>${tag.name}</td>`;
      row += `<td>${tag.user}</td>`;
      row += `<td>${tag.date.substring(0, 16).replace('T', ' ')}</td>`;
      row += `<td><button onclick='RemoveTag("${data.run_id}", "${data.mode}", "${tag.user}", "${tag.name}")' class='btn btn-warning'>Remove tag</button></td></tr>`;
      return total + row;
    }, ""));

    $("#detail_Comments").html(typeof data.comments == 'undefined' ? "" : data['comments'].reduce((total, comment) => {
      var row = `<tr><td>${comment.user}</td>`;
      row += `<td>${comment.comment}</td>`;
      row += `<td>${moment(comment.date).format("YYYY-MM-DD HH:mm")}</td></tr>`;
      return total + row;
    }, ""));
    $("#detail_JSON").JSONView(data, {"collapsed": true});
    $("#runsModal").modal();
  });

}

