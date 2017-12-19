/**
 * Created by Funda Durupinar on 10/28/15.
 */

/**
 * Creates an agent with name and id
 * @param name
 * @param id
 * @constructor
 */


function Agent (name, id, ioLib) {
    //public
    this.agentId = id;
    this.agentName = name;
    this.colorCode = "#00bfff"; //agents have different colors based on specialty
    // this.colorCode = getNewColor();

    this.selectedNode;
    this.selectedEdge;
    this.opHistory = [];
    this.chatHistory = [];
    this.userList = [];
    this.pageDoc;
    this.socket;
    this.room;
    if(ioLib)
        this.io = ioLib;
    else
        this.io = io;


}

/**
 *
 * @param url Server address
 * @param callback
 * @returns socket Io socket to the node.js server
 */
Agent.prototype.connectToServer = function (url,  callback) {


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
    //
    // if(io)
    //     this.socket =  io(serverIp); //server connection
    // else
        this.socket = this.io(serverIp,  { forceNew: true }); //server connection //this opens a separate connection for each agent

    var p1 = new Promise(function (resolve, reject) {
        if (self.room == ""  || self.room == null) {

            self.socket.emit("agentCurrentRoomRequest", function (room) {
                console.log(room);
                    self.room = room; //select the latest room
                resolve("success");
            });
        }
        else {
            console.log(self.room);
            resolve("success");
        }
    });

    p1.then(function (content) {

        self.socket.emit("subscribeAgent", {userName: self.agentName, room: self.room, userId: self.agentId, colorCode: self.colorCode }, function () {

            if (callback != null) callback(self.socket);

        });


    }),  function (xhr, status, error) {
        api.set('content.text', "Error retrieving data: " + error);
    };

}



/**
 * Disconnects from the socket
 * @param callback After disconnecting from server we get success message
 *
 */
Agent.prototype.disconnect = function(callback){


    this.sendRequest('agentManualDisconnectRequest', {}, function(){
        if(callback) callback("success");
    });

    // this.socket.disconnect();

};

//get model for the current room
Agent.prototype.loadModel = function (callback) {

    var self = this;
    this.socket.emit('agentPageDocRequest', {userId: self.agentId, room: self.room}, function(data){

        self.pageDoc = data;


        self.userList = [];
        for(var userId in data.users) {

            self.userList.push({userId: userId, userName: data.users[userId].name});
        }



        if (callback != null) callback();
    });


};
/**
 * Gets list of operations from the node.js server
 * @param callback Function to call after getting operation history
 */
Agent.prototype.loadOperationHistory = function (callback) {

    var self = this;
    this.socket.emit('agentOperationHistoryRequest', {room: this.room}, function(data){
        self.opHistory = data;
        if (data == null)
            self.opHistory = [];


        if (callback != null) callback();


    });

};

/**
 * Returns userList in the same room as agent
 */

Agent.prototype.getUserList = function() {


    return self.userList;
}

/**
 * Gets chat messages from the node.js server
 * @param callback Function to call after getting chat history
 */
//get operation history
Agent.prototype.loadChatHistory= function (callback) {
    var self = this;
    this.socket.emit('agentChatHistoryRequest', {room: this.room}, function(data){
        self.chatHistory = data;
        if (data == null)
            self.chatHistory = [];

        if (callback != null) callback();

    });
}
/**
 *
 * @returns {Object} Node list in the shared model
 */
Agent.prototype.getNodeList = function(cyId){

    return this.pageDoc.cy.cyId.nodes;
};



/**
 *
 * @returns {Object} Edge list in the shared model
 */
Agent.prototype.getEdgeList = function(cyId){
    return this.pageDoc.cy.cyId.edges;
};

/**
 *
 * @returns {*} Layout properties in the shared model
 */
// Agent.prototype.getLayoutProperties = function(){
//     return this.pageDoc.layoutProperties;
// }

/**
 * Sends request to the node.js server to change agent's name
 * @param newName New agent name
 */
Agent.prototype.changeName = function(newName, callback){
    this.agentName = newName;
    this.sendRequest("agentChangeNameRequest", {userName: newName, userId: self.agentId});
    if(callback) callback();
};




/**
 * Gets node with id from the node.js server
 * @param id Node id
 * @param callback Function to call after getting node
 */
Agent.prototype.getNodeRequest = function(id, cyId, callback){
    var self = this;
    this.socket.emit('agentGetNodeRequest', {room: this.room,  userId: self.agentId, id:id, cyId: cyId}, function(data){
        self.selectedNode = data;
        if (callback != null) callback();

    })
};

