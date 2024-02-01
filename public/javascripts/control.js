var initial_control = {};
const SCRIPT_VERSION = '20210922';

function SetDetectorsLocal() {
    PopulateOptionsLists(PullServerData);
    DefineButtonRules();
}

function DefineButtonRules(){
  $(".det_control").change(function(){
    if(document.page_ready == true) {
      console.log('tere');
      $("#confirm_div").fadeIn("fast");
      CheckLinking();
    }
  });

  $(".det_remote").change(function() {
    if (document.page_ready) {
      document.page_ready = false;
      var det = this.id.substr(0, this.id.length-'_remote'.length);
      if ($(`#${det}_remote`).is(":checked")) {
        $(`#${det}_active`).bootstrapToggle('off');
      }
      SetRemote(det);
      document.page_ready = true;
    }
  });

  $(".det_active").change(function() {
    if (document.page_ready) {
      document.page_ready = false;
      var det = this.id.substr(0, this.id.length-'_active'.length);
      // If we're in remote mode, fail. We shouldn't get here, but still
      if ($(`#${det}_remote`).is(":checked")) {
        alert(`You cannot control the ${det.replace('_',' ')} when it is in remote mode`);
        $(`#${det}_active`).bootstrapToggle('toggle');
      }
      document.page_ready = true;
    }
  });

} // DefineButtonRules

function SetRemote(detector){
  if (detector == 'lz') return;
  var is_remote = $(`#${detector}_remote`).is(":checked");
  ['active', 'softstop', 'stop_after', 'comment', 'mode'].forEach(att => $(`#${detector}_${att}`).prop('disabled', is_remote));
  if (is_remote) {
    $(`#${detector}_active`).bootstrapToggle('off');
  } else {

  }
}

function LinkingLogic(modes, links, active, remote, softstop, stopafter) {
  if (_detectors.length == 0) return [null, null, null, true];
  var ret = [null, null, null, false]; // tpc-mv, tpc-nv, mv-nv, invalid
  // check these combos: tpc-mv, tpc-nv, mv-nv
  for (var i = 0; i < _detectors.length-1; i++) {
    for (var j = i+1; j < _detectors.length; j++) {
      if (links[i].includes(_detectors[j]) || links[j].includes(_detectors[i]))
        ret[3] ||= (modes[i] != modes[j] || active[i] != active[j] || stopafter[i] != stopafter[j] || softstop[i] != softstop[j] || remote[i] || remote[j]);
      ret[i+j-1] = links[i].includes(_detectors[j]) && links[j].includes(_detectors[i]);
    }
  }
  return ret;
}

function CheckLinking() {
  if (_detectors.length == 0) return;
  var modes = _detectors.map(det => $(`#${det}_mode`).val());
  var links = _detectors.map(det => $(`#${det}_mode :selected`).attr("link_type").split(","));
  var active = _detectors.map(det => $(`#${det}_active`).is(":checked"));
  var remote = _detectors.map(det => $(`#${det}_remote`).is(":checked"));
  var softstop = _detectors.map(det => $(`#${det}_softstop`).is(":checked"));
  var stopafter = _detectors.map(det => $(`#${det}_stop_after`).val());

  var ret = LinkingLogic(modes, links, active, remote, softstop, stopafter);
  var case_e = ret[0] == false && ret[1] == false && ret[2] == true;

  var html = "";
  if (!case_e) {
    var mv = ret[0] ? "" : "un";
    var nv = ret[1] ? "" : "un";
    html = `MV <i class="fas fa-${mv}link"></i> TPC <i class="fas fa-${nv}link"></i> NV`;
  } else {
    html = `TPC <i class="fas fa-unlink"></i> NV <i class="fas fa-link"></i> MV`;
  }
  var modes_init = _detectors.map(det => initial_control[det].mode);
  var active_init = _detectors.map(det => initial_control[det].active);
  var remote_init = _detectors.map(det => initial_control[det].remote);
  var softstop_init = _detectors.map(det => initial_control[det].softstop);
  var stopafter_init = _detectors.map(det => initial_control[det].stop_after);
  var links_init = _detectors.map(det => $(`#${det}_mode option`).filter(function() {return this.value === initial_control[det].mode;}).attr("link_type").split(','));
  var ret_init = LinkingLogic(modes_init, links_init, active_init, remote_init, softstop_init, stopafter_init);
  var is_idle = _detectors.map(det => $(`#${det}_status_icon`).attr('title').includes('IDLE'));
  console.log(ret);
  console.log(ret_init);
  console.log(is_idle);
  for (var i = 0; i < _detectors.length-1; i++) {
    for (var j = i+1; j < _detectors.length; j++) {
      if ((ret[i+j-1] ^ ret_init[i+j-1]) && !is_idle[i] && !is_idle[j]) {
        // transitioning between linked and unlinked when the relevant detectors aren't idle
        ret[3] = true;
      }
    }
  }
  $("#linking_span").html(html);
  $("#linking_span").css("color", ret[3] ? "red" : "black");
  $("#submit_changes").prop("disabled", ret[3]);
  $("#submit_changes").text(ret[3] ? "Invalid combination" : "Submit");
}

