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

function simpleDataset(info, label, field, colour) {
    return {
        label: label,
        backgroundColor: colour,
        data: info.map((item) => {
            return {x: item["Reported Date"], y: item[field]};
        }),
    };
}

function dailyDataset(info, label, field, colour) {
    data = [];
    newData = dailyDataFunc(info, field);
    for (var i = 0; i < info.length; i++) {
        data.push({x: info[i]["Reported Date"], y: newData[i]});
    }
    console.log(data);
    return {
        label: label,
        backgroundColor: colour,
        data: data,
    };
}

function avgDailyDataset(info, label, field, colour) {
    data = [];
    newData = avgDailyDataFunc(dailyDataFunc(info, field));
    for (var i = 0; i < info.length; i++) {
        data.push({x: info[i]["Reported Date"], y: newData[i]});
    }
    console.log(data);
    return {
        label: label,
        borderColor: colour,
        backgroundColor: 'rgba(0, 0, 0, 0)',
        pointRadius: 0,
        data: data,
        type: "line",
    };
}

function avgDailyDataFunc(oldData) { //takes the data normally in array
    //Calculates a 5 day rolling average
    //l = oldData.map((t) => t[field]);
    l = oldData;
    l1 = [];
    for (var i = 0; i < l.length; i++) {
        l1.push((l[i] + l[i-1] + l[i-2] + l[i-3] + l[i-4])/5);
    }
    console.log(l1);
    return l1
}

function dailyDataFunc(oldData, field) {
    l = oldData.map((t) => t[field]);
    l.unshift(0);
    l1 = [];
    for (var i = 0; i < l.length; i++) {
        l1.push(l[i] - l[i - 1]);
    }
    l1.shift();
    console.log(l1);
    return l1
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
            tooltips: {
                titleFontSize: 16,
                bodyFontSize: 14,
                callbacks: {
                    title: (tt) => {
                        return moment(tt[0].label).format("ddd, MMM D, YYYY");
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

    dispChart.data.datasets.push(
        avgDailyDataset(results, "Daily New Cases (5-Day Avg)", "Total Cases", "#000080"),
        dailyDataset(results, "Daily New Cases", "Total Cases", "#008888"),
        simpleDataset(results, "Cumulative Cases", "Total Cases", "#000000"),
        simpleDataset(results, "Active Cases", "Confirmed Positive", "#ff0000"),
        simpleDataset(results, "Resolved Cases", "Resolved", "#00ff00"),
        dailyDataset(results, "Daily Deaths", "Deaths", "#880088"),
        simpleDataset(results, "Cumulative Deaths", "Deaths", "#0000ff"),
        simpleDataset(results, "Daily Tests Completed", "Total tests completed in the last day", "#888800"),
        simpleDataset(results, "Hospitalized Patients", "Number of patients hospitalized with COVID-19", "#880000"),
        simpleDataset(results, "Patients in ICU", "Number of patients in ICU with COVID-19", "#008800"),
        simpleDataset(results, "Patients on a Ventilator", "Number of patients in ICU on a ventilator with COVID-19", "#000088"),
    );
    
    for (var i = 0; i < dispChart.data.datasets.length; i++) {
        dispChart.getDatasetMeta(i).hidden = true;
    }
    dispChart.update();

    dispChart.data.datasets.forEach((f) => {
        $("#btns").append('<button class="btn btn-outline-primary">' + f.label + "</button>");
    });

    $(".btn").click((e) => {
        //console.log(fields.indexOf($(e.target).html()));
        $(e.target).toggleClass("active");
        var index = dispChart.data.datasets.findIndex((ds) => ds.label == $(e.target).text());
        dispChart.getDatasetMeta(index).hidden = !dispChart.getDatasetMeta(index).hidden;
        dispChart.update();
    });

    $(".btn").dblclick((e) => {
        //console.log(fields.indexOf($(e.target).html()));
        $("#btns").children().removeClass("active");
        $(e.target).addClass("active");
        for (var i = 0; i < dispChart.data.datasets.length; i++) {
            dispChart.getDatasetMeta(i).hidden = true;
        }
        var index = dispChart.data.datasets.findIndex((ds) => ds.label == $(e.target).text());
        dispChart.getDatasetMeta(index).hidden = false;
        dispChart.update();
    });
}