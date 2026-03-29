const RINGCOLORS = {
    1: '#d0cdec',
    2: '#aba0dc',
    3: '#7f6dcf',
    4: '#423177'
}

class RingChart {

    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.rawData = data;
        this.displayData = [];
        this.initVis();
    }

    initVis() {
        let vis = this;
        vis.height = 200;
        vis.width = 250;
        vis.ringX = 75;

        // should initially have 0 dimensions, since svg/tooltip initially hidden
        vis.svg = d3.select('#' + vis.parentElement).append("svg")
            .attr("width", 0)
            .attr("height", 0)

        vis.ringGroup = vis.svg.append("g")
            .attr("class", "ring")
            .attr("transform", "translate(" + vis.ringX + "," + vis.height / 2 + ")")

        vis.pie = d3.pie()
            .value((d) => d.count)
            .sort(null)
        
        vis.title = vis.svg.append("text")
            .attr("id", "ring-title")
            .attr("x", 20)
            .attr("y", 20)
            .text("Price breakdown")

        let prices = [
            {index: 1, string: '$'},
            {index: 2, string: '$$'},
            {index: 3, string: '$$$'},
            {index: 4, string: '$$$$'},
        ]

        let legendEntries = vis.svg.selectAll('.legend-entries')
            .data(prices)
        
        legendEntries.enter()
            .append("rect")
            .attr("class", "legend-entries")
            .attr("x", 160)
            .attr("y", (x) => 30 + x.index * 25)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", (x) => RINGCOLORS[x.index])
        
        legendEntries.enter()
            .append("text")
            .attr("class", "legend-text")
            .attr("x", 185)
            .attr("y", (x) => 43 + x.index * 25)
            .text((x) => x.string)
        // data is shown will be the price.
        vis.wrangleData()
    }

    wrangleData() {
        let vis = this;
        let ringData = {
            oneStar: {},
            twoStar: {},
            threeStar: {},
            bibGourmand: {},
            selectedRestaurants: {}
        }

        vis.rawData.forEach((d) => {
            const award = d.Stars;
            if (ringData[award][d.Country] === undefined) {
                ringData[award][d.Country] = {
                    1: 0,
                    2: 0,
                    3: 0,
                    4: 0
                }
            }
            ringData[award][d.Country][parseInt(d.Price)] += 1
        });

        vis.ringData = ringData
    }

    updateAndShowVis(country, includedAwards) {
        let vis = this;
        let displayData = [
            { price: 1, count: 0 },
            { price: 2, count: 0 },
            { price: 3, count: 0 },
            { price: 4, count: 0 }
        ]
        includedAwards.forEach((award) => {
            let data = vis.ringData[award][country]
            if (data !== undefined) {
                displayData[0].count += data[1]
                displayData[1].count += data[2]
                displayData[2].count += data[3]
                displayData[3].count += data[4]
            }

        })

        let arcs = vis.ringGroup.selectAll(".arc")
            .data(vis.pie(displayData))

        arcs.enter()
            .append("path")
            .merge(arcs)
            .attr("d", d3.arc()
                .innerRadius(30)
                .outerRadius(60))
            .attr("fill", function (d) {
                return RINGCOLORS[d.data.price];
            })
            .on('mouseover', function (event, d) {
            })

        vis.svg
            .attr("width", vis.width)
            .attr("height", vis.height)

    }

    hideVis() {
        let vis = this;
        vis.svg
            .attr("width", 0)
            .attr("height", 0)
    }
}