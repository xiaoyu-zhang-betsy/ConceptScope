// global variables
var hoverHighlight = 'rgba(232, 138, 12, 1)'; //#E88A0C
var transGraphColor = 'rgba(100, 100, 100, 0.2)';//#7B7B7B
var hoverFadeOut = 'rgba(17, 17, 17, 0.7)'; //#111111
var prevClickedRow = '';
var isRowClicked = false;
var circleClicked = false;
var szOn = true;
var szScale = 0.1; // the scale to invoke semantic zooming
var szLevel = 3; // the number of levels to show (for semantic zooming)
var szPadding = 7; // the distance between two contours
var szStrokeWidth = 1; // the stroke width of the contour
var graphNum = 0; // the number of graphs in the canvas now
var entityMap = new Map();
var classDict = {
  "https://cso.kmi.open.ac.uk/topics/artificial_intelligence" : 0,
  "https://cso.kmi.open.ac.uk/topics/robotics" : 1,
  "https://cso.kmi.open.ac.uk/topics/computer_vision" : 2,
  "https://cso.kmi.open.ac.uk/topics/computer_operating_systems" : 3,
  "https://cso.kmi.open.ac.uk/topics/bioinformatics" : 4,
  "https://cso.kmi.open.ac.uk/topics/software_engineering" : 5,
  "https://cso.kmi.open.ac.uk/topics/information_technology" : 6,
  "https://cso.kmi.open.ac.uk/topics/data_mining" : 7,
  "https://cso.kmi.open.ac.uk/topics/information_retrieval" : 8,
  "https://cso.kmi.open.ac.uk/topics/computer_programming" : 9, 
  "https://cso.kmi.open.ac.uk/topics/computer_security" : 10,
  "https://cso.kmi.open.ac.uk/topics/theoretical_computer_science" : 11,
  "https://cso.kmi.open.ac.uk/topics/internet" : 12,
  "https://cso.kmi.open.ac.uk/topics/formal_languages" : 13,
  "https://cso.kmi.open.ac.uk/topics/software" : 14,
  "https://cso.kmi.open.ac.uk/topics/hardware" : 15,
  "https://cso.kmi.open.ac.uk/topics/computer_hardware" : 15,
  "https://cso.kmi.open.ac.uk/topics/computer_aided_design" : 16,
  "https://cso.kmi.open.ac.uk/topics/computer-aided_design" : 16,
  "https://cso.kmi.open.ac.uk/topics/operating_system" : 17,
  "https://cso.kmi.open.ac.uk/topics/operating_systems" : 17,
  "https://cso.kmi.open.ac.uk/topics/computer_system" : 18,
  "https://cso.kmi.open.ac.uk/topics/computer_systems" : 18,
  "https://cso.kmi.open.ac.uk/topics/computer_network" : 19,
  "https://cso.kmi.open.ac.uk/topics/computer_networks" : 19,
  "https://cso.kmi.open.ac.uk/topics/computer_communication_networks" : 19,
  "https://cso.kmi.open.ac.uk/topics/human_computer_interaction" : 20,
  "https://cso.kmi.open.ac.uk/topics/human-computer_interaction" :20
}
colorMap = [
  d3.lab(85,-24,-1),  //#9EE2D5
  d3.lab(85,-11,36),  //#D2D98F
  d3.lab(85,8,-15),   //#D9D0F1
  d3.lab(85,62,29),   //#FF9FA2
  d3.lab(85,-8,-22),  //#B1DAFD
  d3.lab(85,17,22),   //#FEC8AC
  d3.lab(85,-32,52),  //#AFE46C
  d3.lab(85,20,-6),   //#F6C7E0
  d3.lab(85,0,20),    //#D4D4D4
  d3.lab(85,76,-100), //#FF9BFF
  d3.lab(85,-17,15),  //#BBDDB7
  d3.lab(85, -6, 85)  //#E8D600
];

