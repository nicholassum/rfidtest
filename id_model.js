class IdModel{
    constructor(id){
        if (typeof id == 'object'){
            this.id = id;
        } else {
            this.id_obj(id);
        }

    }

    toString() {
        return this.id_string(this.id);
    }

    id_string() {
        let data = this.id;
        let result = "";
        for ( let i = 0; i < data.length; i++){
            result += data[i].toString(16);
        }
        return result;
    }

    id_obj(id_str){
        this.id = IdModel.decode_uid(id_str);
    }

    static decode_uid(id_str) {
        var id = [];
        for (var i = 0; i < id_str.length; i += 2) {
            id.push(parseInt(id_str.substring(i, i + 2), 16));
        }
        return id;
    }
}


module.exports = IdModel;
