// Title for the Disease Predictor page
function _1(md){return(
md`# Disease Predictor`
)}

// Import D3.js version 7 for data handling and visualizations
function _d3(require){return(
require('d3@7')
)}

// Encode categorical variables into numeric indices for modeling
function _encodeCategory(){return(
function encodeCategory(value, categories) {
  const index = categories.indexOf(value);
  return index !== 0 ? index : 0; // Return 0 if the category doesn't exist
}
)}

// Scale correlation values to range between -1 and 1
function _scaleCorrelation(d3){return(
(correlation) => {
  const scale = d3.scaleLinear()
    .domain([-5, 5])  
    .range([-1, 1]); 

  return scale(correlation);
}
)}

// Load and preprocess the heart disease dataset
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

// Point-biserial correlation for continuous vs. binary outcome
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

function _7(pointBiserialCorrelation,data,d3)
{
  const chartWidth = 1000;
  const chartHeight = 600;
  const margin = { top: 80, right: 110, bottom: 60, left: 90 };
  const targets = ['heartDisease', 'kidneyDisease', 'skinCancer'];
  const factors = ['bmi', 'smoking', 'alcoholDrinking', 'stroke', 'physicalHealth', 
    'mentalHealth', 'diffWalking', 'sex', 'ageCategory', 'raceCategory', 
    'diabetic', 'physicalActivity', 'genHealth', 'sleepTime', 'asthma'];

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
    .domain(targets)
    .range([margin.left, chartWidth - margin.right])
    .padding(0.05);

  const yScale = d3.scaleBand()
    .domain(factors)
    .range([margin.top, chartHeight - margin.bottom])
    .padding(0.05);

  // Define a color scale for correlations
  const colorScale = d3.scaleSequential(d3.interpolateRdBu) 
    .domain([1, -1]);

  // Make the labels easier to read
  const labelMap = {heartDisease: 'Heart Disease', 
                    bmi: 'BMI',
                    smoking: 'Smoking',
                    alcoholDrinking: 'Alcohol Drinking',
                    stroke: 'Stroke',
                    physicalHealth: 'Physical Health',
                    mentalHealth: 'Mental Health',
                    diffWalking: 'Difficulty Walking',
                    sex: 'Sex',
                    ageCategory: 'Age Category',
                    raceCategory: 'Race',
                    diabetic: 'Diabetic',
                    physicalActivity: 'Physical Activity',
                    genHealth: 'General Health',
                    sleepTime: 'Sleep Time',
                    asthma: 'Asthma',
                    kidneyDisease: 'Kidney Disease',
                    skinCancer: 'Skin Cancer'
                   };

  // Transform the label
  const formatLabel = (label) => labelMap[label] || label;

  // Create the SVG element for the heatmap
  const svg = d3.create('svg')
    .attr('width', chartWidth)
    .attr('height', chartHeight);

  // Create cells for the heatmap
  svg.selectAll('rect')
    .data(correlationMatrix)
    .enter()
    .append('rect')
    .attr('x', d => xScale(d.target)) 
    .attr('y', d => yScale(d.factor)) 
    .attr('width', xScale.bandwidth()) 
    .attr('height', yScale.bandwidth()) 
    .attr('fill', d => colorScale(d.correlation)); // Set color based on correlation value

  // Add labels for the correlation values inside the cells
  svg.selectAll('text')
    .data(correlationMatrix)
    .enter()
    .append('text')
    .attr('x', d => xScale(d.target) + xScale.bandwidth() / 2)
    .attr('y', d => yScale(d.factor) + yScale.bandwidth() / 2)
    .attr('dy', '.35em') 
    .attr('text-anchor', 'middle')
    .text(d => d3.format('.2f')(d.correlation)) // Round to 2 decimal places
    .attr('fill', 'black');

  // Disease names on the x-axis
  svg.append('g')
    .attr('transform', `translate(0, ${margin.top})`)
    .call(d3.axisTop(xScale))
    .selectAll('text')  
    .text(d => formatLabel(d));

  // Factors on the y-axis
  svg.append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale))
    .selectAll('text')  
    .text(d => formatLabel(d));

  return svg.node();
}


