/**
 * Created by durupina on 2/10/17.
 */

//Listen and respond to cytoscape events triggered by cytoscape-undo-redo.js
let modelMergeFunctions = require('./model-merge-functions.js')();
// Use mousetrap library to listen keyboard events
let Mousetrap = require('mousetrap');

module.exports = function(modelManager, socket, userId, app){

    // get a new mousetrap instance
    var mt = new Mousetrap();

    // jsons for the last copied elements
    var lastCopiedElesJsons;

    // the cy from which some elements are copied last time
    var lastCopiedElesCy;

    // listen to "ctrl/command + m" keyboard event
    mt.bind(["ctrl+m", "command+m"], function () {

        console.log('to perform merge operation here');

        // get the active chise instance
        var chiseInstance = appUtilities.getActiveChiseInstance();

        // get the related cy instance
        var cy = chiseInstance.getCy();

        // If the eles are already copied from this cy instance then merge is meaningless.
        // Therefore return directly if that is the case.
        if ( cy == lastCopiedElesCy ) {
            return;
        }

        modelMergeFunctions.mergeJsonWithCurrent(lastCopiedElesJsons, appUtilities.getActiveNetworkId(), modelManager);

        // return false to prevent default browser behavior
        // and stop event from bubbling
        return false;
    });


    //A new sample or file is loaded --update model and inform others
    $(document).on("sbgnvizLoadSampleEnd sbgnvizLoadFileEnd",  function(event, file, cy){

        console.log("Loading new sample");
        //remove annotations view

        //FIXME
        modelManager.newModel( appUtilities.getActiveNetworkId(), "me"); //do not delete cytoscape, only the model
        modelManager.initModel(cy.nodes(), cy.edges(), appUtilities.getActiveNetworkId(),  appUtilities);

        // setTimeout(function(){
        //         cy.elements().forEach(function(ele){
        //         ele.data("annotationsView", null);
        //         ele._private.data.annotationsView = null;
        //     });
        // },1000);
    });

    // call dynamicResize of CWC when dynamicResize is called for newt
    $(document).on('newtAfterDynamicResize', function () {
      app.dynamicResize();
    });

    $(document).on("CWC_after_copy", function (event, eleJsons, cy) {

        console.log('common clipboard is updated');

        // update jsons for the last copied elements
        lastCopiedElesJsons = eleJsons;

        // update the cy from which some elements are copied last time
        lastCopiedElesCy = cy;
    } );

    // listen 'resizestop' event on canvas tab area and force each of the cytoscape.js
    // instance renderer to recalculate the viewport bounds.
    $("#canvas-tab-area").on('resizestop', function () {

        app.resizeCyCanvases();

    });

    $("#new-file, #new-file-icon").click(function () {
        modelManager.openCy(appUtilities.getActiveNetworkId(), "me");
    });


    $(document).on("closeActiveNetwork", function (e, cyId) {
        console.log("close cy is called");
        modelManager.closeCy(cyId, "me");
    });

    $("#file-input").change(function () {
        if ($(this).val() != "") {
            var file = this.files[0];

            var extension = file.name.split('.').pop().toLowerCase();

            if (extension === "owl") {

                var reader = new FileReader();

                reader.onload = function (e) {

                    socket.emit('BioPAXRequest', this.result, "sbgn", function (sbgnData) { //convert to sbgn
                        appUtilities.getActiveSbgnvizInstance().loadSBGNMLText(sbgnData.graph)
                    });
                };
                reader.readAsText(file);


            }
            else {

                appUtilities.getActiveChiseInstance().loadSBGNMLFile(file);
            }
        }
        setTimeout(function () {
            //remove annotations view first
            // appUtilities.getActiveCy().elements().forEach(function(ele){
            //     ele.data("annotationsView", null);
            //     ele._private.data.annotationsView = null;
            // });
            modelManager.initModel(appUtilities.getActiveCy().nodes(), appUtilities.getActiveCy().edges(),
                appUtilities.getActiveNetworkId(), appUtilities, "me");



        }, 1000);

        });


    //TODO: doesn't catch it here?????
    // $("#file-input").change(function () {
    //
    //     if ($(this).val() != "") {
    //         var file = this.files[0];
    //
    //
    //         var extension = file.name.split('.').pop().toLowerCase();
    //
    //         if (extension === "owl") {
    //
    //             var reader = new FileReader();
    //
    //             reader.onload = function (e) {
    //
    //                 socket.emit('BioPAXRequest', this.result, "sbgn", function(sbgnData){ //convert to sbgn
    //
    //
    //                     appUtilites.getActiveSbgnvizInstance().loadSBGNMLText(sbgnData.graph);
    //                 });
    //             };
    //             reader.readAsText(file);
    //
    //
    //         }
    //     }
    //
    //     setTimeout(function () {
    //         //remove annotations view first
    //         // appUtilities.getActiveCy().elements().forEach(function(ele){
    //         //     ele.data("annotationsView", null);
    //         //     ele._private.data.annotationsView = null;
    //         // });
    //         modelManager.initModel(appUtilities.getActiveCy().nodes(), appUtilities.getActiveCy().edges(),
    //             appUtilities.getActiveNetworkId(), appUtilities, "me");
    //
    //
    //
    //     }, 1000);
    //
    // });
    //


    $(document).on("createNewNetwork", function (e, cy, cyId) {

        cy.on("afterDo afterRedo", function (event, actionName, args, res) {

            console.log(cyId);


            console.log(actionName);
            console.log(args);
            console.log(res);



            if (actionName === "changeData" || actionName === "changeFontProperties" ) {

                var modelElList = [];
                var paramList = [];
                args.eles.forEach(function (ele) {
                    //var ele = param.ele;

                    modelElList.push({id: ele.id(), isNode: ele.isNode()});

                    ele.data("annotationsView", null);
                    paramList.push(ele.data());

                });
                modelManager.changeModelElementGroupAttribute("data", modelElList, cyId,paramList,  "me");

            }


            else if (actionName === "changeNodeLabel" ||actionName === "resizeNodes"||
                actionName === "addStateOrInfoBox" || actionName === "setMultimerStatus" ||
                actionName === "setCloneMarkerStatus" || actionName === "changeStateOrInfoBox" ||
                actionName === "removeStateOrInfoBox" || actionName === "setPortsOrdering") {

                var modelElList = [];
                var paramList = []
                args.nodes.forEach(function (ele) {
                    //var ele = param.ele;

                    modelElList.push({id: ele.id(), isNode: true});

                    ele.data("annotationsView", null);
                    paramList.push(ele.data());

                });
                modelManager.changeModelElementGroupAttribute("data", modelElList,  cyId,paramList,  "me");

            }
            else if(actionName === "resize"){

                var modelElList = [{id: res.node.id(), isNode: true}];
                res.node.data("annotationsView", null);
                var paramList = [res.node.data()];


                modelManager.changeModelElementGroupAttribute("data", modelElList, cyId,paramList,  "me");
            }

            else if (actionName === "changeBendPoints") {

                var modelElList = [];
                var paramList = [];


                modelElList.push({id: res.edge.id(), isNode: false});

                res.edge.data("annotationsView", null);
                res.edge._private.data.annotationsView = null;

                console.log(res.edge._private.data.annotationsView);
                console.log(res.edge._private.data);
                console.log(res.edge.data());
                paramList.push({weights: args.edge.data('cyedgebendeditingWeights'), distances:res.edge.data('cyedgebendeditingDistances')});

                modelManager.changeModelElementGroupAttribute("bendPoints", modelElList, cyId,paramList,  "me");

            }

            else if(actionName === "batch"){
                res.forEach(function(arg){
                    console.log(arg.name);
                   console.log(arg.param);
                    if(arg.name === "thinBorder" || arg.name === 'thickenBorder'){
                        var modelElList = [];
                        var paramList = [];
                        arg.param.forEach(function (ele) {
                            //var ele = param.ele;

                            modelElList.push({id: ele.id(), isNode: ele.isNode()});

                            ele.data("annotationsView", null);
                            paramList.push(ele.data());

                        });
                        modelManager.changeModelElementGroupAttribute("data", modelElList, cyId, paramList,  "me");
                    }
                    else if(arg.name === 'hideAndPerformLayout' || arg.name === 'hide'){
                        var modelElList = [];
                        var paramList = [];
                        var paramListPos = [];
                        var paramListData = [];

                        if(arg.param) {
                            var eles = arg.param.eles;
                            if(!eles) eles = arg.param;

                            eles.forEach(function (ele) {
                                modelElList.push({id: ele.id(), isNode: ele.isNode()});
                                paramList.push("hide");
                                paramListPos.push(ele.position());
                                ele.data("annotationsView", null);
                                paramListData.push(ele.data());

                            });
                        }

                        modelManager.changeModelElementGroupAttribute("data", modelElList, cyId, paramListData,  "me");


                        modelManager.changeModelElementGroupAttribute("visibilityStatus", modelElList, cyId, paramList, "me");
                        modelManager.changeModelElementGroupAttribute("position", modelElList, cyId, paramListPos,   "me");

                    }
                    else if(arg.name === 'showAndPerformLayout' || arg.name === 'show' ){
                        var modelElList = [];
                        var paramList = [];
                        var paramListPos = [];
                        var paramListData = [];


                        if(arg.param) {
                            var eles = arg.param.eles;
                            if(!eles) eles = arg.param;

                            eles.forEach(function (ele) {
                                modelElList.push({id: ele.id(), isNode: ele.isNode()});
                                paramList.push("show");
                                paramListPos.push(ele.position());

                                ele.data("annotationsView", null);
                                paramListData.push(ele.data());

                            });
                        }

                        modelManager.changeModelElementGroupAttribute("data", modelElList, cyId, paramListData,  "me");
                        modelManager.changeModelElementGroupAttribute("visibilityStatus", modelElList,  cyId, paramList,"me");
                        modelManager.changeModelElementGroupAttribute("position", modelElList,  cyId,paramListPos, "me");


                    }
                })


            }
            // else if (actionName === "hide" || actionName === "show") {
            //     var modelElList = [];
            //     var paramList = [];
            //
            //     args.forEach(function (ele) {
            //         modelElList.push({id: ele.id(), isNode: ele.isNode()});
            //         paramList.push(actionName);
            //
            //     });
            //
            //     modelManager.changeModelElementGroupAttribute("visibilityStatus", modelElList, cyId,paramList,  "me");
            // }

            else if (actionName === "highlight") {
                var modelElList = [];
                var paramList = [];


                args.forEach(function (ele) {
                    modelElList.push({id: ele.id(), isNode: ele.isNode()});
                    paramList.push("highlighted");
                });

                modelManager.changeModelElementGroupAttribute("highlightStatus", modelElList, cyId,paramList,   "me");
            }

            else if(actionName === "removeHighlights"){
                var modelElList = [];
                var paramList = [];


                cy.elements().forEach(function (ele) {
                    modelElList.push({id: ele.id(), isNode: ele.isNode()});
                    paramList.push("unhighlighted");

                });

                modelManager.changeModelElementGroupAttribute("highlightStatus", modelElList,  cyId,paramList, "me");

            }
            else if (actionName === "expand" || actionName === "collapse") {

                var modelElList = [];
                var paramList = []
                args.nodes.forEach(function (ele) {
                    modelElList.push({id: ele.id(), isNode: true});
                    paramList.push(actionName);

                });
                modelManager.changeModelElementGroupAttribute("expandCollapseStatus", modelElList,  cyId,paramList, "me");
            }


            else if (actionName === "drag" || actionName === "align") {

                var modelElList = [];
                var paramList = []
                args.nodes.forEach(function (ele) {
                    //var ele = param.ele;
                    modelElList.push({id: ele.id(), isNode: true});
                    paramList.push(ele.position());
                });

                modelManager.changeModelElementGroupAttribute("position", modelElList, cyId,paramList,  "me");
            }

            else if (actionName === "layout") {
                cy.on('layoutstop', function() {

                    console.log('Layout stopped');
                    var modelElList = [];
                    var paramList = [];
                    var paramListData = [];
                    args.eles.forEach(function (ele) {
                        if(ele.isNode()){
                            modelElList.push({id: ele.id(), isNode: true});
                            ele.data("annotationsView", null);
                            paramList.push(ele.position());
                            //paramListData.push(ele.data());
                        }
                    });

                    modelManager.changeModelElementGroupAttribute("position", modelElList, cyId, paramList,  "me");
                    // modelManager.changeModelElementGroupAttribute("data", modelElList,  cyId,paramListData, "me"); //bounding boxes may change
                });
            }


            else if(actionName === "deleteElesSimple" || actionName === "deleteNodesSmart"){


                var nodeList = [];
                var edgeList = [];

                res.forEach(function (el) {
                    if(el.isNode())
                        nodeList.push({id:el.id()});
                    else
                        edgeList.push({id:el.id()});
                });

                modelManager.deleteModelElementGroup({nodes:nodeList,edges: edgeList}, cyId, "me");
            }

            else if (actionName === "addNode") {
                res.eles.data("annotationsView", null);
                var newNode = args.newNode;
                var id = res.eles.id();
                var param = {position: {x: newNode.x, y: newNode.y}, data:{class: newNode.class, parent: newNode.parent}};
                //Add to the graph first
                modelManager.addModelNode(id,  cyId, param, "me");
                //assign other node properties-- css and data
                modelManager.initModelNode(res.eles[0],  cyId, "me", true);

            }

            else if(actionName === "addEdge"){

                var newEdge = args.newEdge;
                var id = res.eles.id();
                //var param = { source: newEdge.source, target:newEdge.target, class: newEdge.class};
                var param = {data:{ source: newEdge.source, target:newEdge.target, class: newEdge.class}};
                //Add to the graph first
                modelManager.addModelEdge(id,  cyId,param, "me");
                //assign other edge properties-- css and data
                modelManager.initModelEdge(res.eles[0],  cyId,"me", true);

            }

            else if(actionName === "paste"){
                res.forEach(function(el){ //first add nodes
                    if(el.isNode()){
                     //   var param = {x: el.position("x"), y: el.position("y"), class: el.data("class")};

                        el.data("annotationsView", null);
                        var param = {position: {x: el.position("x"), y: el.position("y")}, data:el.data()};

                        modelManager.addModelNode(el.id(),  cyId,param, "me");

                        modelManager.initModelNode(el,  cyId, "me", true);
                    }
                });

                res.forEach(function(el){ //first add nodes
                    if(el.isEdge()){
                        var param = { source: el.data("source"), target:el.data("target"), class: el.data("class")};
                        modelManager.addModelEdge(el.id(),  cyId,param, "me");
                        modelManager.initModelEdge(el,  cyId,"me", true);
                    }
                });

            }
            else if(actionName === "changeParent"){
                var modelElList = [];
                var modelNodeList = [];
                var paramListData = [];
                var paramListPosition = [];
                res.movedEles.forEach(function (ele) {
                    //var ele = param.ele;

                    modelElList.push({id: ele.id(), isNode: ele.isNode()});
                    ele.data("annotationsView", null);
                    paramListData.push(ele.data());
                    paramListPosition.push(ele.position());

                });

                res.movedEles.forEach(function (ele) {
                    //var ele = param.ele;

                    if(ele.isNode()) {
                        modelNodeList.push({id: ele.id(), isNode: ele.isNode()});
                        paramListPosition.push(ele.position());
                    }

                });

                modelManager.changeModelElementGroupAttribute("data", modelElList,  cyId,paramListData, "me");
                modelManager.changeModelElementGroupAttribute("position", modelNodeList,  cyId,paramListPosition, "me");


            }
            else if(actionName === "createCompoundForGivenNodes"){
                let paramListData = [];
                let paramListPosition = [];
                let modelElList = [];
                let modelNodeList = [];


                //Last element is the compound, skip it and add the children
                for(var i = 0; i < res.newEles.length - 1; i++){
                    var ele = res.newEles[i];

                    if(ele.isNode()) {
                        modelElList.push({id: ele.id(), isNode: true});
                        ele.data("annotationsView", null);
                        paramListData.push(ele.data()); //includes parent information
                    }
                }

                var compoundId = res.newEles[0].data("parent");
                var compound = cy.getElementById(compoundId);


                var compoundAtts = {position:{x: compound.position("x"), y: compound.position("y")}, data:compound.data()};

                modelManager.addModelCompound(compound.id(), cyId, compoundAtts, modelElList,paramListData, "me" ); //handles data field update

                //assign other node properties-- css and data

            }
        });

        cy.on("mouseup", "node", function () {
            modelManager.unselectModelNode(this, cyId, "me");
        });


        cy.on('select', 'node', function (event) { //Necessary for multiple selections
            //console.log(this.id()); //TODO delete later
            modelManager.selectModelNode(this,   cyId,userId, "me");

        });

        cy.on('unselect', 'node', function () { //causes sync problems in delete op
            modelManager.unselectModelNode(this,  cyId,"me");
        });
        cy.on('grab', 'node', function (event) { //Also works as 'select'
            modelManager.selectModelNode(this,  cyId,userId, "me");
        });

        cy.on('select', 'edge', function (event) {
            //console.log(this.id()); //TODO delete later
            modelManager.selectModelEdge(this,  cyId,userId, "me");

        });

        cy.on('unselect', 'edge', function (event) {
            modelManager.unselectModelEdge(this,  cyId,"me");
        });

    });




}

