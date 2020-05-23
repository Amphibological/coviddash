/*

Ontario COVID-19 Dashboard

An interactive graphical dashboard of data on the 2019 Novel Coronavirus Disease in Ontario.

Data from: 
https://data.ontario.ca/dataset/status-of-covid-19-cases-in-ontario/resource/ed270bb8-340b-41f9-a7c6-e8ef587e6d11

KNOWN BUGS:
- FIXED Date range change function (INCREASING ENDPOINT) fails when averages are enabled
- FIXED Checkboxes not properly disabling when double-click is used to change datasets
- FIXED Disabling a dataset with average checked leaves the average on display
- FIXED The moving average period range slider causes a reload even when no moving average is on display
- The moving average is inaccurate at the ends due to utilizing null values from outside the boundary of the dataset
*/

let avgPeriod = 5; // Period for moving average calculation (i.e number of data points used to calculate each day) | Must be an odd number |
let startDate, endDate; // Start and end dates of currently viewed data
let fullData, data; // The full set of data from the source; the slice of data bounded by the date endpoints
let dispChart; // The chart object for displaying data

let dataStartDate = moment([2020, 0, 26]); // The start date of the full data set (this is a constant equal to January 26, 2020)
let dataEndDate; // The end date of the full data set (will be gotten from the data)

$(document).ready(() => { // Triggers once site is properly loaded

    $.ajax({ // fetch data from url below at specific resource id
        url: 'https://data.ontario.ca/api/3/action/datastore_search',
        data: {
            resource_id: 'ed270bb8-340b-41f9-a7c6-e8ef587e6d11', // the resource id
            limit: 32000,
        },
        dataType: 'jsonp',
        cache: 'true', // do not send timestamp parameter (will not work with data source)
        success: (d) => { // on the success of the request, call these three handlers in order (passing the data to no. 2)
            setupPreData();
            setupDisplay(d);
            setupPostData();
        },
    });

});

// This function runs before data has been properly set up
// Code here cannot depend on the data in any way (no references to results, fullResults, dates, etc.)

function setupPreData() {
    $("#avg").val(avgPeriod); // preset the average range input to its lowest value
    $("#datepicker").datepicker(); //instantiate the datepicker widget
}

// This function runs after data has been properly set up
// Code here has full access to all variables

function setupPostData() {
    // finding the date of the final data point
    dataEndDate = moment(fullData[fullData.length - 1]["Reported Date"]);
    console.log(dataEndDate);

    // setting the inital values of the datepicker to the full range
    $('#datestart').datepicker('update', dataStartDate.toDate());
    $('#dateend').datepicker('update', dataEndDate.toDate());

    // setting both the start and end date pickers to have the correct range
    $('#datestart').datepicker('setStartDate', dataStartDate.toDate());
    $('#datestart').datepicker('setEndDate', dataEndDate.toDate());
    $('#dateend').datepicker('setStartDate', dataStartDate.toDate());
    $('#dateend').datepicker('setEndDate', dataEndDate.toDate());

}

// This function creates a dataset with specific parameters to be displayed in the chart
//
// Parameters:
// func: one of the dataset functions, a mapping from the data and a field to new data
// label: the name of the dataset as displayed to the user
// field: the field of source data to base the dataset on
// colour: the colour of the data when drawn in
// avg: whether or not this is a moving average dataset (affects rendering as a line vs bar)

function dataset(func, label, field, colour, avg=false) {
    resultData = [];
    newData = func(data, field); // gets the new, modified data from the dataset function
    for (let i = 0; i < data.length; i++) { // iterate through the data and map the newData against time
        resultData.push({x: data[i]["Reported Date"], y: newData[i]});
    }

    if (avg) { // parameters if the dataset is a moving average
        return {
            label: label,
            borderColor: colour,
            backgroundColor: 'rgba(0, 0, 0, 0)', // just a line with no shading under it
            pointRadius: 0, // hides the points completely
            data: resultData,
            type: "line",
            order: 0, // higher render priority than non-averages, so that lines display on top
        };
    }

    return { // parameters if the dataset is NOT a moving average
        label: label,
        backgroundColor: colour,
        data: resultData,
        order: 1, // lower render priority
    };
}