//jQuery
$("document").ready(function() {
  //submit click function
  $('#loadGraphFileBtn').on('click', function () {
      var text = $('#graphFile1').val().replace("C:\\fakepath\\", "");

      if (text != "") {
        // create canvas
        $("#graphCanvas")
          .append('<div id="canvas' + graphNum + '" class="col svgGroup"> \
                      <button id="closeCanvasBtn' + graphNum + '" type="button" class="close btn-secondary pull-left" aria-label="btnClose"> \
                        <span aria-hidden="true">&times;</span> \
                      </button> \
                        <div class="row"> \
                          <div class="col" align="center"> \
                              <div class="row"> \
                                  <svg id="svgCircles' + graphNum + '" class="svgCircles"></svg> \
                              </div> \
                              <div class="row"> \
                                <div class="divText" id="divText' + graphNum + '"> \
                                    <table id="tableText' + graphNum + '" style="border-collapse:separate; border-spacing:0 5px;"></table> \
                                </div> \
                              </div> \
                          </div> \
                          <div class="col col-lg-2" id="transGraphContent"> \
                            <svg id="svgTrans' + graphNum + '" class="svgTrans"></svg> \
                          </div> \
                      </div> \
                  </div>');

        // close current canvas
        $('#closeCanvasBtn'+ graphNum).on('click', function () {
          graphNum -= 1;
          $(this).parent().remove();

          // update entityMap and redraw sparkline
          removeIdx = parseInt(this.id.replace('closeCanvasBtn', ''));
          for (let name in entityMap){
            if (removeIdx in entityMap[name]["graph"])
                delete entityMap[name]["graph"][removeIdx];

            isEmptyEntity = true;
            for (let key in entityMap[name]["graph"]){
              if(entityMap[name]["graph"][key] != 0) {
                isEmptyEntity = false;
                break;
              }
            }
            if (isEmptyEntity)
              delete entityMap[name];
          }

          DrawSparkline(entityMap);
        });

        //send data to the server
        var data = {};
        data['filename'] = text;

        $.post("/loadGraph",data,
        function(jsonData,status){
            console.log(jsonData);
            try {
              // draw bubble treemap
              let svg1 = d3.select("#svgCircles"+graphNum);
              svg1.selectAll("*").remove();
              jsonData["hierarchy"].children.sort((a,b) => (a.name > b.name ? 1 : -1));
              drawChart(jsonData["hierarchy"], jsonData["sentences"], svg1, graphNum);
            }
            catch(error) {
              console.error(error);
            }

            try {
              // draw transcript view
              let svgTrans = d3.select("#svgTrans"+graphNum);
              drawTrans(jsonData["sentences"], svgTrans, graphNum);
            }
            catch(error) {
              console.error(error);
            }

            try {
              // draw raw text view
              let svgTrans = d3.select("#svgTrans"+graphNum);
              drawText(jsonData["sentences"], svgTrans, graphNum);
            }
            catch(error) {
              console.error(error);
            }

            graphNum++;
        },"json");
      }
  });

  $('#loadTextFileBtn').on('click', function () {
    var text1 = $('#textFile').val().replace("C:\\fakepath\\", "");

    if (text1 != "") {
      // create new canvas
      $("#graphCanvas")
        .append('<div id="canvas' + graphNum + '" class="col svgGroup"> \
                    <button id="closeCanvasBtn' + graphNum + '" type="button" class="close pull-left" aria-label="btnClose"> \
                      <span aria-hidden="true">&times;</span> \
                    </button> \
                    <div class="row"> \
                        <div class="col" id="circleRow' + graphNum + '"> \
                            <div id="loader' + graphNum + '"> \
                              <div class="loader"></div> \
                              <h2>Processing...</h2> \
                            </div> \
                        </div> \
                        <div class="col col-lg-2" id="transGraphContent"> \
                            <svg id="svgTrans' + graphNum + '" class="svgTrans"></svg> \
                        </div> \
                    </div> \
                </div>');
      
      // close current canvas
      $('#closeCanvasBtn' + graphNum).on('click', function () {
        $(this).parent().remove();
      });

      //send data to the server
      var data = {};
      data['filename'] = text1;
      
      $.post("/loadText",data,
      function(jsonData, status){
          console.log(jsonData)
          try {
            // draw bubble treemap
            $("#loader"+graphNum).remove();
            $("#circleRow"+graphNum).append('<svg id="svgCircles' + graphNum + '" class="svgCircles"></svg>');
            let svgCircles= d3.select("#svgCircles"+graphNum);
            svgCircles.selectAll("*").remove();
            jsonData["hierarchy"].children.sort((a,b) => (a.name > b.name ? 1 : -1));
            drawChart(jsonData["hierarchy"], svgCircles, graphNum);
          }
          catch(error) {
            console.error(error);
          }

          try {
            // draw transcript view
            let svgTrans = d3.select("#svgTrans"+graphNum);
            console.log(svgTrans);
            drawTrans(jsonData["sentences"], svgTrans, graphNum);
          }
          catch(error) {
            console.error(error);
          }

          graphNum++;
      },"json");
    }
  });
  
  // toggle sidebar
  $('#sidebarButton').on('click', function () {
    $('#sidebar').toggleClass('active');
  });

  // show selected file name
  $('.custom-file-input').change(function (e) {
    $(this).next('.custom-file-label').html(e.target.files[0].name);
  });

  $('#showTransBtn').on('click', function() {
    d3.selectAll('#transGraphContent')
      .classed('col col-lg-2', true);

    d3.selectAll(".svgTrans")
      .style("width", "100%");

    $(this).text("Show transcript ✔");
    $('#hideTransBtn').text(" Hide transcript");
  });

  $('#hideTransBtn').on('click', function() {
    d3.selectAll('transGraphContent')
      .classed('col col-lg-2', false);

    d3.selectAll(".svgTrans")
      .style("width", "0px");

    $(this).text("Hide transcript ✔");
    $('#showTransBtn').text(" Show transcript");
  });

  // semantic zooming switch
  $('#szSwitch').on('change.bootstrapSwitch', function (e) {
    if (!e.target.checked){
      szOn = true;
      szLevel =3;
    } else {
      szOn = false;
    }
  });

  // search
  $('#searchButton').on('click', function(){
    keyword = $('#searchInput').val();

    // search circles
    idList = []
    d3.selectAll("circle").nodes().forEach(function(circle) {
      if(circle.id.includes(keyword))
        idList.push(circle.id);
    });
    HighlightCircle(idList);

    // search paths
    d3.selectAll("path").nodes().forEach(function(path) {
      if(path.id.includes(keyword))
        HighlightPath(path.id);
    });
  });

  $('#searchInput').keypress(function(event){
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if(keycode == '13'){
      event.preventDefault();
      keyword = $(this).val();

      // search circles
      idList = []
      d3.selectAll("circle").nodes().forEach(function(circle) {
        if(circle.id.includes(keyword))
          idList.push(circle.id);
      });
      HighlightCircle(idList);

      // search paths
      d3.selectAll("path").nodes().forEach(function(path) {
        if(path.id.includes(keyword))
          HighlightPath(path.id);
      });
      return false;
    }
  });
});

