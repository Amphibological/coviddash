let avgPeriod = 5;

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
        order: 1,
    };
}

function dailyDataset(info, label, field, colour) {
    data = [];
    newData = dailyDataFunc(info, field);
    for (var i = 0; i < info.length; i++) {
        data.push({x: info[i]["Reported Date"], y: newData[i]});
    }
    //console.log(data);
    return {
        label: label,
        backgroundColor: colour,
        data: data,
        order: 1,
    };
}

function avgDailyDataset(info, label, field, colour) {
    data = [];
    newData = avgDailyDataFunc(dailyDataFunc(info, field));
    for (var i = 0; i < info.length; i++) {
        data.push({x: info[i]["Reported Date"], y: newData[i]});
    }
    //console.log(data);
    return {
        label: label,
        borderColor: colour,
        backgroundColor: 'rgba(0, 0, 0, 0)',
        pointRadius: 0,
        data: data,
        type: "line",
        order: 0,
    };
}

function avgDataset(info, label, field, colour) {
    data = [];
    newData = avgDataFunc(info, field);
    for (var i = 0; i < info.length; i++) {
        data.push({x: info[i]["Reported Date"], y: newData[i]});
    }
    //console.log(data);
    return {
        label: label,
        borderColor: colour,
        backgroundColor: 'rgba(0, 0, 0, 0)',
        pointRadius: 0,
        data: data,
        type: "line",
        order: 0,
    };
}

function avgDataFunc(oldData, field) { //takes the data normally in array
    //Calculates a 5 day rolling average
    l = oldData.map((t) => t[field]);
    l1 = [];
    for (var i = 0; i < l.length; i++) {
        //l1.push((l.slice(i-(avgPeriod - 1), i+1).reduce((a, b) => a + b, 0)) / avgPeriod);
        l1.push((l.slice(i - (Math.ceil(avgPeriod/2)), i + (Math.floor(avgPeriod/2))).reduce((a, b) => a + b, 0)) / avgPeriod);
    }
    //console.log(l1);
    return l1
}

function avgDailyDataFunc(oldData) { //takes the data normally in array
    //Calculates a 5 day rolling average
    //l = oldData.map((t) => t[field]);
    l = oldData;
    l1 = [];
    for (var i = 0; i < l.length; i++) {
        //l1.push((l.slice(i-(avgPeriod - 1), i+1).reduce((a, b) => a + b, 0)) / avgPeriod);
        l1.push((l.slice(i - (Math.ceil(avgPeriod/2)), i + (Math.floor(avgPeriod/2))).reduce((a, b) => a + b, 0)) / avgPeriod);
    }
    //console.log(l1);
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
    //console.log(l1);
    return l1
}

