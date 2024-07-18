var initial_control = {};
const SCRIPT_VERSION = '20210922';

function PopulateOptionsLists(callback){
  $.getJSON("control/modes", (data) => {
    if (typeof data.error != 'undefined') {
      console.log(data);
      return;
    }
    data.forEach(doc => {
      $("#mode").append(`<option value='${doc['name']}'><strong>${doc['name']}:</strong> ${doc['description']}</option>`);
    });
    callback();
  });
}

function PullServerData(){
  $.getJSON("control/get_control_doc", function(doc){
    ["duration", "comment"].forEach( (att) => $(`#${att}`).val(doc[att]));
    $(`#mode option`).filter(function() {return this.value===doc.mode;}).prop('selected', true);
    $(`#user`).val(doc.user);
    ['active', 'softstop'].forEach(att => $(`#${att}`).bootstrapToggle(doc[att] ? 'on' : 'off'));
    document.page_ready = true;
  }); // getJSON
}

function PostServerData(){

  post = {'version': SCRIPT_VERSION};
  var new_doc = {};
  $.getJSON("control/get_control_doc", function(current_doc) {
    ['active', 'softstop'].forEach((att) => {
      var checked = $(`#${att}`).is(":checked");
      if (checked != current_doc[att]) {
        new_doc[att] = checked;
      }
    });
    ["duration", "mode", "comment"].forEach((att) => {
      var val = $(`#${att}`).val();
      if (val != current_doc[att])
        new_doc[att] = val;
    });
    if (Object.keys(new_doc).length == 0)
        return;
      post['doc'] = new_doc;
      $.ajax({
        type: "POST",
        url: "control/set_control_docs",
        data: {"data": post},
        success: (data) => {
          if (typeof data.err != 'undefined')
            alert(data.err);
	  location.reload();
        },
        error: function (jqXHR, textStatus, errorThrown) {
	  alert("Error, status = " + textStatus + ", " + "error thrown: " + errorThrown);
        }
      });
  });
}
