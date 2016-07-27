
module.exports.SBGNContainer = function( el,  cytoscapeJsGraph, syncManager) {

    var addRemoveUtilities = require('../../../src/utilities/add-remove-utilities.js');
    //var expandCollapseUtilities = require('../../../src/utilities/expand-collapse-utilities.js')();
   // var undoRedoActions = require('./register-undo-redo-actions.js');

    var bioGeneView = require('./biogene-info.js');

    var nodeLabelChanged = false;
    var prevNode;

    var self = this;



    //notifications
    var notyModel = {layout: "bottomLeft", timeout: 8000, text: "Right click on a gene to see its details!"};

    noty(notyModel);


    var container = $(el);
    var positionMap = {};


    //add position information to data for preset layout and initialize derbyjs model
    for (var i = 0; i < cytoscapeJsGraph.nodes.length; i++) {
        var id = cytoscapeJsGraph.nodes[i].data.id;
        var xPos = cytoscapeJsGraph.nodes[i].data.sbgnbbox.x;
        var yPos = cytoscapeJsGraph.nodes[i].data.sbgnbbox.y;
        positionMap[id] = {'x': xPos, 'y': yPos};
    }


    var cyOptions = {
        elements: cytoscapeJsGraph,
        style: sbgnStyleSheet,
        layout: {
            name: 'preset',
            positions: positionMap
        },
        showOverlay: false,
        minZoom: 0.125,
        maxZoom: 16,
        boxSelectionEnabled: true,
        motionBlur: true,
        wheelSensitivity: 0.1,

        ready: function () {

            var socket = io();
            window.cy = this;

        //    undoRedoActions.registerUndoRedoActions();

            cy.expandCollapse(getExpandCollapseOptions());

            cy.edgeBendEditing({
                // this function specifies the positions of bend points
                bendPositionsFunction: function(ele) {
                    return ele.data('bendPointPositions');
                },
                // whether the bend editing operations are undoable (requires cytoscape-undo-redo.js)
                undoable: true
            });

            cy.clipboard({
                clipboardSize: 5, // Size of clipboard. 0 means unlimited. If size is exceeded, first added item in clipboard will be removed.
                shortcuts: {
                    enabled: true, // Whether keyboard shortcuts are enabled
                    undoable: true // and if undoRedo extension exists
                }
            });

            cy.viewUtilities({
                node: {
                    highlighted: {}, // styles for when nodes are highlighted.
                    unhighlighted: { // styles for when nodes are unhighlighted.
                        'border-opacity': 0.3,
                        'text-opacity': 0.3,
                        'background-opacity': 0.3
                    },
                    hidden: {
                        'display': 'none'
                    }
                },
                edge: {
                    highlighted: {}, // styles for when edges are highlighted.
                    unhighlighted: { // styles for when edges are unhighlighted.
                        'opacity': 0.3,
                        'text-opacity': 0.3,
                        'background-opacity': 0.3
                    },
                    hidden: {
                        'display': 'none'
                    }
                }
            });



            var edges = cy.edges();
            var nodes = cy.nodes();
            //
            // for (var i = 0; i < edges.length; i++) {
            //     var edge = edges[i];
            //     var result = sbgnBendPointUtilities.convertToRelativeBendPositions(edge);
            //
            //     if(result.distances.length > 0){
            //         edge.data('weights', result.weights);
            //         edge.data('distances', result.distances);
            //     }
            // }

       //     expandCollapseUtilities.refreshPaddings();

            refreshPaddings();
            initilizeUnselectedDataOfElements();

            //
            // for (var i = 0; i < nodes.length; i++) {
            //     var node = nodes[i];
            //
            //
            //     node.data("borderColor", node.css('border-color'));
            //     node.addClass('changeBorderColor');
            //
            //     node.data("backgroundOpacity", node.css('background-opacity'));
            //     node.addClass('changeBackgroundOpacity');
            // }
            //
            // for (var i = 0; i < edges.length; i++) {
            //     var edge = edges[i];
            //     edge.data("lineColor", edge.css('line-color'));
            //     edge.addClass('changeLineColor');
            // }
            //
            // cy.one('layoutstop', function(){
            //
            //     cy.nodes().forEach(function(node){
            //         var stateAndInfos = node._private.data.sbgnstatesandinfos;
            //         if(stateAndInfos)
            //             relocateStateAndInfos(stateAndInfos);
            //
            //     });
            //
            // });

       //     cy.nodes('[sbgnclass="complex"],[sbgnclass="compartment"],[sbgnclass="submap"]').data('expanded-collapsed', 'expanded');


            var paramResize;
            cy.noderesize({
                handleColor: '#000000', // the colour of the handle and the line drawn from it
                hoverDelay: 1, // time spend over a target node before it is considered a target selection
                enabled: true, // whether to start the plugin in the enabled state
                minNodeWidth: 30,
                minNodeHeight: 30,
                triangleSize: 20,
                lines: 3,
                padding: 5,
                start: function (sourceNode) {

                    // fired when noderesize interaction starts (drag on handle)
                    paramResize = {
                        ele: sourceNode,
                        initialWidth: sourceNode.width(),//keep this for undo operations
                        initialHeight: sourceNode.height(),
                        width: sourceNode.width(),
                        height: sourceNode.height(),
                        sync: true //synchronize with other users
                    }


                },
                complete: function (sourceNode, targetNodes, addedEntities) {
                    // fired when noderesize is done and entities are added


                },
                stop: function (sourceNode) {
                    paramResize.width = sourceNode.width();
                    paramResize.height = sourceNode.height();

                    syncManager.resizeNode(paramResize);

                  //  cy.undoRedo().do("resizeNode", paramResize);


                }
            });

            //For adding edges interactively
            cy.edgehandles({
               // preview: true,
                complete: function (sourceNode, targetNodes, addedEntities) {
                    // fired when edgehandles is done and entities are added
                    var param = {};
                    var source = sourceNode.id();
                    var target = targetNodes[0].id();
                    var sourceClass = sourceNode.data('sbgnclass');
                    var targetClass = targetNodes[0].data('sbgnclass');
                    var sbgnclass = modeHandler.elementsHTMLNameToName[modeHandler.selectedEdgeType];
                    if (sbgnclass == 'consumption' || sbgnclass == 'modulation'
                        || sbgnclass == 'stimulation' || sbgnclass == 'catalysis'
                        || sbgnclass == 'inhibition' || sbgnclass == 'necessary stimulation') {
                        if (!isEPNClass(sourceClass) || !isPNClass(targetClass) || !isLogicalOperator(sourceClass) || !isLogicalOperator(targetClass)) { //funda
                            if (isPNClass(sourceClass) && (isEPNClass(targetClass) || isLogicalOperator(targetClass))) {
                                //If just the direction is not valid reverse the direction
                                var temp = source;
                                source = target;
                                target = temp;
                            }
                            else {
                                return;
                            }
                        }
                    }
                    else if (sbgnclass == 'production') {
                        if (!isPNClass(sourceClass) || !isEPNClass(targetClass)|| !isLogicalOperator(sourceClass) || !isLogicalOperator(targetClass)) {
                            if (isEPNClass(sourceClass) && isPNClass(targetClass) || isLogicalOperator(sourceClass)) {
                                //If just the direction is not valid reverse the direction
                                var temp = source;
                                source = target;
                                target = temp;
                            }
                            else {
                                return;
                            }
                        }
                    }
                    /*else if (sbgnclass == 'logic arc') { //FUNDA
                        if (!isEPNClass(sourceClass) || !isLogicalOperator(targetClass)) {
                            if (isLogicalOperator(sourceClass) && isEPNClass(targetClass)) {
                                //if (isLogicalOperator(sourceClass) || isEPNClass(sourceClass) ) {
                                //If just the direction is not valid reverse the direction
                                var temp = source;
                                source = target;
                                target = temp;
                            }
                            else {
                                return;
                            }
                        }

                    }*/
                    else if (sbgnclass == 'equivalence arc') {
                        if (!(isEPNClass(sourceClass) && convenientToEquivalence(targetClass))
                            && !(isEPNClass(targetClass) && convenientToEquivalence(sourceClass))) {
                            return;
                        }
                    }

                    param = {
                        source: source,
                        target: target,
                        sbgnclass: sbgnclass,
                        sync:true
                    };
                    syncManager.addEdge(param);

                 //   cy.undoRedo().do("addEdge", param);
                    modeHandler.setSelectionMode();
                    var edge = cy.edges()[cy.edges().length -1].select();



                }
            });



            try { //Todo FUNDA : gives error????
               cy.edgehandles('drawoff');
            }
            catch(err){
               console.log(err);
            }

       //     expandCollapseUtilities.initCollapsedNodes();

            var panProps = ({
                fitPadding: 10,
                fitSelector: ':visible',
                animateOnFit: function(){
                    return sbgnStyleRules['animate-on-drawing-changes'];
                },
                animateOnZoom: function(){
                    return sbgnStyleRules['animate-on-drawing-changes'];
                }
            });

          //  container.cytoscapePanzoom(panProps); //funda

            cy.gridGuide({
                drawGrid: sbgnStyleRules['show-grid'],
                snapToGrid: sbgnStyleRules['snap-to-grid'],
                discreteDrag: sbgnStyleRules['discrete-drag'],
                gridSpacing: sbgnStyleRules['grid-size'],
                resize: sbgnStyleRules['auto-resize-nodes'],
                guidelines: sbgnStyleRules['show-alignment-guidelines'],
                guidelinesTolerance: sbgnStyleRules['guideline-tolerance'],
                guidelinesStyle: {
                    strokeStyle: sbgnStyleRules['guideline-color']
                }
            });

        var lastMouseDownNodeInfo = null;



            //Listen events
            cy.on("beforeCollapse", "node", function (event) {
                var node = this;
                //The children info of complex nodes should be shown when they are collapsed
                if (node._private.data.sbgnclass == "complex") {
                    //The node is being collapsed store infolabel to use it later
                    var infoLabel = getInfoLabel(node);
                    node._private.data.infoLabel = infoLabel;
                }

                var edges = cy.edges();

                // remove bend points before collapse
                for (var i = 0; i < edges.length; i++) {
                    var edge = edges[i];
                    if(edge.hasClass('edgebendediting-hasbendpoints')) {
                        edge.removeClass('edgebendediting-hasbendpoints');
                        delete edge._private.classes['edgebendediting-hasbendpoints'];
                    }
                }

                edges.scratch('cyedgebendeditingWeights', []);
                edges.scratch('cyedgebendeditingDistances', []);

            });

            cy.on("afterCollapse", "node", function (event) {
                var node = this;
                refreshPaddings();

                if (node._private.data.sbgnclass == "complex") {
                    node.addClass('changeContent');
                }


                syncManager.collapseNode({node:node, sync:true});
            });

            cy.on("beforeExpand", "node", function (event) {
                var node = this;
                node.removeData("infoLabel");
            });

            cy.on("afterExpand", "node", function (event) {
                var node = this;
                cy.nodes().updateCompoundBounds();

                //Don't show children info when the complex node is expanded
                if (node._private.data.sbgnclass == "complex") {
                    node.removeStyle('content');
                }

                refreshPaddings();
            });
            cy.on("mousedown", "node", function () {
                

                var self = this;
                if (modeHandler.mode == 'selection-mode' && window.ctrlKeyDown) {

                    enableDragAndDropMode();
                    window.nodeToDragAndDrop = self;
                }
                else {
                    lastMouseDownNodeInfo = {};
                    lastMouseDownNodeInfo.lastMouseDownPosition = {
                        x: this.position("x"),
                        y: this.position("y")
                    };
                    lastMouseDownNodeInfo.node = this;
                }

            });

            cy.on("mouseup", function (event) {
                var self = event.cyTarget;
                if (window.dragAndDropModeEnabled) {
                    var nodesData = getNodesData();
                    nodesData.firstTime = true;
                    var newParent;
                    if (self != cy) {
                        newParent = self;
                    }
                    var node = window.nodeToDragAndDrop;

                    if (newParent && self.data("sbgnclass") != "complex" && self.data("sbgnclass") != "compartment") {
                        return;
                    }

                    if (newParent && self.data("sbgnclass") == "complex" && !isEPNClass(node.data("sbgnclass"))) {
                        return;
                    }

           //funda         disableDragAndDropMode();
                    if (node.parent()[0] == newParent || node._private.data.parent == node.id()) {
                        return;
                    }
                    var param = {
                        newParent: newParent,
                        ele: node,
                        id: node.id(),
                        nodesData: nodesData,
                        posX: event.cyPosition.x,
                        posY: event.cyPosition.y,
                        sync: true,
                    };
                  //  cy.undoRedo().do("changeParent", param);
                   syncManager.changeParent(param);
                }
            });

            //cy.on("mouseup", "node", function () {
            cy.on("mouseup", "node", function () {
                if (window.dragAndDropModeEnabled) {
                    return;
                }

                if (lastMouseDownNodeInfo == null) {
                    return;
                }


                var node = lastMouseDownNodeInfo.node;
                var lastMouseDownPosition = lastMouseDownNodeInfo.lastMouseDownPosition;
                var mouseUpPosition = {
                    x: node.position("x"),
                    y: node.position("y")
                };
                if (mouseUpPosition.x != lastMouseDownPosition.x ||
                    mouseUpPosition.y != lastMouseDownPosition.y) {
                    var positionDiff = {
                        x: mouseUpPosition.x - lastMouseDownPosition.x,
                        y: mouseUpPosition.y - lastMouseDownPosition.y
                    };

                    var nodes;
                    if (node.selected()) {
                        nodes = cy.nodes(":visible").filter(":selected");
                    }
                    else {
                        nodes = [];
                        nodes.push(node);
                    }

                    syncManager.moveNodesConditionally(nodes);


                    lastMouseDownNodeInfo = null;


                   syncManager.unselectNode(this);


                }
            });



            cy.on('select', 'node', function(event) { //Necessary for multiple selections
                syncManager.selectNode(this);

            });
            cy.on('unselect', 'node', function() { //causes sync problems in delete op

                syncManager.unselectNode(this);

            });
            cy.on('grab', 'node', function(event) { //Also works as 'select'


                syncManager.selectNode(this);
            });

            cy.on('select', 'edge', function(event) {
                syncManager.selectEdge(this);

            });

            cy.on('unselect', 'edge', function(event) {
                syncManager.unselectEdge(this);
            });


            cy.on('mouseover', 'node', function (event) {
                var node = this;
                if (modeHandler.mode != "selection-mode") {
                    node.mouseover = false;
                }
                else if (!node.mouseover) {
                    node.mouseover = true;
                    //make preset layout to redraw the nodes
                    cy.forceRender();
                }

                $(".qtip").remove();

                if (event.originalEvent.shiftKey)
                    return;

                node.qtipTimeOutFcn = setTimeout(function () {
                    nodeQtipFunction(node);
                }, 1000);
            });

            cy.on('mouseout', 'node', function (event) {

                if (this.qtipTimeOutFcn != null) {
                    clearTimeout(this.qtipTimeOutFcn);
                    this.qtipTimeOutFcn = null;
                }
                this.mouseover = false;           //make preset layout to redraw the nodes
                cy.forceRender();
            });



            cy.on('cxttap', 'node', function (event) { //funda not working on Chrome!!!!!
                var node = this;
                $(".qtip").remove();

                var geneClass = node._private.data.sbgnclass;
                if (geneClass != 'macromolecule' && geneClass != 'nucleic acid feature' &&
                    geneClass != 'unspecified entity')
                    return;


                socket.emit('BioGeneQuery',  {
                    query: node._private.data.sbgnlabel, //gene name
                    org: "human",
                    format: "json"
                });
                syncManager.modelManager.updateHistory({opName:"query", opTarget:"element", elType: "node", elId:node.id(), param: node._private.data.sbgnlabel});

                var queryResult = "";
                var p1 = new Promise(function (resolve, reject) {
                    socket.on("BioGeneResult", function (val) {
                        queryResult = JSON.parse(val);
                        resolve("success");

                    });
                });

                cy.$(('#' + node.id())).qtip({
                    content: {
                        text: function (event, api) {

                            p1.then(function (content) {
                               if (queryResult.count > 0) {
                                   var info = (new bioGeneView(queryResult.geneInfo[0])).render();
                                    var html = $('#biogene-container').html();
                                    api.set('content.text', html);
                               }
                                else {
                                    api.set('content.text', "No additional information available &#013; for the selected node!");
                                }

                            }), function (xhr, status, error) {
                                api.set('content.text', "Error retrieving data: " + error);
                            };
                            api.set('content.title', node._private.data.sbgnlabel);

                            return _.template($("#loading-small-template").html());

                        }
                    },
                    show: {
                        ready: true
                    },
                    position: {
                        my: 'top center',
                        at: 'bottom right',
                        adjust: {
                            cyViewport: true
                        },
                        effect: false
                    },
                    style: {
                        classes: 'qtip-bootstrap',
                        tip: {
                            width: 16,
                            height: 8
                        }
                    }
                });
            });

            var cancelSelection;
            var selectAgain;
            cy.on('select', 'node', function (event) {


                if (cancelSelection) {
                    this.unselect();
                    cancelSelection = null;
                    selectAgain.select();
                    selectAgain = null;
                }
            });

            cy.on('select', function (event) {
                require('./sample-app-inspector-functions.js').handleSBGNInspector(syncManager);
            });

            cy.on('unselect', function (event) {
                require('./sample-app-inspector-functions.js').handleSBGNInspector(syncManager);
            });


            cy.on('tap', function (event) {
                $("#node-label-textbox").blur();
                $('.ctx-bend-operation').css('display', 'none');

                //label change synchronization is done in menu-functions
                if(nodeLabelChanged){

                    nodeLabelChanged = false;
                }

              //??  cy.nodes(":selected").length;
                if (modeHandler.mode == "add-node-mode") {
                    var cyPosX = event.cyPosition.x;
                    var cyPosY = event.cyPosition.y;
                    var sbgnclass = modeHandler.elementsHTMLNameToName[modeHandler.selectedNodeType];
                    var param = {
                        sync: true,
                        x: cyPosX,
                        y: cyPosY,
                        sbgnclass: sbgnclass
                    };


                    syncManager.addNode(param);


                    modeHandler.setSelectionMode();
                    cy.nodes()[cy.nodes().length - 1].select();





                }
            });

            var tappedBefore = null;


            cy.on('doubleTap', 'node', function (event) {

                if (modeHandler.mode == 'selection-mode') {

                    var node = this;
                    var containerPos = $(cy.container()).position();
                    var left = containerPos.left + this.renderedPosition().x;
                    left -= $("#node-label-textbox").width() / 2;
                    left = left.toString() + 'px';
                    var top = containerPos.top + this.renderedPosition().y;
                    top -= $("#node-label-textbox").height() / 2;
                    top = top.toString() + 'px';

                    $("#node-label-textbox").css('left', left);
                    $("#node-label-textbox").css('top', top);
                    $("#node-label-textbox").show();
                    var sbgnlabel = this._private.data.sbgnlabel || "";

                    $("#node-label-textbox").attr('value', sbgnlabel);
                    $("#node-label-textbox").data('node', this);
                    $("#node-label-textbox").focus();


                  /*  nodeLabelChanged = true;
                    node.data('sbgnlabel', sbgnlabel);


                    prevNode = node;
*/
                }


            });

            cy.on('tap', 'node', function (event) {

                var node = this;



                var tappedNow = event.cyTarget;
                setTimeout(function () {
                    tappedBefore = null;
                }, 300);
                if (tappedBefore === tappedNow) {
                    tappedNow.trigger('doubleTap');
                    tappedBefore = null;
                } else {
                    tappedBefore = tappedNow;
                }



                /*               //Handle expand-collapse box
                var cyPosX = event.cyPosition.x;
                var cyPosY = event.cyPosition.y;



                if (modeHandler.mode == "selection-mode"
                    && cyPosX >= node._private.data.expandcollapseStartX
                    && cyPosX <= node._private.data.expandcollapseEndX
                    && cyPosY >= node._private.data.expandcollapseStartY
                    && cyPosY <= node._private.data.expandcollapseEndY) {


                    selectAgain = cy.filter(":selected");
                    cancelSelection = true;
                    var expandedOrcollapsed = this.data('expanded-collapsed');

                    var incrementalLayoutAfterExpandCollapse =
                        (sbgnStyleRules['incremental-layout-after-expand-collapse'] == 'true');

                    if (expandedOrcollapsed == 'expanded') {
                        if (incrementalLayoutAfterExpandCollapse)
                            syncManager.collapseNode({node:this, sync: true}); //funda

                        else
                            syncManager.simpleCollapseNode({node:this, sync: true});


                    }
                    else {
                        if (incrementalLayoutAfterExpandCollapse)
                            syncManager.expandNode({node:this, sync: true}); //funda
                        else
                            syncManager.simpleExpandNode({node:this, sync: true});


                    }
                }
                */

                $(".qtip").remove();

                if (event.originalEvent.shiftKey)
                    return;

                if (node.qtipTimeOutFcn != null) {
                    clearTimeout(node.qtipTimeOutFcn);
                    node.qtipTimeOutFcn = null;
                }

                 nodeQtipFunction(node); //shows the full label

            });


            cy.on('cxttap', 'edge', function (event) {
                var edge = this;
                var containerPos = $(cy.container()).position();

                var left = containerPos.left + event.cyRenderedPosition.x;
                left = left.toString() + 'px';

                var top = containerPos.top +  event.cyRenderedPosition.y;
                top = top.toString() + 'px';


                $('.ctx-bend-operation').css('display', 'none');

                var selectedBendIndex = cytoscape.sbgn.getContainingBendShapeIndex(event.cyPosition.x, event.cyPosition.y, edge);
                if(selectedBendIndex == -1){
                    $('#ctx-add-bend-point').css('display', 'block');
                    sbgnBendPointUtilities.currentCtxPos = event.cyPosition;
                    ctxMenu = document.getElementById("ctx-add-bend-point");
                }
                else {
                    $('#ctx-remove-bend-point').css('display', 'block');
                    sbgnBendPointUtilities.currentBendIndex = selectedBendIndex;
                    ctxMenu = document.getElementById("ctx-remove-bend-point");
                }

                ctxMenu.style.display = "block";
                ctxMenu.style.left = left;
                ctxMenu.style.top = top;



                sbgnBendPointUtilities.currentCtxEdge = edge;
            });
            var movedBendIndex;
            var movedBendEdge;
            var moveBendParam;

            cy.on('tapstart', 'edge', function (event) {
                var edge = this;
                movedBendEdge = edge;

                moveBendParam = {
                    edge: edge,
                    weights: edge.data('weights')?[].concat(edge.data('weights')):edge.data('weights'),
                    distances: edge.data('distances')?[].concat(edge.data('distances')):edge.data('distances')
                };

                var cyPosX = event.cyPosition.x;
                var cyPosY = event.cyPosition.y;

                if(edge._private.selected){
                    var index = cytoscape.sbgn.getContainingBendShapeIndex(cyPosX, cyPosY, edge);
                    if(index != -1){
                        movedBendIndex = index;
                        cy.panningEnabled(false);
                        cy.boxSelectionEnabled(false);
                    }
                }
            });

            cy.on('tapdrag', function (event) {
                var edge = movedBendEdge;

                if(movedBendEdge === undefined || movedBendIndex === undefined){
                    return;
                }

                var weights = edge.data('weights');
                var distances = edge.data('distances');

                var relativeBendPosition = sbgnBendPointUtilities.convertToRelativeBendPosition(edge, event.cyPosition);
                weights[movedBendIndex] = relativeBendPosition.weight;
                distances[movedBendIndex] = relativeBendPosition.distance;

                edge.data('weights', weights);
                edge.data('distances', distances);


                //notify others
                //update bendpoint positions
                var bendPointPositions = edge.data('bendPointPositions');
                bendPointPositions[movedBendIndex] = event.cyPosition;

                syncManager.changeStyleData({dataType:'bendPointPositions', data: bendPointPositions, sync:true, modelDataName:'bendPointPositions', ele:edge});
            });

            cy.on('tapend', 'edge', function (event) {
                var edge = movedBendEdge;

                if(moveBendParam !== undefined && edge.data('weights')
                    && edge.data('weights').toString() != moveBendParam.weights.toString()){
                    syncManager.changeBendPoints(moveBendParam);



                }

                movedBendIndex = undefined;
                movedBendEdge = undefined;
                moveBendParam = undefined;

                cy.panningEnabled(true);
                cy.boxSelectionEnabled(true);
            });




        }
    };


    container.html("");
    container.cy(cyOptions);


    return this;
};


var getExpandCollapseOptions = function() {
    return {
        fisheye: function(){
            return sbgnStyleRules['rearrange-after-expand-collapse'];
        },
        animate: function(){
            return sbgnStyleRules['animate-on-drawing-changes'];
        }
    };
};