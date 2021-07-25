
// initialize variables
var cable_map = false
var board_map = false
var pmt_dict_lookup = {}
var pmt_dict = {}
var board_dict = {}
var svgObject0 = false
var svgObject1 = false
const svgns = "http://www.w3.org/2000/svg"
var links_set = new Set()
var amp_lookup = {}
var reader_list = ['reader0_reader_0', 'reader1_reader_0', 'reader2_reader_0'];
var pmt_rates = {}
var update_times = {}
var optical_links_zero = {"-1":0}
var pmts_per_detector = {}
var pmts_per_detector_rates = {}
var pmts_list_per_detector_template = {}
var pmts_list_per_detector_dynamic
var opt_link_rates = {}
var rates_meta

var timer
var timer_ini

var rate_total
var rate_min
var rate_max
var rate_zero
var rate_off
var pmts_to_ignore_for_rate = []

var legend_rate_min = 1
var legend_rate_max = 101
var legend_rate_diff = 100

var fading_rate = .20




// developer toggles
var dev_show_timings = false


const default_pos = {
    "init": [-20, -20],
    "tpc":  [-20, -20],
    "he":   [-20, -20],
    "vme":  [-20, -20],
    "amp":  [-20, -20],
    "opt":  [-20, -20],
    "off":  [-20, -20]
}



// some geometrie properties
// vme
layout_global = {
    "height_offset": 15
}

const default_pmt_size = 5
layout_style = {
    "numeric":
    {
        "x0": 20,
        "y0": 35,
        "width": 360,
        "height": 200,
        "d_width": 0,
        "d_height": 10,
        "pmt_size": 5
    },    
    "vme":
    {
        "x0": 0,
        "y0": 35,
        "width": 100,
        "pmt_size": 2.4,
        "height": 55,
        "d_width": 0,
        "d_height": 10,
        "order":
        {
            0:[0,0],
            1:[1,0],
            2:[2,0],
            3:[2,1],
            4:[3,0],
            // 5:[1,2],
            // 6:[2,2]
            
        }
    },
    "opt":
    {
        "x0": 5,
        "y0": 35,
        "width": 56,
        "pmt_size": 3.5,
        "height": 70,
        "d_width": 10,
        "d_height": 10
    },
    "amp":
    {
        "x0": 0,
        "y0": 70,
        "width": 100,
        "pmt_size": 4.1,
        "height": 160,
        "d_width": 0,
        "d_height": 10,
        "order":
        {
            0:[3,0],
            1:[2,0],
            2:[1,0],
            3:[0,0]
        }
    }    
}

const dict_color_scheme = {
        0:   [12, 17, 120],
        500: [23, 162, 184],
        900: [6, 214, 160],
        950: [211, 158, 0],
        1000: [189, 33, 48]
}

var color_threshholds = Object.keys(dict_color_scheme)



function make_rgb_string_from_list(list){
    return("rgb("+list[0].toFixed(3)+","+list[1].toFixed(3)+","+list[2].toFixed(3)+")")
    
}

var lut_colors = []
// using a look up table instead of a formula (might be much quicker)
for(var permil = 0; permil <= 1000; permil++){
    var color = []
    
    if(color_threshholds.includes(""+permil)){
        color = dict_color_scheme[permil]
        
        low = ""+permil
        high = color_threshholds[color_threshholds.indexOf(""+permil)+1]
        color_low = dict_color_scheme[permil]
        color_high = dict_color_scheme[high]
        diff_range = high - low
    }else{
        ratio_high  = (permil - low)/diff_range
        ration_low = 1-ratio_high
        
        color = [
            color_low[0]*ration_low + color_high[0]*ratio_high, 
            color_low[1]*ration_low + color_high[1]*ratio_high, 
            color_low[2]*ration_low + color_high[2]*ratio_high
        ]
    }
    
    lut_colors[permil] = make_rgb_string_from_list(color)
}


function status_bar(string_text, color = false, stroke = false){
    svgObject0.getElementById("str_status_bar").textContent = string_text
    if(color == false){
        svgObject0.getElementById("str_status_bar").style.fill = "black"
    } else {
        svgObject0.getElementById("str_status_bar").style.fill = color
    }
    if(stroke == false){
        svgObject0.getElementById("str_status_bar").style.stroke = ""
    } else {
        svgObject0.getElementById("str_status_bar").style.stroke = color
    }
}

