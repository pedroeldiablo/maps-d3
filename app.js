d3.queue()
  .defer(d3.json, '//unpkg.com/world-atlas@1.1.4/world/50m.json')
  .defer(d3.csv, './country_data.csv', function(row){
    return {
      country: row.country,
      countryCode: row.countryCode,
      population: +row.population,
      medianAge: +row.medianAge,
      fertilityRate: +row.fertilityRate,
      populationDensity: +row.population / +row.landArea
    };
  })
  .await(function(error, mapData, populationData){
    if(error) throw error;

    var geoData = topojson.feature(mapData, mapData.objects.countries).features;

    populationData.forEach(row => {
      var countries = geoData.filter(d => d.id === row.countryCode);
      countries.forEach(country => country.properties = row);
    });
    var width = 960;
    var height = 600;

    var projection = d3.geoMercator()
      .scale(125)
      .translate([width /2, height / 1.4]);

    var path = d3.geoPath()
      .projection(projection);

    d3.select('svg')
      .attr('width', width)
      .attr('height', height)
      .selectAll('.country')
      .data(geoData)
      .enter()
      .append('path')
      .classed('country', true)
      .attr('d', path)
      .on('mousemove', showToolTip)
      .on('touchStart', showToolTip)
      .on('mouseout', hideToolTip)
      .on('touchEnd', hideToolTip);

    var select = d3.select('select');

    select
      .on('change', d => setColor(d3.event.target.value));

    setColor(select.property('value'));


    function setColor(val) {
      var colorRanges = {
        population: ['white', 'purple'],
        populationDensity: ['white', 'orange'],
        medianAge: ['deeppink', 'darkseagreen'],
        fertilityRate: ['pink', 'mediumseagreen']
      };

      var scale = d3.scaleLinear()
        .domain([0, d3.max(populationData, d => d[val])])
        .range(colorRanges[val]);

      d3.selectAll('.country')
        .transition()
        .duration(750)
        .ease(d3.easeBackIn)
        .attr('fill', d => {
          var data = d.properties[val];
          return data ? scale(data) : '#ccc';
        });
    }
  });

var tooltip = d3.select('body')
  .append('div')
  .classed('tooltip', true);

function showToolTip(d) {
  var properties = d.properties;
  tooltip
    .style('opacity', 1)
    .style('left', d3.event.x - (tooltip.node().offsetWidth /2) + 'px')
    .style('top', d3.event.y + 25 + 'px')
    .html(`
        <p>${properties.country}</p>
        <p>Population: ${properties.population.toLocaleString()}</p>
        <p>Population Density: ${properties.populationDensity.toFixed(2)} per km2</p>
        <p>Median Age: ${properties.medianAge}</p>
        <p>Fertility Rate: ${properties.fertilityRate}%</p>
      `);  
}
  
function hideToolTip() {
  tooltip
    .style('opacity', 0);
}