function _8(pointBiserialCorrelation,data,d3)
{
  const chartWidth = 1000;
  const chartHeight = 600;
  const margin = { top: 80, right: 110, bottom: 60, left: 90 };
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
    .domain(targets)
    .range([margin.left, chartWidth - margin.right])
    .padding(0.05);

  const yScale = d3.scaleBand()
    .domain(factors)
    .range([margin.top, chartHeight - margin.bottom])
    .padding(0.05);

  // Define a color scale for correlations
  const colorScale = d3.scaleSequential(d3.interpolateRdBu) 
    .domain([1, -1]);

  // Make the lables easier to read
  const labelMap = {heartDisease: 'Heart Disease', 
                    bmi: 'BMI',
                    smoking: 'Smoking',
                    alcoholDrinking: 'Alcohol Drinking',
                    stroke: 'Stroke',
                    physicalHealth: 'Physical Health',
                    mentalHealth: 'Mental Health',
                    diffWalking: 'Difficulty Walking',
                    sex: 'Sex',
                    ageCategory: 'Age Category',
                    raceCategory: 'Race',
                    diabetic: 'Diabetic',
                    physicalActivity: 'Physical Activity',
                    genHealth: 'General Health',
                    sleepTime: 'Sleep Time',
                    asthma: 'Asthma',
                    kidneyDisease: 'Kidney Disease',
                    skinCancer: 'Skin Cancer'
                   };

  // Transform the label
  const formatLabel = (label) => labelMap[label] || label;

  // Create the SVG element for the heatmap
  const svg = d3.create('svg')
    .attr('width', chartWidth)
    .attr('height', chartHeight);

  // Create cells for the heatmap
  svg.selectAll('rect')
    .data(correlationMatrix)
    .enter()
    .append('rect')
    .attr('x', d => xScale(d.target)) 
    .attr('y', d => yScale(d.factor)) 
    .attr('width', xScale.bandwidth()) 
    .attr('height', yScale.bandwidth()) 
    .attr('fill', d => colorScale(d.correlation)); // Set color based on correlation value

  // Add labels for the correlation values inside the cells
  svg.selectAll('text')
    .data(correlationMatrix)
    .enter()
    .append('text')
    .attr('x', d => xScale(d.target) + xScale.bandwidth() / 2)
    .attr('y', d => yScale(d.factor) + yScale.bandwidth() / 2)
    .attr('dy', '.35em') 
    .attr('text-anchor', 'middle')
    .text(d => d3.format('.2f')(d.correlation)) // Round to 2 decimal places
    .attr('fill', 'black');

  // Disease names on the x-axis
  svg.append('g')
    .attr('transform', `translate(0, ${margin.top})`)
    .call(d3.axisTop(xScale))
    .selectAll('text')  
    .text(d => formatLabel(d));

  // Factors on the y-axis
  svg.append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale))
    .selectAll('text')  
    .text(d => formatLabel(d));

  return svg.node();
}


function _9(md){return(
md`## Use logistic regression for classification`
)}

function _bmi(Inputs){return(
Inputs.range([10, 50], {label: 'BMI', step: 0.1, value: 25})
)}

function _smoking(Inputs){return(
Inputs.checkbox(['Smoking?'], {value: []})
)}

function _alcoholDrinking(Inputs){return(
Inputs.checkbox(['Alcohol Drinking?'], {value: []})
)}

function _stroke(Inputs){return(
Inputs.checkbox(['Stroke History?'], {value: []})
)}

function _physicalHealth(Inputs){return(
Inputs.range([0, 30], {label: 'Physical Health Status (smaller value indicates better status)', step: 1, value: 5})
)}

function _mentalHealth(Inputs){return(
Inputs.range([0, 30], {label: 'Mental Health Status (smaller value indicates better status)', step: 1, value: 5})
)}

function _diffWalking(Inputs){return(
Inputs.checkbox(['Difficulty Walking?'], {value: []})
)}

