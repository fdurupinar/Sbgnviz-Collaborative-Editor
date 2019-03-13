/**
 * Created by durupina on 5/17/17.
 * This is a Trips module to enable communication between trips and sbgnviz
 */

"use strict";
let KQML = require('./KQML/kqml.js');
class TripsInterfaceModule {

    constructor(tmName, agentId, agentName, socket, model, askHuman) {


        var tripsModule = require('./tripsModule.js');
        this.tm = new tripsModule(['-name', tmName]);

        var self = this;
        this.agentId = agentId;
        this.agentName = agentName;
        this.model = model;
        this.modelId;
        this.socket = socket;
        this.room  = socket.room;

        if(!socket.room){
            console.log("Uncreated document error.");
            return;
        }

        self.tm.init(function () {

            //setHandlers must be implemented for each Trips module that derives from this class
            self.setHandlers(askHuman);

            self.tm.run();

        });


        //Wait for a little while before testing connection
        setTimeout(function () {
            //Let user know
            if (!self.isConnectedToTrips()) {
                var msg = {userName: agentName, userId: agentId, room: self.room, date: +(new Date)};

                msg.comment = "TRIPS connection cannot be established.";

                model.add('documents.' + msg.room + '.messages', msg);

            }
        }, 3000);


    }

    isConnectedToTrips() {


        if(this.tm && this.tm.socket && this.tm.socket.stream && this.tm.socket.stream.readable )
            return true;

        return false;

    }

    /***
     * Gets the standardized name of the gene from an EKB XML string
     * by sending a request to sense prioritization agent
     * @param termStr : EKB XML string
     * @param callback : Called when sense prioritization agent returns an answer
     */
    getTermName(termStr, callback) {

        let self = this;
        this.tm.sendMsg({0: 'request', content: {0: 'CHOOSE-SENSE', 'ekb-term': termStr}});


        let patternXml = {0: 'reply', 1: '&key', content: ['SUCCESS', '.', '*']};

        self.tm.addHandler(patternXml, function (textXml) {

            if(textXml.content && textXml.content.length >= 2 && textXml.content[2].length > 0) {

                let termNames = [];
                for(let i = 0; i < textXml.content[2].length; i++) {
                    let contentObj = KQML.keywordify(textXml.content[2][i]);
                    let termName = trimDoubleQuotes(contentObj.name);
                    termNames.push(termName);
                }

                if(termNames.length == 1 && callback)
                    callback(termNames[0]);
                else if(callback)
                    callback(termNames);
            }
        });
    }


    /***
     * When the client page is refreshed a new websocket is achieved
     * Update the socket and its listeners
     * @param newSocket
     */
    updateWebSocket(newSocket) {


        this.socket = newSocket;
        this.room = newSocket.room;

    }

    disconnect(){


        this.tm.disconnect();
    }

}


function trimDoubleQuotes(str){
    if(str[0]!== '"' || str[str.length-1]!== '"')
        return str;

    let strTrimmed = str.slice(1, str.length -1);

    return strTrimmed;

}


module.exports = TripsInterfaceModule;
