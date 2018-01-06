/*
 *	Model initialization
 *  Event handlers of model updates
 *	Author: Funda Durupinar Babur<f.durupinar@gmail.com>
 */
// noinspection Annotator
let app = module.exports = require('derby').createApp('cwc', __filename);
app.loadViews(__dirname + '/views');

const ONE_DAY = 1000 * 60 * 60 * 24;
const ONE_HOUR = 1000 * 60 * 60;
const ONE_MINUTE = 1000 * 60;
const BobId = "Bob123";


let docReady = false;


app.on('model', function (model) {

    model.fn('biggerTime', function (item) {
        let duration = model.get('_page.durationId');
        let startTime;
        if (duration < 0)
            startTime = 0;
        else
            startTime = new Date - duration;

        return item.date > startTime;
    });

    model.fn('biggerThanCurrentTime', function (item) {

        let clickTime = model.get('_page.clickTime');


        return item.date > clickTime;
    });

    model.fn('myMessages', function (msg) {

        let userId = model.get('_session.userId');

        return msg.userId === userId;
    });

});

/***
 * Load document and get a new docId if necessary
 */
app.get('/', function (page, model, params) {
    function getId() {
        return model.id();
    }

    function idIsReserved() {
        let ret = model.get('documents.' + docId) != undefined;
        return ret;
    }

    let docId = getId();

    while (idIsReserved()) {
        docId = getId();
    }


    return page.redirect('/' + docId);
});

/***
 * Load document with docId
 */
app.get('/:docId', function (page, model, arg, next) {
    let  room;

    let self = this;
    room = arg.docId;

    model.subscribe('documents', function () {

        let docPath = 'documents.' + arg.docId;
        model.ref('_page.doc', ('documents.' + arg.docId));

        model.subscribe(docPath, function (err) {
            if (err) return next(err);

            model.createNull(docPath, { // create the empty new doc if it doesn't already exist
                id: arg.docId
            });

            // //chat related
            model.set('_page.room', room);
            //
            model.set('_page.durations', [{name: 'All', id: -1}, {name: 'One day', id: ONE_DAY}, {
                name: 'One hour',
                id: ONE_HOUR
            }, {name: 'One minute', id: ONE_MINUTE}]);


            // create a reference to the document
            let pysb = model.at((docPath + '.pysb'));
            let cy = model.at((docPath + '.cy'));
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

            userIds.subscribe(function () {

            });

            users.subscribe(function () {


                return page.render();
            });

        });
    });

});

/***
 * Filter out messages on the chat window
 */
app.proto.changeDuration = function () {

    return this.model.filter('_page.doc.messages', 'biggerTime').ref('_page.list');
};


/***
 * Called only once in a browser after the first page rendering
 * @param model
 * @returns {*}
 */

