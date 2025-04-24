// Title cell: Displays the heading of the notebook 
function _1(md) {
  return (
    md`# Research Question 4 Pt. 2`
  );
}

//  Introduction cell: States the research question being explored 
function _2(md) {
  return (
    md`Research Question #3

Are certain demographics (men, women, race, age) more prone to getting certain diseases?`
  );
}

//  Load and parse the heart disease dataset from GitHub 
function _heart_data_raw(d3) {
  return (
    d3.csv(
      "https://raw.githubusercontent.com/balleromair12/DataViz_finalproject/refs/heads/main/heart_2020_cleaned.csv",
      d3.autoType // Automatically infer data types
    )
  );
}

//  Dropdown menu to select gender 
function _selectedGender(Inputs) {
  return (
    Inputs.select(["All", "Male", "Female"], {
      label: "Select Gender:",
      value: "All" // Default selection
    })
  );
}

//  Dropdown menu to select race 
function _selectedRace(Inputs) {
  return (
    Inputs.select([
      "All",
      "White",
      "Black",
      "Asian",
      "American Indian/Alaskan Native",
      "Other"
    ], {
      label: "Select Race:",
      value: "All"
    })
  );
}

//  Dropdown menu to select age category 
function _selectedAge(Inputs) {
  return (
    Inputs.select([
      "All",
      "18-24", "25-29", "30-34", "35-39", "40-44",
      "45-49", "50-54", "55-59", "60-64",
      "65-69", "70-74", "75-79", "80 or older"
    ], {
      label: "Select Age Category:",
      value: "All"
    })
  );
}

//  Filter the dataset according to current dropdown selections 
function _filteredData(heart_data_raw, selectedGender, selectedRace, selectedAge) {
  return heart_data_raw.filter(d =>
    // Apply gender filter
    (selectedGender === "All" || d.Sex === selectedGender) &&
    // Apply race filter
    (selectedRace === "All" || d.Race === selectedRace) &&
    // Apply age filter
    (selectedAge === "All" || d.AgeCategory === selectedAge)
  );
}

//  Compute disease prevalence and counts for the filtered dataset 
function _diseaseCounts(filteredData) {
  const diseases = ["HeartDisease", "Stroke", "Asthma", "KidneyDisease", "Diabetic", "SkinCancer"];
  const total = filteredData.length;

  // Map each disease to its count and percentage
  return diseases.map(disease => {
    const count = filteredData.filter(d => d[disease] === "Yes").length;
    return {
      disease,
      count,
      percent: total > 0 ? (count / total) * 100 : 0
    };
  });
}

//  Display a bar chart showing disease prevalence based on filters 
function _chart(selectedGender, selectedRace, selectedAge, heart_data_raw, Plot, diseaseCounts) {
  // Dynamic chart title based on selected demographic filters
  const title = `Prevalence of Diseases${
    selectedGender !== "All" ? ` for ${selectedGender}` : ""
  }${
    selectedRace !== "All" ? `, ${selectedRace}` : ""
  }${
    selectedAge !== "All" ? `, aged ${selectedAge}` : ""
  }`;

  if (selectedGender === "All") {
    //  If no specific gender selected, compare Male vs Female in a grouped bar chart 
    const groups = ["Male", "Female"];
    const diseases = ["HeartDisease", "Stroke", "Asthma", "KidneyDisease", "Diabetic", "SkinCancer"];

    // Group data by gender and calculate prevalence for each disease
    const groupedCounts = groups.flatMap(group => {
      const subset = heart_data_raw.filter(d =>
        d.Sex === group &&
        (selectedRace === "All" || d.Race === selectedRace) &&
        (selectedAge === "All" || d.AgeCategory === selectedAge)
      );
      const total = subset.length;

      return diseases.map(disease => ({
        group,
        disease,
        percent: total > 0
          ? subset.filter(d => d[disease] === "Yes").length / total * 100
          : 0
      }));
    });

    // Render stacked bar chart by gender
    return Plot.plot({
      title,
      y: { label: "Prevalence (%)" },
      x: { label: "Disease" },
      color: { legend: true, label: "Gender" },
      marks: [
        Plot.barY(groupedCounts, {
          x: "disease",
          y: "percent",
          fill: "group",
          order: "descending",
          stack: true,
          tip: true
        }),
        Plot.ruleY([0]) // baseline
      ]
    });

  } else {
    //  If gender is specific, display a flat bar chart for that subset 
    return Plot.plot({
      title,
      y: { label: "Prevalence (%)" },
      x: { label: "Disease", domain: diseaseCounts.map(d => d.disease) },
      marks: [
        Plot.barY(diseaseCounts, {
          x: "disease",
          y: "percent",
          fill: "#4e79a7",
          tip: true
        }),
        Plot.ruleY([0])
      ]
    });
  }
}

