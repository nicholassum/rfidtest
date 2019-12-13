const inquirer = require('inquirer');

const config = require('./config.json');

rfid_io = new(require('./rfid_io.js'))();
db_access = new(require('./db_access.js'))();
IdModel = require('./id_model');

function write_user() {
    inquirer
        .prompt([{
            name: 'action',
            message: "What do you want to do?",
            type: 'list',
            choices: [
                {name:"Associate user with Card", value:0},
                {name:"Read Card", value:1}
            ]
        }]).then(function(answers) {
            switch (answers.action) {
                case 0:
                    inquirer
                        .prompt([{
                            name: 'uid',
                            message: "User Id"
                        }])
                        .then(function(answers) {
                            let loading_icon = twirlTimer("Searching for card ");

                            function write() {
                                rfid_io.action_when_connected(function(factory_id) {
                                    let data = rfid_io.read_data();
                                    let uid = db_access.generate_uid();
                                    let fid = new IdModel(factory_id);
                                    this.reader.writeDataToBlock(8, uid.id);
                                    db_access.associate_user_card(answers.uid, uid.toString(), fid.toString());
                                    clearInterval(loading_icon);
                                }, function(e) {
                                    if (e.code.toString()[0] == '4')
                                        console.log(e);
                                    setTimeout(write, 100);
                                });
                            }
                            write();
                        });
                    break;
                case 1:
                    let loading_icon;
                    function write(){
                        if (!loading_icon){
                            loading_icon = twirlTimer("Searching for card ");
                        }
                        rfid_io.action_when_connected(function(factory_id) {
                            let fid = new IdModel(factory_id);
                            let uid = new IdModel(rfid_io.read_data());
                            db_access.authenticate_card(uid.toString(), fid.toString()).then(function(badge){
                                db_access.report_card_use(uid.toString());
                                console.log("Access granted to: ", badge.member_id);

                                setTimeout(write, 1000);
                            }, function(e){
                                console.log(e);
                                setTimeout(write, 100);
                            });
                            clearInterval(loading_icon);
                            loading_icon = false;
                        }, function(e) {
                            if (!e.code || e.code.toString()[0] == '4')
                                console.log(e);
                            setTimeout(write, 100);
                        });
                    }
                    write();
                    break;
                    default:

            }
        });



}

function twirlTimer(text) {
    var P = ["    ", ".", "..", "...", "...."];
    var x = 0;
    return setInterval(function() {
        process.stdout.write("\r" + text + P[x++]);
        x = x % P.length;
    }, 250);
}

write_user();