function drawChart(data, senSet, svg, graphID) {
    // Create hierarchy.
    let root = d3.hierarchy(data)
        .sum(function(d) { return Math.sqrt(d.size) *10; }) // For flare.
        //.sum(function(d) { return d.size*3; })
        .sort(function(a, b) { return b.value - a.value; });

    // Create bubbletreemap.
    let bubbletreemap = d3.bubbletreemap()
        .padding(szPadding)
        .curvature(10)
        .hierarchyRoot(root)
        .width(svg.attr("width"))
        .height(svg.attr("height"))
        .colormap(colorMap); // Color brewer: 12-class Paired

    // Create gradient color palette
    let contourColor = d3.scaleLinear().domain([root.height, 0]) // [0, root.height]:Darker outside, lighter inside [root.height, 0]:Lighter outside, darker inside 
        .interpolate(d3.interpolateLab)
        .range([d3.lab("#333333"), d3.lab('#eeeeee')]); // Fill_Lighter outside, darker inside
        //.range([d3.lab("#333333"), d3.lab('#CCCCCC')]); //Fill_Darker outside, lighter inside

    // Do layout and coloring.
    let hierarchyRoot = bubbletreemap.doLayout().doColoring().hierarchyRoot();

    let leafNodes = hierarchyRoot.descendants().filter(function (candidate) {
        return !candidate.children;
    });

    graphTemp = new Map();
    // append new graphID to old entities (and set it to 0)
    for (let name in entityMap) {
      entityMap[name]["graph"][graphID] = 0;
      graphTemp = JSON.parse(JSON.stringify(entityMap[name]["graph"]));
    }
    for (let key in graphTemp) {
      graphTemp[key] = 0;
    }
    graphTemp[graphID] = 0;
    //create new item in entityMap (with all the old graph information)
    leafNodes.forEach(function(leaf){
      name = leaf.data.name.substring(leaf.data.name.lastIndexOf("/")+1, leaf.data.name.length-1).split('_').join(' ').replace(/%/g, '');
      if (!(name in entityMap)){
        idx1 = leaf.data.strPath.indexOf('&-&');
        idx2 = leaf.data.strPath.indexOf('&-&', idx1+1)>-1 ? leaf.data.strPath.indexOf('&-&', idx1+1):leaf.data.strPath.length;
        entityMap[name] = {
          "name": name,
          "graph": JSON.parse(JSON.stringify(graphTemp)),
          "color": leaf.color,
          "category": leaf.data.strPath.substring(idx1+4, idx2-1),
        };
      }
      // By now, all entityMap[name]["graph"] have the key "graphID" and value 0
      // just update graph info
      entityMap[name]["graph"][graphID] += leaf.data.size;
    });
    DrawSparkline(entityMap);
   

    let zoomGroup = svg.append("g");
    //genLegend(data, svg);

    // Draw contour.
    let contourGroup = zoomGroup.append("g")
        .attr("class", "contour")
        .style('transform', 'translate(50%, 50%)');

    let tip = d3.tip()
      .attr('class', 'infoTip')
      .offset([10, 0])
      .direction('e')
      .attr("data-clicked", false);
    svg.call(tip);

    d3.select("body").on("click",function(){
      //d3.selectAll(".infoTip").remove();
      tip.hide();
      if (event.target.nodeName!="circle") {
        circleClicked = false;
      }
    });

    // zooming related
    let zoom = d3.zoom()
      .scaleExtent([(-2*szScale+0.99), 5])
      .on("zoom", function () {
        zoomGroup.attr("transform", d3.event.transform);
        if (szOn){
          SemanticZooming_1(bubbletreemap, svg, leafNodes, senSet, graphID, contourColor, tip, root.height);
        } else {
          szLevel = root.height;
        }
      });
    svg.call(zoom);

    path = contourGroup.selectAll("path")
        .data(bubbletreemap.getContour(szLevel).filter(function(nodes) {
          return nodes.height > 0;
        })) //semantic_zooming_1
        //.data(bubbletreemap.getContour(root.height, szPadding)) //semantic_zooming_2
        .enter().append("path")
        .attr("id", function(d) { return "g-" + graphID + "-" + "c-" + d.name.substring(d.name.lastIndexOf("/")+1, d.name.length-1).replace(/%/g, '');})
        .attr("d", function(arc) { return arc.d; })
        .style("stroke", function(arc) {
            return "black"; // fill
            //return contourColor(arc.depth); // contour
            //return arc.color;
        })
        .style("stroke-width", function(arc) { 
            //return 6-arc.depth*0.7; // Thicker outside, thinner inside
            //return 1+arc.depth*0.7; // Thinner outside, thicker inside
            //return szStrokeWidth; // fill
            return 0;
        })
        .style("fill-opacity", 0.7) 
        .style("fill", function(arc) {
            //return "white"; // contour
            return contourColor(arc.depth);// fill
        })
        .attr("transform", function(arc) {return arc.transform;})
        .on("mouseover", function(d, i) {
            HighlightPath(this.id, graphID, tip);
        })
        .on("mouseout", function(d, i) {
            RecoverPath(contourColor, this.id, graphID, tip)
        });
        
    // Draw circles.
    let circleGroup = zoomGroup.append("g")
        .attr("class", "circlesAfterPlanck")
        .style('transform', 'translate(50%, 50%)');

    //Glowing effect: Container for the gradients
    var defs = circleGroup.append("defs");

    //Filter for the outside glow
    var filter = defs.append("filter")
        .attr("id","glow")
        .attr("x", "-30%")
        .attr("y", "-30%")
        .attr("width", "160%")
        .attr("height", "160%");
    filter.append("feGaussianBlur")
        .attr("stdDeviation","3.5")
        .attr("result","coloredBlur");
    var feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode")
        .attr("in","coloredBlur");
    feMerge.append("feMergeNode")
        .attr("in","SourceGraphic");

    circleGroup.selectAll("circle")
        .data(leafNodes.filter(function (nodes) {
            return nodes.depth <= szLevel;
        })) //semantic_zooming_1
        //.data(leafNodes) //semantic_zooming_2
        .enter().append("circle")
        .attr("id", function(d) { return "g-" + graphID + "-" + "e-" + d.data.name.substring(d.data.name.lastIndexOf("/")+1, d.data.name.length-1).replace(/%/g, '');})
        .attr("r", function(d) { return d.r; })
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })
        .style("fill", function(d) { return d.color; })
        .style("stroke",  function(arc) {
            //return "black"; // fill
            //return contourColor(arc.depth); // contour
            return d3.lab(arc.color).darker(1);
        })
        //.style("fill-opacity", 0.7)
        .style("stroke-width", szStrokeWidth)
        .on("mouseover", function(d, i) {
            //console.log(d.x, d.y);
            HighlightCircle([this.id], graphID, tip, d);

            d.data.location.forEach(function(location) {
              HighlightRect("g-" + graphID + "-" + "rSen-" + location[0], graphID);
            });

            // fade out other circles
            otherCircle = d3.selectAll("circle").filter(function(circle){
              if (circle.data.name == d.data.name) 
                return false;
              else
                return true;
            });
            if (!otherCircle.empty())
              otherCircle.style("opacity", 0.1);
        })
        .on("mouseout", function(d, i) {
            RecoverCircle(graphID, tip);

            d.data.location.forEach(function(location) {
              RecoverRect("g-" + graphID + "-" + "rSen-" + location[0], graphID);
            });
        })
        .on("click", function(d, i) {
          if (d3.event.ctrlKey || d3.event.metaKey) {
          //if (d3.event.shiftKey) {
              document.getElementById('concordance-view').style.visibility =
                  'visible';
              // get concordance
              var word = d.data.origin;
              var allConcordances = GetConcordanceHighlight(word, senSet);
              $('#concordance-view-content').children().remove();
              $('#concordance-view-content').append(allConcordances);
          } else {
              ClickCircle(d.data.name, tip);
          }
        });
}

