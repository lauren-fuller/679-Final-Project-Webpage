# CSCE 679 Final Project  
**Authors:** Hayley Hawkins, Lauren Fuller, Phuc Nguyen, Ayaan Omair  

Welcome to the **Heart Disease Visualization Dashboard** repository!  
This repository contains all the code necessary to create interactive visualizations depicting heart disease trends, demographics, and associated risk factors. It also includes everything required to deploy the visualizations to a fully functional website-based dashboard.

---

## 🌐 Website Access  
No need to download or run the code locally — simply click the link below to explore the dashboard:  
🔗 [Visit the Website](https://lauren-fuller.github.io/679-Final-Project-Webpage/)

---

## 🧠 Key Features
- Interactive charts and predictor tools for understanding heart disease prevalence.
- Demographic breakdowns by gender, race, age, and risk factors such as smoking and physical activity.
- A user-friendly, fully responsive web interface built with HTML, CSS, and D3.js in Observable.

---

## 📁 Repository Contents

### `.html` & `.css` Files
- Each `.html` file corresponds to a different page on the website (e.g., home, visualizations, survey).
- Each `.html` file is paired with a `.css` file that handles layout, styling, and responsiveness.
- The `index.html` file **does not** have an associated CSS file. Its only purpose is to initialize the deployment via GitHub Pages and redirect users to the homepage.

### `Observable Notebooks`
- This folder contains all the JavaScript (D3.js) code used to create the six main visualizations and the heart disease predictor tool.
- These notebooks are embedded into the website using iframes and allow for interactive filtering, grouping, and exploration of the data.
- It also includes a Python script used to perform statistical t-tests, which are incorporated into one of the visualizations for comparative analysis.

### `heart_2020_cleaned.csv`
- A cleaned CSV dataset containing heart disease-related information used for visualizations and statistical modeling.
- The data originates from the CDC's Behavioral Risk Factor Surveillance System (BRFSS) and can be found [here.](https://www.kaggle.com/datasets/kamilpytlak/personal-key-indicators-of-heart-disease)

### `heart_disease.jpg`
- A background image used for the homepage of the website to enhance visual appeal and context.

### Final Analysis Report
- This report outlines the background and motivation behind the project.
- It provides a detailed explanation of the codebase, the algorithms used, and how the different files work together.
- The document serves as a comprehensive overview of the development process and technical implementation.

---

