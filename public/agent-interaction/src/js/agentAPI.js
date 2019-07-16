/**
 * Created by Funda Durupinar on 10/28/15.
 */

class Agent{
    /**
     * Creates an agent with name and id
     * @param {string} name
     * @param {string} id
     * @param {io} ioLib
     * @constructor
     */

    constructor(name, id, ioLib) {
        //public

        /**
         *
         * @type {string} agentId
        */

        this.agentId = id;
        /**
         *
         * @type {string} agentName
         */
        this.agentName = name;
        /**
         *
         * @type {string} colorCode
         */
        this.colorCode = "#00bfff"; //agents have different colors based on specialty

        /**
         * @type {string} room
         */
        this.room;

        /**
         * @type {Object} selectedNode
         */
        this.selectedNode;
        /**
         * @type {Object} selectedEdge
         */
        this.selectedEdge;

        /**
         *
         * @type {Array} opHistory
         */
        this.opHistory = [];
        /**
         *
         * @type {Array} chatHistory
         */
        this.chatHistory = [];
        /**
         *
         * @type {Array} userList
         */
        this.userList = [];
        /**
         * @type {Object} pageDoc Shared model of the room
         */
        this.pageDoc;

        /**
         * @type {WebSocket} socket
         */
        this.socket;

        /**
         * @type {IO} io
         */
        this.io;

        if(ioLib)
            this.io = ioLib;
        else
            this.io = io;
    }


    /**
     * socket Io socket to the node.js server
     * @param {string} url Server address
     * @param {function} callback
     */
    connectToServer (url,  callback) {

        var self = this;
        var serverIp;
        var sInd = url.search("3000/") + 5; //roomId index
        if(sInd <= 5){
            serverIp = url;
            self.room = "";
        }
        else{
            serverIp = url.slice(0,sInd);
            self.room = url.slice(sInd, url.length);
        }

        serverIp = serverIp.replace('localhost', '127.0.0.1');


        // if(io)
        //     this.socket =  io(serverIp); //server connection
        // else
        this.socket = this.io(serverIp,  { forceNew: true }); //server connection //this opens a separate connection for each agent
        //     this.socket = this.io(serverIp,  { reconnect: true }); //server connection //this opens a separate connection for each agent


        var p1 = new Promise( (resolve) => {
            if (self.room == ""  || self.room == null) {

                self.socket.emit("agentCurrentRoomRequest",  (room) => {
                    self.room = room; //select the latest room
                    console.log("Agent connected");
                    resolve("success");
                });
            }
            else {
                console.log("Agent connected.");
                resolve("success");
            }
        });

        p1.then( () => {

            self.socket.emit("subscribeAgent", {userName: self.agentName, room: self.room, userId: self.agentId, colorCode: self.colorCode },  () => {

                if (callback != null) callback(self.socket);

            });


        }),   (xhr, status, error) => {
            console.log("Error retrieving data: " + error);
            if (callback != null) callback("error");
        };

    }



    /**
     * Disconnects from the socket
     * @param {function} callback After disconnecting from server we get success message
     *
     */
    disconnect(callback){


        this.sendRequest('agentManualDisconnectRequest', {}, ()=>{
            if(callback) callback("success");
        });

        // this.socket.disconnect();

    }


    /**
     * Gets model for the current room
     * @param {function} callback
     */
    loadModel(callback) {

        var self = this;
        this.socket.emit('agentPageDocRequest', {userId: self.agentId, room: self.room}, (data) =>{

            self.pageDoc = data;


            self.userList = [];
            for(var userId in data.users) {

                self.userList.push({userId: userId, userName: data.users[userId].name});
            }


            if (callback != null) callback();
        });


    }

    /**
     * Gets list of operations from the node.js server
     * @param {function} callback Function to call after getting operation history
     */
    loadOperationHistory(callback) {

        var self = this;
        this.socket.emit('agentOperationHistoryRequest', {room: this.room}, (data) =>{
            self.opHistory = data;
            if (data == null)
                self.opHistory = [];


            if (callback != null) callback();


        });
    }

    /**
     * Returns users in the same room as agent
     */

    getUserList() {
        return this.userList;
    }

    /**
     * Gets chat messages from the node.js server
     * @param {function}  callback Function to call after getting chat history
     */

    loadChatHistory(callback) {
        var self = this;
        this.socket.emit('agentChatHistoryRequest', {room: this.room}, (data)=>{
            self.chatHistory = data;
            if (data == null)
                self.chatHistory = [];

            if (callback != null) callback();

        });
    }

