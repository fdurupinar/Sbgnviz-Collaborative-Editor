/**
 * Created by durupina on 5/17/17.
 * This is a Trips module to enable communication between trips and sbgnviz
 */

"use strict";
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





module.exports = TripsInterfaceModule;