function caclulate_board_base_pos(board, layout){
    try{
        var x = 500;
        var y = 500;
        layout_dict = layout_style[layout]
        if(!("pmt_size" in layout_dict)){
            layout_dict["pmt_size"] = default_pmt_size
        }
        
        switch(layout){
            case "vme":
                grid_pos = layout_dict["order"][board["crate"]]
                slot = board["slot"]
                break;
                
                
            case("opt"):
                grid_pos = [board["link"], parseInt(board["host"].slice(-1))]
                slot = board["opt_bd"]
            break;
            
        }
        if(slot >= 0){
            x = layout_dict["x0"] + 
                grid_pos[0] * (layout_dict["width"]+layout_dict["d_width"]) +
                slot * layout_dict["pmt_size"]*2
                + layout_dict["pmt_size"]
            y = layout_dict["y0"] + layout_dict["d_height"] +
                layout_dict["pmt_size"] +
                grid_pos[1] * (layout_dict["height"] + layout_dict["d_height"])
        }
        return([x,y])
    }catch(error){
        return([500,500])
    }
}





// having a dedicated ditionary should be faster than if statements
// TODO: turn this into const
const pmt_tpc_scaling_factor = 1.3
const pmt_mv_scaling_factor = 1
var array_pos = {
    "top": function(x, y){return([100+x*pmt_tpc_scaling_factor, 145-y*pmt_tpc_scaling_factor])},
    "bottom": function(x, y){return([300+x*pmt_tpc_scaling_factor, 145-y*pmt_tpc_scaling_factor])},
    "he": function(x, y){return([200+x*pmt_tpc_scaling_factor, 145-y*pmt_tpc_scaling_factor])}
}


// functions that translates the pmt coordinates into svg coorinates
function tpc_pos(array, coords){
    try{
        x = coords["pmt"][0]
        y = coords["pmt"][1]
    } catch(error) {
        try{
            x = coords[0]
            y = coords[1]
        } catch(error) {
            return(-1)
        }
    }
    try{
        return(array_pos[array](x,y))
    } catch(error) {
        return(-1)
    }
}



function switch_layout(layout){
    if(!(layout in default_pos)){
        return(0)
    }
    
    try{
        pmt_size = layout_style[layout]["pmt_size"]
    }catch(error){
        var pmt_size = default_pmt_size
    }
    
    if(pmt_size < 4){
        var font_size = 4*pmt_size/5
    }else{
        var font_size = 4
    }
    // move pmts around
    for(pmt_ch in pmt_dict){
        pmtpos = pmt_dict[pmt_ch]["pos"][layout]
        
        
        
        var obj_pmt_circ = svgObject1.getElementById("pmt_circle_"+pmt_ch)
        obj_pmt_circ.setAttribute("cx", pmtpos[0]);
        obj_pmt_circ.setAttribute("cy", pmtpos[1]);
        obj_pmt_circ.setAttribute("r", pmt_size);
        
        
        var obj_pmt_text = svgObject1.getElementById("pmt_text_"+pmt_ch)
        obj_pmt_text.setAttribute("x",  pmtpos[0]);
        obj_pmt_text.setAttribute("y",  pmtpos[1]);
        
        obj_pmt_text.style.fontSize = font_size;
        
        
    }
    // hide or show decorative elements
    var decoelements_hide = svgObject1.getElementsByClassName("deco")
    for(var i = 0; i < decoelements_hide.length; i++){
        decoelements_hide[i].style.visibility = "hidden"
    }
    
    var decoelements_show = svgObject1.getElementsByClassName("deco_"+layout)
    for(var i = 0; i < decoelements_show.length; i++){
        decoelements_show[i].style.visibility = "visible"
    }
    
    
    return(1)
}



function initialize_pmts(){
    timer_ini = [new Date]
    // empty all variables just in case
    cable_map = false
    board_map = false
    pmt_dict = {}
    board_dict = {}
    pmt_pos = {}
    amp_lookup = {}
    links_set = new Set()
    
    
    
    
    console.log("loading board_map")
    $.getJSON("monitor/board_map.json",
        function(data){
            board_map = data;
            console.log("board_map loaded")
            build_pmt_layouts()
        }
    )
    
    
    console.log("loading cable_map")
    $.getJSON("monitor/cable_map.json",
        function(data){
            cable_map = data
            console.log("cable_map loaded")
            build_pmt_layouts()
        }
    )
    
    console.log("both loadings initialized")
}