function drawTrans(senList, svg, graphID, speakerDiff=0) {
  svg.selectAll("*").remove();

  var w = $("#transGraphContent").width();
  var h = $("#transGraphContent").height();

  var docLength = senList.length;
  var transcriptScale = d3.scaleLinear()
                          .domain([0, docLength])
                          .range([0, h-30]);
  var maxTranLine = 0

  // to normalize the widths of the lines of sentence, need to find
  // the maximum length
  for (i=0; i<senList.length;i++){
    if (maxTranLine < senList[i].sentence.length){
      maxTranLine =senList[i].sentence.length;
    }
  }

  // create and store data object for visualization
  var graphData = [];
  for (i=0; i < senList.length; i++){
    var d = {};
    // var ySec = hmsToSec(captionArray[i][0]);
    var ySec = i;
    d.timeStamp = ySec;
    var yloc = transcriptScale(ySec);
    
    //d.speaker = captionArray[i][2];
    if (speakerDiff === 0){
      d.x = 0;
      d.fillColor = transGraphColor;
      d.width = senList[i].sentence.length/maxTranLine * w;
      // d.width = w;
    } else {
      var speakerIndex = speakerList.indexOf(captionArray[i][2]);
      if (speakerIndex === -1){
        // uncomment the below to show other speakers as well
        // (apart from the participants)
        /*
        d.y = transScaleY(speakerList.length - 5);
        d.fillColor = transGraphColor;
        d.height = transScaleY(0.9);
        */
      } else {
        d.x = transScaleX(speakerList.length - speakerIndex - 1);
        d.fillColor = speakerColors[speakerIndex];
        d.width = transScaleX(0.9);
      }
    }

    // var endSec = hmsToSec(captionArray[i][1]);
    var endSec = i+1;
    d.endTime = endSec;
    // var startSec = hmsToSec(captionArray[i][0]);
    var startSec = i;
    var scaledHeight = transcriptScale(endSec - startSec);
    if (scaledHeight > 10){
      d.height = 10;
      d.y = d.height*i+30;
    } else {
      d.height = scaledHeight;
      d.y = yloc+15;
    };
    
    d.sentence = senList[i].sentence;
    d.marks = senList[i].marks;
    /*if ( (!($.isEmptyObject(textMetadataObj))) && 
         (showIC) ) {
      d.fillColor = icColorArray[i];
    }*/
    graphData.push(d);
  }

  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([0, 0])
    .direction('w');
  svg.call(tip);

  var rects = svg.selectAll("rect")
  .data(graphData).enter()
  .append("rect")
  .attr("id", function (d, i) { return "g-" + graphID + "-" + "rSen" + "-" + i})
  .attr("x", function (d) { return d.x; })
  .attr("y", function (d) { return d.y; })
  .attr("width", function (d) { return d.width; })
  .attr("z", 1)
  .attr("height", function (d) { return d.height; })
  .attr("fill", d.fillColor)
  .on("mouseover", function(d, i){
    // highlight corresponding rectangles
    HighlightRect(this.id, graphID, tip, d, i);

    // highlight corresponding circles
    idList = [];
    d.marks.forEach(function(mark) {
      if (mark.entityURI != null) {
        entityName = mark.entityURI.substring(mark.entityURI.lastIndexOf("/")+1, mark.entityURI.length-1).replace(/%/g, '');
        idList.push("g-" + graphID + "-" + "e" + "-" + entityName);
      }
    });
    HighlightCircle(idList, graphID);

    // highlight corresponding raw text
    var textId = d3.select(this).attr('id').replace('rSen', 'line');
    d3.select('#'+textId).style('background-color', hoverHighlight);
  })
  .on("mouseout", function(d){
    RecoverRect(this.id, graphID, tip);
    RecoverCircle(graphID, tip);

    // recover corresponding raw text
    var textId = d3.select(this).attr('id').replace('rSen', 'line');
    d3.select('#'+textId).transition().style('background-color', null);
  });

  var fisheye = d3.fisheye.circular().radius(200);
    svg.on('mousemove', function(){
        // implementing fisheye distortion
        fisheye.focus(d3.mouse(this));
        rects.each(function(d) { d.fisheye = fisheye(d); })
             .attr("y", function(d) { return d.fisheye.y; })
             .attr("width", function(d) {
                return d.width * d.fisheye.z;
             })
             .attr("height", function(d) { 
               return d.height * d.fisheye.z; 
             });
    });
    svg.on('mouseleave', function(){
        rects.each(function(d){d.fisheye = fisheye(d);})
             .attr("y", function(d){return d.y;})
             .attr("width", function(d){return d.width;})
             .attr("height", function(d){return d.height;});
    });

}

