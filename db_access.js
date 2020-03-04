crypto = require("crypto");
firebase = require("firebase-admin");

config = require("./config")
IdModel = require('./id_model');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

class DbAccess {
    constructor() {
        firebase.initializeApp({
            credential: firebase.credential.cert(require("./firebaseadmin.json")),
            databaseURL: config.firebase_url
        });
        this.db = firebase.database();         
    }

    generate_uid() {
        let badge_id = new IdModel(crypto.randomBytes(16).toString('hex'));
        return badge_id;
    }

    associate_user_card(member_id, badge_id, factory_id) {
        let data = {};
        data.member_id = member_id;
        data.factory_uid = factory_id;
        data.badge_id = badge_id;                            
        return new Promise(function(resolve, reject) {            
            var url = config.functions_endpoint + 'writeCard';            
            var xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);
            xhr.setRequestHeader("Content-type", "application/json");
            xhr.onreadystatechange = function() {               
                if (xhr.readyState == 4) {
                    var response = xhr.response;
                    if (xhr.status == 200) {
                        resolve(response);
                    }
                    else {
                        reject(response);
                    }
                }
            };
            var postData = JSON.stringify(data);            
            xhr.send(postData);
        });
    }

    authenticate_card(badge_id, factory_id) {        

        let data = {};
        data.badge_id = badge_id;
        data.factory_uid = factory_id;

        return new Promise(function(resolve, reject) {            
            var url = config.functions_endpoint + 'readCard';            
            var xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);
            xhr.setRequestHeader("Content-type", "application/json");
            xhr.onreadystatechange = function() {                
                if (xhr.readyState == 4) {
                    var response = xhr.responseText;
                    if (xhr.status == 200) {                        
                        resolve(response);
                    }
                    else {                        
                        reject(response);
                    }
                }                        
            };
            var postData = JSON.stringify(data);                     
            xhr.send(postData);
        })
    }
}

module.exports = DbAccess;