app.proto.create = function (model) {
    let self = this;
    docReady = true;

    self.socket = io();
    self.notyView = window.noty({layout: "bottom",theme:"bootstrapTheme", text: "Please wait while model is loading."});

    self.listenToUIOperations(model);

    let id = model.get('_session.userId');


    // Make modelManager instance accessible through window object as testModelManager to use it in Cypress tests
    let ModelManager = require('./public/collaborative-app/modelManager.js');
    self.modelManager = window.testModelManager = new ModelManager(model, model.get('_page.room'));
    this.docId = model.get('_page.doc.id');
    window.testApp = this;
    window.sessionUserId = model.get('_session.userId');


    self.modelManager.addUser(model.get('_session.userId'));

    // self.modelManager.setName( model.get('_session.userId'),name);


    self.dynamicResize(model.get('_page.doc.images'));

    //Notify server about the client connection
    self.socket.emit("subscribeHuman", { userName:name, room:  model.get('_page.room'), userId: id});

    self.agentSocket = require('./public/collaborative-app/clientSideSocketListener')(this);
    self.agentSocket.listen();


    self.factoidHandler = require('./public/collaborative-app/factoid/factoid-handler')(this) ;
    self.factoidHandler.initialize();


    //Loading cytoscape and clients

    let cyIds = self.modelManager.getCyIds();

    cyIds.forEach(function(cyId) {
        if(parseInt(cyId) !== parseInt(appUtilities.getActiveNetworkId())) //tab 0: initial tab
            appUtilities.createNewNetwork(parseInt(cyId)); //opens a new tab
        self.loadCyFromModel(cyId, function (isModelEmpty) {
        });
    });

    if(cyIds.length === 0) //no previous model -- first time loading the document
        self.modelManager.openCy(appUtilities.getActiveNetworkId(), "me");

    self.notyView.close();


    self.editorListener = require('./public/collaborative-app/editor-listener.js')(self.modelManager,self.socket, id);
    //HACK: This is normally called when a new network is created, but the initial network is created before editor-listener
    //Lets editor-listener to subscribe to UI operations
    $(document).trigger('createNewNetwork', [appUtilities.getActiveCy(), appUtilities.getActiveNetworkId()]);

    this.atBottom = true;



    setTimeout(()=>{
        let userIds = self.modelManager.getUserIds();
        let noTrips = model.get('_page.doc.noTrips');
        if(!noTrips &&  userIds.indexOf(BobId) < 0) {

            // console.log("Connection requested " + noTrips + " " + op);
            self.connectTripsAgent();

            self.connectVisAgent();
        }
    }, 500); // wait a little while for the server to update user list and handle disconnections


    return model.on('all', '_page.list', (function (_this) {
        return function () {
            if (!_this.atBottom)
                return;

            document.getElementById("messages").scrollTop= document.getElementById("messages").scrollHeight;
            return _this.container.scrollTop = _this.list.offsetHeight;
        };
    })(this));
};


/***
 * Called after document is loaded.
 * Listeners are called here.
 * @param model
 */
app.proto.init = function (model) {
    this.listenToNodeOperations(model);
    this.listenToEdgeOperations(model);
    this.listenToModelOperations(model);
};

/***
 * Listen to UI inputs and update model accordingly
 */
app.proto.listenToUIOperations = function(model){
    let self = this;

    $('#messages').contentchanged = function () {
        let scrollHeight = $('#messages')[0].scrollHeight
        $('#messages').scrollTop( scrollHeight - $('.message').height());
    };

    //change scroll position
    $('#messages').scrollTop($('#messages')[0].scrollHeight  - $('.message').height());

    $(window).on('resize', function(){
        let images = model.get('_page.doc.images');
        self.dynamicResize(images);
    });


    self.lastMsgInd = -1; //increment in app.proto.app

    //start listening to keyboard events
    $('#inputs-comment').keydown(function (e){
        if(e.keyCode === 38 ||  e.keyCode === 40 ) { //up or down arrows

            //sorted list
            let filteredMsgs = model.filter('_page.doc.messages', 'myMessages').get();
            let messages = filteredMsgs.sort(function(a, b){
                return b-a;
            });

            if(messages && self.lastMsgInd > -1) {
                let msg = messages[self.lastMsgInd].comment;
                self.model.set('_page.newComment', msg);

                if (e.keyCode === 38)
                    self.lastMsgInd = self.lastMsgInd > 0 ? self.lastMsgInd - 1 : 0;
                else
                    self.lastMsgInd = self.lastMsgInd < messages.length - 1 ? self.lastMsgInd + 1 : messages.length - 1;
            }
        }

    });


    //Listen to these after cy is loaded
    $("#undo-last-action, #undo-icon").click(function () {
        if(self.modelManager.isUndoPossible()){
            self.modelManager.undoCommand();
            appUtilities.getActiveCy().forceRender();


        }
    });

    $("#redo-last-action, #redo-icon").click(function () {
        if(self.modelManager.isRedoPossible()){
            self.modelManager.redoCommand();
            appUtilities.getActiveCy().forceRender();
        }
    });


    // //If we get a message on a separate window
    //TODO: this will be done in a new tab
    // window.addEventListener('message', function(event) {
    //     if(event.data) { //initialization for a query window
    //         self.modelManager.newModel("me"); //do not delete cytoscape, only the model
    //         appUtilities.getActiveChiseInstance.updateGraph(JSON.parse(event.data), function(){
    //             self.modelManager.initModel(appUtilities.getActiveCy().nodes(), appUtilities.getActiveCy().edges(),
    //                 appUtilities.getActiveNetworkId(), appUtilities, "me");
    //             $("#perform-layout").trigger('click');
    //
    //         });
    //     }
    //
    // }, false);


};

