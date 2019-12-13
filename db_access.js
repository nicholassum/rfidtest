crypto = require("crypto");
firebase = require("firebase-admin");

config = require("./config")
IdModel = require('./id_model');

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
        data[badge_id] = true;
        this.db.ref("/members/" + member_id + "/badges/").set(data);
        this.db.ref("/badges/" + badge_id).set({
            member_id: member_id,
            factory_uid: factory_id.toString(),
            authentication_date: Date.now(),
            valid: true
        });
    }

    authenticate_card(badge_id, factory_id) {
        let db = this.db;
        return new Promise(function(resolve, reject){
            db.ref("/badges/" + badge_id).on("value", function(snapshot){
                let badge = snapshot.val();
                if (factory_id.toString() !== badge.factory_uid){
                    let e = new Error("Factory Ids do not match");
                    e.code = 405;
                    reject(e);
                    return;
                }

                if (!badge.member_id){
                    let e = new Error("No associated member");
                    e.code = 405;
                    reject(e);
                    return;
                }

                db.ref("/members/" + badge.member_id + "/badges/" + badge_id).on("value", function(badge_associated){
                    if(badge_associated) {
                        resolve(badge);
                    } else {
                        let e = new Error("Badge not in member list, despite pointer");
                        e.code = 503;
                        reject(e);
                        return;
                    }
                });
            }, function(){
                let e = new Error("Badge not recognized");
                e.code = 403;
                reject(e);
            });
        });

    }

    report_card_use(badge_id) {
        this.db.ref("/badges/" + badge_id).update({
            last_used: Date.now(),
            location_last_used: config.machine
        });

    }
}


module.exports = DbAccess;
