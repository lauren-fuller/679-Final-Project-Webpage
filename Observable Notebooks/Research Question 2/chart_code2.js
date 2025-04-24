// ——— Markdown Headers ———
function _1(md){return(
  md`# Research Question 2` // Display the main question title
)}

function _2(md){return(
  md`## How do lifestyle factors (smoking, alcohol, physical activity) influence disease occurrence?` // Subheading describing the focus
)}

// ——— Load the Heart Disease Dataset from GitHub ———
function _heart_data(d3){return(
  d3.csv(
    "https://raw.githubusercontent.com/balleromair12/DataViz_finalproject/refs/heads/main/heart_2020_cleaned.csv",
    d3.autoType // Automatically convert strings to numbers, booleans where possible
  )
)}

// ——— Load D3.js Library ———
function _d3(require){return(
  require("d3@7") // Load D3.js version 7
)}

// ——— Extract D3 Helper Functions ———
function _d3tools(d3) {
  const { rollup, sum, scaleBand, scaleLinear, scaleOrdinal, axisBottom, axisLeft, create, format } = d3;
  return { rollup, sum, scaleBand, scaleLinear, scaleOrdinal, axisBottom, axisLeft, create, format }; // Return selected utilities
}

// ——— Transform Data for Grouped Bar Chart ———
function _chartData(d3tools, heart_data){return(
  (disease, behavior) => {
    const grouped = d3tools.rollup(
      heart_data,
      v => v.length, // Count records
      d => d[disease], // Group by disease presence (Yes/No)
      d => d[behavior] // Group by behavior (Yes/No)
    );

    const result = [];
    for (const [diseaseStatus, behaviorMap] of grouped) {
      const total = d3tools.sum([...behaviorMap.values()]); // Total for this disease group
      for (const [behaviorStatus, count] of behaviorMap) {
        result.push({
          [disease]: diseaseStatus, // e.g., HeartDisease: Yes
          [behavior]: behaviorStatus, // e.g., Smoking: Yes
          count, // Number of observations
          percent: (count / total) * 100 // Convert to percentage of group
        });
      }
    }
    return result; // Return cleaned dataset
  }
)}