function drawText(senList, table, graphID) {
  displayLines = [];
  
  for (i=0; i < senList.length; i++) {
    displayLines.push(
      '<tr id="row' + i + '">' +
      '<td style="border: 1px solid ' + transGraphColor + '; ' +
      'border-right: 7px solid ' + transGraphColor + '; ' +
      'color: rgba(100, 100, 100, 1); ' +
      'font-family:Roboto; font-size:13pt; padding: 5px;"' +
      'class="unselectable" id="g-' + graphID + '-' + 'tag-' + i + '">' +
      i + '</td>' +
      '<td id="g-' + graphID + '-' + 'line-' + i + '" ' +
      'class="tdText">' +
      senList[i].sentence + '</td></tr>');
  }

  var tableBody = $('#tableText'+graphID).append('<tbody></tbody>');
  for (var j in displayLines) {
    tableBody.append(displayLines[j]);
  }

  d3.selectAll(".tdText")
    .on("mouseover", function(){
      d3.select(this).style('background-color', hoverHighlight);
      var rectId = d3.select(this).attr('id').replace('line', 'rSen');
      //d3.select('#'+rectId).attr('fill', hoverHighlight);
      HighlightRect(rectId, graphID);
    })
    .on("mouseout", function(){
      d3.select(this).style('background-color', null);
      var rectId = d3.select(this).attr('id').replace('line', 'rSen');
      //d3.select('#'+rectId).attr('fill', transGraphColor);
      RecoverRect(rectId, graphID);
    });
}

function genTipsHtml(data, index) {
  s_html = "<font size=5 color='#FFF'>"+ index +":  </font>";

  plain_start = 0
  plain_end = 0
  text = data.sentence;
  data.marks.forEach(function(mark){
    plain_end = mark.start_char;
    s_html = s_html + text.substring(plain_start, plain_end);
    if ((mark.category!=null) && mark.category.substring(1, mark.category.length-1) in classDict)
      s_html = s_html + '<span style="background-color:' + colorMap[classDict[mark.category.substring(1, mark.category.length-1)] % colorMap.length] + ' ">' + "<font color='#212529'>" + text.substring(mark.start_char, mark.end_char) + '</font></span>';
    else
      s_html = s_html + text.substring(mark.start_char, mark.end_char)
    plain_start = mark.end_char;
  });
  s_html = s_html + text.substring(plain_start, text.length);

  return s_html;
}

// abadoned
function doIt(fileName1, fileName2 = null) {
  let svg1 = d3.select("#svgCircles1");

  d3.json(fileName1 + "?nocache=" + (new Date()).getTime(), function (error, data1) {
      data1.children.sort((a,b) => (a.name > b.name ? 1 : -1));
      drawChart(data1, svg1);
      
      if(fileName2) {
          let svg2 = d3.select("#svgCircles2");
          d3.json(fileName2 + "?nocache=" + (new Date()).getTime(), function (error, data2) {
              data2.children.sort((a,b) => (a.name > b.name ? 1 : -1));

              // put the element of data2 at the same position as in data
              children_modified = new Array(data2.children.length).fill(null);
              children_left = []
              data2.children.forEach(element => {
                  index = data1.children.findIndex(child => child.name == element.name)
                  if (index != -1 && index<data2.children.length)    
                      children_modified[index] = element;
                  else
                      children_left.push(element);
              });
              children_left.forEach(element => {
                  index = children_modified.findIndex(child => !child);
                  children_modified[index] = element;
              });
              data2.children = children_modified;

              drawChart(data2, svg2);
          });
      }
  });
}

function genLegend(data, svg) {
  let legendGroup = svg.append("svg")
        .attr("class", "svgLegend");
  var legendVals = d3.scaleOrdinal()
                  .domain(data.children.map(function(v) { return v.name;}));
                  //.domain(Object.keys(classDict).map(function(v) { return v.substring(v.lastIndexOf("/")+1, v.length); }));

  var legend = legendGroup.selectAll('.legend')
  .data(legendVals.domain())
  .enter().append('g')
  .attr("transform", function (d, i) {
    pos_y = (i * 17) + 10; 
    return "translate(10," + pos_y + ")";
  });

  legend.append('rect')
  .attr("x", 0)
  .attr("y", 0)
  .attr("width", 15)
  .attr("height", 10)
  .style("fill", function (d, i) {
    return colorMap[classDict[d.substring(1,d.length-1)]%12];
  });

  legend.append('text')
  .attr("x", 20)
  .attr("y", 10)
  //.attr("dy", ".35em")
  .text(function (d, i) {
    return d.substring(d.lastIndexOf("/")+1, d.length-1);;
  })
  .attr("class", "textselected")
  .style("text-anchor", "start")
  .style("font-size", 15);
}

