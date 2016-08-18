
  var data = [];

  var options = {
    region: 'All'
  };
    
  var margin = { top: 15, right: 55, bottom: 100, left: 77  };
  var width = 800 - margin.right - margin.left;
  var height = 600 - margin.top - margin.bottom;
  var binCount = 10;
    
  // FETCH DATA
  d3.json('data/data_xy.json', function (error, json) {
    if (error) { throw error; }
    data = json;
      
    var charts = [
          new Chart('sqrt_imports', 'US Imports, sqrt of millions of USD', 'sqrt_exports', 'US Exports, sqrt of millions of USD')
          ];
      
    // EVENT HANDLERS
    d3.select('#region').on('change', function () {
      options.region = d3.event.target.value;
        charts.forEach(function (chart) { chart.update(); });
    });      
      
  });

    
    function Chart(xvar, xtitle, yvar, ytitle) {
      var chart = this;
      
      chart.xvar = xvar;
      chart.yvar = yvar; 

    // SVG
      chart.svg = d3.select('#chart')
      .append('svg')
      .attr('width', width + margin.right + margin.left)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
      
    // SCALES
 
      chart.x = d3.scale.linear()
        .domain([0, d3.max(data, function (d) { return d[xvar]; })])
        .range([0, width])
        .nice();
      
      chart.y = d3.scale.linear()
      .domain([0, d3.max(data, function (d) { return d[yvar]; })])    
      .range([height, 0])    
      .nice();
      
    // AXES
      var xAxis = d3.svg.axis()
      .scale(chart.x)
      .tickSize(-height);
      
      var yAxis = d3.svg.axis()
      .scale(chart.y)
      .tickSize(-width)
      .orient('left');   
      
      chart.svg.append('g')      
          .attr('class', 'x axis')
          .call(xAxis)
          .attr('transform', 'translate(0,' + (height) + ')')
        .append('text')
          .attr('x', width/2)
          .attr('y', 70)
          .style('text-anchor', 'middle')
          .text(xtitle);            
      
      chart.svg.append('g')
          .attr('class', 'y axis')
          .call(yAxis)
        .append('text')
          .attr('transform', 'rotate(-90)')
          .attr('y', -60)
          .attr('x', -height/2)      
          .style('text-anchor', 'middle')      
          .text(ytitle);                 
              
      chart.update();
      
  }
      
          
    Chart.prototype.update = function () {
    var chart = this;
    IEdata = data.slice();
        
    if (options.region !== 'All') {
      IEdata = IEdata.filter(function (d) {
        return d.region == options.region;
      });
    }
      

        
    // SCATTERPLOT
    var points = chart.svg.selectAll('.point')
      .data(IEdata);
        
    function color(d) {
            if (d.type === 'trade') { return 'blue'; }
            else { return 'red'; }         
    }    
        
    points.enter().append('circle')
      .attr('class', 'point')
      .attr('r', 7)
      .attr('fill', function (d) { 
            if (d.type === 'trade') { return 'blue'; }
            else { return 'red'; } 
        });
//        .attr('fill', color);

    // define function to convert big numbers to something readable
    function convert(num) {
        if (num > 1000000) {
            convert.output = num/1000000;
            convert.output = convert.output.toFixed(1);
            convert.output += ' trillion';        
        } else if (num > 1000) {
            convert.output = num/1000;      
            convert.output = convert.output.toFixed(1);            
            convert.output += ' billion';        
        }        
        return '$' + convert.output;
    }        
           
    // mouseover     
    points    
      .on('mouseover', function(d) {       
    d3.select("#tooltip")
      .select("#country")
      .text(d.country);

    d3.select("#tooltip")
      .select("#import_value")
      .text('Imports: ' + convert(d.imports));     
        
    d3.select("#tooltip")
      .select("#export_value")
      .text('Exports: ' + convert(d.exports));  
        
    d3.selectAll('.point')
    .filter(function(e) {
        return e.country == d.country;
        })
//    .attr('class', 'point_pair')
    .classed('point_pair', true);
        
        
    d3.select("#tooltip").classed("hidden", false);         //Show the tooltip
    })
        .on('mouseout', function(d) {                            //Hide the tooltip
        d3.select("#tooltip").classed("hidden", true);
        d3.selectAll('.point_pair').classed('point_pair', false);
    } );        
        


        
        
    points
    .transition().duration(700)
      .attr('cx', function (d) { return chart.x(d.sqrt_imports); })
      .attr('cy', function (d) { return chart.y(d.sqrt_exports); });        
        
      points.exit()
          .transition().duration(80)
          .remove();    
  }

