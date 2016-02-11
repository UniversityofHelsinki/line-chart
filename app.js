lineChart("ranking.csv", ["#0072C5", "#FFA824", '#E21831', '#3E0605'], "#line-chart");

function lineChart(filePath, colors, selector) {
  var x_column = "Year";
  var constructedData;

  d3.dsv(";", "text/plain")(filePath, function(error, data) {
    data.map(function(d) {
      d[x_column] = +d[x_column];
    });

    var name_columns = d3.keys(data[0])
      .filter(function(key) {
        return key !== x_column;
      });

    color = d3.scale.ordinal()
      .domain(name_columns)
      .range(colors);

    constructedData = name_columns.map(function(name_column) {
      return {
        name: name_column,
        values: data.map(function(d) {
          if (d[name_column] === "") {
            return {
              x: +d[x_column]
            };
          }
          else {
            return {
              x: +d[x_column],
              y: +d[name_column]
            };
          }
        })
      }
    });

    drawSeries(constructedData);
  });

  var legend_y_scale = d3.scale.ordinal()
    .domain(["Taiwan", "Shanghai", "QS", "Times"])
    .range([0, 1, 2, 3]);

  function drawSeries() {
    if (constructedData.length === 0)
      return;

    var chart = d3.select(selector);
    var boundingWidth = chart.node().getBoundingClientRect().width;
    if (boundingWidth > 800)
      boundingWidth = 800;

    var margin = {
      top: 20,
      right: 20,
      bottom: 30,
      left: 50
    };

    var width = boundingWidth - margin.left - margin.right;
    var height = (boundingWidth / 1.5) - margin.top - margin.bottom;

    var svg = d3.select(selector)
      .append("div")
      .classed("svg-container", true)
      .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (height + margin.top + margin.bottom))
      .classed("svg-content-responsive", true)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var i_scale, y_scale, colors;

    var range = {
      y_min: 9999,
      y_max: -9999,
      x_min: 9999,
      x_max: -9999
    };

    constructedData.map(function(serie) {
      serie.values.map(function(d, i) {
        if (range.y_min > d.y) range.y_min = d.y;
        if (range.y_max < d.y) range.y_max = d.y;
        if (range.x_min > d.x) range.x_min = d.x;
        if (range.x_max < d.x) range.x_max = d.x;
        d.i = i;
      });
      var y_margins = (range.y_max - range.y_min)/10;
      range.y_max += y_margins;
      range.y_min -= y_margins;
    });

    var transitionTime = 2000;

    i_scale = d3.scale.linear()
      .domain([0, constructedData[0].values.length - 1])
      .range([0, width]);

    x_scale = d3.scale.linear()
      .domain([range.x_min, range.x_max])
      .range([0, width]);

    y_scale = d3.scale.linear()
      .domain([range.y_min, range.y_max])
      .range([0, height]);

    var xAxis = d3.svg.axis()
      .scale(x_scale)
      .orient("bottom")
      .tickFormat(function(d) {
        return width > 500 ? d : "'" + String(d).slice(-2);
      })
      .innerTickSize(-5)
      .outerTickSize(1)
      .tickPadding(10);

    var yAxis = d3.svg.axis()
      .scale(y_scale)
      .ticks(8)
      .orient("left")
      .tickFormat(function(d) {
        return d;
      })
      .innerTickSize(-width)
      .outerTickSize(1)
      .tickPadding(10);

    var lineFunction = d3.svg.line()
      .x(function(d) {
        return i_scale(d.i);
      })
      .defined(function(d) {
        return 'y' in d;
      })
      .y(function(d) {
        return y_scale(d.y);
      });

    var chart = svg.selectAll(".dataset")
      .data(constructedData)
      .enter();

    svg.append("g")
      .style("font-family", "Open Sans")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .attr("fill", "#000")
      .call(xAxis)
    .selectAll(".tick>text")
      .attr("class", function(d) {
        return 'year year_' + d;
      });

    svg.append("g")
      .style("font-family", "Open Sans")
      .attr("class", "y axis")
      .attr("transform", "translate(" + 0 + ",0)")
      .attr("fill", "#000")
      .call(yAxis);

    chart.append('path')
      .attr('fill', 'none')
      .attr('stroke', function(d) {
        return color(d.name);
      })
      .attr('stroke-width', width/175)
      .data(constructedData)
      .transition()
      .duration(transitionTime)
      .attrTween('d', function(d) {
        return getSmoothInterpolationFromPoint(d.values)(d);
      });

    var focus = svg.append("g");
    var focusline = focus.append("line")
      .attr("y1", 0)
      .attr("y2", height)
      .attr("x1", width)
      .attr("x2", width)
      .style("stroke", "#ccc")
      .style("stroke-width", 1);

    var point = chart.append("g")
      .attr("class", "line-point");

    point.selectAll('circle')
      .data(function(d) {
        return d.values.map(function(e) {
            e["name"] = d.name;
            return e;
          })
          .filter(function(e) {
            return "y" in e;
          });
      })
      .enter().append('circle')
      .attr("cx", function(d) {
        return i_scale(d.i);
      })
      .attr("cy", function(d) {
        return y_scale(d.y);
      })
      .attr("fill-opacity", 0)
      .style("fill", function(d) {
        return color(d.name);
      })
      .attr("stroke-opacity", 0)
      .style("stroke", function(d) {
        return color(d.name);
      })
      .attr("r", width/200)
      .transition()
      .duration(transitionTime)
      .attr("fill-opacity", 1);

    var tooltip_height = height/4;
    var tooltip_text_size = (tooltip_height)/ (7.2);
    var tooltip_text_height = tooltip_text_size * 1.5;
    var tooltip_width = width/4;
    var ttip_top = height - tooltip_height;

    ttipScale = d3.scale.linear()
      .domain([0, width])
      .range([0, width - tooltip_width]);

    var tooltip = svg.append("rect")
      .attr("width", tooltip_width)
      .attr("height", tooltip_height - tooltip_text_height/2)
      .attr("y", ttip_top)
      .classed("tooltip", true);

    var legend = chart.append("g")
      .attr("class", "legend");

    var legend_height = 20;
    var legend_width = 20;
    var legend_padding = 10;

    legend.datum(function(d) {
      var y_values = {};
      d.values.map(function(d) {
        y_values[d.x] = d.y;
      });
      return {
        name: d.name,
        values: y_values
      };
    });

    var legend_y = function(d) {
      return ttip_top + tooltip_text_size + legend_y_scale(d.name) * tooltip_text_height;
    };

    legend.append("text")
      .classed("legend-name", true)
      .text(function(d) {
        return d.name;
      })
      .attr("text-anchor", "left")
      .attr("alignment-baseline", "middle")
      .style("font-family", "Open Sans")
      .style("font-weight", "Bold")
      .style("font-size", tooltip_text_size)
      .attr("y", legend_y)
      .style("fill", function(d) {
        return d3.hcl(color(d.name)).darker(1);
      })
      .style("fill-opacity", 0)
      .transition()
      .duration(transitionTime)
      .style("fill-opacity", 1);

    legend.append("text")
      .classed("legend-number", true)
      .attr("text-anchor", "end")
      .attr("alignment-baseline", "middle")
      .style("font-family", "Open Sans")
      .style("font-weight", "Bold")
      .style("font-size", tooltip_text_size)
      .attr("y", legend_y)
      .style("fill", function(d) {
        return d3.hcl(color(d.name)).darker(1);
      })
      .style("fill-opacity", 0)
      .transition()
      .duration(transitionTime)
      .style("fill-opacity", 1);

    legend.append("rect")
      .style("fill", function(d) {
        return color(d.name);
      })
      .attr("y", function(d) { return legend_y(d) - tooltip_text_size/1.8; })
      .attr("width", tooltip_text_size)
      .attr("height", tooltip_text_size);

    var overlay = svg.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
      .on("mouseover", function() {
        focus.style("display", null);
      })
      .on("mouseout", function() {
        moveTo(2015);
        focus.style("display", "none");
      })
      .on("mousemove", mousemove);


    function getY(i) {
      return function(d) {
        return d.values[i];
      }
    }

    var mouse_max = 2015;
    var mouse_old = mouse_max;

    function mousemove() {
      var mouse_x = d3.mouse(this)[0];
      var mouse_i = Math.floor(x_scale.invert(mouse_x));

      if (mouse_i !== mouse_old) {
        moveTo(mouse_i);
      }
    }

    function moveTo(mouse_i) {
      function defined(d, i) {
        return d.values[i] !== undefined;
      }

      legend.attr("opacity", function(d) {
        return defined(d, mouse_old) ? 1 : 0;
      })
      .transition(1000)
      .attr("opacity", function(d) {
        return defined(d, mouse_i) ? 1 : 0;
      })

      legend.selectAll("rect")
        .attr("x", tooltip_text_height/2 + ttipScale(x_scale(mouse_old)))
        .transition(1000)
        .attr("x", tooltip_text_height/2 + ttipScale(x_scale(mouse_i)));

      legend.selectAll("text.legend-name")
        .attr("x", tooltip_text_height + tooltip_text_size + ttipScale(x_scale(mouse_old)))
        .transition(1000)
        .attr("x", tooltip_text_height + tooltip_text_size + ttipScale(x_scale(mouse_i)));

      legend.selectAll("text.legend-number")
        .text(function(d) {
          return defined(d, mouse_i) ? d.values[mouse_i] : '';
        })
        .attr("x", tooltip_width - tooltip_text_height/2 + ttipScale(x_scale(mouse_old)))
        .transition(1000)
        .attr("x", tooltip_width - tooltip_text_height/2  + ttipScale(x_scale(mouse_i)));

      focusline.attr("x1", x_scale(mouse_old))
        .attr("x2", x_scale(mouse_old))
        .transition(1000)
        .attr("x1", x_scale(mouse_i))
        .attr("x2", x_scale(mouse_i));

      tooltip.attr("x", ttipScale(x_scale(mouse_old)))
        .transition(1000)
        .attr("x", ttipScale(x_scale(mouse_i)));

      d3.selectAll(".year")
        .style("font-weight", "normal");

      if (mouse_i !== mouse_max) {
        d3.selectAll('.year_' + mouse_i)
          .style("font-weight", "Bold");
      }

      mouse_old = mouse_i;
    }
    moveTo(2015);

    function getSmoothInterpolationFromPoint(data) {

      return function(d, i, a) {

        var interpolate = d3.scale.linear()
          .domain([0, 1])
          .range([0, data.length]);

        // Returns line path as function of time
        return function(t) {
          var flooredX = Math.floor(interpolate(t));
          var weight = interpolate(t) - flooredX;

          var interpolatedLine = data.slice(0, flooredX)
            .filter(function(d) {
              return 'y' in d;
            });

          var weightedLineAverage = 0;

          if (flooredX < data.length) {
            weightedLineAverage += data[flooredX].y * weight;
          }

          if (flooredX > 0) {
            weightedLineAverage += data[flooredX - 1].y * (1 - weight);
          }

          if (weightedLineAverage !== null && !isNaN(weightedLineAverage)) {
            interpolatedLine.push({
              "i": interpolate(t) - 1,
              "y": weightedLineAverage
            });
          }

          if (interpolatedLine.length === 0) {
            return ""; // No path in SVG
          }

          return lineFunction(interpolatedLine);
        }
      }
    } // getSmoothInterpolationFromPoint
  } // drawSeries
} // lineChart
