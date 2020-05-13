const fields = [
"Reported Date",
"Confirmed Negative",
"Presumptive Negative",
"Presumptive Positive",
"Confirmed Positive",
"Resolved",
"Deaths",
"Total Cases",
"Total patients approved for testing as of Reporting Date",
"Total tests completed in the last day",
"Under Investigation",
"Number of patients hospitalized with COVID-19",
"Number of patients in ICU with COVID-19",
"Number of patients in ICU on a ventilator with COVID-19",
];

$(document).ready(() => {
    fetchData(displayResults);
});

function fetchData(successHandler) {
    $.ajax({
        url: 'https://data.ontario.ca/api/3/action/datastore_search',
        data: {
            resource_id: 'ed270bb8-340b-41f9-a7c6-e8ef587e6d11', // the resource id
        },
        dataType: 'jsonp',
        cache: 'true', // do not send timestamp parameter
        success: successHandler,
    });
}

function createDataset(info, field, colour) {
    return {
        label: field,
        backgroundColor: colour,
        data: info.map((item) => {
            return {x: item["Reported Date"], y: item[field]};
        }),
    };
}

function displayResults(results) {
    console.log(results);

    results = results.result.records; //get to the actual data

    var context = $("#display")[0].getContext('2d');
    
    var dispChart = new Chart(context, {
        type: 'bar',
        data: {
            datasets: [
                // {
                //     label: "Deaths",
                //     backgroundColor: "0x0000ff",
                //     data: results.map((item) => {
                //         return {x: item["Reported Date"], y: item["Deaths"]};
                //     }),
                // }
                //createDataset(results, "Deaths", "#ff0000"),
            ]
        },
        options: {
            legend: {
                labels: {
                    filter: function(legendItem, chart) {
                        // Logic to remove a particular legend item goes here
                        return !legendItem.hidden;
                    }
                }
            },
            scales: {
                xAxes: [{
                    type: 'time',
                    time: {
                        unit: 'day',
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

    for (fieldNum = 0; fieldNum < fields.length; fieldNum++) {
        dispChart.data.datasets.push(createDataset(results, fields[fieldNum], "#" + ((Math.trunc(0xffffff/fields.length) * fieldNum)).toString(16)));
        dispChart.getDatasetMeta(fieldNum).hidden = true;
    }
    //dispChart.data.datasets.push(createDataset(results, "Deaths", "#ff0000"));
    //dispChart.data.datasets.push(createDataset(results, "Total tests completed in the last day", "#00ff00"));
    //dispChart.getDatasetMeta(0).hidden = true;
    dispChart.update();
}