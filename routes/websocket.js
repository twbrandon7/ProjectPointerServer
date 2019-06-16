
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
        this.role = null;
        this.opposite = null;
        this.keepaliveTimer = null;
        var client = this;

        ws.on('message', function (data) {
            client.onMessage(data);
        });
        ws.on('close', function () {
            delete routeTable[client.id];
            clearInterval(client.keepaliveTimer);
        });
        this.processTimeout();
        this.keepalive();
    }

    onMessage(data) {
        var json = null;
        try {
            json = JSON.parse(data);
        } catch (e) {
            this.ws.send(getServerMessage("error", "JSON Parse Error"));
            return;
        }

        if (this.id == null) {
            if (json.type == "start") {
                this.setID();
                this.ws.send(getServerMessage("start", "ok", {
                    id: this.id
                }, this.id));
            } else {
                this.ws.send(getServerMessage("error", "procedure error"));
            }
        } else if (this.role == null) {
            this.processSetup(json);
        } else if (this.role == "control" && this.opposite == null) {
            this.processOpposite(json);
        } else {
            this.process(json);
        }
    }

    setID() {
        do {
            this.id = makeid(32);
        } while (routeTable[this.id] != null);
        routeTable[this.id] = this;
    }

    processSetup(json) {
        if (json.type == "set") {
            if (json.role == "control" || json.role == "display") {
                this.role = json.role;
                this.ws.send(
                    getServerMessage("set", "ok", {
                        role: json.role
                    }, this.id)
                );
            } else {
                this.ws.send(getServerMessage("error", "command error", {}, this.id));
            }
        } else {
            this.ws.send(getServerMessage("error", "procedure error", {}, this.id));
        }
    }

    processOpposite(json) {
        if (json.type == "set") {
            if(json.opposite && routeTable[json.opposite] != null) {
                this.opposite = routeTable[json.opposite];
                routeTable[json.opposite].opposite = this;
                this.ws.send(
                    getServerMessage("set", "ok", {
                        opposite: json.opposite
                    }, this.id)
                );
                this.opposite.ws.send(
                    getServerMessage("set", "ok", {
                        opposite: this.id
                    }, json.opposite)
                );
            } else {
                this.ws.send(getServerMessage("error", "opposite notfound", {}, this.id));
            }
        } else {
            this.ws.send(getServerMessage("error", "procedure error", {}, this.id));
        }
    }

    process(json) {
        if(this.role == "control") {
            this.processControl(json);
        } else if(this.role == "display") {
            this.processDisplay(json);
        } else {
            this.ws.send(getServerMessage("error", "role with strange type", {role: this.role}, this.id));
        }
    }

    processControl(json) {
        if(json.type == "control" && json.command) {
            this.opposite.sendControl(this.id, json.command);
        } else {
            this.ws.send(getServerMessage("error", "command error", {}, this.id));
        }
    }

    processDisplay(json) {
        if(json.type == "response" && json.message) {
            this.opposite.sendResponse(this.id, json.message);
        } else {
            this.ws.send(getServerMessage("error", "command error", {}, this.id));
        }
    }

    sendControl(source, message) {
        var obj = {
            type: "control",
            command: message,
            source: source,
            destination: this.id,
        };
        this.ws.send(JSON.stringify(obj));
    }

    sendResponse(source, message) {
        var obj = {
            type: "response",
            message: message,
            source: source,
            destination: this.id,
        };
        this.ws.send(JSON.stringify(obj));
    }

    keepalive() {
        var client = this;
        this.keepaliveTimer = setInterval(function () {
            client.ws.send(getServerMessage("keepalive", "ok"));
        }, 5000);
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