function build_pmt_layouts(){
    
    
    
    
    
    // quit if not everything is loaded
    // returning 0 preventes the need for nested design
    if(cable_map == false || board_map == false){
        console.log("other map still missing")
        return(0)
    }
    timer_ini.push(new Date)
    console.log("both maps exisiting, starting to build map....")
    
    
    svgObject0 = document.getElementById('svg_frame1').contentDocument;
    svgObject1 = document.getElementById('svg_frame1').contentDocument.documentElement;


    //add listerns to svg elements
    svgObject0.getElementById("str_legend_100").addEventListener("click", function(){legend_set(which = "max")});
    svgObject0.getElementById("str_legend_000").addEventListener("click", function(){legend_set(which = "min")});
    
    
    
    
    // building quick lookup dictionaries
    // calulate boards base positions for pmt-coordiantes in different views
    console.log("building board dictionary")
    
    
    for(board of board_map){
        
        board["pos"] = {}
        
        board["pos"] = {
            "vme": caclulate_board_base_pos(board, "vme"),
            "opt": caclulate_board_base_pos(board, "opt")
        }
        links_set.add(board["host"].slice(-1)+"."+board["link"])
        board_dict[board["board"]] = board
    }
    console.log("built")
    
    {// draw all the decorations
    {//VME
    
    layout_dict = layout_style["vme"]
    x0 = layout_dict["x0"]
    y0 = layout_dict["y0"]
    width = layout_dict["width"]
    d_width = layout_dict["d_width"]
    height = layout_dict["height"]
    d_height = layout_dict["d_height"]
    
    for (const [crate, pos] of Object.entries(layout_dict["order"])) {
        
        
        
        var crate_header = document.createElementNS(svgns, 'text');
        crate_header.setAttributeNS(null, 'x', x0 + pos[0]*(width+d_width) + .5 * width);
        crate_header.setAttributeNS(null, 'y', y0 + pos[1]*(height+d_height));
        crate_header.textContent = "VME "+ crate;
        crate_header.setAttributeNS(null, "class", "deco deco_vme infotext");
        
        var crate_rect = document.createElementNS(svgns, 'rect');
        crate_rect.setAttributeNS(null, 'x', x0 + pos[0]*(width+d_width));
        crate_rect.setAttributeNS(null, 'y', y0 + pos[1]*(height+d_height)-d_height/2);
        crate_rect.setAttributeNS(null, 'width', width);
        crate_rect.setAttributeNS(null, 'height', height+d_height/2);
        crate_rect.setAttributeNS(null, "class", "deco deco_vme crate_box");
        
        svgObject1.appendChild(crate_header)
        svgObject1.appendChild(crate_rect)
        
    }
    }
    
    {// Optical links
    layout_dict = layout_style["opt"]
    x0 = layout_dict["x0"]
    y0 = layout_dict["y0"]
    width = layout_dict["width"]
    d_width = layout_dict["d_width"]
    height = layout_dict["height"]
    d_height = layout_dict["d_height"]
    
    
    
    for(let rdr_lnk of links_set.values()){
        optical_links_zero[rdr_lnk] = 0
        pos = rdr_lnk.split(".")
        
        
        var crate_header = document.createElementNS(svgns, 'text');
        crate_header.setAttributeNS(null, 'x', x0 + pos[1]*(width+d_width) + .5 * width);
        crate_header.setAttributeNS(null, 'y', y0 + pos[0]*(height+d_height));
        crate_header.textContent = rdr_lnk;
        crate_header.setAttributeNS(null, "class", "deco deco_opt infotext");
        
        var crate_rect = document.createElementNS(svgns, 'rect');
        crate_rect.setAttributeNS(null, 'x', x0 + pos[1]*(width+d_width));
        crate_rect.setAttributeNS(null, 'y', y0 + pos[0]*(height+d_height)-d_height/2);
        crate_rect.setAttributeNS(null, 'width', width);
        crate_rect.setAttributeNS(null, 'height', height+d_height/2);
        crate_rect.setAttributeNS(null, "class", "deco deco_opt crate_box");
        
        var crate_rect_indocator = document.createElementNS(svgns, 'rect');
        crate_rect_indocator.setAttributeNS(null, 'x', x0 + pos[1]*(width+d_width));
        crate_rect_indocator.setAttributeNS(null, 'y', y0 + pos[0]*(height+d_height)-d_height/2);
        crate_rect_indocator.setAttributeNS(null, 'width', width);
        crate_rect_indocator.setAttributeNS(null, 'height', 10);
        crate_rect_indocator.setAttributeNS(null, "class", "deco deco_opt layout");
        crate_rect_indocator.setAttributeNS(null, "id", "opt_indicator_field_"+rdr_lnk);
        
        var crate_rate_text = document.createElementNS(svgns, 'text');
        crate_rate_text.setAttributeNS(null, 'x', x0 + pos[1]*(width+d_width) + .98 * width);
        crate_rate_text.setAttributeNS(null, 'y', y0 + pos[0]*(height+d_height));
        crate_rate_text.textContent = "0";
        crate_rate_text.setAttributeNS(null, "class", "deco deco_opt text_info_small_right");
        crate_rate_text.setAttributeNS(null, "id", "opt_indicator_text_"+rdr_lnk);
        
        
        svgObject1.appendChild(crate_rect_indocator)
        svgObject1.appendChild(crate_header)
        svgObject1.appendChild(crate_rect)
        svgObject1.appendChild(crate_rate_text)
        
    }
    }
    
    
    {// Amplifiers
    layout_dict = layout_style["amp"]
    x0 = layout_dict["x0"]
    y0 = layout_dict["y0"]
    width = layout_dict["width"]
    d_width = layout_dict["d_width"]
    height = layout_dict["height"]
    d_height = layout_dict["d_height"]
    
    
    
    for(amp in [0,1,2,3]){
        pos = [0, 3-amp]
        amp_x0 = x0 + (pos[1]+1)*(width)
        
        amp_lookup[amp] = amp_x0
        
        
        var crate_header = document.createElementNS(svgns, 'text');
        crate_header.setAttributeNS(null, 'x', x0 + pos[1]*(width+d_width) + .5 * width);
        crate_header.setAttributeNS(null, 'y', y0 + pos[0]*(height+d_height));
        crate_header.textContent = amp;
        crate_header.setAttributeNS(null, "class", "deco deco_amp infotext");
        
        var crate_rect = document.createElementNS(svgns, 'rect');
        crate_rect.setAttributeNS(null, 'x', x0 + pos[1]*(width+d_width));
        crate_rect.setAttributeNS(null, 'y', y0 + pos[0]*(height+d_height)-d_height/2);
        crate_rect.setAttributeNS(null, 'width', width);
        crate_rect.setAttributeNS(null, 'height', height+d_height/2);
        crate_rect.setAttributeNS(null, "class", "deco deco_amp crate_box");
        
        
        
        svgObject1.appendChild(crate_header)
        svgObject1.appendChild(crate_rect)
        
    }    
    }
    
    
    
    } // END of decorations 
    timer_ini.push(new Date)
    
    
    
    // setup all the pmts
    console.log("building pmt dictionary and creating pmts")
    // create dictionary first to access data for position etc during second iteration
    // (he-coordianates)
    for(pmt of cable_map){
        pmt_channel = [pmt["pmt"]]
        pmt_dict_lookup[pmt_channel] = pmt
    }
    
    for(pmt of cable_map){
        // calculate also positions
        pmt_channel = pmt["pmt"]
        pmt_dict[pmt_channel] = pmt
        this_board = board_dict[pmt["adc"]]
        
        // count all pmts per detector to know if some did not send data
        if(pmt["detector"] in pmts_per_detector){
            pmts_per_detector[pmt["detector"]] += 1
            pmts_list_per_detector_template[pmt["detector"]].push(pmt_channel+"")
        }else{
            pmts_per_detector[pmt["detector"]] =1
            pmts_list_per_detector_template[pmt["detector"]] = [pmt_channel+""]
        }
        // just asigning would keep a reference and folloing pmts would use old coordinates....
        pmt["pos"] = {...default_pos}
        

        // TPC low-energy channels
        if(pmt_channel <= 493){
            pmt["pos"]["tpc"] = tpc_pos(pmt["array"], pmt["coords"])
            
            //pos["init"] = pos["tpc"]
            pmt["pos"]["init"] = [10 + (pmt_channel%38*10), 40 + Math.floor(pmt_channel/38)*10]

        // TPC high-energy channels
        }else if (pmt_channel <= 752){
            // use coordinates from top in any case
            pmt["coords"] = pmt_dict_lookup[pmt_channel-500]["coords"]
            pmt["pos"]["he"] = tpc_pos("he", pmt["coords"])
            //pos["init"] = pos["he"]
            pmt["pos"]["init"] = [10 + (pmt_channel%38*10), 40 + Math.floor(pmt_channel/38)*10]

        } else if (pmt_channel <= 999){
            // acq-monitors etc
        }
        
        
        // calculate positions for other views
        try{
            // VME
            pmt["pos"]["vme"] = [...this_board["pos"]["vme"]]
            pmt["pos"]["vme"][1] += pmt["adc_channel"] *2* layout_style["vme"]["pmt_size"]
        } catch(error){
            
        }
        try{
            // OPT
            pmt["pos"]["opt"] = [...this_board["pos"]["opt"]]
            pmt["pos"]["opt"][1] += pmt["adc_channel"] *2* layout_style["opt"]["pmt_size"]
            pmt["opt"] = this_board["host"].slice(-1) + "." + this_board["link"]
        } catch(error){
            pmt["opt"] = "-1"
        }
        try{
            // AMP
            if("amp_crate" in pmt){
                pmt["pos"]["amp"] = [
                        400 -
                        layout_style["amp"]["width"]    * (pmt["amp_crate"])-
                        2 * layout_style["amp"]["pmt_size"] * (pmt["amp_slot"])-
                        layout_style["amp"]["pmt_size"]
                    ,
                        layout_style["amp"]["y0"] +
                        layout_style["amp"]["d_height"] +
                        2 * layout_style["amp"]["pmt_size"] * pmt["amp_channel"]+
                        layout_style["amp"]["pmt_size"]
                        
                ]
            }
        } catch(error){
            
        }
        
            
        
        
        
        // creating all the svg objects
        {
        var pmt_group = document.createElementNS(svgns, 'g');
        
        var pmt_circle = document.createElementNS(svgns, 'circle');
        pmt_circle.setAttributeNS(null, 'cx', pmt["pos"]["init"][0]);
        pmt_circle.setAttributeNS(null, 'cy', pmt["pos"]["init"][1]);
        pmt_circle.setAttributeNS(null, 'r', 5);
        pmt_circle.setAttributeNS(null, 'class', "pmt");
        pmt_circle.setAttributeNS(null, "id", "pmt_circle_"+pmt_channel);
        
        var pmt_text = document.createElementNS(svgns, 'text');
        pmt_text.setAttributeNS(null, 'x', pmt["pos"]["init"][0]);
        pmt_text.setAttributeNS(null, 'y', pmt["pos"]["init"][1]);
        pmt_text.textContent = ""+pmt_channel;
        pmt_text.setAttributeNS(null, "class", "pmt_text pmt_text_info");
        pmt_text.setAttributeNS(null, "id", "pmt_text_"+pmt_channel);
        
        var pmt_channel_text = document.createElementNS(svgns, 'text');
        pmt_channel_text.setAttributeNS(null, 'x', 5);
        pmt_channel_text.setAttributeNS(null, 'y', 285);
        pmt_channel_text.textContent = "PMT "+pmt_channel;
        pmt_channel_text.setAttributeNS(null, "class", "text_info_large hidden");
        
        var pmt_rate_text = document.createElementNS(svgns, 'text');
        pmt_rate_text.setAttributeNS(null, 'x', 5);
        pmt_rate_text.setAttributeNS(null, 'y', 300);
        pmt_rate_text.textContent = " no data yet";
        pmt_rate_text.setAttributeNS(null, "class", "text_info_large hidden");
        pmt_rate_text.setAttributeNS(null, "id", "text_rate_"+pmt_channel);
        
        
        var pmt_info_text1 = document.createElementNS(svgns, 'text');
        pmt_info_text1.setAttributeNS(null, 'x', 100);
        pmt_info_text1.setAttributeNS(null, 'y', 278);
        pmt_info_text1.textContent = "ADC: "+ pmt["adc"];
        pmt_info_text1.setAttributeNS(null, "class", "text_info_small hidden");
        
        var pmt_info_text2 = document.createElementNS(svgns, 'text');
        pmt_info_text2.setAttributeNS(null, 'x', 100);
        pmt_info_text2.setAttributeNS(null, 'y', 286);
        pmt_info_text2.textContent = "OPT: " + this_board["host"].slice(-1) + "." + this_board["link"] + "." + this_board["opt_bd"];
        pmt_info_text2.setAttributeNS(null, "class", "text_info_small hidden");
       
        var pmt_info_text3 = document.createElementNS(svgns, 'text');
        pmt_info_text3.setAttributeNS(null, 'x', 100);
        pmt_info_text3.setAttributeNS(null, 'y', 294);
        pmt_info_text3.textContent = "VME: " + pmt["adc_crate"] + "." + pmt["adc_slot"] + "." + pmt["adc_channel"];
        pmt_info_text3.setAttributeNS(null, "class", "text_info_small hidden");
        
        var pmt_info_text4 = document.createElementNS(svgns, 'text');
        pmt_info_text4.setAttributeNS(null, 'x', 100);
        pmt_info_text4.setAttributeNS(null, 'y', 302);
        pmt_info_text4.textContent = "AMP: " + pmt["amp_crate"] + "." + pmt["amp_slot"] + "." + pmt["amp_channel"];
        pmt_info_text4.setAttributeNS(null, "class", "text_info_small hidden");
        
        
        
        pmt_group.appendChild(pmt_circle);
        pmt_group.appendChild(pmt_text);
        pmt_group.appendChild(pmt_channel_text);
        pmt_group.appendChild(pmt_rate_text);
        pmt_group.appendChild(pmt_info_text1);
        pmt_group.appendChild(pmt_info_text2);
        pmt_group.appendChild(pmt_info_text3);
        pmt_group.appendChild(pmt_info_text4);
        
        svgObject1.appendChild(pmt_group);
        }
    }
    
    
    
    switch_layout("tpc")
    console.log("built")
    
    // setting up some global variables from pmt data
    // for waht ever reason it is written to later......
    for(detector of Object.keys(pmts_per_detector)){
        pmts_per_detector_rates[detector] = {
            "min": Infinity,
            "max": 0,
            "tot": 0,
            "missing": pmts_per_detector[detector],
            "zero": 0
        }
        
    }
    
    
    // set default values to text fields
    $("#field_current_timestamp").val((new Date).toISOString())
    update_pmts_to_ignore_for_rate()
    
    
    switch_layout("tpc")
    timer_ini.push(new Date) // end [5]
    
    timer_ini_string = "everythng setup: db: "+(timer_ini[1]-timer_ini[0]).toFixed(0)+" ms, deco: "+(timer_ini[2]-timer_ini[1]).toFixed(0)+"ms, pmts: "+(timer_ini[3]-timer_ini[2]).toFixed(0)+"ms, all: "+(timer_ini[3]-timer_ini[0]).toFixed(0)+" ms"
    
    console.log(timer_ini_string)
    status_bar(timer_ini_string, color = "green")
    
    console.log(timer_ini)
    
    console.log("load data the first time")
    window.setInterval(
        function(){
            updates_wrapper()
        },
        1001
    )
    console.log("function interval set")
}


