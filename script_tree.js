// declare variables
var margin = {top: 24, right: 0, bottom: 0, left: 0};
    
var width = 1140,
    height = 500,    
    root,
    rname = 'Total',    
    transitioning,
    color = d3.scale.category20(),
    direction = 'data/imports_tree.json'; 
    
var svg = d3.select("#chart").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.bottom + margin.top)
  .style("margin-left", -margin.left + "px")
  .style("margin.right", -margin.right + "px")
.append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
  .style("shape-rendering", "crispEdges");    

  var grandparent = svg.append("g")
      .attr("class", "grandparent");    
    
  var x = d3.scale.linear()
      .domain([0, width])
      .range([0, width]);
  
  var y = d3.scale.linear()
      .domain([0, height])
      .range([0, height]);     

// define main function
function main(o, direction) {
        svg.selectAll('text').remove();
        svg.selectAll('rect').remove();    
        root = {};

    d3.json(direction, function(error, res) {
        if (error) throw error;       

        
    var data = d3.nest().key(function(d) { 
        return d.level_1; 
        })
        .key(function(d) { 
            return d.level_2; 
            })
        .entries(res);                  
              
    root = { key: rname, values: data };        

    var treemap = d3.layout.treemap()
      .children(function(d, depth) { return depth ? null : d._children; })
      .sort(function(a, b) { return a.value - b.value; })
      .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
      .round(false);
  
    grandparent.append("rect")
      .attr("y", -margin.top)
      .attr("width", width)
      .attr("height", margin.top);

    grandparent.append("text")
      .attr("x", 6)
      .attr("y", 6 - margin.top)
      .attr("dy", ".75em");

        
// call these functions which are defined below        
    initialize(root);
    accumulate(root);
    layout(root);
    display(root);
        
// define the four functions above    
    function initialize(root) {  
    root.x = root.y = 0;
    root.dx = width;
    root.dy = height;
    root.depth = 0;
    }

    // Aggregate the values for internal nodes. This is normally done by the
    // treemap layout, but not here because of our custom implementation.
    // We also take a snapshot of the original children (_children) to avoid
    // the children being overwritten when when layout is computed.
    function accumulate(d) {
    return (d._children = d.values)
        ? d.value = d.values.reduce(function(p, v) { return p + accumulate(v); }, 0)
        : d.value;
    }

    // Compute the treemap layout recursively such that each group of siblings
    // uses the same size (1×1) rather than the dimensions of the parent cell.
    // This optimizes the layout for the current zoom state. Note that a wrapper
    // object is created for the parent node for each group of siblings so that
    // the parent’s dimensions are not discarded as we recurse. Since each group
    // of sibling was laid out in 1×1, we must rescale to fit using absolute
    // coordinates. This lets us use a viewport to zoom.
    function layout(d) {
        if (d._children) {
          treemap.nodes({_children: d._children});
          d._children.forEach(function(c) {
            c.x = d.x + c.x * d.dx;
            c.y = d.y + c.y * d.dy;
            c.dx *= d.dx;
            c.dy *= d.dy;
            c.parent = d;
            layout(c);
          });
        }
    }

  function display(d) {
    grandparent
        .datum(d.parent)
        .on("click", transito)
      .select("text")
        .text(name(d));

    var g1 = svg.insert("g", ".grandparent")
        .datum(d)
        .attr("class", "depth");

    var g = g1.selectAll("g")
        .data(d._children)
        .enter().append("g");             

    g.filter(function(d) { return d._children; })
        .classed("children", true)
        .on("click", transito);

    var children = g.selectAll(".child")
        .data(function(d) { return d._children || [d]; })
      .enter().append("g");

    children.append("rect")
        .attr("class", "child")
        .call(rect);
      
    children.append("text")
        .attr("class", "ctext").attr('font-size', '16px')
        .text(function(d) { return d.key; })
        .call(text2);

    g.append("rect")
        .attr("class", "parent")
        .call(rect);

    var t = g.append("text")
        .attr("class", "ptext")
        .attr("dy", ".75em");
    
    t.append("tspan")
        .text(function(d) { return d.key; });
    t.append("tspan")
        .attr("dy", "1.0em")
        .text(function(d) { return convert(d.value); });    
    t.call(text);

    g.selectAll("rect")
//        .style("fill", function(d) { return color(d.key); });
    
            .style("fill", function(d) {
                if (d.key) {
                    return color(d.key);
                    console.log('key');
                } else if (d['level_2']) {
                    return color(d['level_2']);
                    console.log('lev 2');
                } else {
                    return color(d['level_1']);
                }
        
        });
    

    toolp = d3.select("body").append("div")   
    .attr("class", "tooltip")               
    .style("opacity", 0);            

      d3.selectAll('.child')
      .on('mouseover', function(d) {  
                  toolp.transition()
                .duration(50)
                .style('opacity', 1)
                .style("left", (d3.event.pageX + 10) + "px")     
                .style("top", (d3.event.pageY - 30) + "px");
                
        
                toolp.append('p')
                .attr('class', 'tooltip_text')
                .html(function() {
                if (d['key']) {
                    return d.parent['key'] + '<br>' + '> ' + d['key'] + '<br>' + '>  ' + convert(d.value);
//                    return d.parent['key'] + '> ' + d['key'] +  '>  ' + convert(d.value);                    
                    } else if (d['level_2']) {
                        return d['level_1'] + '<br>' + '> ' + d['level_2'] + '<br>' + '>  ' + convert(d.value);
                    } else if (d['level_1']) {
                        return d['level_1']  + '<br>' + '>  ' + convert(d.value);
                    } else {
                        return d['parent']['key']  + '<br>' + '>  ' + convert(d.value);
                    }
                })
            })
            .on("mouseout", function(d) {       
                toolp.html('')
                .transition()        
                .duration(0)      
                .style("opacity", 0)
        });        
      
      
      

    function transito(d) {
      if (transitioning || !d) return;
      transitioning = true;

        toolp.remove();
        
      var g2 = display(d),
          t1 = g1.transition().duration(600),
          t2 = g2.transition().duration(600);

      // Update the domain only after entering new elements.
      x.domain([d.x, d.x + d.dx]);
      y.domain([d.y, d.y + d.dy]);

      // Enable anti-aliasing during the transition.
      svg.style("shape-rendering", null);

      // Draw child nodes on top of parent nodes.
      svg.selectAll(".depth").sort(function(a, b) { return a.depth - b.depth; });

      // Fade-in entering text.
      g2.selectAll("text").style("fill-opacity", 0);

      // Transition to the new view.
      t1.selectAll(".ptext").call(text).style("fill-opacity", 0);
      t1.selectAll(".ctext").call(text2).style("fill-opacity", 0);
      t2.selectAll(".ptext").call(text).style("fill-opacity", 1);
      t2.selectAll(".ctext").call(text2).style("fill-opacity", 1);
      t1.selectAll("rect").call(rect);
      t2.selectAll("rect").call(rect);

      // Remove the old node when the transition is finished.
      t1.remove().each("end", function() {
        svg.style("shape-rendering", "crispEdges");
        transitioning = false;
      });
    }

    return g;
      
  }

    
    
    
      function text(text) {
        text.selectAll("tspan")
            .attr("x", function(d) { return x(d.x) + 6; })
        text.attr("x", function(d) { return x(d.x) + 6; })
            .attr("y", function(d) { return y(d.y) + 6; })
            .style("opacity", function(d) { return this.getComputedTextLength() < x(d.x + d.dx) - x(d.x) ? 1 : 0; });
      }



      function text2(text) {
        text.attr("x", function(d) { return x(d.x + d.dx) - this.getComputedTextLength() - 6; })
            .attr("y", function(d) { return y(d.y + d.dy) - 6; })
            .style("opacity", function(d) { return this.getComputedTextLength() < x(d.x + d.dx) - x(d.x) ? 1 : 0; });
      }


      function rect(rect) {
        rect.attr("x", function(d) { return x(d.x); })
            .attr("y", function(d) { return y(d.y); })
            .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
            .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); });
      }

      function name(d) {
        return d.parent
            ? name(d.parent) + " > " + d.key + " (" + convert(d.value) + ")"
            : d.key + " (" + convert(d.value) + ")";      
      }
    });        
}
    
    

    
// calling the main function; defaults to imports
    main("Imports of Services", direction);        

// call the main function again if you change the selector       
    d3.selectAll("input").on("change", function change() {    
        if (this.value == 'imports') {
            file = 'data/imports_tree.json';
            title = 'Imports of Services';      
        } else if (this.value == 'exports') {
            file = 'data/exports_tree.json';
            title = 'Exports of Services';              
        }

svg.selectAll('rect').remove();
svg.selectAll('text').remove(); 
main(title, file);        
       

    });
    

// convert big numbers to something readable
    function convert(num) {
        if (num > 1000000) {
            convert.output = num/1000000;
            convert.output = convert.output.toFixed(1);
            convert.output += ' tr';        
        } else if (num > 1000) {
            convert.output = num/1000;      
            convert.output = convert.output.toFixed(1);            
            convert.output += ' b';        
        } else {
            convert.output = num + ' m';
        }       
        return '$' + convert.output;
    }  