function _sex(Inputs){return(
Inputs.select(['Male', 'Female'], {label: 'Sex'})
)}

function _ageCategory(Inputs){return(
Inputs.select(['18-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74', '75-79', '80 or older'], {label: 'Age Category'})
)}

function _raceCategory(Inputs){return(
Inputs.select(['American Indian/Alaskan Native', 'White', 'Black', 'Asian', 'Hispanic', 'Other'], {label: 'Race'})
)}

function _diabetic(Inputs){return(
Inputs.checkbox(['Diabetic?'], {value: []})
)}

function _physicalActivity(Inputs){return(
Inputs.checkbox(['Physically Active?'], {value: []})
)}

function _genHealth(Inputs){return(
Inputs.select(['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'], {label: 'General Health'})
)}

function _sleepTime(Inputs){return(
Inputs.range([0, 24], {label: 'Sleep Time', step: 1, value: 1})
)}

function _asthma(Inputs){return(
Inputs.checkbox(['Has Asthma?'], {value: []})
)}

function _sigmoid(){return(
function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}
)}

function _normalize(){return(
function normalize(value, min, max) {
  return (value - min) / (max - min);
}
)}

function _predict(sigmoid){return(
function predict(input, weights, bias = 0) {
  let z = bias;
  for (let i = 0; i < input.length; i++) {
    z += input[i] * weights[i];
  }
  
  return sigmoid(z);
}
)}

