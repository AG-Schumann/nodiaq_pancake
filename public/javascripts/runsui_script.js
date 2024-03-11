const SCRIPT_VERSION = '20211103';
var table;

function SearchTag(name){
  $("#mongoquery").val(`{"tags.name": "${name}"}`);
  UpdateRunsTable();
}

function VerifyMongoQuery() {
  var query = $("#mongoquery").val();
  if (query === "")
    query = "{}";
  try {
    JSON.parse(query);
  } catch (e) {
    alert("Your mongo query is not valid JSON! Maybe you used \'\' instead of \"\"?");
    return false;
  }
  return true;
}

var detailButton = function(cell) {
  let data = cell.getRow().getData();
  return `<button style='padding:3px 5px;background-color:#ef476f;color:#eee' class='btn btn-default btn-sm' onclick='ShowDetail(${data.run_id}, "${data.mode}")'>show</button>`;
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

var getTags = function(cell) {
  var ret = '';
  var tags = cell.getValue();
  if(typeof(tags) != "undefined"){
    ret = tags.reduce((tot, tag) => {
      var divclass = "bg-" + (tag["name"][0] === "_" ? "primary" : "secondary");
      var html = `<div class='inline-block mx-1'><span class='badge ${divclass}' style='cursor:pointer' onclick='SearchTag("${tag.name}")'>${tag.name}</span></div>`;
      return tot + html;
    }, "");
  }
  return ret;
}

var getNewestComment = function(cell) {
  var ret = '';
  var comments = cell.getValue();
  if (typeof(comments) != "undefined" && comments.length>0) {
    ret += comments[comments.length - 1]["comment"];
    if (comments.length > 1) {
      ret += ` + ${comments.length - 1} additonal comment`;
      (comments.length > 2) && (ret += 's');
    }
  }
  return ret;
}

function InitializeRunsTable() {
  Tabulator.prototype.defaultOptions.cellVertAlign = "middle";
  Tabulator.prototype.defaultOptions.cellHozAlign = "center";
  Tabulator.prototype.defaultOptions.headerHozAlign = "center";
  table = new Tabulator('#runs_table', {
    height: '100%',
    layout: "fitColumns",
    //frozenRows: 1,
    pagination: "local",
    paginationSize: 24,
    columns: [
      {title: 'Detail', formatter: detailButton, width: 80, resizable: false, headerSort:false},
      {title: 'Run ID', field: 'run_id', width:100},
      {title: 'Mode', field: 'mode'},
      {title: 'User', field: 'user'},
      {title: 'Start (UTC)', field: 'start', width: 210, resizable: false},
      {title: 'Length', field: "end", formatter: getRunLength, width: 85, resizable: false, headerSort:false},
      {title: 'Tags', field: "tags", formatter: getTags, headerSort:false},
      {title: 'Newest Comment', field: "comments", formatter: getNewestComment, headerSort:false}
    ]
  });
  table.setSort([
    {column: "start", dir: "desc"},
  ]);
  $('#datepicker_from').change(function () {
    UpdateRunsTable();
  });
  $('#datepicker_to').change(function () {
    UpdateRunsTable();
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
            UpdateRunsTable();
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

function AddTag() {
  var tag = $("#newtag").val();
  if (!tag || tag.trim() === '') {
    alert('Please specify a tag');
  } else if (tag.includes(' ')) {
    alert('Tags cannot include spaces');
  } else {
    $.getJSON(`runsui/get_runs_table?conditions={"tags.name":"${tag}"}`, (doc) => {
      if (doc.length === 0) {
        if (!confirm(`This tag hasn't been used before. Are you sure you want to proceed?`)) {
          return;
        }
      }
      if (tag === 'flash') document.getElementById("flash_whoa").play();
      var run = ($("#detail_Number").html());
      var mode = ($("#detail_Mode").html());
      if (run && mode) {
        {
          $.ajax({
            type: "POST",
            url: "runsui/addtag",
            data: {"version": SCRIPT_VERSION, "runid": run, "mode": mode, "tag": tag, "user": "web user"},
            success: (data) => {
              if (typeof data.err != 'undefined') alert(data.err);
              UpdateRunsTable();
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
  }
}

function UpdateRunsTable() {
  var from = $('#datepicker_from').val();
  var to = $('#datepicker_to').val();
  var query = $("#mongoquery").val();
  var conds = '';
  if (from !== '')
    conds.length ? conds += `&date_min=${from}` : conds += `?date_min=${from}`;
  if (to !== '')
    conds.length ? conds += `&date_max=${to}` : conds += `?date_max=${to}`;
  if (query !== '') {
    if (VerifyMongoQuery(query))
      conds.length ? conds += `&conditions=${query}` : conds += `?conditions=${query}`;
  }
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
    success: function(data){ if (typeof data.err != 'undefined') alert(data.err); UpdateRunsTable(); ShowDetail(run, mode);},
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
    $("#runsModal").modal('show');
  });

}

