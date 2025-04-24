// ——— Research Question 4 Title ———
function _1(md){return(
  md`# Research Question 4`
)}

// ——— Load D3.js Library ———
function _d3(require){return(
  require('d3@7')
)}

// ——— Encode Categorical Variables to Numeric Index ———
function _encodeCategory(){return(
  function encodeCategory(value, categories) {
    const index = categories.indexOf(value);
    return index !== 0 ? index : 0; // Return 0 if the category doesn't exist
  }
)}

// ——— Scale Correlation Coefficient for Color Mapping ———
function _scaleCorrelation(d3){return(
  (correlation) => {
    const scale = d3.scaleLinear()
      .domain([-5, 5])  
      .range([-1, 1]); 

    return scale(correlation);
  }
)}

// ——— Load and Transform Dataset ———
function _data(d3,encodeCategory){return(
  d3.csv('https://raw.githubusercontent.com/balleromair12/DataViz_finalproject/main/heart_2020_cleaned.csv', d => {
    return {
      heartDisease: d.HeartDisease === 'Yes' ? 1 : 0, // Heart disease 
      bmi: +d.BMI, // Body Mass Index
      smoking: d.Smoking === 'Yes' ? 1 : 0, // Smoking 
      alcoholDrinking: d.AlcoholDrinking === 'Yes' ? 1 : 0, // Alcohol Drinking 
      stroke: d.Stroke === 'Yes' ? 1 : 0, // Stroke 
      physicalHealth: +d.PhysicalHealth, // Physical health condition
      mentalHealth: +d.MentalHealth, // Mental health condition
      diffWalking: d.DiffWalking === 'Yes' ? 1 : 0, // Difficulty walking 
      sex: d.Sex === 'Male' ? 1 : 0, // Sex 
      
      // Label encoding for AgeCategory
      ageCategory: encodeCategory(d.AgeCategory, ['18-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74', '75-79', '80 or older']),
      
      // Label encoding for Race
      raceCategory: encodeCategory(d.Race, ['American Indian/Alaskan Native', 'White', 'Black', 'Asian', 'Hispanic', 'Other']),
      
      diabetic: d.Diabetic === 'Yes' ? 1 : 0, // Diabetic 
      physicalActivity: d.PhysicalActivity === 'Yes' ? 1 : 0, // Physical Activity 
      
      // Label encoding for GenHealth
      genHealth: encodeCategory(d.GenHealth, ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor']),
      
      sleepTime: +d.SleepTime, // Sleep time
      asthma: d.Asthma === 'Yes' ? 1 : 0, // Asthma 
      kidneyDisease: d.KidneyDisease === 'Yes' ? 1 : 0, // Kidney Disease 
      skinCancer: d.SkinCancer === 'Yes' ? 1 : 0, // Skin Cancer 
    };
  })
)}

// ——— Compute Point-Biserial Correlation Between Binary and Continuous Variables ———
function _pointBiserialCorrelation(d3,scaleCorrelation){return(
  (data, target, variable) => {
    const targetValues = data.map(d => d[target]);
    const variableValues = data.map(d => d[variable]);

    // Separate the variable values based on target variable
    const targetGroup1 = variableValues.filter((_, index) => targetValues[index] === 1);
    const targetGroup0 = variableValues.filter((_, index) => targetValues[index] === 0);

    // Mean and standard deviation of the groups
    const mean1 = d3.mean(targetGroup1);
    const mean0 = d3.mean(targetGroup0);
    const stdDev1 = d3.deviation(targetGroup1);
    const stdDev0 = d3.deviation(targetGroup0);

    if (stdDev1 === 0 || stdDev0 === 0) {
      return 0; // If any group has no variance, return 0 correlation
    }

    // Calculate point-biserial correlation coefficient
    let correlation = 0
    const denom = Math.sqrt((targetGroup1.length * targetGroup0.length) / (data.length * (targetGroup1.length + targetGroup0.length)) * (Math.pow(stdDev1, 2) + Math.pow(stdDev0, 2)))

    // Handle edge cases when correlation is undefined or infinite
    if (denom != 0) {
      correlation = (mean1 - mean0) / denom;
    }

    if (Number.isNaN(correlation) || !Number.isFinite(correlation)) {
      correlation = 0;
    }

    return scaleCorrelation(correlation);
  }
)}

// ——— Chart 2: Disease Co-Occurrence Correlation Heatmap ———
function _chart2(pointBiserialCorrelation,data,d3)
{
  const chartWidth = 650;
  const chartHeight = 550;
  const margin = { top: 120, right: 150, bottom: 120, left: 100 }; // Increased bottom margin for title and spacing
  const targets = ['heartDisease', 'kidneyDisease', 'skinCancer'];
  const factors = ['heartDisease', 'kidneyDisease', 'skinCancer'];

  // Calculate the correlation matrix
  const correlationMatrix = [];
  targets.forEach(target => {
    factors.forEach(factor => {
      const correlation = pointBiserialCorrelation(data, target, factor);
      correlationMatrix.push({target, factor, correlation});
    });
  });

  // Set the scales for the x and y axes
  const xScale = d3.scaleBand()
    .domain(factors)
    .range([margin.left, chartWidth - margin.right])
    .padding(0.05);

  const yScale = d3.scaleBand()
    .domain(targets)
    .range([margin.top, chartHeight - margin.bottom])
    .padding(0.1);

  // Define a color scale for correlations (Red for positive, Blue for negative)
  const colorScale = d3.scaleSequential(d3.interpolateRdBu) 
    .domain([1, -1]);  // Red for positive, Blue for negative

  // Make the labels easier to read
  const labelMap = {heartDisease: 'Heart Disease', 
                    kidneyDisease: 'Kidney Disease',
                    skinCancer: 'Skin Cancer'
                   };

  // Transform the label
  const formatLabel = (label) => labelMap[label] || label;

  // Create the SVG element for the heatmap
const svg = d3.create('svg')
  .attr('viewBox', `0 0 ${chartWidth} ${chartHeight}`)
  .attr('preserveAspectRatio', 'xMidYMid meet')
  .style('width', '100%')
  .style('height', 'auto');


  // Define the font style for the chart
  const fontFamily = 'Arial, sans-serif';
  const fontSize = '12px';

  // Create cells for the heatmap
  svg.selectAll('rect')
    .data(correlationMatrix)
    .enter()
    .append('rect')
    .attr('x', d => xScale(d.factor))  // Factors on x-axis
    .attr('y', d => yScale(d.target))  // Targets on y-axis
    .attr('width', xScale.bandwidth()) 
    .attr('height', yScale.bandwidth()) 
    .attr('fill', d => colorScale(d.correlation)); // Set color based on correlation value

  // Add labels for the correlation values inside the cells
  svg.selectAll('text')
    .data(correlationMatrix)
    .enter()
    .append('text')
    .attr('x', d => xScale(d.factor) + xScale.bandwidth() / 2)
    .attr('y', d => yScale(d.target) + yScale.bandwidth() / 2)
    .attr('dy', '.35em') 
    .attr('text-anchor', 'middle')
    .style('font-family', fontFamily)  // Apply font family
    .style('font-size', '16px')  // Increase font size for matrix labels
    .text(d => d3.format('.2f')(d.correlation)) // Round to 2 decimal places
    .attr('fill', 'black');

  // Disease names on the y-axis
  svg.append('g')
    .attr('transform', `translate(0, ${margin.top})`)
    .call(d3.axisTop(xScale))  // Place factors on the top axis
    .selectAll('text')  
    .style('font-family', fontFamily)  // Apply font family
    .style('font-size', '12px')  // Increase font size for axis labels
    .text(d => formatLabel(d));

  // Factors on the x-axis
  svg.append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale))  // Place targets on the left axis
    .selectAll('text')  
    .style('font-family', fontFamily)  // Apply font family
    .style('font-size', '12px')  // Increase font size for axis labels
    .text(d => formatLabel(d));

  // Add a color legend centered below the chart
  const legendHeight = 20;
  const legendWidth = 300;

  const legend = svg.append('g')
    .attr('transform', `translate(${(chartWidth - legendWidth) / 2}, ${chartHeight - margin.bottom + 30})`);

  const legendScale = d3.scaleLinear()
    .domain([1, -1])
    .range([0, legendWidth]);

  // Create a gradient for the color scale (blue on left, red on right)
  const gradient = legend.append('defs')
    .append('linearGradient')
    .attr('id', 'gradient')
    .attr('x1', '0%')
    .attr('x2', '100%')
    .attr('y1', '0%')
    .attr('y2', '0%');

  // Blue on the left (negative correlation)
  gradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', "#61b8e7"); // The blue you requested

  // Red on the right (positive correlation)
  gradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', "#d23626"); // The red you requested

  legend.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .style('fill', 'url(#gradient)');

  // Add numerical labels for the horizontal legend
  legend.append('text')
    .attr('x', 0)
    .attr('y', legendHeight + 15)
    .attr('dy', '.35em')
    .attr('text-anchor', 'middle')
    .style('font-family', fontFamily)  // Apply font family
    .style('font-size', '12px')  // Increase font size for legend labels
    .text('Neg. Correlation (-1.0)') // Negative correlation label
    .attr('fill', 'black');

  legend.append('text')
    .attr('x', legendWidth)
    .attr('y', legendHeight + 15)
    .attr('dy', '.35em')
    .attr('text-anchor', 'middle')
    .style('font-family', fontFamily)  // Apply font family
    .style('font-size', '12px')  // Increase font size for legend labels
    .text('Pos. Correlation (1.0)') // Positive correlation label
    .attr('fill', 'black');

    // Add title at the top
    svg.append('text')
    .attr('x', chartWidth / 2)  // Center the title horizontally
    .attr('y', margin.top / 2)  // Position the title at the top
    .attr('text-anchor', 'middle')  // Center text
    .attr('font-family', 'Arial, sans-serif')  // Apply font
    .attr('font-size', '20px')  // Font size for the title
    .attr('font-weight', 'bold')  // Make the font bold
    .text('Disease Co-Occurrence Correlation');


  return svg.node();
}

// ——— Observable Exports ———
export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("encodeCategory")).define("encodeCategory", _encodeCategory);
  main.variable(observer("scaleCorrelation")).define("scaleCorrelation", ["d3"], _scaleCorrelation);
  main.variable(observer("data")).define("data", ["d3","encodeCategory"], _data);
  main.variable(observer("pointBiserialCorrelation")).define("pointBiserialCorrelation", ["d3","scaleCorrelation"], _pointBiserialCorrelation);
  main.variable(observer("chart2")).define("chart2", ["pointBiserialCorrelation","data","d3"], _chart2);
  return main;
}