function updates_wrapper(){
    var tpc_icon_title  = $("#tpc_status_icon").attr("title")
    var tpc_live_toggle = $("#monitor_live_toggle").is(':checked')
    
    if(tpc_icon_title != "TPC is RUNNING"){
        // do not load if tpc is not running
        status_bar(tpc_icon_title + " ("+(new Date)+")", color = "red")
        return(0)
    }
    if(tpc_live_toggle == false){
        status_bar("")
        return(0)
    }
    timer = [new Date]
    updates_obtain_all()
}
    



function updates_obtain_all(){
    
    status_bar("loading new data")
    pmt_rates = {}
    
    var missing = reader_list.length
    
    for(reader of reader_list){
        pmt_rates[reader] = false;
        
        $.getJSON("monitor/update/"+reader,
            function(data){
                missing--
                pmt_rates[data[0]["host"]] = data[0]
                if(missing == 0){
                    timer.push(new Date)
                    updates_check_and_combine()
                }
            }
        )
    }
    
    
}

function updates_check_and_combine(){
    status_bar("got all new data")
    update_times = {}
    opt_link_rates = {...optical_links_zero};
    
    
    // if just copied from above it will overwrite the default dictrionary......
    // this does not work :(
    //rates_meta = {...pmts_per_detector_rates}
    
    rates_meta = {}
    pmts_list_per_detector_dynamic = {}
    for(detector of Object.keys(pmts_per_detector)){
        rates_meta[detector] = {
            "min": Infinity,
            "max": 0,
            "tot": 0,
            "missing": pmts_per_detector[detector],
            "zero": 0
        }

        pmts_list_per_detector_dynamic[detector] = [...pmts_list_per_detector_template[detector]]
        
    }

    
    
    
    
    for(i in reader_list){
        reader = reader_list[i]
        
        reader_data = pmt_rates[reader]
        try{
            svgObject0.getElementById("str_reader_time_"+i).textContent = reader + ": " + reader_data["time"] + " (UTC)"
            $("#field_current_timestamp").val(reader_data["time"])
        } catch(error){
            
        }
        
        try{
            // remove channels 999, 1999, 2999
            delete reader_data["channels"]['999']
            delete reader_data["channels"]['1999']
            delete reader_data["channels"]['2999']
            
            
            // same readers  should readout the same detctor so speed up the sorting
            var detector = pmt_dict[Object.keys(reader_data["channels"])[0]]["detector"]
            status_bar("working on " + detector)
            
            rates = Object.values(reader_data["channels"])

            
            // rates_meta[detector]["min"] = Math.min(rates_meta[detector]["min"], Math.min(...rates))
            // rates_meta[detector]["max"] = Math.max(rates_meta[detector]["max"], Math.max(...rates))
            
            for(let [channel, rate] of Object.entries(reader_data["channels"])){
                pmts_list_per_detector_dynamic[detector].splice(
                        pmts_list_per_detector_dynamic[detector].indexOf(channel),
                        1
                )
                
                rates_meta[detector]["missing"]--
                
                if(rate == 0){
                    rates_meta[detector]["zero"]++
                } else {
                    rates_meta[detector]["tot"] += rate
                    
                    if(!pmts_to_ignore_for_rate.includes(channel)){
                        rates_meta[detector]["min"] = Math.min(rates_meta[detector]["min"], rate)
                        rates_meta[detector]["max"] = Math.max(rates_meta[detector]["max"], rate)
                    }
                }
                try{
                    opt_link_rates[pmt_dict[channel]["opt"]] += rate
                }catch(error){
                }
                
                try{
                    svgObject1.getElementById("text_rate_"+channel).textContent = rate + " kB/s"
                }catch(error){}
            }
            
        }catch(error){
            console.log("could not work on reader " + reader)
        }
        
    }
        
    if(rates_meta["tpc"]["min"] == Infinity){
        rates_meta["tpc"]["min"] = 0
    }    
    
    svgObject1.getElementById("str_legend_min").textContent = "min: " + rates_meta["tpc"]["min"] + " kB/s"
    svgObject1.getElementById("str_legend_max").textContent = "max: " + rates_meta["tpc"]["max"] + " kB/s"
    svgObject1.getElementById("str_legend_tot").textContent = "total: " + (rates_meta["tpc"]["tot"] /1024).toFixed(2) + " MB/s"
    svgObject1.getElementById("str_legend_minus1").textContent = "no data: " + rates_meta["tpc"]["missing"];
    svgObject1.getElementById("str_legend_zero").textContent = "zero data: " + rates_meta["tpc"]["zero"];
    
    
    if($("#legend_auto_set").is(':checked') == true){
        legend_rate_min = rates_meta["tpc"]["min"]
        legend_rate_max = rates_meta["tpc"]["max"]
        update_color_scheme()
    }
    
    color_pmts()
    
    
    for(detector of Object.keys(pmts_list_per_detector_dynamic)){
        for(channel of pmts_list_per_detector_dynamic[detector]){
            svgObject1.getElementById("pmt_circle_"+channel).style.fill = "lightgrey"
            svgObject1.getElementById("pmt_circle_"+channel).style.fillOpacity = "1"
            svgObject1.getElementById("text_rate_"+channel).textContent = "no data"
        }
    }
    
    status_bar("coloring pmts")
    timer.push(new Date)
    
    
    // update optical reader datarates
    for(let [reader, rate] of Object.entries(opt_link_rates)){
        try{
            rate_permil = Math.min(1000,Math.max(0,Math.round((rate-40000)/40)))
            svgObject1.getElementById("opt_indicator_text_"+reader).textContent = Math.round(rate /10.24) / 100
            rect_obj = svgObject1.getElementById("opt_indicator_field_"+reader)
            rect_obj.style.fill = lut_colors[rate_permil]
            rect_obj.style.fillOpacity = rate_permil/1000

        }catch(error){
            
        }
    }
    
    timer.push(new Date)
    status_bar("")
    if(dev_show_timings){
        status_bar("updated graph. db: " + (timer[1]-timer[0]).toFixed(0) +" ms, work: " + (timer[2]-timer[1]).toFixed(0) +" ms, coloring: " + (timer[3]-timer[2]).toFixed(0) +" ms, all: " + (timer[3]-timer[0]).toFixed(0) +" ms")
    }
}

