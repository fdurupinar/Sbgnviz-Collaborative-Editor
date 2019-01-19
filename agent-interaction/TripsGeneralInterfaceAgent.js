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

    this.sendRequest('agentConnectToTripsRequest', {isInterfaceAgent: true, userName: this.agentName }, (result) => {
        if(!result)
            this.disconnect();
    });

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
TripsGeneralInterfaceAgent.prototype.listenToMessages = function(){

    this.socket.on('message', (data) => {

        //check if Bob is in the targets list of the message:
        let isBobChecked = false;
        data.targets.forEach((target)=>{
            if (target.id === 'Bob123')
                isBobChecked = true;
        });

        if(data.userId != this.agentId && isBobChecked) {
            let wizardMode = document.getElementById('wizard-mode').checked;

            if(wizardMode && data.comment.toUpperCase().indexOf("@BOB")> -1 || !wizardMode){  //trim the @bob part
                let msg  = data.comment.replace(/@[bB][Oo][bB]/, ""); //clean the message anyway
                this.relayMessage(msg);
            }

        }
    });
}