app.proto.loadCyFromModel = function(cyId, callback){
    let self = this;
    let jsonArr = self.modelManager.getJsonFromModel(cyId);

    if (jsonArr) {

        //Updates data fields and sets style fields to default
        appUtilities.getChiseInstance(parseInt(cyId)).updateGraph({
            nodes: jsonArr.nodes,
            edges: jsonArr.edges
        }, function(){
            //Update position fields separately
            appUtilities.getCyInstance(parseInt(cyId)).nodes().forEach(function(node){

                let position = self.modelManager.getModelNodeAttribute('position',node.id(), cyId);

                node.position({x:position.x, y: position.y});

            });

            let container = $('#canvas-tab-area');

            console.log("Panzoom updated");
            // appUtilities.getCyInstance(parseInt(cyId)).zoom(1); //was 2 before
            // appUtilities.getCyInstance(parseInt(cyId)).pan({x:container.width()/2, y:container.height()/2});
            //

             // appUtilities.getCyInstance(parseInt(cyId)).panzoom().reset();

            if(callback) callback(false);

        });



    }
    if(callback) callback(true); //model is empty
};


app.proto.listenToNodeOperations = function(model){

    let self = this;

    //Update inspector
    //TODO: Open later
    // model.on('all', '_page.doc.cy.nodes.**', function(id, op, val, prev, passed){
    //     inspectorUtilities.handleSBGNInspector();
    // });

    model.on('all', '_page.doc.cy.*.nodes.*', function(cyId, id, op, val, prev, passed){

        if(docReady &&  !passed.user) {
            let node  = model.get('_page.doc.cy.' + cyId + '.nodes.' + id);
            if(!node || !node.id){ //node is deleted
                appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).remove();
            }
        }
    });


    model.on('all', '_page.doc.cy.*.nodes.*.addedLater', function(cyId, id, op, idName, prev, passed){ //this property must be something that is only changed during insertion
        console.log(cyId);
        console.log(id);
        console.log(op);

        if(docReady && !passed.user) {
            let pos = model.get('_page.doc.cy.' + cyId +'.nodes.'+ id + '.position');
            let sbgnclass = model.get('_page.doc.cy.' + + cyId +'.nodes.'+ id + '.data.class');
            let visibility = model.get('_page.doc.cy.' + cyId + '.nodes.'+ id + '.visibility');
            let parent = model.get('_page.doc.cy.'+ cyId +'.nodes.'+ id + '.data.parent');

            if(parent === undefined) parent = null;
            let newNode = appUtilities.getChiseInstance(parseInt(cyId)).elementUtilities.addNode(pos.x, pos.y, sbgnclass, id, parent, visibility);

            self.modelManager.initModelNode(newNode,cyId, "me", true);

            let parentEl = appUtilities.getCyInstance(parseInt(cyId)).getElementById(parent);
            newNode.move({"parent":parentEl});


        }
    });

    model.on('all', '_page.doc.cy.*.nodes.*.position', function(cyId, id, op, pos,prev, passed){



        if(docReady && !passed.user && appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).length>0) {

            let posDiff = {x: (pos.x - appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).position("x")), y:(pos.y - appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).position("y"))} ;
            moveNodeAndChildren(posDiff, appUtilities.getCyInstance(parseInt(cyId)).getElementById(id)); //children need to be updated manually here


            appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).updateStyle();

            //parent as well
            // appUtilities.getCyInstance(parseInt(cyId)).panzoom().fit();

        }
    });

    model.on('all', '_page.doc.cy.*.nodes.*.highlightColor', function(cyId, id, op, val,prev, passed){
        //call it here so that everyone can highlight their own textbox
        self.factoidHandler.highlightSentenceInText(id, val);

        if(docReady && !passed.user && appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).length>0) {
            if(!val){
                appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).css({
                    "overlay-color": null,
                    "overlay-padding": 10,
                    "overlay-opacity": 0
                });

            }
            else {
                appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).css({
                    "overlay-color": val,
                    "overlay-padding": 10,
                    "overlay-opacity": 0.25
                });
            }
            appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).updateStyle();
        }
    });

    //Called by agents to change bbox
    model.on('all', '_page.doc.cy.*.nodes.*.data.bbox.*', function(cyId, id, att, op, val,prev, passed){
        if(docReady && !passed.user && appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).length>0) {
            let newAtt = appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).data("bbox");
            newAtt[att] = val;
            appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).data("bbox", newAtt);
        }
    });




    //Called by agents to change specific properties of data
    model.on('all', '_page.doc.cy.*.nodes.*.data.*', function(cyId, id, att, op, val,prev, passed){
        if(docReady && !passed.user && appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).length>0) {
            appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).data(att, val);
            if(att === "parent")
                appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).move({"parent":val});
        }
    });


    model.on('all', '_page.doc.cy.*.nodes.*.data', function(cyId, id,  op, data,prev, passed){
        if(docReady && !passed.user && appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).length>0) {
            appUtilities.getCyInstance(parseInt(cyId)).getElementById(id)._private.data = data;

            //to update parent
            let newParent = data.parent;
            if(newParent === undefined)
                newParent = null;  //must be null explicitly

            appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).move({"parent":newParent});
            appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).updateStyle();
        }
    });



    model.on('all', '_page.doc.cy.*.nodes.*.expandCollapseStatus', function(cyId, id, op, val,prev, passed){
        if(docReady && !passed.user && appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).length>0) {
            let expandCollapse = appUtilities.getCyInstance(parseInt(cyId)).expandCollapse('get'); //we can't call chise.expand or collapse directly as it causes infinite calls
            if(val === "collapse")
                expandCollapse.collapse(appUtilities.getCyInstance(parseInt(cyId)).getElementById(id));
            else
                expandCollapse.expand(appUtilities.getCyInstance(parseInt(cyId)).getElementById(id));
        }
    });


    model.on('all', '_page.doc.cy.*.nodes.*.highlightStatus', function(cyId, id, op, highlightStatus, prev, passed){ //this property must be something that is only changed during insertion
        if(docReady && !passed.user && appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).length>0) {
            try{
                let viewUtilities = appUtilities.getCyInstance(parseInt(cyId)).viewUtilities('get');

                if(highlightStatus === "highlighted")
                    viewUtilities.highlight(appUtilities.getCyInstance(parseInt(cyId)).getElementById(id));
                else
                    viewUtilities.unhighlight(appUtilities.getCyInstance(parseInt(cyId)).getElementById(id));

                //    appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).updateStyle();
            }
            catch(e){
                console.log(e);
            }

        }
    });

    model.on('all', '_page.doc.cy.*.nodes.*.visibilityStatus', function(cyId, id, op, visibilityStatus, prev, passed){ //this property must be something that is only changed during insertion
        if(docReady && !passed.user && appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).length>0) {
            try{
                let viewUtilities = appUtilities.getCyInstance(parseInt(cyId)).viewUtilities('get');
                if(visibilityStatus === "hide") {
                    viewUtilities.hide(appUtilities.getCyInstance(parseInt(cyId)).getElementById(id));
                }
                else { //default is show
                    viewUtilities.show(appUtilities.getCyInstance(parseInt(cyId)).getElementById(id));
                }
            }
            catch(e){
                console.log(e);
            }
        }
    });


};