// This data function is for datasets where no manipulation of source data is required
// It simply selects the correct field from the source data

function simpleDataFunc(oldData, field) {
    return oldData.map((t) => t[field]); // convert each "line" of data to just the required field
}

// This data function is for datasets where a cumulative dataset needs to be displayed as a daily number
// Modifies the data by generating successive differences of the cumulative data

function dailyDataFunc(oldData, field) {
    l = oldData.map((t) => t[field]); // convert each "line" of data to just the required field
    l.unshift(0); // add a dummy zero to the start so the differences function properly
    l1 = [];
    for (let i = 0; i < l.length; i++) { // get all the successive differences of the data
        l1.push(l[i] - l[i - 1]);
    }
    l1.shift(); // remove the dummy
    return l1
}

// This data function is for datasets where a moving average is needed
// Modifies the data by calculating a moving avergge over a certain length of time (set by avgPeriod)

function avgDataFunc(oldData, field) {
    l = oldData.map((t) => t[field]); // convert each "line" of data to just the required field
    l1 = [];
    for (let i = 0; i < l.length; i++) { // for each data point, calculate the average of *avgPeriod* points around it
        l1.push((l.slice(i - (Math.floor(avgPeriod/2)), i + (Math.ceil(avgPeriod/2))).reduce((a, b) => a + b, 0)) / avgPeriod);
    }
    return l1
}

// This data function is for datasets where a moving average of a daily dataset is needed
// Modifies the data by passing it through the daily data function and then calculating a moving average

function avgDailyDataFunc(oldData, field) {
    l = dailyDataFunc(oldData, field); // get the daily data
    l1 = [];
    for (let i = 0; i < l.length; i++) { // for each data point, calculate the average of *avgPeriod* points around it
        l1.push((l.slice(i - (Math.floor(avgPeriod/2)), i + (Math.ceil(avgPeriod/2))).reduce((a, b) => a + b, 0)) / avgPeriod);
    }
    return l1
}

// This function regenerates the entire collection of datasets if needed
// It also saves the status of which datasets were shown

function genDatasets() {
    let hiddens = [];

    // save the hidden status of each dataset
    for (let i = 0; i < dispChart.data.datasets.length; i++) {
        hiddens.push(dispChart.getDatasetMeta(i).hidden);
    }

    dispChart.data.datasets = []; // clear all datasets

    // create and add all datasets
    dispChart.data.datasets.push(
        dataset(dailyDataFunc, "Daily New Cases", "Total Cases", "#008888"),
        dataset(avgDailyDataFunc, "Daily New Cases AVG", "Total Cases", "#000080", true),
        dataset(simpleDataFunc, "Cumulative Cases", "Total Cases", "#000000"),
        dataset(simpleDataFunc, "Active Cases", "Confirmed Positive", "#ff0000"),
        dataset(avgDataFunc, "Active Cases AVG", "Confirmed Positive", "#000080", true),
        dataset(simpleDataFunc, "Resolved Cases", "Resolved", "#00ff00"),
        dataset(dailyDataFunc, "Daily Deaths", "Deaths", "#880088"),
        dataset(avgDailyDataFunc, "Daily Deaths AVG", "Deaths", "#000080", true),
        dataset(simpleDataFunc, "Cumulative Deaths", "Deaths", "#0000ff"),
        dataset(simpleDataFunc, "Daily Tests Completed", "Total tests completed in the last day", "#888800"),
        dataset(avgDataFunc, "Daily Tests Completed AVG", "Total tests completed in the last day", "#000080", true),
        dataset(simpleDataFunc, "Hospitalized Patients", "Number of patients hospitalized with COVID-19", "#880000"),
        dataset(avgDataFunc, "Hospitalized Patients AVG", "Number of patients hospitalized with COVID-19", "#000080", true),
        dataset(simpleDataFunc, "Patients in ICU", "Number of patients in ICU with COVID-19", "#008800"),
        dataset(avgDataFunc, "Patients in ICU AVG", "Number of patients in ICU with COVID-19", "#000080", true),
        dataset(simpleDataFunc, "Patients on a Ventilator", "Number of patients in ICU on a ventilator with COVID-19", "#000088"),
        dataset(avgDataFunc, "Patients on a Ventilator AVG", "Number of patients in ICU on a ventilator with COVID-19", "#000080", true),
    );

    // restore the hidden status of all datasets
    for (let i = 0; i < dispChart.data.datasets.length; i++) {
        dispChart.getDatasetMeta(i).hidden = hiddens[i];
    }

    dispChart.update(); // update the chart display
}

