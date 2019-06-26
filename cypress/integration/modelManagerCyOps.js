/***
 * Tests for non-cy-related modelManager methods
 */


describe('modelManager Cytoscape Operations Test', function () {

    function connect(){
        it('Access global window object', function (done) {
            cy.visit('http://localhost:3000');
            cy.window().should(function (window) {
                expect(window.testApp).to.be.ok;
                expect(window.testApp.model).to.be.ok;
                expect(window.testApp.docId).to.be.ok;
                expect(window.$).to.be.ok;
                expect(window.location.hostname).to.eq('localhost');

                done();
            });
        });
    }
    // Seperating the test names by the network ids would be useful to figure out the
    // details of bugs. Therefore, we need to extend the test names with the network ids
    // where network id matters and used.
    function extendTestNameWithNetworkId (message, networkId) {

        return message + ' for network#' + networkId;

    }

    function addModelNode(cyId, id) {

        let testName = extendTestNameWithNetworkId('modelManager.addModelNode', cyId);

        it(testName, function () {
            cy.window().should(function (window) {

                // get the chise instance for cy/tab id
                let chiseInstance = window.appUtilities.getChiseInstance(cyId);

                // get the associated cy instance
                let cyInstance = chiseInstance.getCy();

                let modelManager = window.testApp.modelManager;

                modelManager.addModelNode(id, cyId, {position: {x: 100, y: 200} , data: {id: id, class: "macromolecule"}});

                expect(cyInstance.getElementById(id)).to.be.ok;

                expect(modelManager.getModelNodeAttribute("data.id", id, cyId)).to.equal(cyInstance.getElementById(id).data("id"));
                expect(cyInstance.getElementById(id).data("class")).to.equal("macromolecule");
                expect(cyInstance.getElementById(id).data("class")).to.equal(modelManager.getModelNodeAttribute("data.class", id, cyId));

                expect(cyInstance.getElementById(id).position("x")).to.equal(100);
                expect(cyInstance.getElementById(id).position("x")).to.equal(modelManager.getModelNodeAttribute("position.x", id, cyId));

                expect(cyInstance.getElementById(id).position("y")).to.equal(200);
                expect(cyInstance.getElementById(id).position("y")).to.equal(modelManager.getModelNodeAttribute("position.y", id, cyId));

            });
        });
    }

    function getModelNode(cyId, id) {

        let testName = extendTestNameWithNetworkId('modelManager.getModelNode', cyId);

        it(testName, function () {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                let modelNode = modelManager.getModelNode(id, cyId);
                expect(modelNode.id).to.equal(id);
            });

        });
    }

    function initModelNode(cyId, id){

        let testName = extendTestNameWithNetworkId('modelManager.initModelNode', cyId);

        it(testName, function() {

            cy.window().should(function (window) {

                // get the chise instance for given cy/tab id
                let chiseInstance = window.appUtilities.getChiseInstance(cyId);

                // get the associated cy instance
                let cyInstance = chiseInstance.getCy();

                let modelManager = window.testApp.modelManager;

                modelManager.initModelNode(cyInstance.getElementById(id), cyId, null, true);



                var node = cyInstance.getElementById(id);
                var modelNode = modelManager.getModelNode(id,cyId);


                for (var att in modelNode.data) {
                    expect(modelNode.data[att]).to.equal(node.data(att));
                }


                for (var att in node.data) {
                    expect(modelNode.data[att]).to.equal(node.data(att));
                }


            });
        });
    }


    function addModelEdge(cyId, id1, id2) {

        let testName = extendTestNameWithNetworkId('modelManager.addModelEdge', cyId);

        it(testName, function () {
            cy.window().should(function (window) {

                // get the chise instance for cy/tab id
                let chiseInstance = window.appUtilities.getChiseInstance(cyId);

                // get the associated cy instance
                let cyInstance = chiseInstance.getCy();

                let modelManager = window.testApp.modelManager;
                var id = (id1 + "-"+ id2);

                modelManager.addModelEdge(id, cyId,{data: {id: id, source: id1, target: id2, class: "consumption"}});

                var modelEdge = modelManager.getModelEdge(id, cyId);
                var edge = cyInstance.getElementById(id);

                expect(cyInstance.getElementById(id)).to.be.ok;

                expect(modelManager.getModelEdgeAttribute("data.id", id, cyId)).to.equal(cyInstance.getElementById(id).data("id"));
                expect(cyInstance.getElementById(id).data("class")).to.equal("consumption");
                expect(cyInstance.getElementById(id).data("class")).to.equal(modelManager.getModelEdgeAttribute("data.class", id, cyId));

                expect(cyInstance.getElementById(id).data("source")).to.equal(id1);
                expect(cyInstance.getElementById(id).data("source")).to.equal(modelManager.getModelEdgeAttribute("data.source", id, cyId));

                expect(cyInstance.getElementById(id).data("target")).to.equal(id2);
                expect(cyInstance.getElementById(id).data("target")).to.equal(modelManager.getModelEdgeAttribute("data.target", id, cyId));


            });
        });
    }


    function getModelEdge(cyId, id) {

        let testName = extendTestNameWithNetworkId('modelManager.getModelEdge', cyId);

        it(testName, function () {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                let modelEdge = modelManager.getModelEdge(id, cyId);
                expect(modelEdge.id).to.equal(id);
            });

        });
    }

    function initModelEdge(cyId, id){

        let testName = extendTestNameWithNetworkId('modelManager.initModelEdge', cyId);

        it(testName, function() {

            cy.window().should(function (window) {

                // get chise instance for given cy/tab id
                let chiseInstance = window.appUtilities.getChiseInstance(cyId);

                // get the associated cy instance
                let cyInstance = chiseInstance.getCy();

                let modelManager = window.testApp.modelManager;

                modelManager.initModelEdge(cyInstance.getElementById(id), cyId, null, true); //no history


                var edge = cyInstance.getElementById(id);
                var modelEdge = modelManager.getModelEdge(id, cyId);


                for (var att in modelEdge.data) {
                    expect(modelEdge.data[att]).to.equal(edge.data(att));
                }


                for (var att in edge.data) {
                    expect(modelEdge.data[att]).to.equal(edge.data(att));
                }

            });
        });
    }

    function selectModelNode(cyId, id) {

        let testName = extendTestNameWithNetworkId('modelManager.selectModelNode', cyId);

        it(testName, function () {
            cy.window().should(function (window) {

                // get chise instance for given cy/tab id
                let chiseInstance = window.appUtilities.getChiseInstance(cyId);

                // get the associated cy instance
                let cyInstance = chiseInstance.getCy();

                let modelManager = window.testApp.modelManager;
                let userId = window.sessionUserId;
                var node = cyInstance.getElementById(id);
                modelManager.selectModelNode(node, cyId, userId); //we need to specify userId for selection
                setTimeout(()=>{ //wait a little while to update the UI
                    expect(node.css('overlay-color')).to.equal(modelManager.getModelNodeAttribute("highlightColor", id, cyId));
                }, 100);

            });

        });
    }

    function unselectModelNode(cyId, id) {

        let testName = extendTestNameWithNetworkId('modelManager.unselectModelNode', cyId);

        it(testName, function () {
            cy.window().should(function (window) {

                // get chise instance for given cy/tab id
                let chiseInstance = window.appUtilities.getChiseInstance(cyId);

                // get the associated cy instance
                let cyInstance = chiseInstance.getCy();

                let modelManager = window.testApp.modelManager;
                var node = cyInstance.getElementById(id);
                modelManager.unselectModelNode(node, cyId); //we need to specify userId for selection
                expect(modelManager.getModelNodeAttribute("highlightColor", id, cyId)).to.not.ok;
                setTimeout(()=>{ //wait a little while to update the UI
                    expect(node.css('overlay-color')).to.not.ok;
                }, 100);

            });

        });
    }

    function selectModelEdge(cyId, id) {

        let testName = extendTestNameWithNetworkId('modelManager.selectModelEdge', cyId);

        it(testName, function () {
            cy.window().should(function (window) {

                // get chise instance for given cy/tab id
                let chiseInstance = window.appUtilities.getChiseInstance(cyId);

                // get the associated cy instance
                let cyInstance = chiseInstance.getCy();

                let modelManager = window.testApp.modelManager;
                let userId = window.sessionUserId;
                var edge = cyInstance.getElementById(id);
                modelManager.selectModelEdge(edge, cyId, userId); //we need to specify userId for selection
                setTimeout(()=>{ //wait a little while to update the UI
                    expect(edge.css('overlay-color')).to.equal(modelManager.getModelEdgeAttribute("highlightColor", id, cyId));
                }, 100);

            });

        });
    }

    function unselectModelEdge(cyId, id) {

        let testName = extendTestNameWithNetworkId('modelManager.unselectModelEdge', cyId);

        it(testName, function () {
            cy.window().should(function (window) {

                // get chise instance for given cy/tab id
                let chiseInstance = window.appUtilities.getChiseInstance(cyId);

                // get the associated cy instance
                let cyInstance = chiseInstance.getCy();

                let modelManager = window.testApp.modelManager;
                var edge = cyInstance.getElementById(id);
                modelManager.unselectModelEdge(edge,cyId); //we need to specify userId for selection
                expect(modelManager.getModelEdgeAttribute("highlightColor", id,cyId)).to.not.ok;
                setTimeout(()=>{ //wait a little while to update the UI
                    expect(edge.css('overlay-color')).to.not.ok;
                }, 100);

            });

        });
    }

    function changeModelNodeAttribute(cyId, id) {

        let testName = extendTestNameWithNetworkId('modelManager.unselectModelEdge', cyId);

        it(testName, function () {
            cy.window().should(function (window) {

                // get chise instance for given cy/tab id
                let chiseInstance = window.appUtilities.getChiseInstance(cyId);

                // get the associated cy instance
                let cyInstance = chiseInstance.getCy();

                let modelManager = window.testApp.modelManager;

                let pos = {x:300, y:400};
                modelManager.changeModelNodeAttribute("position", id, cyId, pos);
                expect(cyInstance.getElementById(id).position().x).to.equal(pos.x);
                expect(modelManager.getModelNode(id, cyId).position.x).equal(pos.x);
                expect(cyInstance.getElementById(id).position().y).to.equal(pos.y);
                expect(modelManager.getModelNode(id, cyId).position.y).to.equal(pos.y);


                let nodeClass = "phenotype";
                modelManager.changeModelNodeAttribute("data.class", id, cyId, nodeClass);
                expect(cyInstance.getElementById(id).data('class')).to.equal(nodeClass);
                expect(modelManager.getModelNode(id, cyId).data.class).to.equal(nodeClass);


                let label = "label2";
                modelManager.changeModelNodeAttribute("data.label", id,  cyId, label);
                expect(cyInstance.getElementById(id).data('label')).to.equal(label);
                expect(modelManager.getModelNode(id, cyId).data.label).to.equal(label);


                let opacity = 0.7;
                modelManager.changeModelNodeAttribute("data.background-opacity", id, cyId, opacity);
                expect(cyInstance.getElementById(id).data('background-opacity')).to.equal( opacity);
                expect(modelManager.getModelNode(id, cyId).data["background-opacity"]).to.equal( opacity);


                let bgColor = '#333343';
                modelManager.changeModelNodeAttribute("data.background-color", id, cyId, bgColor );
                expect(cyInstance.getElementById(id).data('background-color')).to.equal(bgColor);
                expect(modelManager.getModelNode(id, cyId).data["background-color"]).to.equal(bgColor);


                let borColor = '#222222';
                modelManager.changeModelNodeAttribute("data.border-color", id,  cyId, borColor);
                expect(cyInstance.getElementById(id).data('border-color')).to.equal(borColor);
                expect(modelManager.getModelNode(id, cyId).data["border-color"]).to.equal(borColor);

                let borWidth = "3px";
                modelManager.changeModelNodeAttribute("data.border-width", id, cyId, borWidth);
                expect(cyInstance.getElementById(id).data('border-width')).to.equal(borWidth);
                expect(modelManager.getModelNode(id, cyId).data["border-width"]).to.equal(borWidth);


                let fontFamily = "Times";
                modelManager.changeModelNodeAttribute("data.font-family", id, cyId, fontFamily);
                expect(cyInstance.getElementById(id).data('font-family')).to.equal(fontFamily);
                expect(modelManager.getModelNode(id, cyId).data["font-family"]).to.equal(fontFamily);


                let fontWeight = "bold";
                modelManager.changeModelNodeAttribute("data.font-weight", id, cyId, fontWeight);
                expect(cyInstance.getElementById(id).data('font-weight')).to.equal(fontWeight);
                expect(modelManager.getModelNode(id, cyId).data["font-weight"]).to.equal(fontWeight);

                let fontSize = 10;
                modelManager.changeModelNodeAttribute("data.font-size", id, cyId, fontSize);
                expect(cyInstance.getElementById(id).data('font-size')).to.equal(fontSize);
                expect(modelManager.getModelNode(id, cyId).data["font-size"]).to.equal(fontSize);


                let fontStyle = "normal";
                modelManager.changeModelNodeAttribute("data.font-style", id, cyId, fontStyle);
                expect(cyInstance.getElementById(id).data('font-style')).to.equal(fontStyle);
                expect(modelManager.getModelNode(id, cyId).data["font-style"]).to.equal(fontStyle);


                let cloneMarker = true;
                modelManager.changeModelNodeAttribute("data.clonemarker", id, cyId, cloneMarker);
                expect(cyInstance.getElementById(id).data('clonemarker')).to.equal(cloneMarker);
                expect(modelManager.getModelNode(id, cyId).data.clonemarker).to.equal(cloneMarker);


                var stateVarObj = {clazz: 'state variable', state: {value:'val', variable:'var'}, bbox:{w:40, h:20}};
                var unitOfInfoObj = {clazz: 'unit of information', label: {text:'label'}, bbox:{w:40, h:20}};


                modelManager.changeModelNodeAttribute("data.statesandinfos", id, cyId, [stateVarObj, unitOfInfoObj]);


                expect(cyInstance.getElementById(id).data('statesandinfos')[0].clazz).to.deep.equal(stateVarObj.clazz);
                expect(cyInstance.getElementById(id).data('statesandinfos')[1].clazz).to.deep.equal(unitOfInfoObj.clazz);
                expect(cyInstance.getElementById(id).data('statesandinfos')).to.deep.equal(modelManager.getModelNode(id, cyId).data.statesandinfos);

                let parent = "node2";
                modelManager.changeModelNodeAttribute("data.parent", id, cyId, parent);
                expect(cyInstance.getElementById(id).data('parent')).to.equal(parent);
                expect(modelManager.getModelNode(id, cyId).data.parent).to.equal(parent);

                let bh= 4;
                modelManager.changeModelNodeAttribute("data.bbox.h", id, cyId, bh);
                expect(cyInstance.getElementById(id)._private.data.bbox.h).to.equal(bh);
                expect(modelManager.getModelNode(id, cyId).data.bbox.h).to.equal(bh);

                let bw = 5;
                modelManager.changeModelNodeAttribute("data.bbox.w", id, cyId, bw);
                expect(cyInstance.getElementById(id)._private.data.bbox.w).to.equal(bw);
                expect(modelManager.getModelNode(id, cyId).data.bbox.w).to.equal(bw);

                //TODO:
                // modelManager.changeModelNodeAttribute("data.ports", id, cyId, ["glyph4"]);
                // assert.equal(modelManager.getModelNode(id, cyId).data.ports[0], window.appUtilities.getActiveCy().getElementById(id).data('ports')[0], "Node ports are correct in window.cytoscape.");
                // assert.equal(modelManager.getModelNode(id, cyId).data.ports[0], window.appUtilities.getActiveCy().getElementById(id).data('ports')[0], "Node ports are equal in model and window.cytoscape..");

            });

        });
    }

    function changeModelEdgeAttribute(cyId, id) {

        let testName = extendTestNameWithNetworkId('modelManager.changeModelEdgeAttribute', cyId);

        it(testName, function () {
            cy.window().should(function (window) {

                // get chise instance for given cy/tab id
                let chiseInstance = window.appUtilities.getChiseInstance(cyId);

                // get the associated cy instance
                let cyInstance = chiseInstance.getCy();

                let modelManager = window.testApp.modelManager;

                let edgeClass = "catalysis";
                modelManager.changeModelEdgeAttribute("data.class", id, cyId, edgeClass);
                expect(cyInstance.getElementById(id).data('class')).to.equal(edgeClass);
                expect(modelManager.getModelEdge(id, cyId).data.class).to.equal(edgeClass);


                let cardinality = 5;
                modelManager.changeModelEdgeAttribute("data.cardinality", id, cyId, cardinality);
                expect(cyInstance.getElementById(id).data('cardinality')).to.equal(cardinality);
                expect(modelManager.getModelEdge(id, cyId).data.cardinality).to.equal(cardinality);

                let lColor = '#411515';
                modelManager.changeModelEdgeAttribute("data.line-color", id, cyId, lColor );
                expect(cyInstance.getElementById(id).data('line-color')).to.equal(lColor);
                expect(modelManager.getModelEdge(id, cyId).data["line-color"]).to.equal(lColor);


                let width = "8px";
                modelManager.changeModelEdgeAttribute("data.width", id, cyId, width);
                expect(cyInstance.getElementById(id).data('width')).to.equal(width);
                expect(modelManager.getModelEdge(id, cyId).data["width"]).to.equal(width);

                //This  doesn't give error but
                //Edge's source and targets should not be updated like this
                //Chise does not allow this
                //This also causes problem when we try to delete elements

                // let newSource = "node3";
                // modelManager.changeModelEdgeAttribute("data.source", id, cyId, newSource);
                // setTimeout(()=>{ //wait a little while
                //     expect(window.appUtilities.getActiveCy().getElementById(id).data("source")).to.equal(newSource);
                //     expect(window.appUtilities.getActiveCy().getElementById(id).data("source")).to.equal(modelManager.getModelEdgeAttribute("data.source", id,cyId ));
                // },100);
                //
                // let newTarget = "node4";
                // modelManager.changeModelEdgeAttribute("data.target", id, newTarget);
                // setTimeout(()=>{ //wait a little while
                //     expect(window.appUtilities.getActiveCy().getElementById(id).data("target")).to.equal(newTarget);
                //     expect(window.appUtilities.getActiveCy().getElementById(id).data("target")).to.equal(modelManager.getModelEdgeAttribute("data.source", id, cyId));
                // },100);
                //
                // let ps = "node1";
                // modelManager.changeModelEdgeAttribute("data.portsource", id, cyId, ps);
                // expect(window.appUtilities.getActiveCy().getElementById(id).data('portsource')).to.equal(ps);
                // expect(modelManager.getModelEdge(id, cyId).data["portsource"]).to.equal(ps);
                //
                //
                // let pt = "node1";
                // modelManager.changeModelEdgeAttribute("data.porttarget", id, cyId, pt);
                // expect(window.appUtilities.getActiveCy().getElementById(id).data('porttarget')).to.equal(pt);
                // expect(modelManager.getModelEdge(id, cyId).data["porttarget"]).to.equal(pt);


                //TODO
                // modelManager.changeModelEdgeAttribute("databendPointPositions", id, cyId, [{x: 300, y: 400}]);
                // assert.equal(300, cy.getElementById(id)._private.data.bendPointPositions[0].x,  "Edge bendPointPositions are correct in cytoscape.");
                // assert.equal(modelManager.getModelEdge(id, cyId).databendPointPositions[0].x,cy.getElementById(id)._private.data.bendPointPositions[0].x,  "Edge bendPointPositions are equal in model and cytoscape.");

            });

        });
    }

    function deleteModelNode(cyId, id) {

        let testName = extendTestNameWithNetworkId('modelManager.deleteModelNode', cyId);

        it(testName, function () {
            cy.window().should(function (window) {

                // get chise instance for given cy/tab id
                let chiseInstance = window.appUtilities.getChiseInstance(cyId);

                // get the associated cy instance
                let cyInstance = chiseInstance.getCy();

                let modelManager = window.testApp.modelManager;
                modelManager.deleteModelNode(id, cyId);

                expect(modelManager.getModelNode(id, cyId)).to.not.ok;
                expect(cyInstance.getElementById(id).length).to.equal(0);
            });

        });
    }

    function deleteModelEdge(cyId, id) {

        let testName = extendTestNameWithNetworkId('modelManager.deleteModelEdge', cyId);

        it(testName, function () {
            cy.window().should(function (window) {

                // get chise instance for given cy/tab id
                let chiseInstance = window.appUtilities.getChiseInstance(cyId);

                // get the associated cy instance
                let cyInstance = chiseInstance.getCy();

                let modelManager = window.testApp.modelManager;
                modelManager.deleteModelEdge(id, cyId);
                expect(modelManager.getModelEdge(id, cyId)).to.not.ok;
                expect(cyInstance.getElementById(id).length).to.equal(0);
            });

        });
    }

    function undoDeleteModelNode(cyId, id){

        let testName = extendTestNameWithNetworkId('modelManager.undoDeleteModeNode', cyId);

        it(testName, function () {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                modelManager.undoCommand();
                expect(modelManager.getModelNode(id, cyId)).to.be.ok;
            });
        });
    }

    function redoDeleteModelNode(cyId, id){

        let testName = extendTestNameWithNetworkId('modelManager.redoDeleteModelNode', cyId);

        it(testName, function () {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                modelManager.redoCommand();
                expect(modelManager.getModelNode(id, cyId)).to.not.ok;
                expect(window.appUtilities.getCyInstance(cyId).getElementById(id).length).to.be.equal(0);
            });
        });
    }

    function undoDeleteModelEdge(cyId, id){

        let testName = extendTestNameWithNetworkId('modelManager.undoDeleteModeEdge', cyId);

        it(testName, function () {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                modelManager.undoCommand();
                expect(modelManager.getModelEdge(id, cyId)).to.be.ok;
                expect(window.appUtilities.getCyInstance(cyId).getElementById(id).length, 'undoDeleteModelEdge cy length test').to.be.equal(1);
            });
        });
    }

    function redoDeleteModelEdge(cyId, id){

        let testName = extendTestNameWithNetworkId('modelManager.redoDeleteModelEdge', cyId);

        it(testName, function () {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                modelManager.redoCommand();
                expect(modelManager.getModelEdge(id, cyId)).to.not.ok;
                expect(window.appUtilities.getCyInstance(cyId).getElementById(id).length).to.be.equal(0);
            });

            cy.wait(200);

        });
    }

    // inital expected network ids to traverse
    var initialNetworkIds = [0, 2];


    // Check if the list of existing network ids are as expected at the begining
    function networkIdsTest () {

        it('networkIdsTest', function () {

            cy.window().should(function (window) {

                // expect that actual networkIdsStack is deep equal to our initial expected network ids
                expect(window.appUtilities.networkIdsStack, "Network id stack is as expected before the model manager tests").to.deep.equal(initialNetworkIds);

            });
        });
    }


    //These new networks are opened in the chiseUserOpts test
    // networkIdsTest();

    // Perform the tests for the all existing open networks,
    // traversing window.appUtilities.networkIdsStack would be a safer way
    // but currently we are not able to access it from here.
    // If another open/close file operation is done in chiseUserOps.js then the
    // array that is traversed here should be updated accordingly.
    // initialNetworkIds.forEach( function (cyId) {

    // return;
    let cyId = 0;
    connect();
    addModelNode(cyId, "node1");
    initModelNode(cyId, "node1");
    getModelNode(cyId, "node1");

    addModelNode(cyId, "node2");
    initModelNode(cyId, "node2");

    addModelNode(cyId, "node3");
    initModelNode(cyId, "node3");

    addModelNode(cyId, "node4");
    initModelNode(cyId, "node4");


    addModelEdge(cyId, "node1","node2");
    initModelEdge(cyId, "node1-node2");

    selectModelNode(cyId, "node1");
    unselectModelNode(cyId, "node1");

    selectModelEdge(cyId, "node1-node2");
    unselectModelEdge(cyId, "node1-node2");

    changeModelNodeAttribute(cyId, "node1");
    changeModelEdgeAttribute(cyId, "node1-node2");

    deleteModelNode(cyId, "node3");
    undoDeleteModelNode(cyId, "node3");
    redoDeleteModelNode(cyId, "node3");

    // deleteModelEdge(cyId, "node1-node2");
    // undoDeleteModelEdge(cyId, "node1-node2");
    // redoDeleteModelEdge(cyId, "node1-node2");


    // });

});