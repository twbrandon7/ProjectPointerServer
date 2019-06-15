
var receiver = {
    onConnection: function (ws) {
        ws.on('message', function incoming(data) {
            console.log(data);
            ws.send(data);
        });
    }
}
module.exports = receiver;