/**
 * Gets edge with id from the node.js server
 * @param id Edge id
 * @param callback Function to call after getting edge
 */
Agent.prototype.getEdgeRequest = function(id, cyId, callback){
    var self = this;
    this.socket.emit('agentGetEdgeRequest', {room: this.room, userId: self.agentId, id:id, cyId: cyId}, function(data){
        self.selectedEdge = data;
        if (callback != null) callback();

    })
};
/**
 * Sends an operation request to the node.js server
 * Model update operations are done in this method
 * @param reqName Operation name
 * @param param Depends on the operation type
 * <ul>
 *     <li>reqName: "agentSendImageRequest", param: {img,fileName, tabIndex} </li>
 *     <li>reqName: "agentSetLayoutProperties", param: {name, nodeRepulsion, nodeOverlap, idealEdgeLength, edgeElasticity, nestingFactor, gravity, numIter, tile, animate, randomize} </li>
 *     <li>reqName: "agentRunLayoutRequest", param:null </li>
 *     <li>reqName: "agentAddNodeRequest", param: {{data: {class: class}, position:{x:x, y:y}} </li>
 *     <li>reqName: "agentAddEdgeRequest", param:{{data:source, target, class}} </li>\
 *     <li>reqName: "agentChangeNodeAttributeRequest", param:{id, attStr, attVal} </li>
 *     <li>reqName: "agentChangeEdgeAttributeRequest", param:{id, attStr, attVal} </li>
 *     <li>reqName: "agentMoveNodeRequest", param:{id, pos} </li>
 *     <li>reqName: "agentMoveNodeRequest", param:{id, pos} </li>
 *     <li>reqName: "agentAddCompoundRequest", param:{type, selectedNodes} </li>
 * </ul>
 *
 */
Agent.prototype.sendRequest = function(reqName, paramSent, callback){ //model operations

    let param  = paramSent;
    if(!param){
        param = {};
    }
    param.room = this.room;
    param.userId = this.agentId;

    this.socket.emit(reqName, param, function(data){

        console.log(param);
        if(callback)
            callback(data);
        else
            console.log(data);
    });

};


/**
 * Socket listener
 * @param callback
 */
Agent.prototype.listen = function(callback){
    var self = this;
    this.socket.on('operation', function(data){
        self.opHistory.push(data);
    });

    this.socket.on('message', function(data){
        self.chatHistory.push(data);
    });

    // this.socket.on('userList', function(data){
    //     self.userList = data;
    // });

    this.socket.on('imageFile', function(data){


    });

    if (callback != null) callback();


}

/**
 * Sends chat message
 * @param comment Message in text
 * @param targets Ids of targets
 * @param callback Function to call after sending message
 */
Agent.prototype.sendMessage = function(comment, targets, callback){

    var self = this;
    if(targets == "*" || targets == "all"){ //add all users
        targets = [];
        for(var i = 0; i < self.userList.length; i++){ //FIXME: send to all the users for now
            targets.push({userId: self.userList[i].userId});
        }

    }

    var message = {room: this.room, comment: comment, userName:this.agentName, userId: this.agentId, time: 1, targets: targets}; //set time on the server

    this.socket.emit('agentMessage', message, function(data){


        if (callback) callback(data);
    });
}

/***
 * Get the latest message from the message list
 * @param callback
 */
Agent.prototype.getMessage = function(callback){

    self.sendRequest("agentPageDocRequest", {}, function(pageDoc){

        if(callback)
            callback(pageDoc.messages[pageDoc.messages.length-1]);

    })

}

/**
 *
 * @returns {string} A specific color to identify the agent
 */
// Agent.prototype.getNewColor = function(){
//     var gR = 1.618033988749895; //golden ratio
//     var h = Math.floor((Math.random() * gR * 360));//Math.floor((cInd * gR - Math.floor(cInd * gR))*360);
//     var cHsl = [h, 70 + Math.random() * 30, 60 + Math.random() * 10];
//
//     if(typeof module !== 'undefined' && module.exports)
//         tinycolor = require('tinycolor')();
//
//     return tinycolor('hsla('+cHsl[0]  +', '+ cHsl[1] + '%, ' + cHsl[2] +'%, 1)').toHexString();
//
// }

if(typeof module !== 'undefined' && module.exports)
    module.exports = Agent;