function _createFeatures(normalize,encodeCategory){return(
function createFeatures({
  bmi,
  smoking,
  alcoholDrinking,
  stroke,
  physicalHealth,
  mentalHealth,
  diffWalking,
  sex,
  ageCategory,
  raceCategory,
  diabetic,
  physicalActivity,
  genHealth,
  sleepTime,
  asthma
}) {
  return {
    bmi: normalize(bmi, 10, 50),
    smoking: smoking.includes('Smoker?') ? 1 : 0,
    alcoholDrinking: alcoholDrinking.includes('Drinks Alcohol?') ? 1 : 0,
    stroke: stroke.includes('Stroke History?') ? 1 : 0,
    physicalHealth: normalize(physicalHealth, 0, 30),
    mentalHealth: normalize(mentalHealth, 0, 30),
    diffWalking: diffWalking.includes('Difficulty Walking?') ? 1 : 0,
    sex: sex === 'Male' ? 1 : 0,
    ageCategory: encodeCategory(ageCategory, ['18-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74', '75-79', '80 or older']),
    raceCategory: encodeCategory(raceCategory, ['American Indian/Alaskan Native', 'White', 'Black', 'Asian', 'Hispanic', 'Other']),
    diabetic: diabetic.includes('Diabetic?') ? 1 : 0,
    physicalActivity: physicalActivity.includes('Physically Active?') ? 1 : 0,
    genHealth: encodeCategory(genHealth, ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor']),
    sleepTime: normalize(sleepTime, 0, 24),
    asthma: asthma.includes('Asthma?') ? 1 : 0
  };
}
)}

function _features(createFeatures,bmi,smoking,alcoholDrinking,stroke,physicalHealth,mentalHealth,diffWalking,sex,ageCategory,raceCategory,diabetic,physicalActivity,genHealth,sleepTime,asthma){return(
createFeatures({
  bmi, 
  smoking, 
  alcoholDrinking,
  stroke,
  physicalHealth,
  mentalHealth,
  diffWalking,
  sex,
  ageCategory,
  raceCategory,
  diabetic,
  physicalActivity,
  genHealth,
  sleepTime,
  asthma
})
)}

function _inputVector(features){return(
Object.values(features)
)}

function _getWeights(){return(
function getWeights() {
  return {
    heartDisease: [0.09, 0.2, -0.06, 0.24, 0.25, 0.05, 0.31, 0.13, 0.5, -0.08, 0.28, -0.17, 0.39, 0.01, 0.07],
    kidneyDisease: [0.19, 0.14, -0.13, 0.26, 0.45, 0.13, 0.50, -0.4, 0.55, -0.05, 0.50, -0.3, 0.62, 0.02, 0.15],
    skinCancer: [-0.06, 0.06, -0.01, 0.07, 0.07, -0.06, 0.1, 0.02, 0.53, -0.23, 0.06, 0, 0.06, 0.07, 0]};
}
)}

function _weights(getWeights){return(
getWeights()
)}

function _33(predict,inputVector,weights){return(
predict(inputVector, weights.heartDisease)
)}

function _34(predict,inputVector,weights){return(
predict(inputVector, weights.kidneyDisease)
)}

function _35(predict,inputVector,weights){return(
predict(inputVector, weights.skinCancer)
)}

function _heartPrediction(predict,inputVector,weights){return(
predict(inputVector, weights.heartDisease) > 0.98 ? 'Yes' : 'No'
)}

function _kidneyPrediction(predict,inputVector,weights){return(
predict(inputVector, weights.kidneyDisease) > 0.98 ? 'Yes' : 'No'
)}

function _skinPrediction(predict,inputVector,weights){return(
predict(inputVector, weights.skinCancer) > 0.98 ? 'Yes' : 'No'
)}

function _predictor(html,heartPrediction,kidneyPrediction,skinPrediction){return(
html`
<div style="border: 2px solid #ccc; border-radius: 12px; padding: 40px; max-width: 400px; font-family: sans-serif; background: #f9f9f9;">
  <h3 style="margin-top: 0; margin-bottom: 16px; color: #444;">Predicted Disease Risk</h3>
  <div style="margin-bottom: 10px;">
    <strong>Heart Disease:</strong> <span style="color: ${heartPrediction === 'Yes' ? 'red' : 'green'}">${heartPrediction}</span>
  </div>
  <div style="margin-bottom: 10px;">
    <strong>Kidney Disease:</strong> <span style="color: ${kidneyPrediction === 'Yes' ? 'red' : 'green'}">${kidneyPrediction}</span>
  </div>
  <div>
    <strong>Skin Cancer:</strong> <span style="color: ${skinPrediction === 'Yes' ? 'red' : 'green'}">${skinPrediction}</span>
  </div>
</div>
`
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("encodeCategory")).define("encodeCategory", _encodeCategory);
  main.variable(observer("scaleCorrelation")).define("scaleCorrelation", ["d3"], _scaleCorrelation);
  main.variable(observer("data")).define("data", ["d3","encodeCategory"], _data);
  main.variable(observer("pointBiserialCorrelation")).define("pointBiserialCorrelation", ["d3","scaleCorrelation"], _pointBiserialCorrelation);
  main.variable(observer()).define(["pointBiserialCorrelation","data","d3"], _7);
  main.variable(observer()).define(["pointBiserialCorrelation","data","d3"], _8);
  main.variable(observer()).define(["md"], _9);
  main.variable(observer("viewof bmi")).define("viewof bmi", ["Inputs"], _bmi);
  main.variable(observer("bmi")).define("bmi", ["Generators", "viewof bmi"], (G, _) => G.input(_));
  main.variable(observer("viewof smoking")).define("viewof smoking", ["Inputs"], _smoking);
  main.variable(observer("smoking")).define("smoking", ["Generators", "viewof smoking"], (G, _) => G.input(_));
  main.variable(observer("viewof alcoholDrinking")).define("viewof alcoholDrinking", ["Inputs"], _alcoholDrinking);
  main.variable(observer("alcoholDrinking")).define("alcoholDrinking", ["Generators", "viewof alcoholDrinking"], (G, _) => G.input(_));
  main.variable(observer("viewof stroke")).define("viewof stroke", ["Inputs"], _stroke);
  main.variable(observer("stroke")).define("stroke", ["Generators", "viewof stroke"], (G, _) => G.input(_));
  main.variable(observer("viewof physicalHealth")).define("viewof physicalHealth", ["Inputs"], _physicalHealth);
  main.variable(observer("physicalHealth")).define("physicalHealth", ["Generators", "viewof physicalHealth"], (G, _) => G.input(_));
  main.variable(observer("viewof mentalHealth")).define("viewof mentalHealth", ["Inputs"], _mentalHealth);
  main.variable(observer("mentalHealth")).define("mentalHealth", ["Generators", "viewof mentalHealth"], (G, _) => G.input(_));
  main.variable(observer("viewof diffWalking")).define("viewof diffWalking", ["Inputs"], _diffWalking);
  main.variable(observer("diffWalking")).define("diffWalking", ["Generators", "viewof diffWalking"], (G, _) => G.input(_));
  main.variable(observer("viewof sex")).define("viewof sex", ["Inputs"], _sex);
  main.variable(observer("sex")).define("sex", ["Generators", "viewof sex"], (G, _) => G.input(_));
  main.variable(observer("viewof ageCategory")).define("viewof ageCategory", ["Inputs"], _ageCategory);
  main.variable(observer("ageCategory")).define("ageCategory", ["Generators", "viewof ageCategory"], (G, _) => G.input(_));
  main.variable(observer("viewof raceCategory")).define("viewof raceCategory", ["Inputs"], _raceCategory);
  main.variable(observer("raceCategory")).define("raceCategory", ["Generators", "viewof raceCategory"], (G, _) => G.input(_));
  main.variable(observer("viewof diabetic")).define("viewof diabetic", ["Inputs"], _diabetic);
  main.variable(observer("diabetic")).define("diabetic", ["Generators", "viewof diabetic"], (G, _) => G.input(_));
  main.variable(observer("viewof physicalActivity")).define("viewof physicalActivity", ["Inputs"], _physicalActivity);
  main.variable(observer("physicalActivity")).define("physicalActivity", ["Generators", "viewof physicalActivity"], (G, _) => G.input(_));
  main.variable(observer("viewof genHealth")).define("viewof genHealth", ["Inputs"], _genHealth);
  main.variable(observer("genHealth")).define("genHealth", ["Generators", "viewof genHealth"], (G, _) => G.input(_));
  main.variable(observer("viewof sleepTime")).define("viewof sleepTime", ["Inputs"], _sleepTime);
  main.variable(observer("sleepTime")).define("sleepTime", ["Generators", "viewof sleepTime"], (G, _) => G.input(_));
  main.variable(observer("viewof asthma")).define("viewof asthma", ["Inputs"], _asthma);
  main.variable(observer("asthma")).define("asthma", ["Generators", "viewof asthma"], (G, _) => G.input(_));
  main.variable(observer("sigmoid")).define("sigmoid", _sigmoid);
  main.variable(observer("normalize")).define("normalize", _normalize);
  main.variable(observer("predict")).define("predict", ["sigmoid"], _predict);
  main.variable(observer("createFeatures")).define("createFeatures", ["normalize","encodeCategory"], _createFeatures);
  main.variable(observer("features")).define("features", ["createFeatures","bmi","smoking","alcoholDrinking","stroke","physicalHealth","mentalHealth","diffWalking","sex","ageCategory","raceCategory","diabetic","physicalActivity","genHealth","sleepTime","asthma"], _features);
  main.variable(observer("inputVector")).define("inputVector", ["features"], _inputVector);
  main.variable(observer("getWeights")).define("getWeights", _getWeights);
  main.variable(observer("weights")).define("weights", ["getWeights"], _weights);
  main.variable(observer()).define(["predict","inputVector","weights"], _33);
  main.variable(observer()).define(["predict","inputVector","weights"], _34);
  main.variable(observer()).define(["predict","inputVector","weights"], _35);
  main.variable(observer("heartPrediction")).define("heartPrediction", ["predict","inputVector","weights"], _heartPrediction);
  main.variable(observer("kidneyPrediction")).define("kidneyPrediction", ["predict","inputVector","weights"], _kidneyPrediction);
  main.variable(observer("skinPrediction")).define("skinPrediction", ["predict","inputVector","weights"], _skinPrediction);
  main.variable(observer("predictor")).define("predictor", ["html","heartPrediction","kidneyPrediction","skinPrediction"], _predictor);
  return main;
}