/***
 *
 * @param model
 */

app.proto.listenToEdgeOperations = function(model){

    let self = this;

    //Update inspector
    //TODO: open later
    // model.on('all', '_page.doc.cy.edges.**', function(id, op, val, prev, passed){
    //     inspectorUtilities.handleSBGNInspector();
    // });


    model.on('all', '_page.doc.cy.*.edges.*.highlightColor', function(cyId, id, op, val,prev, passed){
        if(docReady && !passed.user && appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).length>0) {
            if(val == null){
                appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).css({
                    "overlay-color": null,
                    "overlay-padding": 10,
                    "overlay-opacity": 0
                });
            }
            else {
                appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).css({
                    "overlay-color": val,
                    "overlay-padding": 10,
                    "overlay-opacity": 0.25
                });
            }
        }
    });

    model.on('all', '_page.doc.cy.*.edges.*', function(cyId, id, op, val, prev, passed){
        if(docReady &&  !passed.user && appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).length>0) {
            let edge  = model.get('_page.doc.cy.' + cyId +'.edges.' + id); //check

            if(!edge|| !edge.id){ //edge is deleted
                appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).remove();

            }
        }
    });

    model.on('all', '_page.doc.cy.*.edges.*.addedLater', function(cyId, id,op, idName, prev, passed){//this property must be something that is only changed during insertion
        if(docReady && !passed.user ){
            let source = model.get('_page.doc.cy.'+ cyId +'.edges.'+ id + '.data.source');
            let target = model.get('_page.doc.cy.'+ cyId +'.edges.'+ id + '.data.target');
            let sbgnclass = model.get('_page.doc.cy.'+ cyId +'.edges.'+ id + '.data.class');
            let visibility = model.get('_page.doc.cy.' + cyId +'.nodes.'+ id + '.visibility');
            let newEdge = appUtilities.getChiseInstance(cyId).elementUtilities.addEdge(source, target, sbgnclass, id, visibility);

            self.modelManager.initModelEdge(newEdge, cyId, "me", true);
        }
    });

    model.on('all', '_page.doc.cy.*.edges.*.data', function(cyId, id, op, data,prev, passed){
        if(docReady && !passed.user && appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).length>0) {
            //appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).data(data); //can't call this if cy element does not have a field called "data"
            appUtilities.getCyInstance(parseInt(cyId)).getElementById(id)._private.data = data;
            appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).updateStyle();
        }
    });

    model.on('all', '_page.doc.cy.*.edges.*.data.*', function(cyId, id, att, op, val,prev, passed){
        if(docReady && !passed.user && appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).length>0)
            appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).data(att, val);
    });

    model.on('all', '_page.doc.cy.*.edges.*.bendPoints', function(cyId, id, op, bendPoints, prev, passed){ //this property must be something that is only changed during insertion
        if(docReady && !passed.user && appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).length>0) {
            try{
                let edge = appUtilities.getCyInstance(parseInt(cyId)).getElementById(id);
                if(bendPoints.weights && bendPoints.weights.length > 0) {
                    edge.data('cyedgebendeditingWeights', bendPoints.weights);
                    edge.data('cyedgebendeditingDistances', bendPoints.distances);
                    edge.addClass('edgebendediting-hasbendpoints');
                }
                else{
                    edge.data('cyedgebendeditingWeights',[]);
                    edge.data('cyedgebendeditingDistances',[]);
                    edge.removeClass('edgebendediting-hasbendpoints');
                }

                edge.trigger('cyedgebendediting.changeBendPoints');
             //   appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).updateStyle();

            }
            catch(e){
                console.log(e);
            }

        }
    });

    model.on('all', '_page.doc.cy.*.edges.*.highlightStatus', function(cyId, id, op, highlightStatus, prev, passed){ //this property must be something that is only changed during insertion
        if(docReady && !passed.user && appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).length>0) {
            let viewUtilities = appUtilities.getCyInstance(parseInt(cyId)).viewUtilities('get');
            try{
                if(highlightStatus === "highlighted")
                    viewUtilities.highlight(appUtilities.getCyInstance(parseInt(cyId)).getElementById(id));
                else
                    viewUtilities.unhighlight(appUtilities.getCyInstance(parseInt(cyId)).getElementById(id));
            }
            catch(e){
                console.log(e);
            }
        }
    });

    model.on('all', '_page.doc.cy.*.edges.*.visibilityStatus', function(cyId, id, op, visibilityStatus, prev, passed){ //this property must be something that is only changed during insertion
        if(docReady && !passed.user && appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).length>0) {
            let viewUtilities = appUtilities.getCyInstance(parseInt(cyId)).viewUtilities('get');
            try{
                if(visibilityStatus === "hide")
                    viewUtilities.hide(appUtilities.getCyInstance(parseInt(cyId)).getElementById(id));
                else
                    viewUtilities.show(appUtilities.getCyInstance(parseInt(cyId)).getElementById(id));
            }
            catch(e){
                console.log(e);
            }
        }
    });
};

