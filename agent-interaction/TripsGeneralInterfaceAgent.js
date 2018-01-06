/**
 * Created by durupina on 5/13/16.
 * Computer agent to provide communication between client and trips
 */

if(typeof module !== 'undefined' && module.exports){
    var Agent = require("./agentAPI.js");
    module.exports = TripsGeneralInterfaceAgent;
}
TripsGeneralInterfaceAgent.prototype = new Agent();

function TripsGeneralInterfaceAgent(agentName, id) {
    this.agentName = agentName;
    this.agentId = id;
    this.tripsUttNum = 1;
}
TripsGeneralInterfaceAgent.prototype.init = function(){
    var self = this;

    this.sendRequest('agentConnectToTripsRequest', {isInterfaceAgent: true, userName: this.agentName }, function(result){
        if(!result)
            self.disconnect();
    }); //interfaceAgent
    this.listenToMessages();
}

TripsGeneralInterfaceAgent.prototype.relayMessage = function(text){

    this.sendRequest('relayMessageToTripsRequest', {text: '"' + text +'"', uttNum: this.tripsUttNum});
    this.tripsUttNum++;

}

/***
 * Listen to messages from other actors and act accordingly
 * @param callback
 */
TripsGeneralInterfaceAgent.prototype.listenToMessages = function(callback){
    var self = this;

    this.socket.on('message', function(data){

        if(data.userId != self.agentId) {


            self.relayMessage(data.comment);

        }

    });
}