function SemanticZooming_1(bubbletreemap, svg, leafNodes, senSet, graphID, contourColor, tip, treeHeight) {
  szLevel = 3 + Math.floor((d3.event.transform.k-1)/szScale);
  szLevel = szLevel<=treeHeight? szLevel : treeHeight;

  // update contours
  let newPath = svg.select("g").select(".contour").selectAll("path")
    .data(bubbletreemap.getContour(szLevel).filter(function(nodes) {
      return nodes.height > 0;
    }));
  newPath.exit().remove();
  newPath.enter().append("path")
    .attr("id", function(d) { return "g-" + graphID + "-" + "c-" + d.name.substring(d.name.lastIndexOf("/")+1, d.name.length-1).replace(/%/g, '');})
    .attr("d", function(arc) { return arc.d; })
    .style("stroke", function(arc) {
        return "black"; // fill
        //return contourColor(arc.depth); // contour
        //return d3.lab(arc.color).darker(1);
    })
    .style("stroke-width", function(arc) { 
        //return 6-arc.depth*0.7; // Thicker outside, thinner inside
        //return 1+arc.depth*0.7; // Thinner outside, thicker inside
        //return szStrokeWidth; // fill
        return 0;
    })
    .style("fill-opacity", 0.7) 
    .style("fill", function(arc) {
        //return "white"; // contour
        return contourColor(arc.depth);// fill
    })
    .attr("transform", function(arc) {return arc.transform;})
    .on("mouseover", function(d, i) {
        HighlightPath(this.id, graphID, tip);
    })
    .on("mouseout", function(d, i) {
        RecoverPath(contourColor, this.id, graphID, tip)
    });

  // update circles
  let newCircle = svg.select("g").select(".circlesAfterPlanck").selectAll("circle")
                  .data(leafNodes.filter(function (nodes) {
                    return nodes.depth <= szLevel;
                  }));
  newCircle.exit().remove();
  newCircle.enter().append("circle")
    .attr("id", function(d) { return "g-" + graphID + "-" + "e-" + d.data.name.substring(d.data.name.lastIndexOf("/")+1, d.data.name.length-1).replace(/%/g, '');})
    .attr("r", function(d) { return d.r; })
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .style("fill", function(d) { return d.color; })
    .style("stroke",  function(arc) {
        //return "black"; // fill
        //return contourColor(arc.depth); // contour
        return d3.lab(arc.color).darker(1);
    })
    //.style("fill-opacity", 0.7)
    .style("stroke-width", szStrokeWidth)
    .on("mouseover", function(d, i) {
        HighlightCircle([this.id], graphID, tip);

        d.data.location.forEach(function(location) {
          HighlightRect("g-" + graphID + "-" + "rSen-" + location[0], graphID);
        });
    })
    .on("mouseout", function(d, i) {
        RecoverCircle(graphID, tip);

        d.data.location.forEach(function(location) {
          RecoverRect("g-" + graphID + "-" + "rSen-" + location[0], graphID);
        });
    })
    .on("click", function(d, i) {
        if (d3.event.ctrlKey || d3.event.metaKey) {
        //if (d3.event.shiftKey) {
            document.getElementById('concordance-view').style.visibility =
                'visible';
            // get concordance
            var word = d.data.origin;
            var allConcordances = GetConcordanceHighlight(word, senSet);
            $('#concordance-view-content').children().remove();
            $('#concordance-view-content').append(allConcordances);
        } else {
            ClickCircle(d.data.name, tip);
        }
    });
  }

function HighlightCircle(idList, graphID=-1, tip=null) {
  // Use D3 to select all elements in multiple graph
  circles = d3.selectAll("circle").filter(function(circle) {
    flag = false;
    idList.forEach(function(id){
      specificName = '/' + id.substring(id.lastIndexOf("e-")+2, id.length)+'>';
      if (circle.data.name.includes(specificName))
        flag = true;
    });
    return flag;
  });
  // highlight circles in idList
  if (!circles.empty()) {
    circles
    //.style("fill", function(d) {return d3.lab(d.color).darker(2);})
    .style("stroke-width", 1)
    //.style("stroke-dasharray", "3,3")
    //.style("fill", hoverHighlight)
    //.style("stroke", "white")
    .style("stroke", function(d) {return d3.lab(d.color).brighter(1);})
    .style("filter", "url(#glow)");
    //.style("filter", function(d) {return "Glow(Color=" + d.color + ", Strength=255)";})
    //.attr("r", function(d) { return 0; })
    
    circles.nodes().forEach(function(node) {
      if(tip!=null && !circleClicked) {
        labelText = node.id.substring(node.id.lastIndexOf("e-")+2, node.id.length);
        tip.html(labelText);
        //.style("left", d.x + "px")     
        //.style("top", d.y + "px");
        //console.log(tip.style("left"), tip.style("top"));
        //console.log(node.getBBox().x, node.getBBox().y);
        tip.show();
      }
    })
  }

  // fade out other circles
  otherCircles = d3.selectAll("circle").filter(function(circle) {
    flag = true;
    idList.forEach(function(id){
      specificName = '/' + id.substring(id.lastIndexOf("e-")+2, id.length)+'>';
      if (circle.data.name.includes(specificName))
        flag = false;
    });
    return flag;
  });
  if (!otherCircles.empty())
    //otherCircle.style("fill", transGraphColor);
    otherCircles.style("opacity", 0.1);
}

function RecoverCircle(graphID, tip) {
  // recover all circles
  d3.selectAll("circle")
    .style("fill", function(d) { return d.color;})
    .style("stroke", function(d) {
      return d3.lab(d.color).darker(1);
    })
    .style("stroke-width", szStrokeWidth)
    .style("stroke-dasharray", null)
    .style("filter", null)
    .style("opacity", 1);

  if(tip!=null && !circleClicked) {
    tip.hide();
  }
}

function ClickCircle(uri, tip) {
  labelText = '<h4 align="center">' + uri.substring(uri.lastIndexOf("/")+1, uri.length-1).split('_').join(' ') + '</h4>';
  
  //send data to the server
  var data = {};
  data['uri'] = uri.substring(1, uri.length-1);
  $.post("/queryEntity",data,
      function(jsonData,status){
          d3.selectAll(".conceptTip").remove();

          try {
            console.log(jsonData);
            if("thumbnail" in jsonData) {
              labelText += '<img class="thumbnail" src="' + jsonData["thumbnail"] +'">'
            }
            if("abstract" in jsonData) {
              labelText += '<div class="abstract">'+ jsonData["abstract"] +'</div>'
            }
            if("neighbor" in jsonData) {
              neighborList = jsonData["neighbor"];
              labelText += "<div> See also: </div>";
              neighborList.forEach(function(neighbor) {
                if (neighbor.name in entityMap)
                  style = "bold";
                else
                  style = "normal";
                labelText += '<li><a style="color:black; font-size:10pt; font-weight:' + style + '" href="' + neighbor.name + '">' + neighbor.name.substring(neighbor.name.lastIndexOf("/")+1, neighbor.name.length).split('_').join(' ').replace(/%/g, '') +'</a></li>';
              })
            }
            labelText += '<a href="' + uri.substring(1, uri.length-1) + '">Read more</a>';
            tip.html(labelText).show();
          }
          catch(error) {
            //console.error(error);
          }
      },"json");
  
  circleClicked = true;
}