function PopulateOptionsLists(callback){
  $("#lz_remote").bootstrapToggle('on');
  $("#lz_softstop").bootstrapToggle('off');
  $("#lz_mode").html("<option value='shit'><strong>xenon leak mode</strong></option><option value='goblind'><strong>HV spark mode</strong></option><option value='oops'><strong>find dark matter but it turns out not to be dark matter mode</strong></option><option value='n'><strong>Only measure neutrons because of all our teflon mode</strong></option><option value='blow'><strong>Lots of radon mode (note, this mode cannot be turned off)</strong></option><option value='whoops'>Don't drift electrons because all the teflon outgasses too much mode</option>");
  $.getJSON("control/modes", (data) => {
    if (typeof data.error != 'undefined') {
      console.log(data);
      return;
    }
    // [{_id: detector name, configs: []}, {_id: detector name....}]
    data.forEach(doc => {
      $("#"+doc['_id']+"_mode").html(doc['configs'].reduce((html, val) => html+`<option value='${val[0]}' link_type='${val[2].join()}'><strong>${val[0]}:</strong> ${val[1]}</option>`, ""));
    });
    callback();
  });
}

function PullServerData(){
  var ready = 0;
  document.page_ready = false;
  _detectors.forEach(det => {
    $.getJSON("control/get_control_doc?detector="+det, function(doc){
      var detector = doc['detector'];
      if(typeof detector == 'undefined' || !_detectors.includes(detector)){
        return;
      }
      initial_control[detector] = doc;
      ["stop_after", "comment"].forEach( (att) => $(`#${detector}_${att}`).val(doc[att]));

      $(`#${detector}_mode option`).filter(function() {return this.value===doc.mode;}).prop('selected', true);
      $(`#${detector}_user`).val(doc.user);

      ['active', 'remote', 'softstop'].forEach(att => $(`#${detector}_${att}`).bootstrapToggle(doc[att] == 'true' ? 'on' : 'off'));

      SetRemote(detector);
      ready++;
      document.page_ready = ready >= _detectors.length;
    }); // getJSON
  }); // forEach
  // select a random LZ mode for fun
  var lz = $("#lz_mode option");
  var n = Math.floor(Math.random()*lz.length);
  lz.filter((i, val) => i==n).prop("selected", true);
}

function PostServerData(){

  // TODO: make this only one detector? Do we need the remote vs. local distinction?
  post = {'version': SCRIPT_VERSION};
  var empty = true;
  _detectors.forEach(detector => {
    var thisdet = {};
    if ($(`#${detector}_remote`).is(":checked")) {
      if (initial_control[detector]['remote'] == 'false') {
        thisdet['remote'] = 'true';
        thisdet['active'] = 'false';
      }
    } else {
      ['active', 'remote', 'softstop'].forEach( (att) => {
        var checked = $(`#${detector}_${att}`).is(":checked").toString();
        if (checked != initial_control[detector][att])
          thisdet[att] = checked;
      });

      ["stop_after", "mode", "comment"].forEach( (att) => {
        var val = $(`#${detector}_${att}`).val();
        if (val != initial_control[detector][att])
          thisdet[att] = val;
      });

    }
    if (Object.keys(thisdet).length == 0)
      return;
    post[detector] = thisdet;
    empty &&= false;
  });
  if (!empty) {
    $.ajax({
      type: "POST",
      url: "control/set_control_docs",
      data: {"data": post},
      success: (data) => {
        if (typeof data.err != 'undefined')
          alert(data.err);
        location.reload();},
      error: function(jqXHR, textStatus, errorThrown) {
        alert("Error, status = " + textStatus + ", " + "error thrown: " + errorThrown);
      }
    });
  }
}
