const config = require('./config.json');

rfid_io = new(require('./rfid_io.js'))();
db_access = new(require('./db_access.js'))();
IdModel = require('./id_model');

function listenForChange() {
    firebase.database().ref('libratory/badgeToWrite').on('value', snapshot => {        
        if (snapshot.val()) {
            console.log(snapshot.val());
            function write() {                                
                rfid_io.action_when_connected(function(factory_id) {
                    let data = rfid_io.read_data();
                    let uid = db_access.generate_uid();
                    let fid = new IdModel(factory_id);
                    this.reader.writeDataToBlock(8, uid.id);
                    db_access.associate_user_card(snapshot.val(), uid.toString(), fid.toString()).then((res) => {
                        console.log(res)
                    }, function(e) {
                        console.log(e);                                        
                    });                    
                }, function(e) {                    
                    if (e.code.toString()[0] == '4')
                        console.log(e);
                    setTimeout(write, 100);
                });
            }
            write();
        }
        else {
            console.log("value is null");
        }
    })
}

listenForChange();