// ——— Grouped Bar Chart Component ———
function _groupedBarChart(d3tools,d3){return(
  ({data, xDomain, xSubgroup, groupKey, subKey, label, colors}) => {
    const margin = {top: 70, right: 30, bottom: 60, left: 70},
          width = 700 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;

    const svg = d3tools.create("svg") // Create SVG element
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("width", "100%")
      .style("height", "auto");

    const g = svg.append("g") // Main group container
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Title for the chart
    svg.append("text")
      .attr("x", (width + margin.left + margin.right) / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .attr("font-weight", "bold")
      .text(label);

    // Scales
    const x0 = d3tools.scaleBand().domain(xDomain).range([0, width]).padding(0.2); // Main categories
    const x1 = d3tools.scaleBand().domain(xSubgroup).range([0, x0.bandwidth()]).padding(0.05); // Subcategories
    const y = d3tools.scaleLinear().domain([0, 100]).nice().range([height, 0]); // Y-axis scale
    const color = d3tools.scaleOrdinal().domain(xSubgroup).range(colors); // Color scale

    // Axes
    g.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3tools.axisBottom(x0)); // X-axis labels

    g.append("g")
      .call(d3tools.axisLeft(y).ticks(10).tickFormat(d => d + "%")); // Y-axis labels with %

    // Tooltip setup
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "white")
      .style("padding", "5px")
      .style("border", "1px solid #ddd")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("visibility", "hidden");

    // Draw grouped bars
    const groups = g.selectAll("g.bar-group")
      .data(xDomain) // Loop through disease status
      .enter().append("g")
      .attr("transform", d => `translate(${x0(d)},0)`); // Position group

    groups.selectAll("rect")
      .data(hd => data.filter(d => d[groupKey] === hd)) // Filter data by group
      .enter().append("rect")
      .attr("x", d => x1(d[subKey])) // Subgroup position
      .attr("y", d => y(d.percent)) // Height position
      .attr("width", x1.bandwidth())
      .attr("height", d => height - y(d.percent))
      .attr("fill", d => color(d[subKey]))
      .on("mouseover", function(event, d) {
        tooltip.style("visibility", "visible") // Show tooltip
          .html(`<strong>${groupKey}:</strong> ${d[groupKey]}<br>` +
                `<strong>${subKey}:</strong> ${d[subKey]}<br>` +
                `<strong>Percent:</strong> ${d.percent.toFixed(1)}%<br>` +
                `<strong>Count:</strong> ${d3.format(",")(d.count)}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mousemove", function(event) {
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", function() {
        tooltip.style("visibility", "hidden"); // Hide tooltip
      });

    // X-axis label
    svg.append("text")
      .attr("x", width / 2 + margin.left)
      .attr("y", height + margin.top + 45)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .text(label);

    // Y-axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", margin.left / 4)
      .attr("x", -height / 2 - margin.top)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .text("Percentage (%)");

    // Legend for subgroups
    const legend = svg.append("g")
      .attr("transform", `translate(${margin.left + width - 100}, ${margin.top - 30})`);

    xSubgroup.forEach((label, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      legendRow.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color(label));

      legendRow.append("text")
        .attr("x", 18)
        .attr("y", 10)
        .text(`${subKey}: ${label}`)
        .attr("font-size", "12px")
        .attr("alignment-baseline", "middle");
    });

    return svg.node(); // Return the SVG node to be rendered
  }
)}


// ——— Dropdown Menu for Selecting a Chart ———
function _chartSelector(html){return(
  html`
    <select>
      <!-- Each option corresponds to a specific chart configuration -->
      <option value="chart1">Heart Disease vs. Smoking</option>
      <option value="chart2">Heart Disease vs. Physical Activity</option>
      <option value="chart3">Heart Disease vs. Alcohol</option>
      <option value="chart4">Kidney Disease vs. Smoking</option>
      <option value="chart5">Kidney Disease vs. Physical Activity</option>
      <option value="chart6">Kidney Disease vs. Alcohol</option>
      <option value="chart7">Skin Cancer vs. Smoking</option>
      <option value="chart8">Skin Cancer vs. Physical Activity</option>
      <option value="chart9">Skin Cancer vs. Alcohol</option>
    </select>
  `
)}

// ——— Reactive Binding: Get Current Dropdown Value ———
function _selectedChart(chartSelector){return(
  chartSelector // Returns the current selected <option> value
)}

// ——— Chart Display Logic: Render Based on Selected Option ———
function _chartDisplay(selectedChart, groupedBarChart, chartData) {
  // Dictionary mapping chart keys to display titles
  const titles = {
    chart1: "Impact of Smoking on Heart Disease Prevalence",
    chart2: "Impact of Physical Activity on Heart Disease Prevalence",
    chart3: "Impact of Alcohol Drinking on Heart Disease Prevalence",
    chart4: "Impact of Smoking on Kidney Disease Prevalence",
    chart5: "Impact of Physical Activity on Kidney Disease Prevalence",
    chart6: "Impact of Alcohol Drinking on Kidney Disease Prevalence",
    chart7: "Impact of Smoking on Skin Cancer Prevalence",
    chart8: "Impact of Physical Activity on Skin Cancer Prevalence",
    chart9: "Impact of Alcohol Drinking on Skin Cancer Prevalence"
  };

  const title = titles[selectedChart]; // Get title for selected chart

  // Switch between chart cases based on selected value
  switch (selectedChart) {
    case "chart1":
      return groupedBarChart({
        data: chartData("HeartDisease", "Smoking"),
        xDomain: ["Yes", "No"],
        xSubgroup: ["Yes", "No"],
        groupKey: "HeartDisease",
        subKey: "Smoking",
        label: title,
        colors: ["#1f77b4", "#ff7f0e"]
      });

    case "chart2":
      return groupedBarChart({
        data: chartData("HeartDisease", "PhysicalActivity"),
        xDomain: ["Yes", "No"],
        xSubgroup: ["Yes", "No"],
        groupKey: "HeartDisease",
        subKey: "PhysicalActivity",
        label: title,
        colors: ["#1f77b4", "#ff7f0e"]
      });

    case "chart3":
      return groupedBarChart({
        data: chartData("HeartDisease", "AlcoholDrinking"),
        xDomain: ["Yes", "No"],
        xSubgroup: ["Yes", "No"],
        groupKey: "HeartDisease",
        subKey: "AlcoholDrinking",
        label: title,
        colors: ["#1f77b4", "#ff7f0e"]
      });

    case "chart4":
      return groupedBarChart({
        data: chartData("KidneyDisease", "Smoking"),
        xDomain: ["Yes", "No"],
        xSubgroup: ["Yes", "No"],
        groupKey: "KidneyDisease",
        subKey: "Smoking",
        label: title,
        colors: ["#4B0082", "#FFBF00"]
      });

    case "chart5":
      return groupedBarChart({
        data: chartData("KidneyDisease", "PhysicalActivity"),
        xDomain: ["Yes", "No"],
        xSubgroup: ["Yes", "No"],
        groupKey: "KidneyDisease",
        subKey: "PhysicalActivity",
        label: title,
        colors: ["#4B0082", "#FFBF00"]
      });

    case "chart6":
      return groupedBarChart({
        data: chartData("KidneyDisease", "AlcoholDrinking"),
        xDomain: ["Yes", "No"],
        xSubgroup: ["Yes", "No"],
        groupKey: "KidneyDisease",
        subKey: "AlcoholDrinking",
        label: title,
        colors: ["#4B0082", "#FFBF00"]
      });

    case "chart7":
      return groupedBarChart({
        data: chartData("SkinCancer", "Smoking"),
        xDomain: ["Yes", "No"],
        xSubgroup: ["Yes", "No"],
        groupKey: "SkinCancer",
        subKey: "Smoking",
        label: title,
        colors: ["#2ca02c", "#9467bd"]
      });

    case "chart8":
      return groupedBarChart({
        data: chartData("SkinCancer", "PhysicalActivity"),
        xDomain: ["Yes", "No"],
        xSubgroup: ["Yes", "No"],
        groupKey: "SkinCancer",
        subKey: "PhysicalActivity",
        label: title,
        colors: ["#2ca02c", "#9467bd"]
      });

    case "chart9":
      return groupedBarChart({
        data: chartData("SkinCancer", "AlcoholDrinking"),
        xDomain: ["Yes", "No"],
        xSubgroup: ["Yes", "No"],
        groupKey: "SkinCancer",
        subKey: "AlcoholDrinking",
        label: title,
        colors: ["#2ca02c", "#9467bd"]
      });
  }
}

// ——— Intermediate Bindings (Not Essential) ———
function _11(chartSelector){return(chartSelector)} // Placeholder to output dropdown
function _12(chartDisplay){return(chartDisplay)}   // Placeholder to output chart

// ——— Observable Runtime Export ———
export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["md"], _2);
  main.variable(observer("heart_data")).define("heart_data", ["d3"], _heart_data);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("d3tools")).define("d3tools", ["d3"], _d3tools);
  main.variable(observer("chartData")).define("chartData", ["d3tools","heart_data"], _chartData);
  main.variable(observer("groupedBarChart")).define("groupedBarChart", ["d3tools","d3"], _groupedBarChart);
  main.variable(observer("viewof chartSelector")).define("viewof chartSelector", ["html"], _chartSelector);
  main.variable(observer("chartSelector")).define("chartSelector", ["Generators", "viewof chartSelector"], (G, _) => G.input(_));
  main.variable(observer("selectedChart")).define("selectedChart", ["chartSelector"], _selectedChart);
  main.variable(observer("chartDisplay")).define("chartDisplay", ["selectedChart","groupedBarChart","chartData"], _chartDisplay);
  main.variable(observer()).define(["chartSelector"], _11);
  main.variable(observer()).define(["chartDisplay"], _12);
  return main;
}
