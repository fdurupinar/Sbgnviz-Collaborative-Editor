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

        return msg.userId === userId; //&& isUserChecked;
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
            let cellularLocations = model.at((docPath + '.cellularLocations'));
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
            let biopaxMode = model.at((docPath + '.biopaxMode'));
            let wizardMode = model.at((docPath + '.wizardMode'));
            let sampleSentences = model.at((docPath + '.sampleSentences'));
            let notes = model.at((docPath + '.notes'));
            let oncoprint = model.at((docPath + '.oncoprint'));


            pysb.subscribe(() =>{
            });

            cy.subscribe(() => {
            });

            history.subscribe(() => {
            });

            undoIndex.subscribe(() => {
            });

            context.subscribe(() => {
            });

            images.subscribe(() => {
            });

            messages.subscribe(() => {
            });

            provenance.subscribe(() => {
            });

            pcQuery.subscribe(() => {
            });

            biopaxMode.subscribe(()=>{
            });


            noTrips.subscribe(() => {

            });

            userIds.subscribe(() => {

            });

            cellularLocations.subscribe(() => {

            });

            sampleSentences.subscribe(() => {

            });

            notes.subscribe(() => {

            });

            oncoprint.subscribe(() => {

            });
            users.subscribe(() => {

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
    docReady = true;

    this.socket = io();
    this.notyView = window.noty({layout: "bottom",theme:"bootstrapTheme", text: "Please wait while model is loading."});



    this.listenToUIOperations(model);

    let id = model.get('_session.userId');

    console.log("Session id is : " + id );
    let url = document.URL;
    if(url[url.length-1] === '#')
        url = url.substring(0, url.length-1);
    this.model.set('_page.url', url);


    // Make modelManager instance accessible through window object as testModelManager to use it in Cypress tests
    let ModelManager = require('./public/collaborative-app/modelManager.js');
    this.modelManager = window.testModelManager = new ModelManager(model, model.get('_page.room'));
    this.docId = model.get('_page.doc.id');
    window.testApp = this;
    window.sessionUserId = model.get('_session.userId');


    this.modelManager.addUser(id);

    //name is assigned in the modelmanager
    let userNameModel = this.modelManager.getName(id);

    this.modelManager.setUserTyping(id, false);

    this.dynamicResize();

    //Notify server about the client connection
    this.socket.emit("subscribeHuman", { userName:userNameModel, room:  model.get('_page.room'), userId: id});

    this.agentSocket = require('./public/collaborative-app/clientSideSocketListener')(this);
    this.agentSocket.listen();


    this.factoidHandler = require('./public/collaborative-app/factoid/factoid-handler')(this) ;
    this.factoidHandler.initialize();


    this.oncoprintHandler = require('./public/collaborative-app/oncoprint/oncoprint-handler')(this) ;
    this.oncoprintHandler.initialize($('#oncoprint-container').width());


    let oncoprintData = this.modelManager.getOncoprint();
    if(oncoprintData) {
        document.getElementById('oncoprint-tab').style.visibility = 'visible';
        this.oncoprintHandler.updateData(oncoprintData);
    }
    else
        document.getElementById('oncoprint-tab').style.visibility='hidden';

    //Loading cytoscape and clients

    let cyIds = this.modelManager.getCyIds();



    cyIds.forEach((cyId) => {
        if(parseInt(cyId) !== parseInt(appUtilities.getActiveNetworkId())) //tab 0: initial tab
            appUtilities.createNewNetwork(parseInt(cyId)); //opens a new tab

        this.loadCyFromModel(cyId, function (isModelEmpty) {
        });

        //To initialize the editor
        this.editorListener = require('./public/collaborative-app/editor-listener.js')(this.modelManager,this.socket, id, this);

        //HACK: This is normally called when a new network is created, but the initial network is created before editor-listener
        //Lets editor-listener subscribe to UI operations
        // does not actually create a new network, just notifies editor-listener
        // triggers event listeners
        $(document).trigger('createNewNetwork', [appUtilities.getCyInstance(cyId), cyId]);


    });

    if(cyIds.length === 0) { //no previous model -- first time loading the document
        this.modelManager.openCy(appUtilities.getActiveNetworkId(), "me");

        //To initialize the editor
        this.editorListener = require('./public/collaborative-app/editor-listener.js')(this.modelManager,this.socket, id, this);

        $(document).trigger('createNewNetwork', [appUtilities.getActiveCy(), appUtilities.getActiveNetworkId()]);
    }


    this.notyView.close();






    //HACK
    //set the initial tab as the active network
    //hack: otherwise all the tabs look active and they render on top of each other
    setTimeout(()=> {
        $('#network-tabs-list a[href="#sbgn-network-container-0"]').trigger('click');
        appUtilities.getCyInstance(0).panzoom().fit();

    }, 1000);


    //update the ui
    document.getElementById('wizard-mode').checked = model.get('_page.doc.wizardMode');

    this.atBottom = true;

    //sort session ids

    setTimeout(()=>{

        let userIds = this.modelManager.getUserIds();


        let noTrips = model.get('_page.doc.noTrips');
        if(!noTrips &&  userIds.indexOf(BobId) < 0) {

            // console.log("Connection requested " + noTrips + " " + op);
            this.connectTripsAgent();

            this.connectVisualizationHandler(this.modelManager);
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

    $('')

    $('#messages').contentchanged = function () {
        let scrollHeight = $('#messages')[0].scrollHeight
        $('#messages').scrollTop( scrollHeight - $('.message').height());
    };

    //change scroll position
    $('#messages').scrollTop($('#messages')[0].scrollHeight  - $('.message').height());


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

        if(e.keyCode === 27){ //esc
            model.del('_page.newComment'); //to clear  the input box
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

};

app.proto.loadCyFromModel = function(cyId, callback){
    let self = this;
    let jsonArr = self.modelManager.getJsonFromModel(cyId);

    if (jsonArr) {

        //Updates data fields and sets style fields to default
        appUtilities.getChiseInstance(parseInt(cyId)).updateGraph({nodes: jsonArr.nodes, edges: jsonArr.edges}, function(){
            //Update position fields separately
            appUtilities.getCyInstance(parseInt(cyId)).nodes().forEach(function(node){

                let position = self.modelManager.getModelNodeAttribute('position',node.id(), cyId);

                node.position({x:position.x, y: position.y});

            });

            let container = $('#canvas-tab-area');

            // console.log("Panzoom updated");
            // appUtilities.getCyInstance(parseInt(cyId)).zoom(1); //was 2 before
            // appUtilities.getCyInstance(parseInt(cyId)).pan({x:container.width()/2, y:container.height()/2});
            //

             // appUtilities.getCyInstance(parseInt(cyId)).panzoom().reset();

            appUtilities.getCyInstance(parseInt(cyId)).panzoom().fit();

            if(callback) callback(false);

        }, true);



    }
    if(callback) callback(true); //model is empty
};


app.proto.convertToBiopax = function(){
    let self= this;

    if(this.model.get('_page.doc.biopaxMode')) {

        let cyId = appUtilities.getActiveNetworkId();
        let chiseInst = appUtilities.getChiseInstance(cyId);

        //get rid of ports
        chiseInst.setPortsOrdering(chiseInst.getCy().nodes(), 'none');

        chiseInst.getCy().nodes().forEach(function (node) {
            chiseInst.elementUtilities.removePorts(node);
        });

        let sbgn = appUtilities.getChiseInstance(cyId).createSbgnml();


        sbgn = sbgn.replace("unknown", "process description");
        sbgn = sbgn.replace("libsbgn/0.3", "libsbgn/0.2");


        self.socket.emit('BioPAXRequest', sbgn, "biopax", function (biopax) {

            console.log("sending biopax req");
            self.model.set('_page.doc.pysb.' + cyId + '.biopax', biopax.graph);
            console.log(biopax.graph);
        });
    }
}




app.proto.listenToNodeOperations = function(model){

    let self = this;

    //Update inspector

    // model.on('all', '_page.doc.cy.*.nodes.**', function(cyId, id, op, val, prev, passed){
    //     //TODO: Open later
    // //     inspectorUtilities.handleSBGNInspector();
    //
    //     //Update biopax model stored in pysb
    //     let sbgn = appUtilities.getChiseInstance(cyId).createSbgnml();
    //     sbgn = sbgn.replace("unknown", "process description");
    //     sbgn = sbgn.replace("libsbgn/0.3", "libsbgn/0.2");
    //     //
    //     self.socket.emit('BioPAXRequest', sbgn, "biopax", function(biopax) {
    //         self.model.set('_page.doc.pysb.' + cyIdt + '.biopax', biopax.graph);
    //     });
    //
    // });




    model.on('all', '_page.doc.cy.*.nodes.*', function(cyId, id, op, val, prev, passed){


        if(docReady &&  !passed.user) {
            let node  = model.get('_page.doc.cy.' + cyId + '.nodes.' + id);
            if((!node || !node.id)){ //node is deleted


                let cyNode =  appUtilities.getCyInstance(parseInt(cyId)).getElementById(id);
                if(cyNode && cyNode.data("class") === "compartment"){
                    self.removeCellularLocation(cyNode.data("label"));
                }

                appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).remove();

            }
        }
        else {
            let node  = model.get('_page.doc.cy.' + cyId + '.nodes.' + id);
            if(!node || !node.id) //node is deleted
                self.convertToBiopax();


        }
    });


    model.on('all', '_page.doc.cy.*.nodes.*.addedLater', function(cyId, id, op, idName, prev, passed){ //this property must be something that is only changed during insertion


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
        else {

                self.convertToBiopax();
        }
    });

    model.on('all', '_page.doc.cy.*.nodes.*.position', function(cyId, id, op, pos,prev, passed){


        if(docReady && !passed.user && appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).length>0) {

            let posDiff = {x: (pos.x - appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).position("x")), y:(pos.y - appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).position("y"))} ;
            moveNodeAndChildren(posDiff, appUtilities.getCyInstance(parseInt(cyId)).getElementById(id)); //children need to be updated manually here


            appUtilities.getCyInstance(parseInt(cyId)).getElementById(id).updateStyle();

            //parent as well
            appUtilities.getCyInstance(parseInt(cyId)).panzoom().fit();

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

    // model.on('all', '_page.doc.cy.*.edges.**', function(cyId, id, op, val, prev, passed){
    //     //TODO: Open later
    //     //     inspectorUtilities.handleSBGNInspector();
    //
    //     //Update biopax model stored in pysb
    //     let sbgn = appUtilities.getChiseInstance(cyId).createSbgnml();
    //     sbgn = sbgn.replace("unknown", "process description");
    //     sbgn = sbgn.replace("libsbgn/0.3", "libsbgn/0.2");
    //     //
    //     self.socket.emit('BioPAXRequest', sbgn, "biopax", function(biopax) {
    //         self.model.set('_page.doc.pysb.' + cyId + '.biopax', biopax.graph);
    //
    //     });
    //
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
        else{
            let edge  = model.get('_page.doc.cy.' + cyId +'.edges.' + id); //check
            if(!edge|| !edge.id) //edge is deleted
                self.convertToBiopax();

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
        else
            self.convertToBiopax();
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



    model.on('all', '_page.doc.users.*.isTyping', function( id, op, mode, prev, passed){


        if(docReady &&  !passed.user) { //another user made the update
            let userId = self.model.get('_session.userId');
            let users = self.model.get('_page.doc.users');


        //see if there are other users who are writing at the time
            let isAnyoneTyping = false;

            for(let uid in users){
                let user = users[uid];

                if (uid !== userId) {
                    if (user.isTyping)
                        isAnyoneTyping = true;
                }
            }

            if(!isAnyoneTyping)
                document.getElementById('is-another-user-typing').style.display = "none";

            else
                document.getElementById('is-another-user-typing').style.display = "block";


        }

    });


    model.on('all', '_page.doc.wizardMode', function(op, mode, prev, passed){

        if(docReady &&  !passed.user) {
            if(!mode)
                mode = false;
            document.getElementById('wizard-mode').checked = mode;


        }
    });


    model.on('all', '_page.doc.oncoprint', function(op, data, prev, passed){

        //once defined, keep it open
        if(docReady &&  !passed.user) {

            document.getElementById('oncoprint-tab').style.visibility='visible';
            self.oncoprintHandler.updateData(data);

        }
    });



    model.on('all', '_page.doc.cellularLocations.*', function(location, op, names, prev, passed){


        if(docReady &&  !passed.user) {
            self.addCellularLocation(names, location);
        }
    });

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

    model.on('all', '_page.doc.cy.*', function( cyId, op, val, prev, passed){

        if(docReady && !passed.user){
                self.loadCyFromModel(cyId);
        }
    });


    //Tab is closed by another client
    model.on('all', '_page.doc.closedCy', function(  op, cyId, prev, passed){

        if(docReady) {
            if(docReady && !passed.user) {
                try {
                    appUtilities.setActiveNetwork(cyId);
                    appUtilities.closeActiveNetwork();
                }
                catch(e){
                    console.log(e);
                }
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
                // $("#perform-layout").trigger('click');
                self.callLayout(chiseInst.cyId);

            }, true);

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
            try {
                $('#notificationAudio')[0].play();
            }
            catch(e){
                console.log("Cannot play audio. " + e);
            }

    });

    model.on('change', '_page.doc.messages.*', function ( id, msg, prev,passed) {



        if (!passed.user && self.tripsAgent && self.tripsAgent.isIntendedForBob((msg))) {
            msg.sentToBob = true;
            self.model.pass({user:"me"}).set('_page.doc.messages.'+ id, msg);
        }


    });


    let timeSort = function (a, b) {
        return (a != null ? a.date : void 0) - (b != null ? b.date : void 0);
    };


    return model.sort('_page.doc.messages', timeSort).ref('_page.list');

};


app.proto.isUserInTargets = function(targets){

    let userId = this.model.get('_session.userId');

    if(!targets || targets == '*')
        return true;

    //if there is no such user in the user list, this should also return true
    // let users = this.model.get('_page.doc.userIds');

    let isTarget = false;

    targets.forEach((target) =>{
        if(target.id == userId)
            isTarget = true;
    });

    return isTarget;
}
app.proto.addCellularLocation = function(genes, compartment, cyId) {
    if (!cyId)
        cyId = appUtilities.getActiveNetworkId();


    let cy = appUtilities.getCyInstance(cyId);
    let chiseInst = appUtilities.getChiseInstance(cyId);


    //check if compartment already exists among the children, and remove if so


    //make sure they are unselected
    cy.elements().unselect();

    let elements = [];


    if (genes === 'ont::all') {
        cy.elements().select();
        cy.nodes().forEach((el) => elements.push(el));
    }
    else {
        genes.forEach((gene) => {
            let els = this.visHandler.findAllNodesFromLabel(gene, cy.nodes());
            els.forEach((el) => elements.push(el));
        });

        //unselect all others
        elements.forEach((el) => {
            if (el.isNode()) {
                el.select();

                //select its parents as well
                let parentId = el.data('parent');
                while (parentId) {
                    let parentEl = cy.getElementById(parentId);
                    parentEl.select();
                    elements.push(parentEl);
                    parentId = parentEl.data('parent');
                }
            }
        });

        let nodes = cy.nodes(':selected');

        // let extendedNodes = chiseInst.elementUtilities.getNeighboursOfNodes(nodes);
        // // let extendedNodes = chiseInst.elementUtilities.extendNodeList(nodes); //processes
        // extendedNodes.forEach((el) => el.select());


    }


    //format label, eliminate any w:: or ont:: i
    let compartmentLabel = compartment.replace("W::", '');
    compartmentLabel = compartmentLabel.replace("ONT::", '');


    //check if compartment already exists
    let existingCompartment;
    cy.nodes().forEach((node) => {
        if (node.data("label") === compartmentLabel && node.isParent()) {
            existingCompartment = node; //they should all be the same compartment as this process eliminates duplicates
        }
    });

    if (existingCompartment) {
        let descs = existingCompartment.descendants();

        elements.forEach((el) => {

            if (!descs.contains(el)) { //el is not a descendant of this node, so add it into this
                // el.move({"parent": existingCompartment.id()});

                chiseInst.changeParent(el, existingCompartment.id(), 0, 0);

                el.updateStyle();

            }
        });
    }
    else {


        if (cy.nodes(":selected").size() > 0) {


            chiseInst.createCompoundForGivenNodes(cy.nodes(':selected'), "compartment");


            if (cy.nodes(':selected').size() > 0) {
                //find topmost parent

                let parentId = cy.nodes(':selected')[0].data('parent');

                let compoundId;

                while (parentId) {
                    compoundId = parentId;
                    let parentEl = cy.getElementById(compoundId);
                    parentEl.select();
                    parentId = parentEl.data('parent');
                }
                cy.getElementById(compoundId)._private.data.label = compartmentLabel;


            }

            setTimeout(() => {
                this.callLayout(cyId);
                // $("#perform-layout").trigger('click');
            }, 200);

        }
    }

    //unselect back
    cy.elements().unselect();



}


app.proto.moveOutOfCellularLocation = function(genes, compartment, cyId){
    if (!cyId)
        cyId = appUtilities.getActiveNetworkId();


    let cy = appUtilities.getCyInstance(cyId);
    let chiseInst = appUtilities.getChiseInstance(cyId);



    //make sure they are unselected
    cy.elements().unselect();

    let elements = [];


    if (genes === 'ont::all') {
        cy.elements().select();
        cy.nodes().forEach((el) => elements.push(el));
    }
    else {
        genes.forEach((gene) => {
            let els = this.visHandler.findAllNodesFromLabel(gene, cy.nodes());
            els.forEach((el) => elements.push(el));
        });

        //unselect all others
        elements.forEach((el) => {
            if (el.isNode()) {
                el.select();

                //select its parents as well
                let parentId = el.data('parent');
                while (parentId) {
                    let parentEl = cy.getElementById(parentId);
                    parentEl.select();
                    elements.push(parentEl);
                    parentId = parentEl.data('parent');
                }
            }
        });

        let nodes = cy.nodes(':selected');

        // let extendedNodes = chiseInst.elementUtilities.getNeighboursOfNodes(nodes);
        // // let extendedNodes = chiseInst.elementUtilities.extendNodeList(nodes); //processes
        // extendedNodes.forEach((el) => el.select());

    }


    //format label, eliminate any w:: or ont:: i
    let compartmentLabel = compartment.replace("W::", '');
    compartmentLabel = compartmentLabel.replace("ONT::", '');


    //check if compartment exists
    let existingCompartment;
    cy.nodes().forEach((node) => {
        if (node.data("label") === compartmentLabel && node.isParent()) {
            existingCompartment = node; //they should all be the same compartment as this process eliminates duplicates
        }
    });

    if (existingCompartment) {
        let descs = existingCompartment.descendants();

        elements.forEach((el) => {

            if (descs.contains(el)) { //el is actually a descendant of this node, so move it out
                // el.move({"parent": null});


                chiseInst.changeParent(el, null, 0, 0);
                el.updateStyle();


            }
        });

            setTimeout(() => {
                this.callLayout(cyId);
                // $("#perform-layout").trigger('click');
            }, 200);




    }

    //unselect back
    cy.elements().unselect();



}

app.proto.removeCellularLocation = function(location) {
    this.modelManager.removeModelCellularLocation(location);
}

/***
 * Add locations at each model update
 */
app.proto.updateCellularLocations = function() {

    let cyId = appUtilities.getActiveNetworkId();

    let cy = appUtilities.getCyInstance(cyId);
    let chiseInst = appUtilities.getChiseInstance(cyId);

    let cellularLocations = this.model.get('_page.doc.cellularLocations');



    for(let loc in cellularLocations){
        if(cellularLocations.hasOwnProperty(loc))
            this.addCellularLocation(cellularLocations[loc], loc)
    }
}

////////////////////////////////////////////////////////////////////////////
// UI events
////////////////////////////////////////////////////////////////////////////

app.proto.updateWizardMode = function(e){

    this.model.pass({user:"me"}).set('_page.doc.wizardMode', e.target.checked);

}
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

    try {

        let msg = e.options[e.selectedIndex].text;

        this.model.set('_page.newComment', msg);
    }
    catch(error){
        console.log(e.selectedIndex);
        console.log(error);
    }
};

app.proto.resetConversationOnTrips = function(){
    //directly ask the server as this client may not have a tripsAgent
    this.socket.emit('resetConversationRequest');

    this.model.del('_page.doc.cellularLocations');
};

app.proto.connectVisualizationHandler = function(modelManager){
    let self = this;

    let VisHandler = require('./public/collaborative-app/visual-manipulation/vis-handler.js');
    this.visHandler = new VisHandler(modelManager);

};

app.proto.findLabelAndStateOfSelectedNode = function() {

    if (appUtilities.getActiveCy().nodes(":selected").length <= 0)
        return;

    let nodeSelected = appUtilities.getActiveCy().nodes(":selected")[0];

    let nodeName = nodeSelected.data("label");

    let state = null;
    let statesandinfos = nodeSelected.data("statesandinfos");

    if (statesandinfos && statesandinfos.length > 0) {
        if (statesandinfos[0].clazz == "state variable") {
            if (statesandinfos[0].state.value)
                state = statesandinfos[0].state.value;
            else
                state = '';
        }
    }

    return {name: nodeName, state:state}
}

app.proto.lockNodes = function () {

    let nodes = appUtilities.getActiveCy().nodes(":selected");
    if (nodes.length <= 0)
        return;

    nodes.lock();

}

app.proto.unlockNodes = function () {

    let nodes = appUtilities.getActiveCy().nodes(":selected");
    if (nodes.length <= 0)
        return;

    nodes.unlock();

}

app.proto.moveNode = function(){

    let nodeProps = this.findLabelAndStateOfSelectedNode();
    if(!nodeProps || !nodeProps.name) {
        alert("Node not selected or it has an empty label");
        return;
    }

    let el = document.getElementById("move-node");
    let location = el.options[el.selectedIndex].text;

    let cyId = appUtilities.getActiveNetworkId();



    this.visHandler.moveNode({name: nodeProps.name, location: location, cyId:cyId, state:nodeProps.state});
};

app.proto.highlightNodeStream = function(){

    let nodeProps = this.findLabelAndStateOfSelectedNode();
    if(!nodeProps || !nodeProps.name){
        alert("Node not selected or it has an empty label");
        return;
    }

    let el = document.getElementById("highlight-node-stream");
    let direction = el.options[el.selectedIndex].text;

    let cyId = appUtilities.getActiveNetworkId();

    this.visHandler.highlightNodeStream({name: nodeProps.name, direction:direction,  state:nodeProps.state, cyId:cyId} );
};

app.proto.selectNodeStream = function(){

    let nodeProps = this.findLabelAndStateOfSelectedNode();
    if(!nodeProps || !nodeProps.name){
        alert("Node not selected or it has an empty label");
        return;
    }

    let el = document.getElementById("select-node-stream");
    let direction = el.options[el.selectedIndex].text;

    let cyId = appUtilities.getActiveNetworkId();

    this.visHandler.selectNodeStream({name: nodeProps.name, direction:direction,  state:nodeProps.state, cyId:cyId} );
};


app.proto.moveNodeStream = function(){

    let nodeProps = this.findLabelAndStateOfSelectedNode();
    if(!nodeProps || !nodeProps.name) {
        alert("Node not selected or it has an empty label");
        return;
    }

    let elDir = document.getElementById("move-node-stream-direction");
    let direction = elDir.options[elDir.selectedIndex].text;

    let elLoc = document.getElementById("move-node-stream-location");
    let location = elLoc.options[elLoc.selectedIndex].text;

    let cyId = appUtilities.getActiveNetworkId();

    this.visHandler.moveNodeStream({name: nodeProps.name, direction:direction, location:location,  state:nodeProps.state, cyId:cyId} );
};



app.proto.moveCompartment = function(){

    let compName = document.getElementById("move-compartment-name").value;

    let elLoc = document.getElementById("move-compartment-location");
    let location = elLoc.options[elLoc.selectedIndex].text;

    let cyId = appUtilities.getActiveNetworkId();

    this.visHandler.moveCompartmentNodes({name: compName, location:location,  cyId:cyId} );
};



app.proto.connectTripsAgent = function(){
    let self = this;

    let TripsGeneralInterfaceAgent = require("./agent-interaction/TripsGeneralInterfaceAgent.js");
    self.tripsAgent = new TripsGeneralInterfaceAgent("Bob", BobId);

    console.log("Bob connected");

    // Here we get the address and port we are actually at and connect to that
    var pathArray = window.location.href.split(':');
    var hostPort = pathArray[2].substring(0, 4);
    self.tripsAgent.connectToServer(pathArray[0] + ':' + pathArray[1] + ':' + hostPort, () => {
        self.tripsAgent.loadModel(() => {
            self.tripsAgent.init();
            self.tripsAgent.loadChatHistory(() => {
            });
        });
    });
};



app.proto.enterMessage = function(event){

    let userId = this.model.get('_session.userId');
    if (event.keyCode === 13 && !event.shiftKey) { //enter
       this.add(event);
        // prevent default behavior
        event.preventDefault();

        this.lastMsgInd = this.lastMsgInd > 0 ? this.lastMsgInd - 1 : 0;

        this.modelManager.setUserTyping(userId, false);


    }
    else {
        this.modelManager.setUserTyping(userId, true);
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

    //hack
    //if all the targets are selected let targets = '*', so when the page is reloaded, everyone can see the messages

    let isAllUsersChecked = true;
    for(let i = 0; i < users.length; i++){
        let user = users[i];
        if(user === myId ||  document.getElementById(user).checked){
            targets.push({id: user});
        }
        else
            isAllUsersChecked = false;
    }


    if(isAllUsersChecked)
        targets = '*';


    let msgUserId = model.get('_session.userId');
    let msgUserName = model.get('_page.doc.users.' + msgUserId +'.name');

    comment.style = "font-size:large";





    let msg = {room: model.get('_page.room'),
        targets: targets,
        userId: msgUserId,
        userName: msgUserName,
        comment: comment
    };


    //also lets server know that a client message is entered.
    self.socket.emit('getDate', msg, function(date){ //get the date from the server


        msg.date = date;

        model.add('_page.doc.messages', msg);
        event.preventDefault();

        let filteredMsgs = model.filter('_page.doc.messages', 'myMessages').get();
        self.lastMsgInd = filteredMsgs.length - 1;

        //change scroll position
        var scrollHeight = $('#messages')[0].scrollHeight
       $('#messages').scrollTop( scrollHeight - $('.message').height());


        self.modelManager.setUserTyping(myId, false);

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

    hours = time.getUTCHours();

    minutes = time.getUTCMinutes();

    seconds = time.getUTCSeconds();

    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    if (seconds < 10) {
        seconds = '0' + seconds;
    }

    return hours + ':' + minutes + ':' + seconds + ' (UTC)';
};


app.proto.formatObj = function(obj){
    return JSON.stringify(obj, null, '\t');
};


app.proto.callLayout = function(cyId){


    var currentLayoutProperties = appUtilities.getScratch(appUtilities.getCyInstance(cyId), 'currentLayoutProperties');
    appUtilities.getChiseInstance(cyId).performLayout(currentLayoutProperties);


}

app.proto.dynamicResize = function () {
    // get window inner width and inner height that includes scrollbars when they are rendered
    // using $(window).width() would be problematic when scrolls are visible
    // please see: https://stackoverflow.com/questions/19582862/get-browser-window-width-including-scrollbar
    // and https://developer.mozilla.org/en-US/docs/Web/API/Window/innerWidth
    let windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    let canvasWidth = 1200;
    let canvasHeight = 680;

    let images = this.model.get('_page.doc.images');


    if (windowWidth > canvasWidth) {

        let wCanvasTab = $("#canvas-tab-area").width();

        $(".nav-menu").width(wCanvasTab);
        $(".navbar").width(wCanvasTab);
        $("#sbgn-toolbar").width(wCanvasTab);

        $("#network-panels-container").width(wCanvasTab);

        if(images) {
            images.forEach(function (img) {
                $("#static-image-container-" + img.tabIndex).width(wCanvasTab);
            });
        }


        let wInspectorTab = $("#inspector-tab-area").width();
        $("#sbgn-inspector").width(wInspectorTab);
        $("#canvas-tabs").width( wCanvasTab);
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

        let hCanvasTab = $("#canvas-tab-area").height();
        $("#network-panels-container").height(hCanvasTab);
        if(images) {
            images.forEach(function (img) {
                $("#static-image-container-" + img.tabIndex).height(hCanvasTab);
            });
        }

        let hInspectorTab = $("#inspector-tab-area").height();

        $("#sbgn-inspector").height(hInspectorTab);
        $("#factoid-area").height(hInspectorTab * 0.9);
        $("#factoidBox").height(hInspectorTab * 0.6);
    }

    // TODO it would be better if find a good place to move these resizable calls.
    
    // make canvas tab area resizable and resize some other components as it is resized
    $("#canvas-tab-area").resizable({
            alsoResize: '#inspector-tab-area, #network-panels-container',
            minWidth: 1000,
            minHeight: 600
        }
    );

    // make inspector-tab-area resizable
    $("#inspector-tab-area").resizable({
        minWidth:390
    });

    // force each of the cytoscape.js
    // instance renderer to recalculate the viewport bounds
    this.resizeCyCanvases();
};

// force each of the cytoscape.js
// instance renderer to recalculate the viewport bounds
app.proto.resizeCyCanvases = function () {

  // traverse each network id
  for ( var i = 0; i < appUtilities.networkIdsStack.length; i++ ) {

    // get current networkId
    var networkId = appUtilities.networkIdsStack[i];

    // get the associated cy instance
    var cy = appUtilities.getCyInstance(networkId);

    // force renderer of cy to recalculate the viewport bounds
    cy.resize();
  }

}


app.proto.testImageTab = function(){

    let imgData = {
        img: ("data:image/png;base64,"),
        tabIndex: 1,
        tabLabel: "test",
        fileName: "modelRXN"
    };
    var status = this.modelManager.addImage(imgData);
    this.dynamicResize();
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
