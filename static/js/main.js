// global variables
var hoverHighlight = 'rgba(232, 138, 12, 1)'; //#E88A0C
var transGraphColor = 'rgba(100, 100, 100, 0.2)';//#7B7B7B
var hoverFadeOut = 'rgba(17, 17, 17, 0.7)'; //#111111
var prevClickedRow = '';
var isRowClicked = false;
var szScale = 0.1; // the scale to invoke semantic zooming
var szLevel = 3; // the number of levels to show (for semantic zooming)
var szPadding = 7; // the distance between two contours
var szStrokeWidth = 3; // the stroke width of the contour
var graphNum = 0; // the number of graphs in the canvas now
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
  d3.lab(85,0,0),     //#D4D4D4
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
          console.log( $(this).parent());
          $(this).parent().remove();
        });

        //send data to the server
        var data = {};
        data['filename'] = text;

        $.post("/loadGraph",data,
        function(jsonData,status){
            try {
              // draw bubble treemap
              let svg1 = d3.select("#svgCircles"+graphNum);
              svg1.selectAll("*").remove();
              jsonData["hierarchy"].children.sort((a,b) => (a.name > b.name ? 1 : -1));
              drawChart(jsonData["hierarchy"], svg1, graphNum);
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
});

function drawChart(data, svg, graphID) {
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
        .range([d3.lab("#111111"), d3.lab('#AAAAAA')]); // Fill_Lighter outside, darker inside
        //.range([d3.lab("#333333"), d3.lab('#CCCCCC')]); //Fill_Darker outside, lighter inside

    // Do layout and coloring.
    let hierarchyRoot = bubbletreemap.doLayout().doColoring().hierarchyRoot();

    let leafNodes = hierarchyRoot.descendants().filter(function (candidate) {
        return !candidate.children;
    });

    let zoomGroup = svg.append("g");

    // Draw contour.
    let contourGroup = zoomGroup.append("g")
        .attr("class", "contour")
        .style('transform', 'translate(50%, 50%)');

    let tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([5, 0])
      .direction('e');
    svg.call(tip);

    let zoom = d3.zoom()
      .scaleExtent([(-2*szScale+0.99), 5])
      .on("zoom", function () {
        zoomGroup.attr("transform", d3.event.transform);
        SemanticZooming_1(bubbletreemap, svg, leafNodes, graphID, contourColor, tip, root.height);
      });
    svg.call(zoom);

    svg.node().addEventListener("resize", function(){
      console.log("here");
    });

    path = contourGroup.selectAll("path")
        .data(bubbletreemap.getContour(szLevel)) //semantic_zooming_1
        //.data(bubbletreemap.getContour(root.height, szPadding)) //semantic_zooming_2
        .enter().append("path")
        .attr("id", function(d) { return "g-" + graphID + "-" + "c-" + d.name.substring(d.name.lastIndexOf("/")+1, d.name.length-1).replace(/%/g, '');})
        .attr("d", function(arc) { return arc.d; })
        .style("stroke", function(arc) {
            return "black"; // fill
            //return contourColor(arc.depth); // contour
        })
        .style("stroke-width", function(arc) { 
            //return 6-arc.depth*0.7; // Thicker outside, thinner inside
            //return 1+arc.depth*0.7; // Thinner outside, thicker inside
            return szStrokeWidth; // fill
        })
        .style("fill-opacity", 0.7) 
        .style("fill", function(arc) {
            //return "white"; // contour
            return contourColor(arc.depth);// fill
        })
        .attr("transform", function(arc) {return arc.transform;})
        .on("mouseover", function(d, i) {
            // Use D3 to select element, change size
            d3.selectAll("#"+this.id)
            .style("fill-opacity", 0.7) 
            .style("fill", hoverHighlight)
            //.style("fill", function(arc) { return d3.rgb(contourColor(arc.depth)).darker(2);})
            .style("stroke-width", szStrokeWidth*2);
            
            labelText = d.name.substring(d.name.lastIndexOf("/")+1, d.name.length-1);
            tip.html(labelText).show();
        })
        .on("mouseout", function(d, i) {
            tip.hide();
            // Use D3 to select element, change size
            d3.selectAll("#"+this.id)
            .style("fill-opacity", 0.7) // fill:1.0 contour:0.0
            //.style("fill", "white") // contour
            .style("fill", function(arc) { return contourColor(arc.depth);})// fill
            .style("stroke-width", szStrokeWidth);
        });
        
    // Draw circles.
    let circleGroup = zoomGroup.append("g")
        .attr("class", "circlesAfterPlanck")
        .style('transform', 'translate(50%, 50%)');

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
        .style("stroke", "black")
        //.style("fill-opacity", 0.7)
        //.style("stroke-width", "1")
        .on("mouseover", function(d, i) {
            // Use D3 to select element, change size
           /* d3.select(this)
            //.attr("r", d.r*1.1)
            .style("fill", d3.rgb(d.color).darker(0.8));*/
            
            d3.selectAll("#"+this.id)
            .style("stroke-width", "4")
            .style("fill", hoverHighlight)
            .style("stroke", "black")
            //.style("fill", d3.rgb(d.color).darker(1))
            //.style("stroke", hoverHighlight)
            //.attr("r", function(d) { return d.r+2; })
            
            labelText = d.data.name.substring(d.data.name.lastIndexOf("/")+1, d.data.name.length-1);
            tip.html(labelText).show();
                
            // highlight rectangles in transcript view
            d.data.location.forEach(function(location) {
              d3.select("#g-" + graphID + "-" + "rSen" + "-" + location[0])
                .attr('fill', hoverHighlight);
            });            
        })
        .on("mouseout", function(d, i) {
            tip.hide();
            // Use D3 to select element, change size
            d3.selectAll("#"+this.id)
            //d3.select(this)
            .style("fill", d.color)
            .style("stroke-width", "0")
            .attr("r", function(d) { return d.r; });

            d.data.location.forEach(function(location) {
              d3.select("#g-" + graphID + "-" + "rSen" + "-" + location[0])
                .attr('fill', transGraphColor);
            }); 
        });
}

function drawTrans(senList, svg, graphID, speakerDiff=0) {
  svg.selectAll("*").remove();

  var w = $("#transGraphContent").width();
  var h = $("#transGraphContent").height();

  var docLength = senList.length;
  var transcriptScale = d3.scaleLinear()
                          .domain([0, docLength])
                          .range([0, h]);
  var constantHeight = 0;
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
    d.y = yloc;
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
    if (constantHeight !== 0){
      d.height = 10;
    } else {
      // var endSec = hmsToSec(captionArray[i][1]);
      var endSec = i+1;
      d.endTime = endSec;
      // var startSec = hmsToSec(captionArray[i][0]);
      var startSec = i;
      var scaledHeight = transcriptScale(endSec - startSec);
      if (scaledHeight < 1){
        d.height = 1;
      } else {
        d.height = scaledHeight;
      };
    }
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
    tip.html(genTipsHtml(d, i)).show();
    d3.select(this).attr("height", 5);
    //if ((prevClickedTag === "") && !(isRowClicked)){
    d3.select(this).attr('fill', hoverHighlight);
    //}
    d3.select(this).attr('z', 50);

    // highlight corresponding raw text
    var textId = d3.select(this).attr('id').replace('rSen', 'line');
    d3.select('#'+textId).style('background-color', hoverHighlight);

    // highlight corresponding circles
    d.marks.forEach(function(mark) {
      entityName = mark.entityURI.substring(mark.entityURI.lastIndexOf("/")+1, mark.entityURI.length-1).replace(/%/g, '');
      entityCircle = d3.select("#g-" + graphID + "-" + "e-" + entityName);
      if (!entityCircle.empty())
          entityCircle.style("stroke-width", "4");
                      //.style("stroke", "black")
                      //.style("fill", hoverHighlight);
                      //.attr("r", function(d) { return d.r+2; })
                      //.style("stroke", hoverHighlight)
                      //.style("fill", d3.rgb(entityCircle.attr("data-color")).darker(1));
    });

    // fade out other circles
    otherCircle = d3.selectAll("circle").filter(function(circle){
      flag = true;
      d.marks.forEach(function(mark) {
        if (circle.data.name === mark.entityURI) {
          flag = false;
        }
      });
      return flag;
    });

    if (!otherCircle.empty())
      otherCircle.style("fill", transGraphColor);
  })
  .on("mouseout", function(d){
    tip.hide();
    d3.select(this).attr("height", d.height);
    d3.select(this).attr('fill', d.fillColor);
    //}
    d3.select(this).attr('z', 1);
    /*$("#transTable").find("td").removeClass("hoverHighlight");*/

    // recover corresponding raw text
    var textId = d3.select(this).attr('id').replace('rSen', 'line');
    d3.select('#'+textId).transition().style('background-color', null);

    // recover the color of fade out circles
    otherCircle = d3.selectAll("circle").filter(function(circle){
      flag = true;
      d.marks.forEach(function(mark) {
        if (circle.data.name === mark.entityURI) {
          flag = false;
        }
      });
      return flag;
    });

    if (!otherCircle.empty()){
      otherCircle.style("fill", function(circle) {
        return circle.color;
      });
    }

    // recover the color of highlighted circles
    d.marks.forEach(function(mark) {
      entityName = mark.entityURI.substring(mark.entityURI.lastIndexOf("/")+1, mark.entityURI.length-1).replace(/%/g, '');
      entityCircle = d3.select("#g-" + graphID + "-" + "e-" + entityName);
      if (!entityCircle.empty())
        entityCircle.style("stroke-width", "0");
                    //.style("fill", entityCircle.attr("data-color"))
                    //.attr("r", function(d) { return d.r; })
    });
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
      d3.select('#'+rectId).attr('fill', hoverHighlight);
    })
    .on("mouseout", function(){
      d3.select(this).style('background-color', null);
      var rectId = d3.select(this).attr('id').replace('line', 'rSen');
      d3.select('#'+rectId).attr('fill', transGraphColor);
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
    s_html = s_html + '<span style="background-color:' + colorMap[classDict[mark.category.substring(1, mark.category.length-1)] % colorMap.length] + ' ">' + "<font color='#212529'>" + text.substring(mark.start_char, mark.end_char) + '</font></span>';
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

function SemanticZooming_1(bubbletreemap, svg, leafNodes, graphID, contourColor, tip, treeHeight) {
  szLevel = 3 + Math.floor((d3.event.transform.k-1)/szScale);
  szLevel = szLevel<=treeHeight? szLevel : treeHeight;

  // update contours
  let newPath = svg.select("g").select(".contour").selectAll("path")
    .data(bubbletreemap.getContour(szLevel));
  newPath.exit().remove();
  newPath.enter().append("path")
    .attr("id", function(d) { return "g-" + graphID + "-" + "c-" + d.name.substring(d.name.lastIndexOf("/")+1, d.name.length-1).replace(/%/g, '');})
    .attr("d", function(arc) { return arc.d; })
    .style("stroke", function(arc) {
        return "black"; // fill
        //return contourColor(arc.depth); // contour
    })
    .style("stroke-width", function(arc) { 
        //return 6-arc.depth*0.7; // Thicker outside, thinner inside
        //return 1+arc.depth*0.7; // Thinner outside, thicker inside
        return arc.strokeWidth; // fill
    })
    .style("fill-opacity", 0.7) 
    .style("fill", function(arc) {
        //return "white"; // contour
        return contourColor(arc.depth);// fill
    })
    .attr("transform", function(arc) {return arc.transform;})
    .on("mouseover", function(d, i) {
        // Use D3 to select element, change size
        d3.selectAll("#"+this.id)
        .style("fill-opacity", 0.7) 
        .style("fill", hoverHighlight)
        //.style("fill", function(arc) { return d3.rgb(contourColor(arc.depth)).darker(2);})
        .style("stroke-width", function(arc) { return arc.strokeWidth*2; });
        
        labelText = d.name.substring(d.name.lastIndexOf("/")+1, d.name.length-1);
        tip.html(labelText).show();
    })
    .on("mouseout", function(d, i) {
        tip.hide();
        // Use D3 to select element, change size
        d3.selectAll("#"+this.id)
        .style("fill-opacity", 0.7) // fill:1.0 contour:0.0
        //.style("fill", "white") // contour
        .style("fill", function(arc) { return contourColor(arc.depth);})// fill
        .style("stroke-width", function(arc) { return arc.strokeWidth; });
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
    .attr("data-color", function(d) { return d.color; })
    .style("fill", function(d) { return d.color; })
    //.style("fill-opacity", 0.7)
    //.style("stroke", "black")
    //.style("stroke-width", "1")
    .on("mouseover", function(d, i) {
        // Use D3 to select element, change size
      /* d3.select(this)
        //.attr("r", d.r*1.1)
        .style("fill", d3.rgb(d.color).darker(0.8));*/
        
        d3.selectAll("#"+this.id)
        .style("stroke-width", "4")
        .style("fill", hoverHighlight)
        .style("stroke", "black")
        //.style("fill", d3.rgb(d.color).darker(1))
        //.style("stroke", hoverHighlight)
        //.attr("r", function(d) { return d.r+2; })
        
        labelText = d.data.name.substring(d.data.name.lastIndexOf("/")+1, d.data.name.length-1);
        tip.html(labelText).show();
            
        // highlight rectangles in transcript view
        d.data.location.forEach(function(location) {
          d3.select("#g-" + graphID + "-" + "rSen" + "-" + location[0])
            .attr('fill', hoverHighlight);
        });            
    })
    .on("mouseout", function(d, i) {
        tip.hide();
        // Use D3 to select element, change size
        d3.selectAll("#"+this.id)
        //d3.select(this)
        .style("fill", d.color)
        .style("stroke-width", "0")
        .attr("r", function(d) { return d.r; });

        d.data.location.forEach(function(location) {
          d3.select("#g-" + graphID + "-" + "rSen" + "-" + location[0])
            .attr('fill', transGraphColor);
        }); 
    });
}

function SemanticZooming_2(bubbletreemap, svg, leafNodes, graphID, contourColor, tip, treeHeight) {
  szPadding = 7 + Math.floor((d3.event.transform.k-1)/szScale);
  //showLevel = showLevel<=treeHeight? showLevel : treeHeight;

  // updata contours
  let newPath = svg.select("g").select(".contour").selectAll("path")
    .data(bubbletreemap.getContour(-1));
  
  newPath.exit().remove();

  newPath = svg.select("g").select(".contour").selectAll("path")
    .data(bubbletreemap.getContour(treeHeight, szPadding));
  newPath.enter().append("path")
    .attr("id", function(d) { return "g-" + graphID + "-" + "c-" + d.name.substring(d.name.lastIndexOf("/")+1, d.name.length-1).replace(/%/g, '');})
    .attr("d", function(arc) { return arc.d; })
    .style("stroke", function(arc) {
        return "black"; // fill
        //return contourColor(arc.depth); // contour
    })
    .style("stroke-width", function(arc) { 
        //return 6-arc.depth*0.7; // Thicker outside, thinner inside
        //return 1+arc.depth*0.7; // Thinner outside, thicker inside
        return arc.strokeWidth; // fill
    })
    .style("fill-opacity", 0.7) 
    .style("fill", function(arc) {
        //return "white"; // contour
        return contourColor(arc.depth);// fill
    })
    .attr("transform", function(arc) {return arc.transform;})
    .on("mouseover", function(d, i) {
        // Use D3 to select element, change size
        d3.selectAll("#"+this.id)
        .style("fill-opacity", 0.7) 
        .style("fill", hoverHighlight)
        //.style("fill", function(arc) { return d3.rgb(contourColor(arc.depth)).darker(2);})
        .style("stroke-width", szStrokeWidth*2);
        
        labelText = d.name.substring(d.name.lastIndexOf("/")+1, d.name.length-1);
        tip.html(labelText).show();
    })
    .on("mouseout", function(d, i) {
        tip.hide();
        // Use D3 to select element, change size
        d3.selectAll("#"+this.id)
        .style("fill-opacity", 0.7) // fill:1.0 contour:0.0
        //.style("fill", "white") // contour
        .style("fill", function(arc) { return contourColor(arc.depth);})// fill
        .style("stroke-width", szStrokeWidth);
    });
}