function displayResults(results) {
    //console.log(results);

    results = results.result.records; //get to the actual data

    var context = $("#display")[0].getContext('2d');
    
    var dispChart = new Chart(context, {
        type: 'bar',
        data: {
            datasets: []
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
        dailyDataset(results, "Daily New Cases", "Total Cases", "#008888"),
        avgDailyDataset(results, "Daily New Cases AVG", "Total Cases", "#000080"),
        simpleDataset(results, "Cumulative Cases", "Total Cases", "#000000"),
        simpleDataset(results, "Active Cases", "Confirmed Positive", "#ff0000"),
        avgDataset(results, "Active Cases AVG", "Confirmed Positive", "#000080"),
        simpleDataset(results, "Resolved Cases", "Resolved", "#00ff00"),
        dailyDataset(results, "Daily Deaths", "Deaths", "#880088"),
        avgDailyDataset(results, "Daily Deaths AVG", "Deaths", "#000080"),
        simpleDataset(results, "Cumulative Deaths", "Deaths", "#0000ff"),
        simpleDataset(results, "Daily Tests Completed", "Total tests completed in the last day", "#888800"),
        avgDataset(results, "Daily Tests Completed AVG", "Total tests completed in the last day", "#000080"),
        simpleDataset(results, "Hospitalized Patients", "Number of patients hospitalized with COVID-19", "#880000"),
        avgDataset(results, "Hospitalized Patients AVG", "Number of patients hospitalized with COVID-19", "#000080"),
        simpleDataset(results, "Patients in ICU", "Number of patients in ICU with COVID-19", "#008800"),
        avgDataset(results, "Patients in ICU AVG", "Number of patients in ICU with COVID-19", "#000080"),
        simpleDataset(results, "Patients on a Ventilator", "Number of patients in ICU on a ventilator with COVID-19", "#000088"),
        avgDataset(results, "Patients on a Ventilator AVG", "Number of patients in ICU on a ventilator with COVID-19", "#000080"),
    );
    
    for (var i = 0; i < dispChart.data.datasets.length; i++) {
        dispChart.getDatasetMeta(i).hidden = true;
    }
    
    dispChart.update();

    dispChart.data.datasets.forEach((f) => {
        if (f.type != 'line') {
            if (dispChart.data.datasets.some((i) => {return i.label == (f.label + " AVG");})) {
                $("#btns").append('<button class="btn btn-outline-primary">' + f.label + '<br><input class="check" type="checkbox" disabled><label>Average</label></button>');
            } else {
                $("#btns").append('<button class="btn btn-outline-primary">' + f.label + '</button>');

            }
        }
    });

    $(".btn").click((e) => {
        if (!$(e.target).is("button")) {
             return;
        }
        $(e.target).toggleClass("active");
        //console.log($(e.target).children("input"));
        if ($(e.target).children().length) {
            if ($(e.target).children("input")[0].hasAttribute("disabled")) {
                $(e.target).children("input").removeAttr("disabled");
            } else {
                $(e.target).children("input").attr("disabled", true);
                $(e.target).children("input").prop("checked", false);
                var index = dispChart.data.datasets.findIndex((ds) => ds.label == ($(e.target).parent().text().split("Average")[0] + " AVG"));
                dispChart.getDatasetMeta(index).hidden = true;
                dispChart.update();
            }
        }
        var index = dispChart.data.datasets.findIndex((ds) => ds.label == $(e.target).text().split("Average")[0]);
        dispChart.getDatasetMeta(index).hidden = !dispChart.getDatasetMeta(index).hidden;
        dispChart.update();
    });

    $(".btn").dblclick((e) => {
        //console.log(fields.indexOf($(e.target).html()));
        if (!$(e.target).is("button")) {
            return;
        }
        $("#btns").children().removeClass("active");

        if ($(e.target).children().length) {
            if ($(e.target).children("input")[0].hasAttribute("disabled")) {
                $(e.target).children("input").removeAttr("disabled");
            } else {
                $(e.target).children("input").attr("disabled", true);
                $(e.target).children("input").prop("checked", false);
                var index = dispChart.data.datasets.findIndex((ds) => ds.label == ($(e.target).parent().text().split("Average")[0] + " AVG"));
                dispChart.getDatasetMeta(index).hidden = true;
                dispChart.update();
            }
        }
        $(e.target).addClass("active");
        for (var i = 0; i < dispChart.data.datasets.length; i++) {
            dispChart.getDatasetMeta(i).hidden = true;
        }
        var index = dispChart.data.datasets.findIndex((ds) => ds.label == $(e.target).text().split("Average")[0]);
        dispChart.getDatasetMeta(index).hidden = false;
        dispChart.update();
    });

    $(".check").change((e) => {
        console.log($(e.target).parent().text().split("Average")[0]);
        var index = dispChart.data.datasets.findIndex((ds) => ds.label == ($(e.target).parent().text().split("Average")[0] + " AVG"));
        if ($(e.target).is(":checked")) {
            dispChart.getDatasetMeta(index).hidden = false;
        } else {
            dispChart.getDatasetMeta(index).hidden = true;
        }
        dispChart.update();
    });

    $("#avg").change((e) => {
        avgPeriod = $("#avg").val();
        //console.log(avgPeriod);
        var hiddens = [];
        for (var i = 0; i < dispChart.data.datasets.length; i++) {
            hiddens.push(dispChart.getDatasetMeta(i).hidden);
        }
        dispChart.data.datasets = [];
        dispChart.data.datasets.push(
            dailyDataset(results, "Daily New Cases", "Total Cases", "#008888"),
            avgDailyDataset(results, "Daily New Cases AVG", "Total Cases", "#000080"),
            simpleDataset(results, "Cumulative Cases", "Total Cases", "#000000"),
            simpleDataset(results, "Active Cases", "Confirmed Positive", "#ff0000"),
            avgDataset(results, "Active Cases AVG", "Confirmed Positive", "#000080"),
            simpleDataset(results, "Resolved Cases", "Resolved", "#00ff00"),
            dailyDataset(results, "Daily Deaths", "Deaths", "#880088"),
            avgDailyDataset(results, "Daily Deaths AVG", "Deaths", "#000080"),
            simpleDataset(results, "Cumulative Deaths", "Deaths", "#0000ff"),
            simpleDataset(results, "Daily Tests Completed", "Total tests completed in the last day", "#888800"),
            avgDataset(results, "Daily Tests Completed AVG", "Total tests completed in the last day", "#000080"),
            simpleDataset(results, "Hospitalized Patients", "Number of patients hospitalized with COVID-19", "#880000"),
            avgDataset(results, "Hospitalized Patients AVG", "Number of patients hospitalized with COVID-19", "#000080"),
            simpleDataset(results, "Patients in ICU", "Number of patients in ICU with COVID-19", "#008800"),
            avgDataset(results, "Patients in ICU AVG", "Number of patients in ICU with COVID-19", "#000080"),
            simpleDataset(results, "Patients on a Ventilator", "Number of patients in ICU on a ventilator with COVID-19", "#000088"),
            avgDataset(results, "Patients on a Ventilator AVG", "Number of patients in ICU on a ventilator with COVID-19", "#000080"),
        );
        for (var i = 0; i < dispChart.data.datasets.length; i++) {
            dispChart.getDatasetMeta(i).hidden = hiddens[i];
        }
        dispChart.update();
    });

    $(document).on('input', '#avg', () => {
        $("#avg-text").text($("#avg").val() + " days");
    });
}