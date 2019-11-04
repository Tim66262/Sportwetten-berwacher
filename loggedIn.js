$(document).ready(function() {
    var user;
    var saldo;
    $('.sidenav').sidenav();
    google.charts.load('current', {
        'packages': ['bar']
    });
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            $('#content').css('display', 'block');
            storeUser(user);
            firebase.database().ref(user.uid).on('value', function(snapshot) {
                $('.notLoading').css('visibility', 'hidden');
                $('.loading').css('display', 'table');
                buildHtml(snapshot)
                $('.loading').css('display', 'none');
                $('.notLoading').css('visibility', 'visible');
            });
        } else {
            window.location.replace("index.html");
        }
    }, function(error) {
        console.log(error);
    });
});

function storeUser(userObject) {
    user = userObject;
}

function buildHtml(snapshot) {
    var data = [['Monat', 'Gewinn', 'Verlust'],['Jan',0 , 0], ['Feb',0 , 0], ['Mar',0 , 0], ['Apr',0 , 0], ['Mai',0 , 0], ['Jun',0 , 0], ['Jul',0 , 0], ['Aug',0 , 0], ['Sep',0 , 0], ['Okt',0 , 0], ['Nov',0 , 0], ['Dez',0 , 0]];
    $('#table tbody').empty();
    var chart = new google.charts.Bar(document.getElementById('columnchart_material'));
    var t = "";
    var counter = 0;
    var saldo = 0;
    snapshot.forEach(function(childSnapshot) {
        saldo = Math.round((saldo + countPieceOfGuthaben(childSnapshot)) * 100) / 100;
        var id = Object.keys(snapshot.val())[counter]
        var dateArray = childSnapshot.val().date.split(" ");
        var tr = "<tr>";
        if (childSnapshot.val().type == "Wette") {
            tr += "<td><i class=\"material-icons\">ondemand_video</i></td>";
        } else if (childSnapshot.val().type == "Einzahlung") {
            tr += "<td><i class=\"material-icons\">attach_money</i></td>";
        } else {
            tr += "<td><i class=\"material-icons\">money_off</i></td>";
        }
        tr += "<td>" + childSnapshot.val().description + "</td>";
        if (childSnapshot.val().type == "Wette") {
            tr += "<td>" + childSnapshot.val().einsatz + " Fr.-</td>";
            tr += "<td>" + childSnapshot.val().quote + "</td>";
        } else {
            tr += "<td></td>";
            tr += "<td></td>";
        }
        tr += "<td>" + dateArray[2] + "." + dateArray[1] + "." + dateArray[3] + "</td>";
        if (childSnapshot.val().type == "Wette") {
            var date = childSnapshot.val().date.split(" ");
            var year = date[3];
            var month = date[1]
            if (childSnapshot.val().win) {
                var gewinn = Math.round(((parseFloat(childSnapshot.val().einsatz) * parseFloat(childSnapshot.val().quote) - parseFloat(childSnapshot.val().einsatz))) * 100) / 100;
                tr += "<td><button class=\"btn-floating btn-small waves-effect waves-light green\" onclick=\"updateWin('" + id + "')\"><i class=\"material-icons\">thumb_up</i></button></td>";
                tr += "<td>+ " + gewinn + " Fr.-</td>";
                if(year == new Date().getFullYear()){
                    for(var i = 1; i < data.length; i++){
                      if(data[i][0] == month){
                        data[i][1] = data[i][1] + gewinn;
                      }
                    }
                }
            } else {
                var verlust = Math.round((parseFloat(childSnapshot.val().einsatz)) * 100) / 100;
                tr += "<td><button class=\"btn-floating btn-small waves-effect waves-light red\" onclick=\"updateWin('" + id + "')\"><i class=\"material-icons\">thumb_down</i></button></td>";
                tr += "<td>- " + verlust + " Fr.-</td>";
                if(year == new Date().getFullYear()){
                    for(var i = 1; i < data.length; i++){
                      if(data[i][0] == month){
                        data[i][2] = data[i][2] + verlust;
                      }
                    }
                }
            }
        } else {
            tr += "<td></td>";
            if (childSnapshot.val().type == "Einzahlung") {
                tr += "<td>+ " + childSnapshot.val().summe + " Fr.-</td>";
            } else {
                tr += "<td>- " + childSnapshot.val().summe + " Fr.-</td>";
            }
        }

        tr += "</tr>";
        t = tr + t;
        counter = counter + 1;
    });
    var dataGoogle = google.visualization.arrayToDataTable(data);

    var options = {
        chart: {
            title: 'Sportwettenverlauf',
            subtitle: 'Analyse von den Sportwetten in dem aktuellen Jahr',
        }
    };
    chart.draw(dataGoogle, google.charts.Bar.convertOptions(options));
    document.getElementById("table").innerHTML += t;
    $('#guthaben').text("Guthaben: " + saldo + " Fr.-");
    $('#guthabenMobile').text("Guthaben: " + saldo + " Fr.-")
    this.saldo = saldo;
}

