// Title block introducing the research question
function _1(md) {
  return (
    md`# Research Question 5`
  );
}

// Subtitle framing the specific inquiry into sleep duration differences
function _2(md) {
  return (
    md`# How does sleep duration differ among people with these diseases? `
  );
}

// Hardcoded average sleep duration for people with and without each disease
function _sleepData() {
  return (
    {
      HeartDisease: { Yes: 6.2, No: 7.0 },
      KidneyDisease: { Yes: 6.6, No: 7.1 },
      SkinCancer: { Yes: 5.8, No: 7.2 }
    }
  );
}

// Hardcoded t-test statistics and p-values for each disease
function _statsData() {
  return (
    {
      HeartDisease: { t_stat: 4.96, p_value: "< 0.0001" },
      KidneyDisease: { t_stat: 2.42, p_value: "0.0155" },
      SkinCancer: { t_stat: 19.79, p_value: "< 0.0001" }
    }
  );
}

// Repeated markdown summary title for clarity
function _5(md) {
  return (
    md`How does sleep duration differ among people with these diseases?`
  );
}

// Renders a small multiple bar chart grid showing sleep differences by disease
function _chartGrid(d3, sleepData, DOM, statsData) {
  const margin = { top: 100, right: 20, bottom: 15, left: 60 };
  const width = 250 - margin.left - margin.right;
  const height = 250 - margin.top - margin.bottom;

  const svg = d3.create("svg")
    .attr("viewBox", `0 0 800 300`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "auto");

  // Add a main title centered at the top
  svg.append("text")
    .attr("x", 400)
    .attr("y", 40)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .text("Average Sleep Duration by Disease Status");

  const diseases = Object.keys(sleepData);
  const barColors = { Yes: "#e63946", No: "#457b9d" }; // red and blue palette

  diseases.forEach((disease, i) => {
    // Create a new group for each disease panel
    const group = svg.append("g")
      .attr("transform", `translate(${(i % 3) * 260 + margin.left}, ${margin.top})`);

    // Convert sleepData into a format suitable for d3.join()
    const data = Object.entries(sleepData[disease]).map(([group, value]) => ({
      group, value
    }));

    // X and Y scales
    const x = d3.scaleBand().domain(data.map(d => d.group)).range([0, width]).padding(0.4);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value) + 1]).range([height, 0]);

    // Title for each individual chart (disease name formatted nicely)
    group.append("text")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(disease.replace(/([A-Z])/g, ' $1').trim());

    // Draw axes
    group.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
    group.append("g").call(d3.axisLeft(y).ticks(5));

    // Axis labels
    group.append("text")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Has Disease?");

    group.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Sleep Time (hours)");

    // Tooltip div styled for use on hover
    const tooltip = d3.select(DOM.element("div"))
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", "#fff")
      .style("padding", "6px 10px")
      .style("font", "13px sans-serif")
      .style("border", "1px solid #ccc")
      .style("box-shadow", "0px 0px 6px rgba(0,0,0,0.1)")
      .style("border-radius", "4px")
      .style("opacity", 0);

    svg.node().appendChild(tooltip.node());

    // Pre-allocated label elements for hover text
    const hoverLabelGroup = group.append("g").style("opacity", 0);

    const hoverLabelBg = hoverLabelGroup.append("rect")
      .attr("rx", 4).attr("ry", 4)
      .attr("fill", "#fff").attr("stroke", "#999").attr("stroke-width", 0.8)
      .attr("height", 22).attr("y", -26);

    const hoverLabelText = hoverLabelGroup.append("text")
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#000")
      .style("font-weight", "bold");

    // Draw bars for Yes/No responses
    group.selectAll(".bar")
      .data(data)
      .join("rect")
      .attr("x", d => x(d.group))
      .attr("y", d => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.value))
      .attr("fill", d => barColors[d.group])
      .on("mouseover", function(event, d) {
        // Show tooltip on hover
        tooltip.style("opacity", 1)
          .html(`<strong>${d.group}</strong>: ${d.value.toFixed(2)} hrs`);

        // Show inline hover label near bar
        hoverLabelText
          .text(`${d.value.toFixed(2)} hrs`)
          .attr("x", x(d.group) + x.bandwidth() / 2);

        const textWidth = hoverLabelText.node().getBBox().width;

        hoverLabelBg
          .attr("x", x(d.group) + x.bandwidth() / 2 - textWidth / 2 - 6)
          .attr("width", textWidth + 12);

        hoverLabelGroup
          .attr("transform", `translate(0, ${y(d.value)})`)
          .style("opacity", 1);
      })
      .on("mousemove", function(event) {
        // Move tooltip with cursor
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 30) + "px");
      })
      .on("mouseout", function() {
        // Hide tooltip and label
        tooltip.style("opacity", 0);
        hoverLabelGroup.style("opacity", 0);
      });

    // Append t-test and p-value below each chart
    const stats = statsData[disease];
    group.append("text")
      .attr("x", width / 2)
      .attr("y", height + 55)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("fill", "#555")
      .text(`t = ${stats.t_stat}, p = ${stats.p_value}`);
  });

  return svg.node();
}

// Dropdown to select a single disease for summary text
function _diseaseSelect(Inputs, sleepData) {
  return (
    Inputs.select(Object.keys(sleepData), {
      label: "Choose a disease:",
      value: "HeartDisease"
    })
  );
}

// Dynamically generates a summary explanation for the selected disease
function _summary(md, diseaseSelect, statsData, sleepData) {
  return md`**Statistical Summary for ${diseaseSelect}:**  
- t-statistic = ${statsData[diseaseSelect].t_stat}  
- p-value = ${statsData[diseaseSelect].p_value}  
- ${(() => {
    const { t_stat, p_value } = statsData[diseaseSelect];

    // Handle "< 0.0001" formatting by converting to a number for comparison
    const numericP = typeof p_value === "string" && p_value.includes("<")
      ? 0.0001
      : parseFloat(p_value);

    if (numericP < 0.05) {
      // Determine if people with the disease sleep more or less
      const direction = sleepData[diseaseSelect].Yes < sleepData[diseaseSelect].No
        ? "less"
        : "more";
      return `There is a **statistically significant** difference in sleep duration. People with ${diseaseSelect.replace(/([A-Z])/g, ' $1').trim()} sleep **${direction}** on average than those without.`;
    } else {
      return `There is **no statistically significant difference** in sleep duration between people with and without ${diseaseSelect.replace(/([A-Z])/g, ' $1').trim()}.`;
    }
  })()}`
}