function HighlightPath(id, graphID=-1, tip=null){
  // Use D3 to select all elements in multiple graph
  paths = d3.selectAll("path").filter(function(path) {
    specificName = '/' + id.substring(id.lastIndexOf("c-")+2, id.length)+'>';
    if (path.name.includes(specificName))
      return true;
    else
      return false;
  });
  paths.style("fill-opacity", 0.7) 
  .style("fill", function(arc) {return d3.lab(arc.color).darker(1);})
  //.style("fill", function(arc) { return d3.rgb(contourColor(arc.depth)).darker(2);})
  //.style("stroke", function(arc) {return d3.lab(arc.color).darker(1);})
  .style("stroke", "black")
  .style("stroke-width", szStrokeWidth+1);
  
  if(tip!=null && !circleClicked) {
    labelText = id.substring(id.lastIndexOf("c-")+2, id.length);
    tip.html(labelText).show();
  }
}

function RecoverPath(contourColor, id, graphID, tip) {
  // Use D3 to select all elements in multiple graph
  paths = d3.selectAll("path").filter(function(path) {
    specificName = '/' + id.substring(id.lastIndexOf("c-")+2, id.length)+'>';
    if (path.name.includes(specificName))
      return true;
    else
      return false;
  });
  paths.style("fill-opacity", 0.7) // fill:1.0 contour:0.0
  //.style("fill", "white") // contour
  .style("fill", function(arc) { return contourColor(arc.depth);})// fill
  //.style("stroke", function(arc) {return contourColor(arc.depth);})
  //.style("stroke-width", szStrokeWidth); 
  .style("stroke-width", 0); 

  if(tip!=null && !circleClicked)
    tip.hide();
}

function HighlightRect(id, graphID, tip=null, data=null, index=null){
  d3.select("#" + id)
    .attr('fill', hoverHighlight);

  // tip == null: hover over a circle
  // tip != null: hover over a rectangle
  if (tip != null) {
    tip.html(genTipsHtml(data, index)).show();
  }
}

function RecoverRect(id, graphID, tip=null){
  d3.select("#" + id)
    .attr('fill', transGraphColor);

  if (tip) {
    tip.hide();
  }
}

function DrawSparkline(entityMap){
  $("#entity-menu").empty();
  entityList = Object.values(entityMap);
  entityList.sort(function(a, b){
    return classDict[a["category"]] - classDict[b["category"]];
  })
  let curCtg = null;
  let CtgNode = null;
  let maxSize = 0;
  entityList.forEach(function(entity){
    text = entity["name"];
    /*entity["graph"].forEach(function(id){
      text += 'G' + (id+1) + ', ';
    });
    text　= text.substring(0, text.length-2)+')';*/
    if (curCtg != entity["category"]) {
      curCtg = entity["category"];
      CtgNode = $('<a style="font-weight:bold; font-size:1.1em;  background-color:' + entity.color + '" href="#">'+ curCtg.substring(curCtg.lastIndexOf("/")+1, curCtg.length).split('_').join(' ') + '</a>')
      .appendTo("#entity-menu");
    }
    graphList = Object.values(entity["graph"]);
    if (Math.max.apply(null, graphList) > maxSize)
      maxSize = Math.max.apply(null, graphList);
    $(CtgNode)
      .append('<a class="EntityItem" style="padding-left:30px; background-color:' + d3.lab(entity.color).brighter(0.5) + '" '+ 'data-color="'+ d3.lab(entity.color).brighter(0.5) +'" href="#">'+ text + '<span class="inlinebar" style="margin-left:0.5em">' + graphList + '</span>' + '</a>');
  });

  $('.inlinebar').sparkline('html', {type: 'bar', chartRangeMin: 0, barWidth: 8, chartRangeMax: maxSize, barColor: "#343a40", zeroColor: transGraphColor} );
  
  d3.selectAll(".EntityItem")
  .on("mouseover", function() {
      this.style.backgroundColor = d3.rgb(this.dataset.color).darker(1);
      HighlightCircle(["g-0-e-" + this.textContent.replace(' ', '_')]); // fake id to satisfy function paramenter requirement
  })
  .on("mouseout", function() {
      this.style.backgroundColor = this.dataset.color;
      RecoverCircle(0, null);
  })
}

// Function to generate a text concordance view in the form of an html
// table
function GetConcordanceTrans(word, captionArray) {
  console.log(captionArray);
  //take the captionArray and put in one string
  var allCaptions = "";
  var textWindow = 60;
  
  captionArray.forEach(function (caption) {
      allCaptions += caption["sentence"] + " ";
  });

  //now search of the index (indices) of the word in the allCaptions
  var indices = getIndicesOfTrans(word, allCaptions, false);
  //var indices = [word];

  //Array of the concordances
  var concordances = "<table id='concTable' align='center'>";

  for (var i = 0; i < indices.length; i++) {
      var index = indices[i];
      var left = index - textWindow < 0 ? 0 : index - textWindow;
      var right = index+textWindow+word.length >allCaptions.length-1?
                  allCaptions.length-1 : index + textWindow + 
                  word.length;
      var row = "<tr>" +
                  "<td align='right'>" +
                  allCaptions.substring(left, index - 1) +
                  "</td>" +
                  "<td width=10px></td>" +
                  "<td align='center'><b>" +
                  allCaptions.substring(index,
                                        index+word.length) +
                  " </b></td>" +
                  "<td width=10px></td>" +
                  "<td align='left'>" +
                  allCaptions.substring(index + word.length,
                                        right) +
                  "</td>" +
                "</tr>"
        concordances = concordances.concat(row);
  }
  concordances = concordances.concat("</table>");
  return concordances;
}

