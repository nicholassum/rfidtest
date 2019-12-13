// let Firebase = require("firebase");
// let fs = require('fs');
// let sys = require('util');
// let exec = require('child_process').exec,
//     child, child1;
const Mfrc522 = require("mfrc522-rpi");
const SoftSPI = require("rpi-softspi");
const default_key = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF];
class RfidIo {
    constructor() {
        let softSPI = new SoftSPI({
            clock: 23, // pin number of SCLK
            mosi: 19, // pin number of MOSI
            miso: 21, // pin number of MISO
            client: 24 // pin number of CS
        });

        // GPIO 24 can be used for buzzer bin (PIN 18), Reset pin is (PIN 22).
        // I believe that channing pattern is better for configuring pins which are optional methods to use.
        this.reader = new Mfrc522(softSPI).setResetPin(22).setBuzzerPin(18);
    }

    action_when_connected(fn, fn_failed, fn_finally) {
        let result;
        this.reader.reset();
        try{
            if(this.find_card()){
                let fid = this.read_fid();
                this.reader.selectCard(fid);
                this.auth_card(fid);
                result = fn.apply(this, [fid]);
                this.reader.alert();
            }
        }
        catch (e) {
            if (fn_failed) {
                result = fn_failed.apply(this, [e]);
            }
        }

        if (fn_finally){
            result = fn_finally.apply(this, []);
        }
        this.reader.stopCrypto();
        return result;
    }

    read_card() {
        return this.action_when_connected(function(){
            let data = this.read_data();
            return data;
        });
    }

    write_card(data) {
        return this.action_when_connected(function(){
                this.reader.writeDataToBlock(8, [0xAA,0xBB,0xCC,0xDD]);
        });
    }

    find_card() {
        let response = this.reader.findCard();
        if (!response.status){
            let e = new Error("Couldn't find card");
            e.code = 304;
            throw e;
        }
        return !!response.status;
    }

    read_fid() {
        let response = this.reader.getUid();
        if (!response.status) {
            let e = new Error("Couldn't read RFID FID");
            e.code = 501;
            throw e;
        } else {
            return response.data;
        }
    }

    auth_card(fid) {
        return this.reader.authenticate(8, default_key, fid);
    }

    read_data() {
        let response = this.reader.getDataForBlock(8);
        if (response.length < 8){
            let e = new Error("Failed read data");
            e.code = 500;
            throw e;
        }
        return response;
    }

    write_data( data ) {
        return this.reader.writeDataToBlock(8, data);
    }
}


module.exports = RfidIo;
