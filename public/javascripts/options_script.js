// public/javascripts/options_script.js
var detectors_local = {};
const SCRIPT_VERSION = '20210622';


function PopulateModeList(){
  $.getJSON("options/options_list", function(run_modes){
    $.each(run_modes, function(index, run_mode){
      $("#run_mode_select").append(`<option value="${run_mode}">${run_mode}</option>`);
    });
    $("#run_mode_select").prop('disabled', false);
  });
}

function FetchMode(select_div){
  mode = $('#'+select_div).val();
  $.getJSON('options/options_json?name='+mode, function(data){
    document.jsoneditor.set(data);
  });
}

function SubmitMode(){
  try{JSON.parse(JSON.stringify(document.jsoneditor.get()));}
  catch(error){alert(error);return}
  $.post("options/set_run_mode", {"doc": JSON.stringify(document.jsoneditor.get()), "version": SCRIPT_VERSION}, function(data){
    if (typeof data.res != 'undefined')
      alert(data.res);
    else
      location.reload();
  });
};

function RemoveMode(select_div){
  $.get("options/remove_run_mode?name="+$("#"+select_div).val(), function(data){
    if (typeof data.res != 'undefined')
      alert(data.res);
    else
      location.reload();
  });
}

