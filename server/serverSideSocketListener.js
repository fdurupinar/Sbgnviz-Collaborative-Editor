let readline = require('readline');
let fs = require('fs');


/***
 * Calls cmdStr on console and runs callback function with parameter content
 * @param cmdStr
 * @param callback
 */
let executeCommandLineProcess = function (cmdStr, callback){
    try {
        let exec = require('child_process').exec;

        exec(cmdStr, function (error, stdout, stderr) {
            console.log('stdout: ' + stdout);
            if (stderr)
                console.log('stderr: ' + stderr);
            if (error !== null) {
                if (callback) callback(error);
                console.log('exec error: ' + error);
            }

            if (callback) callback();
        });
    }
    catch(error){
        console.log(error);
        if(callback) callback();

    }
};

/***
 * Read the file to visualize and return its contents in callback
 * @param filePath : path+fileName
 * @param callback
 */
var readJsonFile =  function(filePath, callback ){

    try {
        var fs = require('fs');
        fs.readFile(filePath, 'utf-8', function (error, fileContent) {
            if (error) {
                if (callback) callback("Error " + error)
                console.log('exec error: ' + error);
                return;
            }

            if (callback) {
                callback(fileContent);
            }


        });
    }
    catch(error){
        if (callback) callback("Error " + error);
    }

};



/***
 * Start listening to sockets
 * @param io
 * @param model: shared model
 * @param cancerDataOrganizer: get mutation data from cbioportal
 */