function writeTipp(description, einsatz, quote) {
    firebase.database().ref(user.uid).push({
        type: "Wette",
        description: description,
        einsatz: einsatz,
        quote: quote,
        win: false,
        date: Date(Date.now()).toString()
    })
}

function writeEinzahlung(summe) {
    firebase.database().ref(user.uid).push({
        type: "Einzahlung",
        description: "Einzahlung",
        summe: summe,
        date: Date(Date.now()).toString()
    })
}

function writeAuszahlung(summe) {
    firebase.database().ref(user.uid).push({
        type: "Auszahlung",
        description: "Auszahlung",
        summe: summe,
        date: Date(Date.now()).toString()
    })
}

function writeTippEvent() {
    var inputDescription = $('#description').val();
    var inputEinsatz = $('#einsatz').val();
    var inputQuote = $('#quote').val();
    if (inputDescription.length && inputQuote.length && inputEinsatz.length) {
        if (this.saldo >= parseFloat(inputEinsatz)) {
            writeTipp(inputDescription, parseFloat(inputEinsatz), parseFloat(inputQuote))
            $('#description').val('');
            $('#einsatz').val('5');
            $('#quote').val('1.5');
        } else {
            M.toast({
                html: '<i class="material-icons">warning</i><span> Der Einsatz muss kleider als das Guthaben sein</span>',
                classes: 'rounded  amber lighten-2'
            })
        }
    } else {
        M.toast({
            html: '<i class="material-icons">warning</i><span> Fülle alle Felder aus</span>',
            classes: 'rounded  amber lighten-2'
        })
    }
}

function summeEinzahlen() {
    var inputSumme = $('#summeEinzahlen').val();
    if (inputSumme.length) {
        writeEinzahlung(inputSumme);
    } else {
        M.toast({
            html: '<i class="material-icons">warning</i><span> Fülle alle Felder aus</span>',
            classes: 'rounded  amber lighten-2'
        })
    }
}

function summeAuszahlen() {
    var inputSumme = $('#summeAuszahlen').val();
    if (inputSumme.length) {
        if (this.saldo >= parseFloat(inputSumme)) {
            writeAuszahlung(inputSumme);
        } else {
            M.toast({
                html: '<i class="material-icons">warning</i><span> Du kannst dir maximal dein Guthaben auszahlen</span>',
                classes: 'rounded  amber lighten-2'
            })
        }
    } else {
        M.toast({
            html: '<i class="material-icons">warning</i><span> Fülle alle Felder aus</span>',
            classes: 'rounded  amber lighten-2'
        })
    }
}

function updateWin(betId) {
    firebase.database().ref(user.uid + "/" + betId).once('value').then(function(snapshot) {
        var postData = {
            type: snapshot.val().type,
            description: snapshot.val().description,
            einsatz: snapshot.val().einsatz,
            quote: snapshot.val().quote,
            win: true,
            date: snapshot.val().date
        };
        var updates = {};
        updates[user.uid + "/" + betId] = postData;
        firebase.database().ref().update(updates);
    });
}

function countPieceOfGuthaben(childSnapshot) {
    if (childSnapshot.val().type == "Einzahlung") {
        return parseFloat(childSnapshot.val().summe);
    } else if (childSnapshot.val().type == "Auszahlung") {
        return 0 - parseFloat(childSnapshot.val().summe);
    } else {
        if (childSnapshot.val().win) {
            return (parseFloat(childSnapshot.val().einsatz) * parseFloat(childSnapshot.val().quote) - parseFloat(childSnapshot.val().einsatz))
        } else {
            return 0 - (parseFloat(childSnapshot.val().einsatz))
        }
    }

}


function logOut() {
    firebase.auth().signOut().then(function() {
        console.log('Signed Out');
    }, function(error) {
        console.error(error);
    });
}