/***
 * Listen to other operations on the model
 * @param model
 */
app.proto.listenToModelOperations = function(model){
    let self = this;


    //Listen to other model operations
    model.on('all', '_page.doc.factoid.*', function(id, op, val, prev, passed){
        if(docReady &&  !passed.user) {
            self.factoidHandler.setFactoidModel(val);
        }
    });


    //A new tab is open
    model.on('all', '_page.doc.cy.**', function( val, op, cyId, prev, passed){

        if(docReady && !passed.user){
            if( op === 'insert')
                appUtilities.createNewNetwork(cyId);

        }
    });

    model.on('all', '_page.doc.cy.*', function( val, op, cyId, prev, passed){

        if(docReady && !passed.user){
                self.loadCyFromModel(val);
        }
    });


    //Tab is closed by another client
    model.on('all', '_page.doc.closedCy', function(  op, cyId, prev, passed){

        if(docReady) {
            if(docReady && !passed.user) {
                appUtilities.setActiveNetwork(cyId);
                appUtilities.closeActiveNetwork();

            }
        }
    });



    //Cy updated by other clients
    model.on('all', '_page.doc.cy.*.initTime', function( cyId, op, val, prev, passed){

        if(docReady) {
            if(docReady && !passed.user) {
                self.loadCyFromModel(cyId);
            }
            self.notyView.close();
        }
    });

    model.on('change', '_page.doc.pcQuery.*.graph', function(ind, data){
        let chiseInst = appUtilities.createNewNetwork();

        let jsonObj = chiseInst.convertSbgnmlTextToJson(data);

            chiseInst.updateGraph(jsonObj, function() {
                self.modelManager.initModel(chiseInst.getCy().nodes(), chiseInst.getCy().edges(), chiseInst.cyId, appUtilities, "me");
                $("#perform-layout").trigger('click');

            });

    }); //opens a new tab



    //Sometimes works
    model.on('all', '_page.doc.images', function() {
        if (docReady) {
            triggerContentChange('static-image-container');
            triggerContentChange('receivedImages');
        }
    });

    model.on('all', '_page.doc.history', function(){
        if(docReady){
            triggerContentChange('command-history-area');
        }
    });

    model.on('insert', '_page.list', function () {
        let com = model.get('_page.list');
        let myId = model.get('_session.userId');

        if(docReady)
            triggerContentChange('messages');

        if (docReady && com[com.length - 1].userId != myId)
            $('#notificationAudio')[0].play();

    });


    let timeSort = function (a, b) {
        return (a != null ? a.date : void 0) - (b != null ? b.date : void 0);
    };

    return model.sort('_page.doc.messages', timeSort).ref('_page.list');

};

