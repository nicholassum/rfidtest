const config = require('./config.json');

rfid_io = new(require('./rfid_io.js'))();
db_access = new(require('./db_access.js'))();
IdModel = require('./id_model');

function read(){
    rfid_io.action_when_connected(function(factory_id) {
        let fid = new IdModel(factory_id);
        let uid = new IdModel(rfid_io.read_data());
        db_access.authenticate_card(uid.toString(), fid.toString()).then((res) =>{
            var data = JSON.parse(res)
            firebase.database().ref(`libratory/members/${data.memberId}`).once('value').then(snapshot => {
                console.log(`Access Granted to ${snapshot.val().first_name} ${snapshot.val().last_name}.`)
            })
            setTimeout(read, 1000);
        }, function(e){
            console.log(e);
            setTimeout(read, 100);
        });
    }, function(e) {    
        if (!e.code || e.code.toString()[0] == '4')
            console.log(e);
        setTimeout(read, 100);
    });
}
read();