
var routeTable = {}

// source : https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function getServerMessage(type, message, append, destination) {
    var obj = {
        type: type,
        source: "_SERVER_",
        destination: destination,
        message: message
    }
    if (append) {
        for (key in append) {
            obj[key] = append[key];
        }
    }
    return JSON.stringify(obj);
}

class Client {
    constructor(ws) {
        this.ws = ws;
        this.id = null;
        this.timeout = 15; //seconds
        var client = this;

        ws.on('message', function(data){
            client.onMessage(data);
        });
        ws.on('close', function() {
            delete routeTable[client.id];
        });
        this.processTimeout();
    }

    onMessage(data) {
        var json = null;
        try {
            json = JSON.parse(data);
        } catch (e) {
            ws.send(getServerMessage("error", "JSON Parse Error"));
            return;
        }

        if (this.id == null) {
            if(json.type == "start") {
                this.setID();
                this.ws.send(getServerMessage("set", "ok", {
                    id: this.id
                }, this.id));
            } else {
                ws.send(getServerMessage("error", "procedure error"));
            }
        } else {
            this.process(json);
        }
    }

    setID() {
        do {
            this.id = makeid(32);
        } while(routeTable[this.id] != null);
        routeTable[this.id] = this;
    }

    process(json) {
        var x = [];
        for(key in routeTable) {
            x.push(key);
        }
        this.ws.send(getServerMessage("control", "ok", {
            list: x.join(", ")
        }));
    }

    processTimeout() {
        var client = this;
        var timer = setInterval(function () {
            if (client.id != null) {
                clearInterval(timer);
            } else if (client.timeout < 0) {
                clearInterval(timer);
                client.ws.send(getServerMessage("error", "timeout"));
                client.ws.close();
            } else {
                client.timeout--;
            }
        }, 1000);
    }
}

module.exports = {
    onConnection: function (ws) {
        ws.send(getServerMessage("start", "hello"));
        new Client(ws);
    }
};