module.exports.start = function(io, model, cancerDataOrganizer){
    let modelManagerList = {}; //not an array!
    let roomList = [];
    let humanList = [];
    let pnnlArr  = [];
    let sampleSentencesJson;
    let tripsGeneralInterfaceInstance;

    let tripsVisualizationInterfaceInstance;

    let request = require('request'); //REST call over http/https

    let responseHeaders = {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
        "access-control-allow-headers": "content-type, accept",
        "access-control-max-age": 10,
        "Content-Type": "application/json"
    };

    // io.on('connection', function(socket){ //updated to this in socket.io > 1.0
    io.sockets.on('connection', function (socket) {

    // io.on('connection', function(socket){ //for the new socket.io

        socket.on('error', function (error) {
            console.log(error);
        });

        listenToAgentRequests(socket);

        listenToHumanRequests(socket);

        listenToQueryRequests(socket); //can come from both human and agent

        readJsonFile('./server/data/sampleSentences.json', function(content){
            sampleSentencesJson =  JSON.parse(content);


        });



        socket.on('disconnect', function() {
            try {
                if(socket.room) {

                   modelManagerList[socket.room].deleteUserId(socket.userId);

                    console.log(socket.userId  + " deleted." );
                    // remove from humanlist
                    for (let i = humanList.length - 1; i >= 0; i--) {
                        if (humanList[i].userId === socket.userId) {

                            humanList.splice(i, 1);
                            break;
                        }
                    }

                }
            }
            catch(e){
                console.log("Disconnect error " + e);
            }

            socket.subscribed = false; //why isn't the socket removed

        });
    });


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //LOCAL FUNCTIONS
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /***
     * Send a client query to do the clientside operation
     * @param userId
     * @param room
     * @param requestStr
     * @param data
     * @param callback
     */
    let askHuman = function (userId, room, requestStr, data, callback){
        let roomMate = humanList.find(function(human){
            return(human.userId !== userId && human.room === room);
        }); //returns the first match

        console.log("roommate is " + roomMate);


        if(roomMate != null) {
            let clientSocket = io.sockets.connected[roomMate.socketId];

            clientSocket.emit(requestStr, data, function(val){

                console.log(requestStr);
                console.log(userId);
                console.log(room);

                if(callback) callback(val);
            });
        }
        else
        if(callback) callback();
    };

    /***
     * Read all the gene names in causal path data
     * @param callback
     */
    let readGeneList = function(callback){
        let filePath = './agent-interaction/CausalPath/causative-data-centric.sif';
        let inStream = fs.createReadStream(filePath);
        let rl = readline.createInterface(inStream);

        let geneList = [];
        rl.on('line', function (line) {
            let vals = line.split("\t");

            let id1 = vals[0].toUpperCase();
            let id2 = vals[2].toUpperCase();

            geneList[id1] = true;
            geneList[id2] = true;
        });

        rl.on('close', function () {

            if(callback) callback(geneList);
        });
    };

    /***
     * Read PNNL ovarian correlation data
     * @param geneList
     * @param callback
     */
    let readPNNLData = function(geneList, callback){
        if(pnnlArr.length <= 0){
            let filePathCorr = './agent-interaction/CausalPath/PNNL-ovarian-correlations.txt';
            let instreamCorr = fs.createReadStream(filePathCorr);
            let rlCorr = readline.createInterface(instreamCorr);

            let i = 0;

            rlCorr.on('line', function (line) {
                let vals = line.split("\t");

                let id1 = vals[0].toUpperCase();
                let id2 = vals[1].toUpperCase();


                if (id1.indexOf('/') < 0 && id2.indexOf('/') < 0) { //exclude incorrect formats
                    let idStr1 = id1.split('-');
                    let geneName1 = idStr1[0];
                    let pSite1 = idStr1[1];

                    let idStr2 = id2.split('-');
                    let geneName2 = idStr2[0];
                    let pSite2 = idStr2[1];

                  //  if(Number(vals[2]) < 0.95 ) {

                    if((geneList && (geneList[geneName1] || geneList[geneName2])) || !geneList){
                        pnnlArr.push({
                            id1: geneName1,
                            id2: geneName2,
                            pSite1: pSite1,
                            pSite2: pSite2,
                            correlation: vals[2],
                            pVal: vals[3]
                        });
                        i++;
                        console.log(i);
                    }
                }
            });

            rlCorr.on('close', function () {
                console.log("PNNL data reading into memory complete.");
                if (callback) callback(pnnlArr);

            });
        }
        else{
            if (callback) callback(pnnlArr);
        }

    };

    /***
     *
     * @param socket
     */
    let listenToHumanRequests = function(socket){

        socket.on('getDate',  function(msg, callback){
            callback(+(new Date));
            //relay the message to agents
            io.in(socket.room).emit('message', msg);

        });

        socket.on('subscribeHuman', function (data) {
            socket.userId = data.userId;
            // console.log("Human "+ socket.id  + "'s userId is " + socket.userId );
            socket.room = data.room;
            socket.userName = data.userName;
            socket.subscribed = true;

            socket.join(data.room);

            data.socketId = socket.id;


            let roomExists = false;
            if(roomList.indexOf(data.room) > -1)
                roomExists = true;


            roomList.push(data.room);



            humanList.push({room:data.room, userId: data.userId, socketId: data.socketId});


            console.log("human " + data.userId +  " subscribed  to room " + data.room + " with socket " + socket.id);


            // noinspection Annotator
            model.subscribe('documents', function () {
                let pageDoc = model.at('documents.' + data.room);
                let docPath = 'documents.' + data.room;
                let cy = model.at((docPath + '.cy'));
                let pysb = model.at((docPath + '.pysb'));
                let history = model.at((docPath + '.history'));
                let undoIndex = model.at((docPath + '.undoIndex'));
                let context = model.at((docPath + '.context'));
                let images = model.at((docPath + '.images'));

                let users = model.at((docPath + '.users'));//user lists with names and color codes
                let userIds = model.at((docPath + '.userIds')); //used for keeping a list of subscribed users
                let messages = model.at((docPath + '.messages'));
                let provenance = model.at((docPath + '.provenance'));
                let pcQuery = model.at((docPath + '.pcQuery'));

                let noTrips = model.at((docPath + '.noTrips'));
                let sampleSentences = model.at((docPath + '.sampleSentences'));

                pageDoc.subscribe(function () {
                    pysb.subscribe(function () {
                    });

                    cy.subscribe(function () {
                    });

                    history.subscribe(function () {
                    });

                    undoIndex.subscribe(function () {
                    });

                    context.subscribe(function () {
                    });

                    images.subscribe(function () {
                    });

                    messages.subscribe(function () {
                    });

                    provenance.subscribe(function(){
                    });

                    pcQuery.subscribe(function(){
                    });


                    noTrips.subscribe(function(){
                    });

                    sampleSentences.subscribe(function(){
                    });
                    users.subscribe(function () {
                        let ModelManager = require("../public/collaborative-app/modelManager.js");

                        modelManagerList[data.room] = new ModelManager(model, data.room);



                        //Add the user explicitly here
                         modelManagerList[data.room].addUser(data.userId, data.userName);
                        //modelManagerList[data.room].setName(data.userId, data.userName); done up

                        model.set((docPath + '.noTrips'), (process.argv.length > 2) && (process.argv[2].toUpperCase().indexOf("TRIPS") > -1));


                        if(!roomExists) //read this once for each room.
                            model.set((docPath + '.sampleSentences'), sampleSentencesJson);


                        userIds.subscribe(function () {
                            //if human is the first to connect to the room clean all the previously connected userids
                            if(humanList.length <=1)
                                userIds.set([data.userId]);
                        });

                    });
                });

                //Notify agents of model changes
                model.on('insert', (docPath + '.history.**'), function (id, cmdInd) {
                        if (socket.subscribed) { //humans are connected through sockets as well,check userType to prevent notifying twice
                            let cmd = model.get(docPath + '.history.' + cmdInd);
                            //console.log(cmd.opName);
                            io.in(socket.room).emit('operation', cmd);
                        }
                    }
                );

                // //To send the message to computer agents
                model.on('all', (docPath + '.messages.**'), function (id, op, msg) {

                    //it means message is newly inserted
                    if (!id) {
                        for (let att in msg) {
                            if (msg.hasOwnProperty(att))
                                msg = msg[att];
                        }
                    }

                    if (msg && msg.comment) {
                        if (msg.comment.indexOf("The most likely context") > -1) { //if agent told about context
                            io.in(socket.room).emit("agentContextQuestion", msg.userId);
                        }
                    }

                });

                //Send image file to computer agents
                model.on('insert', (docPath + '.images.*'), function (op, id, data) {
                    if (socket.subscribed)
                        io.in(socket.room).emit('imageFile', data.img);
                });

                //queryData is the element in the array
                model.on('insert', (docPath + '.pcQuery'), function( ind, queryData){

                    if(ind >= 0 ) {

                        request(queryData[0].url, function (error, response, body) {

                            if (error) {
                                console.log(error);
                            }
                            else { //only open the window if a proper response is returned

                                if (response.statusCode === 200) {
                                    model.set(docPath + '.pcQuery.' + ind + '.graph', body);
                                }
                            }
                        });
                    }
                });

            });

        });


        /***
         * Reset Clic conversation and the BA
         */
        socket.on('resetConversationRequest', function(){
            let p = new Promise((resolve, reject) => {
                if(tripsGeneralInterfaceInstance && tripsGeneralInterfaceInstance.isConnectedToTrips())


                    resolve("success");
            });
            p.then((val) => {

                tripsGeneralInterfaceInstance.cleanAll();

            });

            //Send this to agents listening to conversations,  such as Clare
            io.in(socket.room).emit("conversationReset");


        });


    };

    /***
     * Requests sent through the socket through agent API
     * @param socket used for socket disconnections
     */
    let listenToAgentRequests = function(socket){

        socket.on('subscribeAgent', function (data, callback) {
            socket.userId = data.userId;
            socket.room = data.room;
            socket.subscribed = true;
            socket.userName = data.userName;

            socket.join(data.room);

            data.socketId = socket.id;

            try {
                model.subscribe('documents', function () {
                    let pageDoc = model.at('documents.' + data.room);
                    let docPath = 'documents.' + data.room;
                    let cy = model.at((docPath + '.cy'));
                    let pysb = model.at((docPath + '.pysb'));
                    let history = model.at((docPath + '.history'));
                    let undoIndex = model.at((docPath + '.undoIndex'));
                    let context = model.at((docPath + '.context'));
                    let images = model.at((docPath + '.images'));


                    let users = model.at((docPath + '.users'));//user lists with names and color codes
                    let userIds = model.at((docPath + '.userIds')); //used for keeping a list of subscribed users
                    let messages = model.at((docPath + '.messages'));
                    let provenance = model.at((docPath + '.provenance'));
                    let pcQuery = model.at((docPath + '.pcQuery'));
                    let noTrips = model.at((docPath + '.noTrips'));
                    let sampleSentences = model.at((docPath + '.sampleSentences'));

                    if(!data.room)
                        return;
                    try {
                        pageDoc.subscribe(function () {
                            pysb.subscribe(function () {
                            });
                            cy.subscribe(function () {
                            });
                            history.subscribe(function () {
                            });
                            undoIndex.subscribe(function () {
                            });
                            context.subscribe(function () {
                            });
                            images.subscribe(function () {
                            });
                            messages.subscribe(function () {
                            });

                            provenance.subscribe(function () {
                            });

                            pcQuery.subscribe(function () {
                            });

                            noTrips.subscribe(function () { 
                            });

                            sampleSentences.subscribe(function(){
                            });

                            userIds.subscribe(function () {
                                let userIdsList = userIds.get();
                                if (!userIdsList || userIdsList.indexOf(data.userId) < 0) {
                                    userIds.push(data.userId);
                                }
                            });

                            users.subscribe(function () {
                                // users.set(data.userId, {name: data.userName, colorCode: data.colorCode});
                                // modelManagerList[data.room].setName(data.userId, data.userName);
                                modelManagerList[data.room].addUser(data.userId, data.userName, data.colorCode);
                                //console.log("agent subscribed to room: " + data.room);
                                console.log("agent " + data.userId +  " subscribed  to room " + data.room + " with socket " + socket.id);
                            });
                        });
                    }
                    catch(e) {
                        console.log("Client not connected");
                    }
                });
            }
            catch(e){
                console.log("Model subscription unsuccessful");
            }

            if(callback) callback();

        });

        socket.on('agentActiveRoomsRequest', function( callback){
            callback(roomList);
        });

        socket.on('agentCurrentRoomRequest', function( callback){
            callback(roomList[roomList.length - 1]);
        });

        socket.on('agentPNNLRequest', function(data, callback){
            readGeneList(function(geneList){
                readPNNLData(geneList, callback);
            });
        });

        socket.on('agentUndoRequest', function(data, callback){ //from computer agent
            try {
                modelManagerList[data.room].undoCommand();
                //we can wait here until agent request is performed
                if(callback) callback("success");
            }
            catch(e){
                console.log(e);
                if(callback) callback();
            }
        });

        socket.on('agentRedoRequest', function(data, callback){ //from computer agent
            try {
                modelManagerList[data.room].redoCommand();
                if (callback) callback();
            }
            catch(e){
                console.log(e);
                if(callback) callback();
            }
        });

        socket.on('agentChangeNameRequest',function(data, callback){

            try {
                modelManagerList[data.room].setName(data.userName);
                if (callback) callback();
            }
            catch(e){
                console.log(e);
                if(callback) callback();

            }
        });

        socket.on('agentRunLayoutRequest', function(data, callback){
            askHuman(data.userId, data.room,  "runLayout", data, function(val){
                if (callback) callback(val);
            });
        });

        socket.on('agentAlignRequest',function(data, callback){
            askHuman(data.userId, data.room,  "align", data, function(val){
                if (callback) callback(val);
            });
        });


        socket.on('agentMergeGraphRequest', function(data, callback){


            let requestStr;
            if(data.type === "sbgn")
                requestStr = "mergeSbgn";
            else //default is json
                requestStr = "mergeJsonWithCurrent";


            askHuman(data.userId, data.room,  requestStr, data, function(val){

                if (callback) callback(val);
            });
        });


        socket.on('agentDisplaySbgnRequest', function(data, callback){

            let requestStr = "displaySbgn";


            askHuman(data.userId, data.room,  requestStr, data, function(val){

                if (callback) callback(val);
            });
        });

        socket.on('agentDisplaySifRequest', function(data, callback){

            let requestStr = "displaySif";


            askHuman(data.userId, data.room,  requestStr, data, function(val){

                if (callback) callback(val);
            });
        });

        socket.on('agentAddProvenanceRequest', function(data, callback){

            let requestStr = "addProvenance";

            askHuman(data.userId, data.room,  requestStr, data, function(val){



                if (callback) callback(val);
            });
        });

        socket.on('agentUpdateSampleSentencesRequest', function(data,  callback){
            let docPath = 'documents.' + data.room;
            model.set((docPath + '.sampleSentences'), data.json);
            if(callback) callback("success");
        });

        socket.on('agentDisconnectBobRequest', function(callback){


        });


        //done via sockets as data conversion to json is done in menu-functions
        socket.on('agentLoadFileRequest',  function(data, callback){
            if(data.fileType.indexOf(".owl") > -1){
                request.post({
                    url: "http://localhost:8080/SBGNConverterServlet",
                    headers: responseHeaders,
                    form: {reqType: "sbgn", content: data.param}
                }, function(error, response){

                    if (error) {
                        console.log(error);
                    }
                    else  {
                        if(response.statusCode === 200) {
                            askHuman(data.userId, data.room,  "loadFile", data, function(val){
                                if (callback) callback(val);
                            });
                        }

                    }
                });
            }
            else
                askHuman(data.userId, data.room,  "loadFile", data, function(val){
                    if (callback) callback(val);
                });

            if(callback) callback();
        });


        socket.on('agentCleanAllRequest',  function(data, callback){
            askHuman(data.userId, data.room,  "cleanAll", data, function(val){
                if (callback) callback(val);
            });
        });

        socket.on('agentUpdateHighlightStatusRequest', function(data, callback){
            askHuman(data.userId, data.room,  "updateHighlight", data, function(val){
                if(callback) callback(val);
            });
        });

        socket.on('agentUpdateVisibilityStatusRequest', function(data, callback){
            askHuman(data.userId, data.room,  "updateVisibility", data, function(val){
                if(callback) callback(val);
            });
        });

        socket.on('agentUpdateExpandCollapseStatusRequest', function(data, callback){
            askHuman(data.userId, data.room,  "updateExpandCollapse", data, function(val){
                if(callback) callback(val);
            });
        });

        socket.on('agentAddCompoundRequest', function(data, callback) {
            askHuman(data.userId, data.room,  "addCompound", data, function(val){
                if(callback) callback(val);
            });
        });

        socket.on('agentCloneRequest', function(data, callback) {
            askHuman(data.userId, data.room,  "clone", data, function(val){
                if(callback) callback(val);
            });
        });

        socket.on('agentSearchByLabelRequest', function(data, callback) {
            askHuman(data.userId, data.room,  "searchByLabel", data, function(val){
                if(callback) callback(val);
            });
        });

        socket.on('agentChangeLockStateRequest', function(data, callback) {
            askHuman(data.userId, data.room,  "changeLockState", data, function(val){
                if(callback) callback(val);
            });
        });


        socket.on('agentGetNodeRequest',function(data, callback){
            try {
                let node = modelManagerList[data.room].getModelNode(data.id, data.cyId);
                if (callback) callback(node);
            }
            catch(e){
                console.log(e);
                if(callback) callback();
            }
        });

        socket.on('agentGetEdgeRequest',function(data, callback){
            try {
                let edge = modelManagerList[data.room].getModelEdge(data.id, data.cyId);
                if (callback) callback(edge);
            }
            catch(e){
                console.log(e);
                if(callback) callback();
            }
        });

        socket.on('agentAddNodeRequest',function(data, callback){
            //Ask a human client to perform this operation as we don't know the node id
            askHuman(data.userId, data.room, "addNode", data,  function(nodeId){
                if (callback) callback(nodeId);
            });
        });

        socket.on('agentAddEdgeRequest',function(data,  callback){
            try {
                //we know the edge id so add directly to the model
                //second parameter needs to have a data field
                let status = modelManagerList[data.room].addModelEdge(data.id,  data.cyId, data, "me");
                if (callback) callback(data.id);
            }
            catch(e){
                console.log(e);
                if(callback) callback();
            }
        });

        socket.on('agentDeleteElesRequest',function(data, callback){
            askHuman(data.userId, data.room,  "deleteEles", data, function(val){
                if(callback) callback(val);
            });
        });

        socket.on('agentMoveNodeRequest',function(data, callback){
            try {
                let status = modelManagerList[data.room].changeModelNodeAttribute("position", data.id, data.cyId,  data.pos);
                if (callback) callback(status);
            }
            catch(e){
                console.log(e);
                if(callback) callback();
            }
        });

        socket.on('agentChangeNodeAttributeRequest', function(data, callback){
            try {
                let status = modelManagerList[data.room].changeModelNodeAttribute(data.attStr, data.id,data.cyId, data.attVal);
                if (callback) callback(status);
            }
            catch(e){
                console.log(e);
                if(callback) callback();

            }

        });
        socket.on('agentChangeEdgeAttributeRequest', function(data, callback){
            try {
                let status = modelManagerList[data.room].changeModelEdgeAttribute(data.attStr, data.id,data.cyId, data.attVal);
                if (callback) callback(status);
            }
            catch(e){
                console.log(e);
                if(callback) callback();

            }
        });

        //Agent wants the history of operations
        socket.on('agentOperationHistoryRequest', function(data, callback){ //
            // from computer agent
            let docPath = 'documents.' + data.room;
            callback(model.get(docPath + '.history'))
        });

        //Agent wants the history of chat messages
        socket.on('agentChatHistoryRequest', function(data, callback){ //from computer agent
            let messagesQuery = model.query('messages', {
                room: data.room
            });
            messagesQuery.fetch( function(err){
                if(err) next(err);
                callback(messagesQuery.get());
            });
        });

        socket.on('agentSendImageRequest', function(data, callback){
            try {

                let status = modelManagerList[socket.room].addImage(data);
                if (callback) callback(status);
            }
            catch(e){
                console.log(e);
                if(callback) callback();

            }

        });

        socket.on('agentCBioPortalQueryRequest', function(queryInfo, callback){
            if(queryInfo.queryType === "cancerTypes") {
                callback(cancerDataOrganizer.cancerStudies);
            }

            else if(queryInfo.queryType === "context") {
                cancerDataOrganizer.getAllMutationCounts(queryInfo.proteinName, function (cancerData) {
                    callback(cancerData);
                });
            }
            else if(queryInfo.queryType === "alterations"){
                cancerDataOrganizer.getMutationCountInContext(queryInfo.proteinName, queryInfo.studyId, function(mutationCount){
                    callback(mutationCount);
                });
            }
        });

        socket.on('agentMessage', function( msg, callback){

            msg.date = +(new Date);
            msg.userName = socket.userName;

            try {
                model.add('documents.' + msg.room + '.messages', msg);
                //io.in(socket.room).emit("message", msg);

                if (msg.comment) {
                    if (msg.comment.indexOf("The most likely context") > -1) { //if agent told about context
                        io.in(socket.room).emit("agentContextQuestion", msg.userId);
                    }
                }
                if (callback) callback("success");
            }
            catch(e){
                console.log("Connection error " + e);
            }
        });

        //Agent wants the model
        socket.on('agentPageDocRequest', function(data, callback){ //from computer agent
            try {


                let pageDoc = modelManagerList[data.room].getPageDoc();

                callback(pageDoc);

            }
            catch(e){
                console.log(e);
                if(callback) callback();

            }
        });

        //For testing purposes only
        socket.on('agentManualDisconnectRequest', function(data, callback){
            try {


                //do not delete socket but remove agent from the list of users
                modelManagerList[data.room].deleteUserId(data.userId);
                socket.subscribed = false; //why isn't the socket removed
                if(callback) callback("success");
            }
            catch(e){
                console.log("Disconnect error " + e);
                if(callback) callback();
            }


        });

        /**
         * This stores only species and organs information as cancerTypes require too many genes to be stored and
         * node interactionCnt is already stored as a node attribute
         */
        socket.on('agentContextUpdate', function(data){
            let docPath = 'documents.' + data.room;
            model.set(docPath + '.context', data.param);
        });

        socket.on('agentRemoveBobRequest', function(data){
            if(tripsGeneralInterfaceInstance ) {


                askHuman(data.userId, data.room,  "removeBob", "",function(){

                    tripsGeneralInterfaceInstance.disconnect();


                });
            }
        });

        socket.on('agentSendTripsRequestRequest', function(data){
            if(tripsGeneralInterfaceInstance ) {
                tripsGeneralInterfaceInstance.sendTripsRequest(data.request, data.data);
            }

        });
        socket.on('agentConnectToTripsRequest', function(param){
            console.log("Agent trips connection request");
            if(!tripsGeneralInterfaceInstance || !tripsGeneralInterfaceInstance.isConnectedToTrips()) {
                let TripsGeneralInterfaceModule = require('./trips/TripsGeneralInterfaceModule.js');
                tripsGeneralInterfaceInstance = new TripsGeneralInterfaceModule(param.userId, param.userName, socket, model, askHuman);
            }
            else {//already there is an instance
                tripsGeneralInterfaceInstance.updateWebSocket(socket);
                tripsGeneralInterfaceInstance.updateListeners(socket);
            }
        //connect vismodule when the trips agent is connected
            if(!tripsVisualizationInterfaceInstance || !tripsVisualizationInterfaceInstance.isConnectedToTrips()) {
                let tripsVisualizationInterfaceModule = require('./trips/TripsVisualizationInterfaceModule.js');
                tripsVisualizationInterfaceInstance = new tripsVisualizationInterfaceModule(param.userId, param.userName, socket, model, askHuman);
            }
            else {
                tripsVisualizationInterfaceInstance.updateWebSocket(socket);
            }
        });


    };

    /***
     * Requests sent to other servers
     * @param socket
     */
    let listenToQueryRequests = function(socket){
        socket.on('REACHQuery',  function(outputType, msg, callback){
            let queryParams = "text=" + msg + "&output=" + outputType; //fries";


            request({
                url: 'http://agathon.sista.arizona.edu:8080/odinweb/api/text', //URL to hit
                // qs: {from: 'blog example', time: +new Date()}, //Query string data
                method: 'POST',
                headers: responseHeaders,
                form: queryParams

            }, function (error, response, body) {

                if (error) {

                    console.log(error);
                } else {


                    if(response.statusCode === 200) {
                        if(callback) callback(body);
                        io.in(socket.room).emit("REACHResult", body);

                    }


                }
            });
        });

        socket.on('pdfConvertRequest', function(binData, callback){

            let pdf2Text = require('pdf2text');

            pdf2Text(binData).then(function(pages) {
                if(callback) callback(pages);
            });

        });

        socket.on('BioGeneQuery', function (queryParams, callback) {


            request({
                url: 'http://cbio.mskcc.org/biogene/retrieve.do', //URL to hit
                // qs: {from: 'blog example', time: +new Date()}, //Query string data
                method: 'POST',
                headers: responseHeaders,
                form: queryParams

            }, function (error, response, body) {

                if (error) {

                    console.log(error);
                } else {

                    callback(body);
                    //socket.emit("BioGeneResult",body);
                }
            });
        });

        socket.on('AgentPCQueryRequest', function(queryData, callback){


            request(queryData.url , function (error, response, body) {

                if (error) {
                    console.log(error);
                } else  { //only open the window if a proper response is returned

                    if(response.statusCode === 200) {
                        if(callback)
                            callback(body);
                        else
                            socket.emit("PCQueryResult", {graph:body, type:queryData.type});
                    }
                    else{
                        if(callback)
                            callback();
                        socket.emit("PCQueryResult", "error");
                    }
                }
            });
        });

        socket.on('AgentMergePCQueryRequest', function(queryData, callback){

            request(queryData.url , function (error, response, body) {


                if (error) {
                    console.log(error);
                } else  { //only open the window if a proper response is returned

                    if(response.statusCode === 200) {
                        askHuman(queryData.userId, queryData.room,  "mergeSbgn", body, function(val){
                            if (callback) callback(val);
                        });

                    }
                    else{
                        if(callback) callback();

                    }

                }
                //    req.end();
            });

            // req.end();
        });

        socket.on('BioPAXRequest', function(fileContent, reqType, callback){

            request({
                url: "http://causalpath.org:8080/paxtools/PaxtoolsServlet",
                // url: "http://localhost:8081/PaxtoolsServlet",
                method:"POST",
                headers: responseHeaders,
                form: {reqType: reqType, content: fileContent}
            }, function (error, response, body) {

                console.log(response.statusCode);
                if (error) {
                    console.log(error);
                } else { //only open the window if a proper response is returned

                    if (response.statusCode === 200) {

                        if(reqType === "partialBiopax"){
                            io.in(socket.room).emit("processToIntegrate", body);
                        }

                        if(reqType === "biopax"){
                            if(tripsGeneralInterfaceInstance && tripsGeneralInterfaceInstance.isConnectedToTrips())
                                tripsGeneralInterfaceInstance.sendModelToTrips(body);
                        }

                        if(callback) {
                            callback({graph: body});
                        }
                    }
                    else {
                        console.log("Paxtools Server Error " + response.statusCode);
                    }
                }
            });
        });

    };
};