////////////////////////////////////////////////////////////////////////////
// UI events
////////////////////////////////////////////////////////////////////////////

app.proto.onScroll = function () {
    let bottom, containerHeight, scrollBottom;

    bottom = this.list.offsetHeight;
    containerHeight = this.container.offsetHeight;
    scrollBottom = this.container.scrollTop + containerHeight;

    return this.atBottom = bottom < containerHeight || scrollBottom > bottom - 10;

};

app.proto.changeColorCode = function(){

    this.modelManager.changeColorCode(this.model.get('_session.userId'));

};


/***
 * Client requests the server to send a pc query
 * The result will later be displayed by the client
 * @param pc_url
 */
app.proto.openPCQueryWindow = function(pc_url){
    this.model.push('_page.doc.pcQuery', {url: pc_url, graph:''});
};

/*
 * This is for selecting messages from the select box and test queries
 */
app.proto.updateTripsMessage = function(){

    let e = document.getElementById("test-messages");
    let msg = e.options[e.selectedIndex].text;

    this.model.set('_page.newComment', msg);
};

app.proto.resetConversationOnTrips = function(){
    //directly ask the server as this client may not have a tripsAgent
    this.socket.emit('resetConversationRequest');

};


app.proto.connectCausalityAgent = function(){
    this.socket.emit('connectToCausalityAgentRequest');
};

