var results;

function renameObjectKey(oldObj, oldName, newName) {
    const newObj = {};

    Object.keys(oldObj).forEach(key => {
        const value = oldObj[key];

        if (key === oldName) {
            newObj[newName] = value;
        } else {
            newObj[key] = value;
        }
    });

    return newObj;
}

$(document).ready(() => {

    var data = {
        resource_id: 'ed270bb8-340b-41f9-a7c6-e8ef587e6d11', // the resource id
        fields: "Reported Date,Deaths",
    };
    $.ajax({
        url: 'https://data.ontario.ca/api/3/action/datastore_search',
        data: data,
        dataType: 'jsonp',
        cache: 'true',
        success: function(data) {
            results = data.result.records;
            displayResults();
        },
    });
});

function displayResults() {

    //console.log(datax)

    var ctx = $("#display")[0].getContext('2d');
    var dispChart = new Chart(ctx, {
        type: 'bar',
        data: {
            //labels: [1, 2, 3, 4, 5, 6, 7, 8],
            datasets: [{
                label: "Deaths",
                backgroundColor: "0x0000ff",
                data: results.map((item) => {
                    return {x: item["Reported Date"], y: item["Deaths"]};
                }),
            }]
        },
        options: {
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
}