// This function initializes the user interface for the program
// It creates and configures the chart as well as various other interactive elements

function setupDisplay(inputData) {

    // Get the actual relevant data from the source object and assign it to both fullData and data

    fullData = inputData.result.records; 
    data = inputData.result.records;

    let context = $("#display")[0].getContext('2d'); // Get the "context" object for use by Chart.js
    
    // create the chart
    dispChart = new Chart(context, {
        type: 'bar', // bar chart
        data: {
            datasets: [] // datasets will be added later dynamically
        },
        options: {
            maintainAspectRatio: false,
            legend: {
                labels: {
                    filter: function(legendItem, chart) {
                        // remove hidden datasets from displaying in legend
                        return !legendItem.hidden;
                    }
                }
            },
            tooltips: {
                titleFontSize: 16,
                bodyFontSize: 14,
                callbacks: {
                    title: (tt) => {
                        // User friendly formating of tooltip dates (instead of ISO format)
                        return moment(tt[0].label).format("ddd, MMM D, YYYY");
                    }
                }
            },
            scales: {
                xAxes: [{
                    type: 'time', // sets x-axis to be a time axis
                    time: {
                        unit: 'day', // measured in days
                    }
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });

    // Initialize all datasets
    genDatasets();

    // Set each dataset to be hidden by default
    for (let i = 0; i < dispChart.data.datasets.length; i++) {
        dispChart.getDatasetMeta(i).hidden = true;
    }
    
    dispChart.update(); // Update chart display

    // Create the interactive buttons
    dispChart.data.datasets.forEach((f) => {
        if (f.type != 'line') { // if the dataset is not an average
            if (dispChart.data.datasets.some((i) => i.label == (f.label + " AVG"))) { // and the dataset has a corresponding average dataset
                // create a button with a checkbox to enable the average
                $("#btns").append('<button class="btn btn-outline-primary">' + f.label + '<br><input class="check" type="checkbox" disabled><label>Average</label></button>');
            } else {
                // create a button with no checkbox
                $("#btns").append('<button class="btn btn-outline-primary">' + f.label + '</button>');

            }
        }
    });

    // When the user clicks a dataset button
    $(".btn").click((e) => {
        // ensure that the click is on the actual button and not on one of the inner buttons
        if (!$(e.target).is("button")) {
             return;
        }
        $(e.target).toggleClass("active"); // change whether the button is active

        // If the button has a checkbox inside it
        if ($(e.target).children().length) {
            // if the checkbox is disabled, enable it
            if ($(e.target).children("input")[0].hasAttribute("disabled")) {
                $(e.target).children("input").removeAttr("disabled");
            } else { // if it's enabled, disable it and the range control and uncheck it
                $(e.target).children("input").attr("disabled", true);
                $(e.target).children("input").prop("checked", false);
                $("#avg").attr("disabled", true);

                // find the corresponding average to the clicked button
                let index = dispChart.data.datasets.findIndex((ds) => ds.label == ($(e.target).parent().text().split("Average")[0] + " AVG"));
                dispChart.getDatasetMeta(index).hidden = true; // disable it and update the display
                dispChart.update();
            }
        }

        // find the dataset of the button which was clicked (split on Average to disregard the checkbox text)
        let index = dispChart.data.datasets.findIndex((ds) => ds.label == $(e.target).text().split("Average")[0]);
       
        // Toggle whether it is hidden from the chart display and update
        dispChart.getDatasetMeta(index).hidden = !dispChart.getDatasetMeta(index).hidden;
        dispChart.update();
    });

    // When the user double clicks a dataset button
    $(".btn").dblclick((e) => {
        // ensure that the click is on the actual button and not on one of the inner buttons
        if (!$(e.target).is("button")) {
            return;
        }

        $("#btns").children().removeClass("active"); // deactivate all buttons
        $("#btns").children().children("input").prop("checked", false); // uncheck and disable all checkboxes
        $("#btns").children().children("input").attr("disabled", true);
        $("#avg").attr("disabled", true); // disable the range control
        
        // If the button has a checkbox inside it
        if ($(e.target).children().length) {
            // if the checkbox is disabled, enable it
            if ($(e.target).children("input")[0].hasAttribute("disabled")) {
                $(e.target).children("input").removeAttr("disabled");
            } else { // if it's enabled, disable it and the range control and uncheck it
                $(e.target).children("input").attr("disabled", true);
                $(e.target).children("input").prop("checked", false);
                $("#avg").attr("disabled", true);

                // find the corresponding average to the double clicked button
                let index = dispChart.data.datasets.findIndex((ds) => ds.label == ($(e.target).parent().text().split("Average")[0] + " AVG"));
                dispChart.getDatasetMeta(index).hidden = true; // disable it
                dispChart.update(); // update the display
            }
        }

        $(e.target).addClass("active"); // activate the clicked button

        // hide all the datasets from the chart view
        for (let i = 0; i < dispChart.data.datasets.length; i++) {
            dispChart.getDatasetMeta(i).hidden = true;
        }

        // find the dataset of the button which was clicked (split on Average to disregard the checkbox text)
        let index = dispChart.data.datasets.findIndex((ds) => ds.label == $(e.target).text().split("Average")[0]);
        
        // enable the selected dataset and update it
        dispChart.getDatasetMeta(index).hidden = false;
        dispChart.update();
    });

    // When a checkbox is changed
    $(".check").change((e) => {

        // find the AVG dataset corresponding to the checkbox (split on Average to ignore the checkbox text)
        let index = dispChart.data.datasets.findIndex((ds) => ds.label == ($(e.target).parent().text().split("Average")[0] + " AVG"));
        
        // show or hide the dataset and enable or disable the range control depending on the status of the checkbox
        if ($(e.target).is(":checked")) {
            dispChart.getDatasetMeta(index).hidden = false;
            $("#avg").attr("disabled", false);
        } else {
            dispChart.getDatasetMeta(index).hidden = true;
            $("#avg").attr("disabled", true);
        }

        dispChart.update(); // update the dataset
    });

    // When the average range control is changed

    $("#avg").change((e) => {
        avgPeriod = $("#avg").val(); // update the average period variable
        genDatasets(); // regerate all datasets
    });

    // When the average control is moved (different from being changed, which is when it is moved and released)
    $(document).on('input', '#avg', () => {
        $("#avg-text").text($("#avg").val() + " days"); // update the element showing the setting
    });

    // When the either of the datepicker inputs change
    $("#datepicker>input").change((e) => {
        // get the starting and ending dates from the datepicker in Moment.js format
        startDate = moment($('#datestart').datepicker('getDate'));
        endDate = moment($('#dateend').datepicker('getDate'));

        // get the indexes of these dates in the original data
        let startDateIndex = fullData.findIndex((entry) => entry["Reported Date"] == startDate.format("YYYY-MM-DDTHH:mm:ss"));
        let endDateIndex = fullData.findIndex((entry) => entry["Reported Date"] == endDate.format("YYYY-MM-DDTHH:mm:ss"));

        data = fullData.slice(startDateIndex, endDateIndex + 1); // slice out that data
        genDatasets(); // and regenerate the datasets
    });
}