function color_pmts(){
    // this funciton only colors in pmts as it is called on datarate updates and when the lenged is changed
    for(let [reader, reader_data] of Object.entries(pmt_rates)){
        for(let [channel, rate] of Object.entries(reader_data["channels"])){
            color_channel(channel, rate)
        }
    }
}



function color_channel(channel, rate){
    try{
        pmt_obj = svgObject1.getElementById("pmt_circle_"+channel)
        
        if(rate == -1){
            pmt_obj.style.fillOpacity = "1"
        }else if(rate < legend_rate_min && $("#monitor_fade_toggle").is(':checked')){
            // just fade away if data is below minimum
            pmt_obj.style.fillOpacity = Math.max((pmt_obj.style.fillOpacity || 1)-fading_rate, 0);
            
        } else{
            pmt_obj.style.fillOpacity = "1"
            pmt_obj.style.fill = convert_rate_to_color_string(rate)
        }
    } catch(error){
        
        
    }
}


function convert_rate_to_color_string(rate){
    // catch easy cases first (below above limits)
    if(rate < legend_rate_min){
        return(lut_colors[0])
    }else if(rate > legend_rate_max){
        return(lut_colors[1000])
    } else{
        if($("#legend_color_scale_log").is(':checked') == true){
            permil = (Math.log(rate)-Math.log(legend_rate_min))/legend_rate_diff*1000
        }else{
            permil = (rate-legend_rate_min)/legend_rate_diff*1000
        }
        
        
        return(lut_colors[Math.round(permil)])
    
    }
}


