//FUNDA WARNING
//Moved the file here as it triggers cy functions
////

;(function () {
    'use strict';

// registers the extension on a cytoscape lib ref
    var register = function (cytoscape) {

        if (!cytoscape) {
            return;
        } // can't register if cytoscape unspecified

        var cy;
        var actions = {};
        var undoStack = [];
        var redoStack = [];

        var _instance = {
            options: {
                isDebug: false, // Debug mode for console messages
                actions: {},// actions to be added
                undoableDrag: true, // Whether dragging nodes are undoable
                keyboardShortcuts: {
                    ctrl_z: true, // undo
                    ctrl_y: true, // redo
                    ctrl_shift_z: false // redo
                },
                beforeUndo: function () { // callback before undo is triggered.

                },
                afterUndo: function () { // callback after undo is triggered.

                },
                beforeRedo: function () { // callback before redo is triggered.

                },
                afterRedo: function () { // callback after redo is triggered.

                },
                ready: function () {

                }
            }
        };


        // design implementation
        cytoscape("core", "undoRedo", function (options, dontInit) {
            cy = this;



            function getScratch() {
                if (!cy.scratch("_undoRedo")) {
                    cy.scratch("_undoRedo", { });

                }
                return cy.scratch("_undoRedo");
            }

            if (options) {
                for (var key in options)
                    if (_instance.options.hasOwnProperty(key))
                        _instance.options[key] = options[key];

                if (options.actions)
                    for (var key in options.actions)
                        actions[key] = options.actions[key];


            }

            if (!getScratch().isInitialized && !dontInit) {
                if (_instance.options.keyboardShortcuts && !getScratch().isKeyboardShortcutsSet) {
                    var sh = _instance.options.keyboardShortcuts;
                    setKeyboardShortcuts(sh.ctrl_z, sh.ctrl_y, sh.ctrl_shift_z);
                    getScratch().isKeyboardShortcutsSet = true;

                } else
                    setKeyboardShortcuts(false, false, false);
                var defActions = defaultActions();
                for (var key in defActions)
                    actions[key] = defActions[key];


                setDragUndo(_instance.options.undoableDrag);
                getScratch().isInitialized = true;
            }

            _instance.options.ready();
            return _instance;

        });

        // Undo last action
        _instance.undo = function () {
            if (!this.isUndoStackEmpty()) {

                var action = undoStack.pop();
                cy.trigger("beforeUndo", [action.name, action.args]);

                var res = actions[action.name]._undo(action.args);

                redoStack.push({
                    name: action.name,
                    args: res
                });

                cy.trigger("afterUndo", [action.name, action.args]);
                return res;
            } else if (_instance.options.isDebug) {
                console.log("Undoing cannot be done because undo stack is empty!");
            }
        };

        // Redo last action
        _instance.redo = function () {

            if (!this.isRedoStackEmpty()) {
                var action = redoStack.pop();

                cy.trigger(action.firstTime ? "beforeDo" : "beforeRedo", [action.name, action.args]);


                if (!action.args)
                    action.args = {};
                action.args.firstTime = action.firstTime ? true : false;

                var res = actions[action.name]._do(action.args);

                undoStack.push({
                    name: action.name,
                    args: res
                });

                cy.trigger(action.firstTime ? "afterDo" : "afterRedo", [action.name, action.args]);


                console.log(action.name);
                console.log(action.args);
                console.log(res);
                if(action.name == "changeStyleData" || action.name == "changeStyleCss")
                    cy.trigger(action.name,  [action.args.dataType, action.args.eles]);


                else if(action.name  == "changeNodeLabel"){
                    cy.trigger("changeStyleData" ,["sbgnlabel", action.args.nodes]);
                }

                else if(action.name  == "changeFontProperties"){
                    cy.trigger("changeStyleData" ,["labelsize", action.args.eles]);
                    cy.trigger("changeStyleData" ,["fontstyle", action.args.eles]);
                    cy.trigger("changeStyleData" ,["fontfamily", action.args.eles]);
                    cy.trigger("changeStyleData" ,["fontweight", action.args.eles]);
                }
                else if(action.name  == "changeIsMultimerStatus"){
                    cy.trigger("changeStyleData" ,["sbgnclass", action.args.nodes]);
                }
                else if(action.name  == "changeIsCloneMarkerStatus"){
                    cy.trigger("changeStyleData" ,["sbgnclonemarker", action.args.nodes]);
                }
                else if(action.name  == "changeUnitOfInformation" || action.name  == "addStateAndInfo" || action.name  == "changeStateVariable" || action.name == "removeStateAndInfo" ){
                    cy.trigger("changeStyleData" ,["sbgnstatesandinfos", action.args.nodes]);
                }

                else if(action.name  == "changeBendPoints"){

                    cy.trigger("changeStyleData" ,["bendPointPositions", action.args.edge]);


                    //FIXME
                    cy.trigger("changeStyleCss" ,["curve-style", res.edge]);
                    cy.trigger("changeScratch" ,["cyedgebendeditingWeights", res.edge]);
                    cy.trigger("changeScratch" ,["cyedgebendeditingDistances", res.edge]);

                    //       cy.trigger("changeClasses", [action.args.edge]);

                }

                else if (action.name == "highlight" || action.name == "removeHighlights"){
                    cy.trigger("changeHighlightStatus",["highlighted", res.current.highlighteds] );
                    cy.trigger("changeHighlightStatus",["unhighlighted", res.current.unhighlighteds] );
                    cy.trigger("changeHighlightStatus",["notHighlighted", res.current.notHighlighteds] );

                    // cy.trigger("changeClasses",  [res.current.notHighlighteds]);
                    // cy.trigger("changeClasses",  [res.current.highlighteds]);
                    // cy.trigger("changeClasses",  [res.current.unhighlighteds]);
                    //
                    // // cy.trigger("changeScratch",  ["_viewUtilities", res.current.unhighlighteds]);
                    //
                    //
                    // console.log(res.current.highlighteds);


                }

                else if (action.name == "hide" || action.name == "show"){
                    cy.trigger("changeClasses", [action.args]);

                }

                else if (action.name == "collapse" || action.name == "expand"){
                    cy.trigger("changeClasses", [ action.args.nodes]);

                }
                else if( action.name == "drag" || action.name == "align"){

                    cy.trigger("changePosition" ,[action.args.nodes]);
                }
                else if (action.name == "resizeNode"){
                    cy.trigger("changeStyleCss" ,["width", action.args.nodes]);
                    cy.trigger("changeStyleCss" ,["height", action.args.nodes]);
                    cy.trigger("changeStyleData" ,["width", action.args.nodes]);
                    cy.trigger("changeStyleData" ,["height", action.args.nodes]);

                }
                else if(action.name == "addNode"){

                    cy.trigger("addNode", [res.eles, action.args.newNode]);

                }
                else if(action.name == "addEdge"){
                    cy.trigger("addEdge", [res.eles, action.args.newEdge]);
                }

                else if(action.name == "removeEles" || action.name == "deleteSelected"){
                    cy.trigger("removeEles", [res]);
                }

                else if(action.name == "createCompoundForSelectedNodes"){
                    cy.trigger("createCompoundForSelectedNodes", [action.args.compoundType, res, action.args.nodesToMakeCompound]);
                    //       cy.trigger("changeChildren", [res]); //changes classes, style and data
                }
                else if(action.name == "changeParent"){
                    if(action.args.newParent){
                        cy.trigger("changeStyleData", [action.name, action.args.newParent]);
                        cy.trigger("changeStyleCss", [action.name, action.args.newParent]);
                        cy.trigger("changeChildren", [action.args.newParent]);
                    }

                    //change current node
                    cy.trigger("changeStyleData", [action.name, action.args.node]);
                    cy.trigger("changeStyleCss", [action.name, action.args.node]);

                    //change children of new compound
                    if(res.newParent) {
                        cy.trigger("changeStyleData", [action.name, res.newParent]);
                        cy.trigger("changeStyleCss", [action.name, res.newParent]);
                    }
                }



                return res;
            } else if (_instance.options.isDebug) {
                console.log("Redoing cannot be done because redo stack is empty!");
            }




        };

        // Calls registered function with action name actionName via actionFunction(args)
        _instance.do = function (actionName, args) {

            redoStack = [];
            redoStack.push({
                name: actionName,
                args: args,
                firstTime: true
            });






            return this.redo();
        };

        // Register action with its undo function & action name.
        _instance.action = function (actionName, _do, _undo) {

            actions[actionName] = {
                _do: _do,
                _undo: _undo
            };


            return _instance;
        };

        // Removes action stated with actionName param
        _instance.removeAction = function (actionName) {
            delete actions[actionName];
        };

        // Gets whether undo stack is empty
        _instance.isUndoStackEmpty = function () {
            return (undoStack.length === 0);
        };

        // Gets whether redo stack is empty
        _instance.isRedoStackEmpty = function () {
            return (redoStack.length === 0);
        };

        // Gets actions (with their args) in undo stack
        _instance.getUndoStack = function () {
            return undoStack;
        };

        // Gets actions (with their args) in redo stack
        _instance.getRedoStack = function () {
            return redoStack;
        };

        // Set keyboard shortcuts according to options
        function setKeyboardShortcuts(ctrl_z, ctrl_y, ctrl_shift_z) {
            document.addEventListener("keydown", function (e) {
                if (e.ctrlKey && e.target.nodeName === 'BODY')
                    if (ctrl_z && e.which === 90)
                        if (ctrl_shift_z && e.shiftKey)
                            _instance.redo();
                        else
                            _instance.undo();
                    else if (ctrl_y && e.which === 89)
                        _instance.redo();
            });
        }

        var lastMouseDownNodeInfo = null;
        var isDragDropSet = false;

        function setDragUndo(undoable) {
            isDragDropSet = true;
            cy.on("grab", "node", function () {
                if (undoable) {
                    lastMouseDownNodeInfo = {};
                    lastMouseDownNodeInfo.lastMouseDownPosition = {
                        x: this.position("x"),
                        y: this.position("y")
                    };
                    lastMouseDownNodeInfo.node = this;
                }
            });
            cy.on("free", "node", function () {
                if (undoable) {
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
                            nodes = cy.collection([node]);
                        }

                        var param = {
                            positionDiff: positionDiff,
                            nodes: nodes, move: false
                        };
                        _instance.do("drag", param);

                        lastMouseDownNodeInfo = null;
                    }
                }
            });
        }
        function getTopMostNodes(nodes) {
            var nodesMap = {};
            for (var i = 0; i < nodes.length; i++) {
                nodesMap[nodes[i].id()] = true;
            }
            var roots = nodes.filter(function (i, ele) {
                var parent = ele.parent()[0];
                while(parent != null){
                    if(nodesMap[parent.id()]){
                        return false;
                    }
                    parent = parent.parent()[0];
                }
                return true;
            });

            return roots;
        }

        function moveNodes(positionDiff, nodes, notCalcTopMostNodes) {
            var topMostNodes = notCalcTopMostNodes?nodes:getTopMostNodes(nodes);
            for (var i = 0; i < topMostNodes.length; i++) {
                var node = topMostNodes[i];
                var oldX = node.position("x");
                var oldY = node.position("y");
                node.position({
                    x: oldX + positionDiff.x,
                    y: oldY + positionDiff.y
                });
                var children = node.children();
                moveNodes(positionDiff, children, true);
            }
        }

        function getEles(_eles) {
            return (typeof _eles === "string") ? cy.$(_eles) : _eles;
        }

        function restoreEles(_eles) {
            return getEles(_eles).restore();
        }


        function returnToPositionsAndSizes(nodesData) {
            var currentPositionsAndSizes = {};
            cy.nodes().positions(function (i, ele) {
                currentPositionsAndSizes[ele.id()] = {
                    width: ele.width(),
                    height: ele.height(),
                    x: ele.position("x"),
                    y: ele.position("y")
                };
                var data = nodesData[ele.id()];
                ele._private.data.width = data.width;
                ele._private.data.height = data.height;
                return {
                    x: data.x,
                    y: data.y
                };
            });

            return currentPositionsAndSizes;
        }

        function getNodesData() {
            var nodesData = {};
            var nodes = cy.nodes();
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                nodesData[node.id()] = {
                    width: node.width(),
                    height: node.height(),
                    x: node.position("x"),
                    y: node.position("y")
                };
            }
            return nodesData;
        }

        // Default actions
        function defaultActions() {
            return {
                "add": {
                    _do: function (eles) {
                        return eles.firstTime ? cy.add(eles) : restoreEles(eles);
                    },
                    _undo: cy.remove
                },
                "remove": {
                    _do: cy.remove,
                    _undo: restoreEles
                },
                "restore": {
                    _do: restoreEles,
                    _undo: cy.remove
                },
                "select": {
                    _do: function (_eles) {
                        return getEles(_eles).select();
                    },
                    _undo: function (_eles) {
                        return getEles(_eles).unselect();
                    }
                },
                "unselect": {
                    _do: function (_eles) {
                        return getEles(_eles).unselect();
                    },
                    _undo: function (_eles) {
                        return getEles(_eles).select();
                    }
                },
                "move": {
                    _do: function (args) {
                        var eles = getEles(args.eles);
                        var nodes = eles.nodes();
                        var edges = eles.edges();

                        return {
                            oldNodes: nodes,
                            newNodes: nodes.move(args.location),
                            oldEdges: edges,
                            newEdges: edges.move(args.location)
                        };
                    },
                    _undo: function (eles) {
                        var newEles = cy.collection();
                        var location = {};
                        if (eles.newNodes.length > 0) {
                            location.parent = eles.newNodes[0].parent();

                            for (var i = 0; i < eles.newNodes.length; i++) {
                                var newNode = eles.newNodes[i].move({
                                    parent: eles.oldNodes[i].parent()
                                });
                                newEles.union(newNode);
                            }
                        } else {
                            location.source = location.newEdges[0].source();
                            location.target = location.newEdges[0].target();

                            for (var i = 0; i < eles.newEdges.length; i++) {
                                var newEdge = eles.newEdges[i].move({
                                    source: eles.oldEdges[i].source(),
                                    target: eles.oldEdges[i].target()
                                });
                                newEles.union(newEdge);
                            }
                        }
                        return {
                            eles: newEles,
                            location: location
                        };
                    }
                },
                "drag": {
                    _do: function (args) {
                        if (args.move)
                            moveNodes(args.positionDiff, args.nodes);
                        return args;
                    },
                    _undo: function (args) {
                        var diff = {
                            x: -1 * args.positionDiff.x,
                            y: -1 * args.positionDiff.y
                        };
                        var result = {
                            positionDiff: args.positionDiff,
                            nodes: args.nodes,
                            move: true
                        };
                        moveNodes(diff, args.nodes);
                        return result;
                    }
                },
                "layout": {
                    _do: function (args) {
                        if (args.firstTime){
                            var nodesData = getNodesData();
                            if(args.eles)
                                getEles(args.eles).layout(args.options);
                            else
                                cy.layout(args.options);
                            return nodesData;
                        } else
                            return returnToPositionsAndSizes(options);
                    },
                    _undo: function (nodesData) {
                        return returnToPositionsAndSizes(nodesData);
                    }
                }
            };
        }

    };

    if (typeof module !== 'undefined' && module.exports) { // expose as a commonjs module
        module.exports = register;
    }

    if (typeof define !== 'undefined' && define.amd) { // expose as an amd/requirejs module
        define('cytoscape.js-undo-redo', function () {
            return register;
        });
    }

    if (typeof cytoscape !== 'undefined') { // expose to global cytoscape (i.e. window.cytoscape)
        register(cytoscape);
    }

})();