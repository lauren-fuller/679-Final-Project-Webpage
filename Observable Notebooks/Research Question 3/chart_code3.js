// ——— Title and Subheader ———
function _1(md){return(
  md`# Research Question 3` // Main title for the section
)}

function _2(md){return(
  md`### Are certain demographics (men, women, race, age) more prone to getting certain diseases?`
)}

// ——— Load Raw Heart Dataset ———
function _heart_data_raw(d3){return(
  d3.csv(
    "https://raw.githubusercontent.com/balleromair12/DataViz_finalproject/refs/heads/main/heart_2020_cleaned.csv",
    d3.autoType // Automatically parse values (numbers, booleans, dates, etc.)
  )
)}

// ——— Checkbox UI with 'All' Exclusive Option ———
function _exclusiveCheckboxInput(Inputs){return(
  function exclusiveCheckboxInput(options, labelText) {
    const defaultValue = ["All"];
    const input = Inputs.checkbox(options, { label: labelText, value: defaultValue });

    requestAnimationFrame(() => {
      const checkboxes = Array.from(input.querySelectorAll("input[type='checkbox']"));

      checkboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
          let selected = new Set(input.value);

          if (checkbox.value === "All") {
            if (checkbox.checked) {
              input.value = ["All"];
              input.dispatchEvent(new CustomEvent("input")); // Notify Observable of input change
            }
          } else {
            selected.delete("All");

            if (checkbox.checked) {
              selected.add(checkbox.value);
            } else {
              selected.delete(checkbox.value);
            }

            if (selected.size === 0) {
              input.value = ["All"];
            } else {
              input.value = Array.from(selected);
            }

            input.dispatchEvent(new CustomEvent("input")); // Trigger reactivity
          }
        });
      });
    });

    return input; // Return the constructed checkbox element
  }
)}

// ——— Gender Filter UI ———
function _selectedGenders(exclusiveCheckboxInput){return(
  exclusiveCheckboxInput(
    ["All", "Male", "Female"], // Options
    "Filter by Gender:" // Label
  )
)}

// ——— Race Filter UI ———
function _selectedRaces(exclusiveCheckboxInput){return(
  exclusiveCheckboxInput(
    ["All", "White", "Black", "Asian", "American Indian/Alaskan Native", "Other"],
    "Filter by Race:"
  )
)}

// ——— Age Category Filter UI ———
function _selectedAges(exclusiveCheckboxInput){return(
  exclusiveCheckboxInput(
    ["All", "18-24", "25-29", "30-34", "35-39", "40-44", "45-49", "50-54", "55-59", "60-64", "65-69", "70-74", "75-79", "80 or older"],
    "Filter by Age Category:"
  )
)}

// ——— Grouping Option (Radio Buttons) ———
function _stackBy(Inputs){return(
  Inputs.radio(
    ["None", "Gender", "Race", "AgeCategory"], // Available group-by options
    { label: "Group/Stack bars by:", value: "None" } // Default selection
  )
)}

// ——— Filter Data Based on Demographic Inputs ———
function _filteredData(selectedGenders,selectedRaces,selectedAges,heart_data_raw) {
  selectedGenders;
  selectedRaces;
  selectedAges;

  return heart_data_raw.filter(d =>
    (selectedGenders.includes("All") || selectedGenders.includes(d.Sex)) &&
    (selectedRaces.includes("All") || selectedRaces.includes(d.Race)) &&
    (selectedAges.includes("All") || selectedAges.includes(d.AgeCategory))
  );
}

// ——— Count Diseases in Filtered Dataset ———
function _diseaseCounts(filteredData) {
  const diseases = ["HeartDisease", "Stroke", "Asthma", "KidneyDisease", "Diabetic", "SkinCancer"];
  const total = filteredData.length; // Total filtered rows

  return diseases.map(disease => {
    const count = filteredData.filter(d => d[disease] === "Yes").length;
    return {
      disease, // Disease name
      count, // Raw count of 'Yes' responses
      percent: total > 0 ? (count / total) * 100 : 0 // Percent of total
    };
  });
}