function legend_set(which){
    if((["min", "max"]).includes(which)){
        
        new_value = parseFloat(window.prompt("new "+{"min":"lower", "max":"upper"}[which]+" bound in kB/s (current: " + eval("legend_rate_"+which) + " kB/s)", eval("legend_rate_"+which)));
        
        if(!isNaN(new_value)){
            change_toggle("legend_auto_set", false)
            eval("legend_rate_"+which+ "="+new_value)
            
            update_color_scheme()
        }
    }
    
}



function update_color_scheme(new_min = false, new_max=false){
    if(new_min !== false){
        legend_rate_min = new_min
    }
    if(new_max != false){
        legend_rate_max = new_max
    }
    if(legend_rate_min == legend_rate_max){
        legend_rate_min -= 1
        legend_rate_max += 10
    }
    
    
    if($("#legend_color_scale_log").is(':checked') == true){
        if(legend_rate_min <= 0){
            legend_rate_min = 1
        }
        legend_rate_diff = Math.log(legend_rate_max) - Math.log(legend_rate_min)
        diff_rate = legend_rate_diff/4
        
        text_25 = Math.exp(Math.log(legend_rate_min) + diff_rate)
        text_50 = Math.exp(Math.log(legend_rate_min) + diff_rate * 2)
        text_75 = Math.exp(Math.log(legend_rate_min) + diff_rate * 3)
        
        
    } else {
        if(legend_rate_min < 0){
            legend_rate_min = 0
        }
        legend_rate_diff = legend_rate_max - legend_rate_min
        diff_rate = legend_rate_diff/4
        text_25 = legend_rate_min + diff_rate
        text_50 = legend_rate_min + diff_rate * 2
        text_75 = legend_rate_min + diff_rate * 3
    }
    
    svgObject0.getElementById("str_legend_000").textContent = legend_rate_min
    svgObject0.getElementById("str_legend_025").textContent = text_25.toFixed(0)
    svgObject0.getElementById("str_legend_050").textContent = text_50.toFixed(0)
    svgObject0.getElementById("str_legend_075").textContent = text_75.toFixed(0)
    svgObject0.getElementById("str_legend_100").textContent = legend_rate_max
    
    color_pmts()
}


function update_pmts_to_ignore_for_rate(){
    pmts_to_ignore_for_rate = $("#field_ignore_pmts").val().split(",")
    status_bar("ignoring pmts: "+$("#field_ignore_pmts").val(), col = "green")
}

function change_toggle(id, desired_state){
    if($("#"+id).is(':checked') != desired_state){
        $("#"+id).parent().click()
    }
}