// Code credits for below function (getIndicesOf):
// http://stackoverflow.com/questions/3410464/how-to-find-all-occurrences-of-one-string-in-another-in-javascript
function getIndicesOfTrans(searchStr, str, caseSensitive) {
  searchStr = searchStr.trim();
  var startIndex = 0, searchStrLen = searchStr.length;
  var index, indices = [];
  if (!caseSensitive) {
      str = str.toLowerCase();
      searchStr = searchStr.toLowerCase();
  }
  while ((index = str.indexOf(searchStr, startIndex)) > -1) {
      indices.push(index);
      startIndex = index + searchStrLen;
  }
  return indices;
}

// Function to generate a text concordance view in the form of an html
// table
function GetConcordanceCncpt(word, senSet) {
  console.log(senSet);
  //take the senSet and put in one string
  var allCaptions = "";
  var textWindow = 60;
  
  senSet.forEach(function (caption) {
      allCaptions += caption["sentence"] + " ";
  });

  //now search of the index (indices) of the word in the allCaptions
  var indices = getIndicesOfCncpt(word, senSet, false);
  //var indices = [word];

  //Array of the concordances
  var concordances = "<table id='concTable' align='center'>";

  for (var i = 0; i < indices.length; i++) {
      var indexS = indices[i][0], indexM = indices[i][1];
      /*var left = index - textWindow < 0 ? 0 : index - textWindow;
      var right = index+textWindow+word.length >allCaptions.length-1?
                  allCaptions.length-1 : index + textWindow + 
                  word.length;*/
      var left = "";
      for (var j=0; j < indexM; j++){
        left += senSet[indexS].marks[j].origin + ' ';
      }
      var right = "";
      for (var j=indexM+1; j < senSet[indexS].marks.length; j++){
        right += senSet[indexS].marks[j].origin + ' ';
      }
      var row = "<tr>" +
                  "<td align='right'>" +
                  left +
                  "</td>" +
                  "<td width=10px></td>" +
                  "<td align='center'><b>" +
                  senSet[indexS].marks[indexM].origin +
                  " </b></td>" +
                  "<td width=10px></td>" +
                  "<td align='left'>" +
                  right +
                  "</td>" +
                "</tr>"
        concordances = concordances.concat(row);
  }
  concordances = concordances.concat("</table>");
  return concordances;
}

function getIndicesOfCncpt(searchStr, sentences, caseSensitive) {
  var indices = [];
  sentences.forEach(function(sent, indexS) {
    sent.marks.forEach(function(mark, indexM) {
      str = mark.origin;
      if (!caseSensitive) {
        str = str.toLowerCase();
        searchStr = searchStr.toLowerCase();
      }

      if (str == searchStr)
        indices.push([indexS, indexM]);
    })
  });
  return indices;
}

// Function to generate a text concordance view in the form of an html
// table
function GetConcordanceHighlight(word, senSet) {
  //take the senSet and put in one string
  var allCaptions = "";
  var textWindow = 120;
  
  senSet.forEach(function (caption) {
      allCaptions += caption["sentence"] + " ";
  });

  //now search of the index (indices) of the word in the allCaptions
  var indices = getIndicesOfHighlight(word, senSet, false);
  //var indices = [word];

  //Array of the concordances
  var concordances = "<table id='concTable' align='center'>";

  for (var i = 0; i < indices.length; i++) {
      var indexS = indices[i][0], indexM = indices[i][1];
      var conceptMark = senSet[indexS].marks[indexM];
      var left_index = conceptMark.start_char - textWindow < 0 ? 0 : conceptMark.start_char - textWindow;
      var right_index = conceptMark.end_char+textWindow >senSet[indexS].sentence.length?
                  senSet[indexS].sentence.length : 
                  conceptMark.end_char+textWindow;

      text = senSet[indexS].sentence;
      text_left = senSet[indexS].sentence.substring(left_index, conceptMark.start_char);
      text_right = senSet[indexS].sentence.substring(conceptMark.end_char, right_index);
      senSet[indexS].marks.forEach(function(mark){
        if ((mark.start_char >= left_index) && (mark.end_char < conceptMark.start_char))
          text_left = text_left.replace(text.substring(mark.start_char, mark.end_char), '<b>' + text.substring(mark.start_char, mark.end_char) + '</b>');
        else if ((mark.start_char > conceptMark.end_char) && (mark.end_char <= right_index))
          text_right = text_right.replace(text.substring(mark.start_char, mark.end_char), '<b>' + text.substring(mark.start_char, mark.end_char) + '</b>');        
      });

      var highlightColor = conceptMark.category ? colorMap[classDict[conceptMark.category.substring(1, conceptMark.category.length-1)] % colorMap.length] : "#ffff00";
      var row = "<tr>" +
                  "<td align='right'>" +
                  text_left +                   
                  "</td>" +
                  "<td width=10px></td>" +
                  "<td align='center'>" + '<span style="background-color:' + highlightColor + ' ">' + "<b>" +
                  conceptMark.origin +
                  "</b></span></td>" +
                  "<td width=10px></td>" +
                  "<td align='left'>" +
                  text_right +                  
                  "</td>" +
                "</tr>"
        concordances = concordances.concat(row);
  }
  concordances = concordances.concat("</table>");
  return concordances;
}

function getIndicesOfHighlight(searchStr, sentences, caseSensitive) {
  var indices = [];
  sentences.forEach(function(sent, indexS) {
    sent.marks.forEach(function(mark, indexM) {
      str = mark.origin;
      if (!caseSensitive) {
        str = str.toLowerCase();
        searchStr = searchStr.toLowerCase();
      }

      if (str == searchStr)
        indices.push([indexS, indexM]);
    })
  });
  return indices;
}