// ——— Chart Display Based on Filters and Stack Options ———
function _chart(selectedGenders,selectedRaces,selectedAges,stackBy,filteredData,diseaseCounts,Plot) {
  selectedGenders;
  selectedRaces;
  selectedAges;
  stackBy;
  filteredData;
  diseaseCounts;

  const diseases = ["HeartDisease", "Stroke", "Asthma", "KidneyDisease", "Diabetic", "SkinCancer"];

  // Dynamically construct chart title based on selected filters
  const title = `Prevalence of Diseases${
    selectedGenders.includes("All") ? "" : ` for ${selectedGenders.join(", ")}`
  }${
    selectedRaces.includes("All") ? "" : `, ${selectedRaces.join(", ")}`
  }${
    selectedAges.includes("All") ? "" : `, aged ${selectedAges.join(", ")}`
  }`;

  // ——— Stacked Chart Mode ———
  if (stackBy !== "None") {
    const stackColumnMap = {
      Gender: "Sex",
      Race: "Race",
      AgeCategory: "AgeCategory"
    };
    const stackColumn = stackColumnMap[stackBy]; // Match UI label to data column

    // Identify unique groups from the filtered data
    const groups = Array.from(new Set(filteredData.map(d => d[stackColumn]).filter(d => d)));

    // Create a dataset with grouped prevalence values
    const groupedCounts = groups.flatMap(group => {
      const subset = filteredData.filter(d => d[stackColumn] === group);
      const total = subset.length;

      return diseases.map(disease => ({
        group: group ?? "Unknown", // Handle missing values
        disease,
        percent: total > 0 ? subset.filter(d => d[disease] === "Yes").length / total * 100 : 0
      }));
    });

    return Plot.plot({
      title,
      y: { label: "Prevalence (%)" },
      x: { label: "Disease" },
      color: { legend: true, label: stackBy, type: "categorical" },
      marks: [
        Plot.barY(groupedCounts, {
          x: "disease",
          y: "percent",
          fill: "group",
          stack: true, // Enable stacking by group
          tip: true // Enable tooltips
        }),
        Plot.ruleY([0]) // Add baseline at y=0
      ]
    });
  } else {
    // ——— Simple Chart Mode (No Grouping) ———
    return Plot.plot({
      title,
      y: { label: "Prevalence (%)" },
      x: { label: "Disease" },
      marks: [
        Plot.barY(diseaseCounts, {
          x: "disease",
          y: "percent",
          fill: "#4e79a7", // Single color fill
          tip: true // Tooltips enabled
        }),
        Plot.ruleY([0])
      ]
    });
  }
}

// ——— Export All Modules to Observable ———
export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["md"], _2);
  main.variable(observer("heart_data_raw")).define("heart_data_raw", ["d3"], _heart_data_raw);
  main.variable(observer("exclusiveCheckboxInput")).define("exclusiveCheckboxInput", ["Inputs"], _exclusiveCheckboxInput);
  main.variable(observer("viewof selectedGenders")).define("viewof selectedGenders", ["exclusiveCheckboxInput"], _selectedGenders);
  main.variable(observer("selectedGenders")).define("selectedGenders", ["Generators", "viewof selectedGenders"], (G, _) => G.input(_));
  main.variable(observer("viewof selectedRaces")).define("viewof selectedRaces", ["exclusiveCheckboxInput"], _selectedRaces);
  main.variable(observer("selectedRaces")).define("selectedRaces", ["Generators", "viewof selectedRaces"], (G, _) => G.input(_));
  main.variable(observer("viewof selectedAges")).define("viewof selectedAges", ["exclusiveCheckboxInput"], _selectedAges);
  main.variable(observer("selectedAges")).define("selectedAges", ["Generators", "viewof selectedAges"], (G, _) => G.input(_));
  main.variable(observer("viewof stackBy")).define("viewof stackBy", ["Inputs"], _stackBy);
  main.variable(observer("stackBy")).define("stackBy", ["Generators", "viewof stackBy"], (G, _) => G.input(_));
  main.variable(observer("filteredData")).define("filteredData", ["selectedGenders","selectedRaces","selectedAges","heart_data_raw"], _filteredData);
  main.variable(observer("diseaseCounts")).define("diseaseCounts", ["filteredData"], _diseaseCounts);
  main.variable(observer("chart")).define("chart", ["selectedGenders","selectedRaces","selectedAges","stackBy","filteredData","diseaseCounts","Plot"], _chart);
  return main;
}