//  List of diseases being tracked for analysis 
function _trackedDiseases() {
  return ["HeartDisease", "Stroke", "Asthma", "KidneyDisease", "Diabetic", "SkinCancer"];
}

//  Create a nested tree structure to show co-occurrence of diseases 
function _diseaseTreeData(heart_data_raw, selectedGender, selectedRace, selectedAge, trackedDiseases) {
  // Apply current filters
  const filtered = heart_data_raw.filter(d =>
    (selectedGender === "All" || d.Sex === selectedGender) &&
    (selectedRace === "All" || d.Race === selectedRace) &&
    (selectedAge === "All" || d.AgeCategory === selectedAge)
  );

  // Initialize tree root
  const root = { name: "All", count: 0, children: [] };

  for (const person of filtered) {
    // Select diseases marked "Yes", and sort for consistent nesting
    const diseases = trackedDiseases.filter(disease => person[disease] === "Yes").sort();
    if (diseases.length < 2) continue; // skip if not enough co-occurrence

    let current = root;
    current.count++;

    for (const disease of diseases) {
      if (!current.children) current.children = [];
      let child = current.children.find(c => c.name === disease);
      if (!child) {
        child = { name: disease, count: 0, children: [] };
        current.children.push(child);
      }
      child.count++;
      current = child;
    }
  }

  return root;
}

//  Render the disease co-occurrence tree using D3 tree layout 
function _diseaseTreeChart(d3, diseaseTreeData) {
  const width = 800;
  const dx = 50; // vertical spacing between nodes
  const dy = 140; // horizontal spacing

  const root = d3.hierarchy(diseaseTreeData);
  const treeLayout = d3.tree().nodeSize([dx, dy]);
  treeLayout(root); // compute layout

  // Calculate bounds for dynamic viewBox sizing
  const x0 = d3.min(root.descendants(), d => d.x);
  const x1 = d3.max(root.descendants(), d => d.x);
  const y0 = d3.min(root.descendants(), d => d.y);
  const y1 = d3.max(root.descendants(), d => d.y);

  const svg = d3.create("svg")
    .attr("viewBox", [y0 - 100, x0 - dx - 60, y1 - y0 + 200, x1 - x0 + 160])
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("font", "12px sans-serif")
    .style("overflow", "visible")
    .style("width", "100%")
    .style("height", "auto");

  const g = svg.append("g");

  // Add chart title
  g.append("text")
    .attr("x", (y1 - y0) / 2 + y0)
    .attr("y", x0 - dx - 30)
    .attr("text-anchor", "middle")
    .attr("font-size", "25px")
    .attr("font-weight", "bold")
    .text("Common Disease Co-Occurrence Tree");

  // Draw tree links
  g.append("g")
    .selectAll("path")
    .data(root.links())
    .join("path")
    .attr("fill", "none")
    .attr("stroke", "#ccc")
    .attr("stroke-width", 2)
    .attr("d", d3.linkHorizontal()
      .x(d => d.y)
      .y(d => d.x)
    );

  // Draw tree nodes
  const node = g.append("g")
    .selectAll("g")
    .data(root.descendants())
    .join("g")
    .attr("transform", d => `translate(${d.y},${d.x})`);

  node.append("circle")
    .attr("fill", "#4e79a7")
    .attr("r", 5);

  // Add node labels with counts
  node.append("text")
    .attr("dy", "0.31em")
    .attr("x", d => d.children ? -10 : 10)
    .attr("text-anchor", d => d.children ? "end" : "start")
    .text(d => `${d.data.name} (${d.data.count})`)
    .clone(true).lower()
    .attr("stroke", "white");

  return svg.node();
}
