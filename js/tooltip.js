class Tooltip {

    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.rawData = data;
        this.displayData = [];
        this.initTooltip();
    }

    initTooltip() {
        let vis = this;
        // triangle
        vis.triangle = d3.select('#' + vis.parentElement).append("div")
            .text("")
            .attr("id", "tooltip-triangle")
            .style("height", 0)
            .style("width", 0)
            .style("opacity", 0)

        vis.div = d3.select('#' + vis.parentElement).append("div")
            .attr("id", "country-tooltip")
            .style("opacity", 0)
        
        vis.title = vis.div.append("div")

        // add the ring chart container
        vis.div.append("div")
            .attr("id", "ring-chart-container")
        vis.cuisineDiv = vis.div.append("div")
            .attr("id", "cuisine-info")
        vis.ringChart = new RingChart('ring-chart-container', this.rawData)
        vis.hide()
        vis.wrangleData()

    }

    wrangleData() {
        let vis = this;
        let cuisineData = {
            oneStar: {},
            twoStar: {},
            threeStar: {},
            bibGourmand: {},
            selectedRestaurants: {}
        }

        vis.rawData.forEach((d) => {
            const award = d.Stars;
            if (cuisineData[award][d.Country] === undefined) {        // initialise if undefined
                cuisineData[award][d.Country] = {}
            }

            let cuisines = JSON.parse(d.Regional)
            cuisines.forEach((c) => {

                if (cuisineData[award][d.Country][c] === undefined) {
                    cuisineData[award][d.Country][c] = 1
                }
                else {
                    cuisineData[award][d.Country][c] += 1
                }
            })
        })

        // convert to arrays
        AWARDCLASSES.forEach((award) => {
            for (const country in cuisineData[award]) {
                if (cuisineData[award][country] === undefined) {
                    return []
                }
                cuisineData[award][country] = Object.keys(cuisineData[award][country]).map((cuisine) => {
                    return {
                        cuisine: cuisine,
                        count: cuisineData[award][country][cuisine]
                    }
                })
            }

        })
        vis.cuisineData = cuisineData

    }

    show(xCoord, yCoord, country, includedAwards, triangleY, sum) {
        let vis = this;
        let countryTotal = {}
        for (const award of includedAwards) {
            if (vis.cuisineData[award][country] !== undefined) {
                vis.cuisineData[award][country].forEach((x) => {
                    if (countryTotal[x.cuisine] === undefined) {
                        countryTotal[x.cuisine] = x.count
                    }
                    else {
                        countryTotal[x.cuisine] += x.count
                    }
                })
            }

        }
        countryTotal = Object.keys(countryTotal).map((cuisine) => {
            return {
                cuisine: cuisine,
                count: countryTotal[cuisine]
            }
        }).sort((a, b) => b.count - a.count)

        vis.ringChart.updateAndShowVis(country, includedAwards)
        vis.div
            .style("opacity", 1)
            .style("left", xCoord + "px")
            .style("top", yCoord + "px")
            .style("height", null)
            .style("width", null)
        
        vis.title
            .html(`<h3>${country}</h3>
                <p>${sum} restaurants</p>`)

        vis.triangle
            .style("opacity", 1)
            .style("left", xCoord + "px")
            .style("top", triangleY + "px")
            .style("height", null)
            .style("width", null)
        vis.cuisineDiv      // todo: check for arrays shorter than 4, bc special case needed
            .html(`<div>
                    <div class="tooltip-text-container">
                        <p>top regional keywords: </p>
                        <span>${countryTotal.length > 0 ? countryTotal[0].cuisine: ''} </span>
                        <span>${countryTotal.length > 1 ? ', ' + countryTotal[1].cuisine: ''} </span>
                        <span>${countryTotal.length > 2 ? ', ' + countryTotal[2].cuisine: ''} </span>
                        <span>${countryTotal.length > 3 ? ', ' + countryTotal[3].cuisine : ''} </span>
                        
                    </div>
                </div>`)

    }

    hide() {
        let vis = this;
        vis.ringChart.hideVis()
        vis.div
            .style("opacity", 0)
            .style("height", 0)
            .style("width", 0)

        vis.cuisineDiv
            .html(``)
        
        vis.triangle
            .style("opacity", 0)
            .style("height", 0)
            .style("width", 0)
    }
}