console.log("hello world ")
let dataVis;

// read from csv
d3.csv('data/michelin_data.csv').then((data) => {
    // do things
    dataVis = new BarChart('chart-area', data)
})