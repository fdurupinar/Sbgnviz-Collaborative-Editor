/**
 * Created by durupina on 5/13/16.

 */

// if(typeof module !== 'undefined' && module.exports) //ESDOC problem
let Agent = require("./agentAPI.js");


/**
 * Computer agent to provide communication between client and trips
 */
class TripsGeneralInterfaceAgent extends Agent{
    constructor(agentName, id){
        super(agentName, id);
        /**
         *
         * @type {number} tripsUttNum
         */
        this.tripsUttNum = 1;
    }
    

    init(){

        this.sendRequest('agentConnectToTripsRequest', {isInterfaceAgent: true, userName: this.agentName }, (result) => {
            if(!result)
                this.disconnect();
        });

        this.listenToMessages();
    }

    /**
     * Send the message coming from a human to server Trips interface
     * @param {string} text
     */

    relayMessage(text){

        this.sendRequest('relayMessageToTripsRequest', {text: '"' + text +'"', uttNum: this.tripsUttNum});
        this.tripsUttNum++;
    }

    /**
     * Send the given request to Trips server interface so that it can send the request to Trips
     * @param {Object} data
     */
    sendTripsRequest(data){

        this.sendRequest('agentSendTripsRequestRequest', data);

    }

    /***
     * Listen to messages from other actors and act accordingly
     */
    listenToMessages(){

        this.socket.on('message', (data) => {

            if(this.isIntendedForBob(data)){
                let msg = data.comment.replace(/@[bB][Oo][bB]/, ""); //clean the message anyway
                this.relayMessage(msg);
            }

        });
    }

    /**
     * Is message for Bob or the wizard
     * @param {Object} data {targets {Array}, comment {string}, userId {string}}
     * @returns {boolean}
     */
    isIntendedForBob(data){

        let isBobChecked = false;
        if(!data.targets || data.targets == '*')
            isBobChecked = true;
        else{
            data.targets.forEach((target)=>{
                if (target.id === 'Bob123')
                    isBobChecked = true;
            });
        }

        if(data.userId != this.agentId && isBobChecked) {
            let wizardMode = document.getElementById('wizard-mode').checked;

            if(wizardMode && data.comment.toUpperCase().indexOf("@BOB")> -1 || !wizardMode) {  //trim
                return true;
            }

        }

        return false;

    }

}

// if(typeof module !== 'undefined' && module.exports) //ESDOC problem
    module.exports = TripsGeneralInterfaceAgent;