app.proto.connectVisAgent = function(){
    let self = this;
    let VisAgent = require('./agent-interaction/VisAgent.js');
    this.visA = new VisAgent("VisAgent123")

    self.visA.connectToServer("http://localhost:3000/", function(){
        self.visA.loadModel(function () {
            self.visA.loadChatHistory(function () {
                self.visA.init(); //connects to trips
            });
        });
    });
};

// app.proto.moveNode = function(location){
//
//     if(appUtilities.getActiveCy().nodes(":selected").length <= 0)
//         return;
//
//     if(this.visA == null)
//         this.connectVisAgent();
//
//     let nodeName =  appUtilities.getActiveCy().nodes(":selected")[0].data("label");
//     this.visA.moveNode(nodeName, location);
// };


app.proto.connectTripsAgent = function(){
    let self = this;

    let TripsGeneralInterfaceAgent = require("./agent-interaction/TripsGeneralInterfaceAgent.js");
    self.tripsAgent = new TripsGeneralInterfaceAgent("Bob", BobId);

    console.log("Bob connected");
    self.tripsAgent.connectToServer("http://localhost:3000/", function(){
        self.tripsAgent.loadModel(function () {
            self.tripsAgent.init();
            self.tripsAgent.loadChatHistory(function () {
            });
        });
    });
};


app.proto.enterMessage = function(event){
    let self = this;

    if (event.keyCode === 13 && !event.shiftKey) {
       self.add(event);
        // prevent default behavior
        event.preventDefault();
    }
};

app.proto.add = function (event, model) {
    let self = this;

    if(!model)
        model = this.model;

    this.atBottom = true;

    let comment;
    comment = model.del('_page.newComment'); //to clear  the input box
    if (!comment) return;

    let targets  = [];
    let users = model.get('_page.doc.userIds');

    let myId = model.get('_session.userId');
    for(let i = 0; i < users.length; i++){
        let user = users[i];
        if(user === myId ||  document.getElementById(user).checked){
            targets.push({id: user});
        }
    }

    let msgUserId = model.get('_session.userId');
    let msgUserName = model.get('_page.doc.users.' + msgUserId +'.name');

    comment.style = "font-size:large";

    let msg = {room: model.get('_page.room'),
        targets: targets,
        userId: msgUserId,
        userName: msgUserName,
        comment: comment
    };


    let filteredMsgs = model.filter('_page.doc.messages', 'myMessages').get();

    self.lastMsgInd = filteredMsgs.length; //new message will be added next

    //also lets server know that a client message is entered.
    self.socket.emit('getDate', msg, function(date){ //get the date from the server
        msg.date = date;

        model.add('_page.doc.messages', msg);
        event.preventDefault();

        //change scroll position
        var scrollHeight = $('#messages')[0].scrollHeight
       $('#messages').scrollTop( scrollHeight - $('.message').height());

    });
};


app.proto.clearHistory = function () {
    this.model.set('_page.clickTime', new Date);

    //TODO: silllll
    // appUtilities.getCyInstance(parseInt(cyId)).panzoom().fit();
    // var $reset = $('<div class="cy-panzoom-reset cy-panzoom-zoom-button"></div>');
    // $('#cy-panzoom-zoom-button').trigger('mousedown');
    // appUtilities.getCyInstance(parseInt(cyId)).panzoom.reset();
    return this.model.filter('_page.doc.messages', 'biggerThanCurrentTime').ref('_page.list');
};


app.proto.uploadFile = function(evt){
    let self = this;

    try{
        let room = this.model.get('_page.room');
        let fileStr = this.model.get("_page.newFile").split('\\');
        let filePath = fileStr[fileStr.length-1];

        let file = evt.target.files[0];

        let reader = new FileReader();
        let images = this.model.get('_page.doc.images');
        let imgCnt = 0;
        if(images)
            imgCnt = images.length;
        reader.onload = function(evt){
            self.modelManager.addImage({ img: evt.target.result,room: room, fileName: filePath, tabIndex:imgCnt, tabLabel:filePath});

        };

        reader.readAsDataURL(file);

        //Add file name as a text message
        this.model.set('_page.newComment',  ("Sent image: "  + filePath) );

        this.app.proto.add(evt,this.model, filePath);

    }
    catch(error){ //clicking cancel when the same file is selected causes error
        console.log(error);

    }
};