    /**
     * @param {number} cyId
     * @returns {Object} Node list in the shared model
     */
    getNodeList(cyId){

        if(!cyId)
            cyId = 0;
        return this.pageDoc.cy[cyId].nodes;
    }



    /**
     * @param {number} cyId
     * @returns {Object} Edge list in the shared model
     */
    getEdgeList (cyId){
        if(!cyId)
            cyId = 0;
        return this.pageDoc.cy[cyId].edges;
    }


    /**
     * Sends request to the node.js server to change agent's name
     * @param {string} newName New agent name
     * @param {function} callback
     */
    changeName(newName, callback){
        this.agentName = newName;
        this.sendRequest("agentChangeNameRequest", {userName: newName, userId: self.agentId});
        if(callback) callback();
    }



    /**
     * Gets node with id from the node.js server
     * @param {string} id Node id
     * @param {number} cyId
     * @param {function} callback Function to call after getting node
     */
    getNodeRequest(id, cyId, callback){
        var self = this;
        if(!cyId)
            cyId = 0;
        this.socket.emit('agentGetNodeRequest', {room: this.room,  userId: self.agentId, id:id, cyId: cyId}, (data)=>{
            self.selectedNode = data;
            if (callback != null) callback();

        })
    }

    /**
     * Gets edge with id from the node.js server
     * @param {string} id Edge id
     * @param {number} cyId
     * @param {function} callback Function to call after getting edge
     */
    getEdgeRequest(id, cyId, callback){
        var self = this;
        if(!cyId)
            cyId = 0;
        this.socket.emit('agentGetEdgeRequest', {room: this.room, userId: self.agentId, id:id, cyId: cyId}, (data)=>{
            self.selectedEdge = data;
            if (callback != null) callback();

        })
    }

    /**
     * Sends an operation request to the node.js server
     * Model update operations are done in this method
     * @param {string} reqName Operation name
     * @param {Object} paramSent Depends on the operation type
     * reqName: "agentSetLayoutProperties", param: {name, nodeRepulsion, nodeOverlap, idealEdgeLength, edgeElasticity, nestingFactor, gravity, numIter, tile, animate, randomize}
     * reqName: "agentRunLayoutRequest", param:null
     * reqName: "agentAddNodeRequest", param: {{data: {class: class}, position:{x:x, y:y}}
     * reqName: "agentAddEdgeRequest", param:{{data:source, target, class}}
     * reqName: "agentChangeNodeAttributeRequest", param:{id, attStr, attVal}
     * reqName: "agentChangeEdgeAttributeRequest", param:{id, attStr, attVal}
     * reqName: "agentMoveNodeRequest", param:{id, pos}
     * reqName: "agentMoveNodeRequest", param:{id, pos}
     * reqName: "agentAddCompoundRequest", param:{type, selectedNodes}
     * reqName: "agentSendImageRequest", param: {img,fileName, tabIndex}
     * @param {function} callback
     */
    sendRequest(reqName, paramSent, callback){ //model operations

        let param  = paramSent;
        if(!param){
            param = {};
        }
        param.room = this.room;
        param.userId = this.agentId;

        this.socket.emit(reqName, param, (data) =>{
            if(callback)
                callback(data);
        });

    }


    /**
     * Socket listener
     * @param {function} callback
     */
    listen(callback){
        var self = this;
        this.socket.on('operation', (data)=>{
            self.opHistory.push(data);
        });

        this.socket.on('message', (data)=>{
            self.chatHistory.push(data);
        });


        if (callback != null) callback();


    }

    /**
     * Sends chat message
     * @param {string} comment Message in text
     * @param {Array} targets Ids of targets
     * @param {function} callback Function to call after sending message
     */
    sendMessage(comment, targets, callback){

        var self = this;
        if(targets == "*" || targets == "all"){ //add all users
            targets = [];
            for(var i = 0; i < self.userList.length; i++){ //FIXME: send to all the users for now
                targets.push({userId: self.userList[i].userId});
            }

        }

        var message = {room: this.room, comment: comment, userName:this.agentName, userId: this.agentId, time: 1, targets: targets}; //set time on the server

        this.socket.emit('agentMessage', message, (data)=>{

            if (callback) callback(data);
        });
    }

    /***
     * Get the latest message from the message list
     * @param {function} callback
     */
    getMessage(callback){

        this.sendRequest("agentPageDocRequest", {}, (pageDoc)=>{
            if(callback)
                callback(pageDoc.messages[pageDoc.messages.length-1]);

        });

    }

 
}
// if( typeof module !== 'undefined' && module.exports ) //ESDOC problem
module.exports = Agent;


