// public/javascripts/options_scripts.js
var detectors_local = {};
const SCRIPT_VERSION = '20210622';


function PopulateModeList(){
  $.getJSON("options/options_list", function(name){
    $("#run_mode_select").append(`<option value=${name}> ${name} </option>`);
    $("#run_mode_select").prop('disabled', false);
    $("#run_mode_select").selectpicker();
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