app.proto.count = function (value) {
    return Object.keys(value || {}).length;
};


app.proto.formatTime = function (message) {
    let hours, minutes, seconds;
    let time = message && message.date;


    if (!time) {
        return;
    }
    time = new Date(time);
    hours = time.getHours();

    minutes = time.getMinutes();

    seconds = time.getSeconds();

    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    if (seconds < 10) {
        seconds = '0' + seconds;
    }

    return hours + ':' + minutes + ':' + seconds;
};


app.proto.formatObj = function(obj){
    return JSON.stringify(obj, null, '\t');
};


app.proto.dynamicResize = function (images) {
    let win = $(window);
    let windowWidth = win.width();
    let windowHeight = win.height();
    let canvasWidth = 1200;
    let canvasHeight = 680;


    if (windowWidth > canvasWidth) {
        $("#canvas-tab-area").resizable({
                alsoResize: '#inspector-tab-area',
                minWidth: 1000
            }
        );

        let wCanvasTab = $("#canvas-tab-area").width();

        $(".nav-menu").width(wCanvasTab);
        $(".navbar").width(wCanvasTab);
        $("#sbgn-toolbar").width(wCanvasTab);

        $("#network-panels-container").width( wCanvasTab* 0.99);

        if(images) {
            images.forEach(function (img) {
                $("#static-image-container-" + img.tabIndex).width(wCanvasTab * 0.99);
            });
        }


        $("#inspector-tab-area").resizable({
            minWidth:355
        });

        let wInspectorTab = $("#inspector-tab-area").width();
        $("#sbgn-inspector").width(wInspectorTab);
        $("#canvas-tabs").width( wCanvasTab* 0.99);
    }
    else {
        if(images) {
            images.forEach(function (img) {
                $("#static-image-container-" + img.tabIndex).width(800);
                $("#static-image-container-" + img.tabIndex).height(680);
            });
        }
    }

    if (windowHeight > canvasHeight) {

        $("#canvas-tab-area").resizable({
            alsoResize:'#inspector-tab-area',
            minHeight: 600
        });

        let hCanvasTab = $("#canvas-tab-area").height();
        $("#network-panels-container").height(hCanvasTab * 0.99);
        if(images) {
            images.forEach(function (img) {
                $("#static-image-container-" + img.tabIndex).height(hCanvasTab * 0.99);
            });
        }

        $("#inspector-tab-area").resizable({
            alsoResize:'#canvas-tab-area',
            minHeight: 600
        });

        let hInspectorTab = $("#inspector-tab-area").height();

        $("#sbgn-inspector").height(hInspectorTab);
        $("#factoid-area").height(hInspectorTab * 0.9);
        $("#factoidBox").height(hInspectorTab * 0.6);
    }
};


app.proto.testImageTab = function(){

    let imgData = {
        img: ("data:image/png;base64,"),
        tabIndex: 1,
        tabLabel: "test",
        fileName: "modelRXN"
    };
    var status = this.modelManager.addImage(imgData);
    var images = this.modelManager.getImages();
    this.dynamicResize(images);
}
////////////////////////////////////////////////////////////////////////////
//Local functions
////////////////////////////////////////////////////////////////////////////


function triggerContentChange(divId){
    //TODO: triggering here does not always work
    $(('#' + divId)).trigger('contentchanged');
}


/***
 * Local function to update children's positions with node
 * @param positionDiff
 * @param node
 */
function moveNodeAndChildren(positionDiff, node) {
    let oldX = node.position("x");
    let oldY = node.position("y");
    node.position({
        x: oldX + positionDiff.x,
        y: oldY + positionDiff.y
    });
    let children = node.children();
    children.forEach(function(child){
        moveNodeAndChildren(positionDiff, child, true);
    });
}