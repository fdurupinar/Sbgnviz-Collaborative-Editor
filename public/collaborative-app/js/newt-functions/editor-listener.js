/**
 * Author: Funda Durupinar
 * Created by durupina on 2/10/17.
 * Listens and responds to cytoscape events triggered by cytoscape-undo-redo.js
 */



let Mousetrap = require('mousetrap'); //used to listen to keyboard events
let Tippy = require('tippy.js');
let appUtilities = window.appUtilities;
let ModelMergeFunctions = require('../merger/model-merge-functions.js');
let modelMergeFunctions = new ModelMergeFunctions();

/**
 * Listens to editor events and updates the shared model
 * @param {Object} modelManager Model operations handler
 * @param {Object} socket
 * @param {string} userId
 * @param {Object} app Derby.js application
 */
module.exports = function(modelManager, socket, userId, app){

    // get a new mousetrap instance
    let mt = new Mousetrap();

    // jsons for the last copied elements
    let lastCopiedElesJsons;

    // the cy from which some elements are copied last time
    let lastCopiedElesCy;


    // listen to "ctrl/command + m" keyboard event
    mt.bind(["ctrl+m", "command+m"], function () {

        console.log('to perform merge operation here');

        // get the active chise instance
        let chiseInstance = appUtilities.getActiveChiseInstance();

        // get the related cy instance
        let cy = chiseInstance.getCy();

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
       modelManager.initModel(cy.nodes(), cy.edges(), appUtilities.getActiveNetworkId());

        // setTimeout(function(){
        //         cy.elements().forEach(function(ele){
        //         ele.data("annotationsView", null);
        //         ele._private.data.annotationsView = null;
        //     });
        // },1000);

        setTimeout(function () {
            appUtilities.triggerLayout(cy, true);
        }, 1000);


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




    $(document).on("closeNetwork", function (e, cyId) {
        console.log("close cy is called for " + cyId);

        modelManager.closeCy(cyId, "me");
    });


    $("#file-input").change(function () {
        if ($(this).val() != "") {
            let file = this.files[0];

            let extension = file.name.split('.').pop().toLowerCase();

            if (extension === "owl") {

                let reader = new FileReader();

                reader.onload = function () {

                    socket.emit('BioPAXRequest', this.result, "sbgn", function (sbgnData) { //convert to sbgn
                        console.log(sbgnData);
                        appUtilities.getActiveSbgnvizInstance().loadSBGNMLText(sbgnData.graph);
                    });
                };
                reader.readAsText(file, 'UTF-8');
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
            modelManager.initModel(appUtilities.getActiveCy().nodes(), appUtilities.getActiveCy().edges(), appUtilities.getActiveNetworkId(),"me");



        }, 1000);

        });

    $("#sif-file-input").change(function () {
        if ($(this).val() != "") {
            let file = this.files[0];

            let chiseInstance = appUtilities.getActiveChiseInstance();

                // use cy instance assocated with chise instance
            let cy = appUtilities.getActiveCy();



                let loadFcn = function() {
                    let layoutBy = function() {
                        appUtilities.triggerLayout( cy, true );

                    };
                    chiseInstance.loadSIFFile(file, layoutBy, null);

                };

                loadFcn();

                $(this).val("");
        }


        setTimeout(function () {
            modelManager.initModel(appUtilities.getActiveCy().nodes(), appUtilities.getActiveCy().edges(),
                appUtilities.getActiveNetworkId(),  "me");


        }, 1000);

    });


    $(document).on("createNewNetwork", function (e, cy, cyId) {

        console.log("create new network with id: " + cyId);
        modelManager.openCy(cyId, "me");



        cy.on("afterDo afterRedo", function (event, actionName, args, res) {

            let modelElList = [];
            let paramList = [];
            let paramListPos = [];
            let paramListData = [];
            let modelNodeList = [];
            let param;

            console.log(cyId);

            console.log(actionName);
            console.log(args);
            console.log(res);



            if (actionName === "changeData" || actionName === "changeFontProperties" ) {

                modelElList = [];
                paramList = [];
                args.eles.forEach(function (ele) {

                    modelElList.push({id: ele.id(), isNode: ele.isNode()});

                    ele.data("annotationsView", null);
                    paramList.push(ele.data());

                });
                modelManager.changeModelElementGroupAttribute("data", modelElList, cyId, paramList,  "me");

            }

            else if (actionName === "changeNodeLabel" ||actionName === "resizeNodes"||
                actionName === "addStateOrInfoBox" || actionName === "setMultimerStatus" ||
                actionName === "setCloneMarkerStatus" || actionName === "changeStateOrInfoBox" ||
                actionName === "removeStateOrInfoBox" || actionName === "setPortsOrdering") {

                modelElList = [];
                paramList = [];
                args.nodes.forEach(function (ele) {

                    modelElList.push({id: ele.id(), isNode: true});

                    ele.data("annotationsView", null);
                    paramList.push(ele.data());

                });
                modelManager.changeModelElementGroupAttribute("data", modelElList,  cyId,paramList,  "me");


                app.informTripsAboutModelChange(cyId);
                

            }
            else if(actionName === "resize"){

                modelElList = [{id: res.node.id(), isNode: true}];
                paramList = [res.node.data()];

                res.node.data("annotationsView", null);

                modelManager.changeModelElementGroupAttribute("data", modelElList, cyId,paramList,  "me");
            }

            else if (actionName === "changeBendPoints") {

                modelElList = [];
                paramList = [];


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
                        modelElList = [];
                        paramList = [];
                        arg.param.forEach(function (ele) {
                            //let ele = param.ele;

                            modelElList.push({id: ele.id(), isNode: ele.isNode()});

                            ele.data("annotationsView", null);
                            paramList.push(ele.data());

                        });
                        modelManager.changeModelElementGroupAttribute("data", modelElList, cyId, paramList,  "me");
                    }
                    else if(arg.name === 'hideAndPerformLayout' || arg.name === 'hide'){
                        modelElList = [];
                        paramList = [];
                        paramListPos = [];
                        paramListData = [];

                        if(arg.param) {
                            let eles = arg.param.eles;
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
                        modelElList = [];
                        paramList = [];



                        if(arg.param) {
                            let eles = arg.param.eles;
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
            //     let modelElList = [];
            //     let paramList = [];
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
                modelElList = [];
                paramList = [];


                args.forEach(function (ele) {
                    modelElList.push({id: ele.id(), isNode: ele.isNode()});
                    paramList.push("highlighted");
                });

                modelManager.changeModelElementGroupAttribute("highlightStatus", modelElList, cyId,paramList,   "me");
            }

            else if(actionName === "removeHighlights"){
                modelElList = [];
                paramList = [];


                cy.elements().forEach(function (ele) {
                    modelElList.push({id: ele.id(), isNode: ele.isNode()});
                    paramList.push("unhighlighted");

                });

                modelManager.changeModelElementGroupAttribute("highlightStatus", modelElList,  cyId,paramList, "me");

            }
            else if (actionName === "expand" || actionName === "collapse") {

                modelElList = [];
                paramList = [];
                args.nodes.forEach(function (ele) {
                    modelElList.push({id: ele.id(), isNode: true});
                    paramList.push(actionName);

                });
                modelManager.changeModelElementGroupAttribute("expandCollapseStatus", modelElList,  cyId,paramList, "me");
            }


            else if (actionName === "drag" || actionName === "align") {

                modelElList = [];
                paramList = [];
                args.nodes.forEach(function (ele) {
                    //let ele = param.ele;
                    modelElList.push({id: ele.id(), isNode: true});
                    paramList.push(ele.position());
                });

                modelManager.changeModelElementGroupAttribute("position", modelElList, cyId,paramList,  "me");
            }

            else if (actionName === "layout") {
                cy.on('layoutstop', function() {

                    console.log('Layout stopped');
                    modelElList = [];
                    paramList = [];


                    args.eles.forEach(function (ele) {
                        if(ele.isNode()){ //check if element is in the model already, otherwise don't try to add it
                            // if(modelManager.isNodeInModel(cyId, ele.id()){
                                modelElList.push({id: ele.id(), isNode: true});
                                ele.data("annotationsView", null);
                                paramList.push(ele.position());
                            }
                        // }
                    });

                    modelManager.changeModelElementGroupAttribute("position", modelElList, cyId, paramList,  "me");

                });
            }


            else if(actionName === "deleteElesSimple" || actionName === "deleteNodesSmart"){


                let nodeList = [];
                let edgeList = [];

                res.forEach(function (el) {
                    if(el.isNode())
                        nodeList.push({id:el.id()});
                    else
                        edgeList.push({id:el.id()});
                });

                modelManager.deleteModelElementGroup({nodes:nodeList,edges: edgeList}, cyId, "me");

                app.informTripsAboutModelChange(cyId);
            }

            else if (actionName === "addNode") {

                res.eles.data("annotationsView", null);
                let newNode = args.newNode;
                let id = res.eles.id();
                param = {position: {x: newNode.x, y: newNode.y}, data:{class: newNode.class, parent: newNode.parent}};
                //Add to the graph first
                modelManager.addModelNode(id,  cyId, param, "me");
                //assign other node properties-- css and data
                modelManager.initModelNode(res.eles[0],  cyId, "me", true);

                app.informTripsAboutModelChange(cyId);

            }

            else if(actionName === "addEdge"){

                let newEdge = args.newEdge;
                param = {data:{ source: newEdge.source, target:newEdge.target, class: newEdge.class}};
                //Add to the graph first
                modelManager.addModelEdge(res.eles.id(),  cyId,param, "me");
                //assign other edge properties-- css and data
                modelManager.initModelEdge(res.eles[0],  cyId,"me", true);

                app.informTripsAboutModelChange(cyId);

            }

            else if(actionName === "paste"){
                res.forEach(function(el){ //first add nodes
                    if(el.isNode()){

                        el.data("annotationsView", null);
                        param = {position: {x: el.position("x"), y: el.position("y")}, data:el.data()};

                        modelManager.addModelNode(el.id(),  cyId, param, "me");

                        modelManager.initModelNode(el,  cyId, "me", true);


                    }
                });

                res.forEach(function(el){ //first add nodes
                    if(el.isEdge()){
                        param = { source: el.data("source"), target:el.data("target"), class: el.data("class")};
                        modelManager.addModelEdge(el.id(),  cyId,param, "me");
                        modelManager.initModelEdge(el,  cyId,"me", true);
                    }
                });

                app.informTripsAboutModelChange(cyId);

            }
            else if(actionName === "changeParent"){
                modelElList = [];
                paramList = [];
                paramListData = [];
                paramListPos = [];

                modelNodeList = [];

                res.movedEles.forEach(function (ele) {

                    modelElList.push({id: ele.id(), isNode: ele.isNode()});
                    ele.data("annotationsView", null);
                    paramListData.push(ele.data());
                    paramListPos.push(ele.position());

                });

                res.movedEles.forEach(function (ele) {
                    //let ele = param.ele;

                    if(ele.isNode()) {
                        modelNodeList.push({id: ele.id(), isNode: ele.isNode()});
                        paramListPos.push(ele.position());
                    }

                });

                modelManager.changeModelElementGroupAttribute("data", modelElList, cyId, paramListData, "me");
                modelManager.changeModelElementGroupAttribute("position", modelNodeList, cyId, paramListPos, "me");
                app.informTripsAboutModelChange(cyId);

            }
            else if(actionName === "createCompoundForGivenNodes"){
                paramListData = [];
                modelElList = [];
                modelNodeList = [];


                //Last element is the compound, skip it and add the children
                for(let i = 0; i < res.newEles.length - 1; i++){
                    let ele = res.newEles[i];

                    if(ele.isNode()) {
                        modelElList.push({id: ele.id(), isNode: true});
                        ele.data("annotationsView", null);
                        paramListData.push(ele.data()); //includes parent information
                    }
                }

                let compoundId = res.newEles[0].data("parent");
                let compound = cy.getElementById(compoundId);


                let compoundAtts = {position:{x: compound.position("x"), y: compound.position("y")}, data:compound.data()};

                modelManager.addModelCompound(compound.id(), cyId, compoundAtts, modelElList, paramListData, "me" ); //handles data field update

                //assign other node properties-- css and data
                app.informTripsAboutModelChange(cyId);
            }
        });

        cy.on("mouseup", "node", function () {
            modelManager.unselectModelNode(this, cyId, "me");
        });


        cy.on("cxttap", "edge", function (event) {
            showTooltip(event, cy);
        });


        cy.on('select', 'node', function () { //Necessary for multiple selections
            modelManager.selectModelNode(this,   cyId,userId, "me");

        });

        cy.on('unselect', 'node', function () { //causes sync problems in delete op
            modelManager.unselectModelNode(this,  cyId,"me");
        });
        cy.on('grab', 'node', function () { //Also works as 'select'
            modelManager.selectModelNode(this,  cyId,userId, "me");
        });

        cy.on('select', 'edge', function () {
            modelManager.selectModelEdge(this,  cyId,userId, "me");

        });

        cy.on('unselect', 'edge', function () {
            modelManager.unselectModelEdge(this,  cyId,"me");
        });

    });


    /**
     * Tooltip function for showing edge type information
     * @param {Event} event
     */
    function showTooltip(event) {

        let edge = event.target || event.cyTarget;
        let tooltipContent = event.target.data().class;
        let ref = edge.popperRef();

        let tippy = Tippy.one(ref, {
            content: (() => {
                let content = document.createElement('div');

                content.style['font-size'] = '12px'; //make it independent of the zoom amount
                content.innerHTML = tooltipContent;

                return content;
            })(),
            trigger: 'manual',
            hideOnClick: true,
            arrow: true,
            placement: "top",
            duration: 200,
            size: 'large',
        });


        setTimeout( () => tippy.show(), 0 );
    }

}


