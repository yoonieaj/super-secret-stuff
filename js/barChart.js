// todo: make these not constants anymore
const WIDTH = 600;
const HEIGHT = 600;
const AWARDCLASSES = [
    'selectedRestaurants',
    'bibGourmand',
    'oneStar',
    'twoStar',
    'threeStar'
]

class BarChart {

    // constructor
    constructor(parentElement, data) {
        console.log("treemapping")
        console.log(data)
        // initialize attributes
        this.parentElement = parentElement;
        this.rawData = data;
        this.displayData = [];
        this.includedAwards = new Set([
            'selectedRestaurants',
            'bibGourmand',
            'oneStar',
            'twoStar',
            'threeStar'
        ])
        this.initVis();
    }

    initVis() {
        let vis = this;
        let parentRect = document.getElementById(vis.parentElement).getBoundingClientRect()
        vis.margin = { top: 10, right: 50, bottom: 10, left: 50 };
        vis.barPadding = 150;
        vis.barPaddingY = 20;
        vis.width = parentRect.width - vis.margin.left - vis.margin.right;
        vis.height = HEIGHT - vis.margin.top - vis.margin.bottom;
        vis.transitionDuration = 1000

        // add the event listeners for the checkboxes
        AWARDCLASSES.forEach((award) => {
            d3.select('#' + award).on("change", function (event, d) {
                updateSelection(event, vis)
            })
            d3.select('#' + award + '-button').on("click", function (event, d) {
                onFilterClick(event, vis)
            })
        })

        // init drawing area
        // TODO: maybe make the width and height of these dynamic and depend
        // on viewport width/height whatever
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        
        // add x-axis group
        vis.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(${vis.barPadding}, ${vis.barPaddingY})`)

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;
        console.log("wrangling data");
        // we are going to update the vis.displayData values
        console.log("start:", vis.rawData);
        vis.displayData = vis.rawData;      // cause to be honest i cleaned this the way i wanted already
        vis.countryStats = {};
        vis.rawData.forEach((d, i) => {
            let prevVal = vis.countryStats[d.Country]
            let stars = d.Stars

            if (prevVal === undefined) {
                console.log("undefined, initialising")
                // initialise
                vis.countryStats[d.Country] = {
                    selectedRestaurants: 0,
                    bibGourmand: 0,
                    oneStar: 0,
                    twoStar: 0,
                    threeStar: 0,
                    total: 0
                }
            }

            vis.countryStats[d.Country].total += 1;
            vis.countryStats[d.Country][stars] += 1;
        })
        console.log("countrystats", vis.countryStats)

        // something something by country
        vis.countryTotalArray = Object.keys(vis.countryStats).map((key) => {
            return {
                country: key,
                total: vis.countryStats[key].total,
                selectedRestaurants: vis.countryStats[key].selectedRestaurants,
                bibGourmand: vis.countryStats[key].bibGourmand,
                oneStar: vis.countryStats[key].oneStar,
                twoStar: vis.countryStats[key].twoStar,
                threeStar: vis.countryStats[key].threeStar,
            }
        })
        // update the vis
        vis.dataOrder(false);
    }

    dataOrder(isUpdate) {
        let vis = this;
        // console.log("sorginggs")
        vis.countryTotalArray.sort((a, b) => {
            let sumA = 0
            let sumB = 0
            for (const award of vis.includedAwards) {
                sumA += a[award];
                sumB += b[award]
            }
            return sumB - sumA
        })

        const cutoff = 33       // anything after 33rd entry will be labelled as "other" initially
        vis.countryFilteredArray = vis.countryTotalArray.slice(0,cutoff)
        const others = vis.countryTotalArray.slice(cutoff)
        let otherSelected = 0
        let otherBG = 0;
        let otherOneStar = 0
        let otherTwoStar = 0
        let otherThreeStar = 0
        others.forEach((rest) => {
            otherSelected += rest.selectedRestaurants;
            otherBG += rest.bibGourmand;
            otherOneStar += rest.oneStar;
            otherTwoStar += rest.twoStar;
            otherThreeStar += rest.threeStar;
        })
        vis.countryFilteredArray.push({
            country: 'Other',
            bibGourmand: otherBG,
            oneStar: otherOneStar,
            selectedRestaurants: otherSelected,
            threeStar: otherThreeStar,
            twoStar: otherTwoStar,
            total: otherSelected + otherOneStar + otherBG + otherThreeStar + otherTwoStar
        })

        console.log("countrifulterdary", vis.countryFilteredArray)

        vis.updateVis(isUpdate);
    }

    updateVis(isUpdate) {
        let vis = this;

        let maxRestaurants = d3.max(vis.countryFilteredArray, (d) => {
            let sum = 0
            for (const award of vis.includedAwards) {
                sum += d[award];
            }
            return sum
        })

        var x = d3.scaleLinear()
            .domain([0, maxRestaurants])
            .range([0, vis.width - vis.barPadding - 10]);
        
        console.log("vis height", vis.height)
        var y = d3.scaleBand()
            .range([0, vis.height])
            .domain(vis.countryFilteredArray.map(d => d.country))
            .padding(.3);

        var stackedData = d3.stack()
            .keys(AWARDCLASSES)
            .value((d, key) => {
                return vis.includedAwards.has(key) ? d[key] : 0
            })
            (vis.countryFilteredArray)

            console.log("stacked data", stackedData)

        const colorScheme = {
            'selectedRestaurants': '#c3d0ea',
            'bibGourmand': '#77bbbb',
            'oneStar': '#f6dbb8',
            'twoStar': '#faa16d',
            'threeStar': '#f33b3b'
        }

        // draw x axis
        vis.xAxis = d3.axisTop()
            .scale(x)
            .ticks(4);

        console.log("xaxis", vis.xAxis)

        let xAxis = d3.selectAll(".x-axis")
        xAxis.enter()
            .merge(xAxis)
            .transition()
            .duration(vis.transitionDuration)
            .call(vis.xAxis)

        let stackGroups = vis.svg.selectAll(".bar-group")
            .data(stackedData)
        
        console.log("stacked data", stackedData)

        let bars = stackGroups.enter().append("g")
            .attr("class", "bar-group")
            .merge(stackGroups)
            .attr("fill", function (d) { console.log("color", d.key); return colorScheme[d.key]; })

            .selectAll("rect")
            .data(function (d) {
                // console.log("function d", d) 
                return d; })

        bars.enter()
            .append("rect")
            .attr("fill", function (d) {
                return colorScheme[d.key]; 
            })

            .merge(bars)
            .attr("y", function (d, i) {
                return y(vis.countryFilteredArray[i].country) + vis.barPaddingY;
            })

            .attr("height", y.bandwidth())
            .transition()
            .duration(vis.transitionDuration)
            .attr("width", function (d) { 
                return x(d[1]) - x(d[0]); 
            })
            .attr("x", function (d) {
                return x(d[0]) + vis.barPadding;
            })

        bars.exit().remove()
        stackGroups.exit().remove()
        
        let labels = vis.svg.selectAll(".country-label")
            .data(vis.countryFilteredArray, function(d) {
                return d.country
            })
        
        // add / update labels
        labels.enter().append("text")
            .attr("class", "country-label")
            .attr("id", d => d.country + "-label")
            .attr("y", vis.height)
            .attr("x", vis.barPadding - 10)
            .merge(labels)
            .transition()
            .duration(isUpdate ? vis.transitionDuration : 0)
            .text(d => {return d.country})
            .attr("y", d => y(d.country) + 10 + vis.barPaddingY)
            .attr("opacity", d => {
                for (const award of vis.includedAwards) {
                    if (d[award] > 0) {
                        return 1
                    }
                }
                return 0;
            })
        labels.exit().remove()
    }

};

updateSelection = function (event, vis) {
    if (event.target.checked) {
        vis.includedAwards.add(event.target.name)
    }
    else { // false
        vis.includedAwards.delete(event.target.name)
    }

    vis.dataOrder(true)
}

onFilterClick = function (event, vis) {
    console.log("clicked", event)

    if (vis.includedAwards.has(event.target.name)) {
        event.target.className += " disabled"
        console.log("child", event.target.querySelector('.button-close'))
        event.target.querySelector('.button-close').className = "button-close disabled"
        vis.includedAwards.delete(event.target.name)
    }
    else { // false
        event.target.className = "button"
        event.target.querySelector('.button-close').className = "button-close"
        vis.includedAwards.add(event.target.name)
    }

    vis.dataOrder(true)
}