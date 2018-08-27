/***
 * Test for sending and receiving messages
 */

let io = require('socket.io-client');
let globalTestData = require('../testData/globalTestData.js');

describe('Agent API Test', function () {
    let agent;
    let agentId = '103abc';
    let agentName = "testAgent";


    function newAgent() {
       it('new Agent', function () {
           let Agent = require("../../agent-interaction/agentAPI.js");
           agent = new Agent(agentName, agentId, io);
           expect(agent).to.be.ok;
        });
    }

    function checkAgentProperties(){
        it('Agent properties', function() {
            expect(agent.agentId).to.be.equal(agentId);
            expect(agent.agentName).to.be.equal(agentName);
            expect(agent.colorCode).to.be.equal("#00bfff");
        });
    }

    function loadModel() {
       it('agent.connectToServer', function (done) {
            agent.connectToServer("http://localhost:3000/",  function (socket) {
                expect(socket).to.be.ok;
                agent.loadModel( function () {
                    agent.loadOperationHistory( function () {
                        expect(agent.opHistory).to.be.ok;
                        expect(agent.pageDoc).to.be.ok;
                        done();
                    });
                });
            });
       });
    }

    function changeName() {
        it('agent.changeName', function (done) {
            agent.changeName("HAL", function () {
                setTimeout(function () { //should wait here as well
                    expect(agent.agentName).to.equal("HAL");
                    done();
                }, 100);

            });

        });
    }

    function sendMessage() {
        it('agent.sendMessage', function (done) {
            cy.window().should(function (window) {
                let model = window.testApp.model;
                let testMsg = "hello my name is <b> Bob </b>";
                agent.sendRequest("agentMessage", {comment: testMsg, targets: "*"}, function (data) {
                    setTimeout(function () { //should wait here as well
                        expect(data).to.equal("success");
                        let messages = model.get('_page.list');
                        expect(messages[messages.length -1].comment).equal(testMsg);
                        done();
                    }, 100);
                });
            });

        });
    }

    function sendGetRequest(cyId){

        it('agent.getNode', function(done) {
            let node1 = "agentNode1";
            agent.getNodeRequest(node1, cyId,  function () {
                equal(agent.selectedNode.id).to.equal(node1);
                done();
            });

        });
        it('agent.getEdge', function(done) {
            let edge1 = "agentNode1-agentNode2";
            agent.getEdgeRequest(edge1, cyId, function () {
                equal(agent.selectedEdge.id).to.equal(edge1);
                done();
            });
        });
    }

    function addNodeRequest(cyId, props, attr) {

        it('agent.addNode', function (done) {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                props.cyId = cyId;
                agent.sendRequest("agentAddNodeRequest", props,   function (nodeId) {
                    setTimeout(function () { //should wait here to synchronize server and client model
                        let val = modelManager.getModelNode(nodeId, cyId);

                        expect(val).to.be.ok;
                        expect(val.data.class).to.equal(props.data.class);
                        expect(val.position.x).to.equal(props.position.x);
                        expect(val.position.y).to.equal(props.position.y);
                        done();
                    }, 100);
                });
            });
        });

    }


    function addEdgeRequest(cyId, props, sourceInd, targetInd) {
        it('agent.addEdge', function (done) {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                let nodes = modelManager.getModelNodesArr(cyId);
                let source = nodes[sourceInd].data.id;
                let target = nodes[targetInd].data.id;
                props.data.source = source;
                props.data.target = target;
                props.id = source + "-" + target;
                props.cyId = cyId;
                agent.sendRequest("agentAddEdgeRequest", props,   function (edgeId) {
                    setTimeout(function () { //should wait here as well
                        let val = modelManager.getModelEdge(edgeId, cyId);
                        expect(props.id).to.equal(edgeId);
                        expect(val).to.be.ok;
                        expect(val.data.class).to.equal(props.data.class);
                        expect(val.data.source).to.equal(props.data.source);
                        expect(val.data.target).to.equal(props.data.target);
                        done();
                    }, 100);
                });
            });
        });
    }

    //Delete 3 elements
    function deleteElesRequest(cyId,type, edgeInd, node1Ind, node2Ind){
        it('agent.agentDeleteElesRequest', function (done) {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                let nodes = modelManager.getModelNodesArr(cyId);
                let edges = modelManager.getModelEdgesArr(cyId);

                let eles  = [edges[edgeInd].data.id, nodes[node1Ind].data.id, nodes[node2Ind].data.id] ;
                agent.sendRequest("agentDeleteElesRequest", {elementIds: eles, type: type, cyId: cyId}, function () {
                    setTimeout(function () { //should wait here as well
                        let valEdge = modelManager.getModelEdge(eles[0], cyId);
                        expect(valEdge).to.be.not.ok;
                        let valNode1 = modelManager.getModelNode(eles[1], cyId);
                        expect(valNode1).to.be.not.ok;
                        let valNode2 = modelManager.getModelNode(eles[2], cyId);
                        expect(valNode2).to.be.not.ok;

                        done();

                    }, 100);

                });
            });
        });
    }

    function undoDeleteRequest(cyId) {
        it('agent.undoDeleteRequest', function (done) {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                agent.sendRequest("agentUndoRequest", null, function () {
                    setTimeout(function () { //should wait here as well
                        let nodes = modelManager.getModelNodesArr(cyId);
                        console.log(nodes);
                        expect(nodes.length).to.equal(3);

                        let edges = modelManager.getModelEdgesArr(cyId);
                        expect(edges.length).to.equal(1);
                        console.log(edges);

                        done();
                    }, 100);

                });
            });
        });
    }

    function redoDeleteRequest(cyId) {
        it('agent.redoDeleteRequest', function (done) {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                agent.sendRequest("agentRedoRequest", null, function (undoActionStr) {
                    setTimeout(function () { //should wait here as well
                        let nodes = modelManager.getModelNodesArr(cyId);
                        expect(nodes.length).to.equal(0);

                        let edges = modelManager.getModelEdgesArr(cyId);
                        expect(edges.length).to.equal(0);

                        done();
                    }, 100);

                });
            });
        });
    }

    function moveNodeRequest(cyId,pos){
        it('agent.moveNodeRequest', function (done) {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                let nodeId = modelManager.getModelNodesArr(cyId)[0].id;
                agent.sendRequest("agentMoveNodeRequest", {id: nodeId, cyId: cyId,  pos:pos}, function(){
                    setTimeout(function () { //should wait here as well
                        let val = modelManager.getModelNodeAttribute("position", nodeId, cyId);
                        expect(val).to.be.deep.equal(pos);
                        done();
                    },100);
                });
            });
        });
    }


    function alignRequest(cyId){
        it('agent.alignRequest', function (done) {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                let nodeId = modelManager.getModelNodesArr(cyId)[0].id;
                agent.sendRequest("agentAlignRequest", {nodeIds: '*', cyId: cyId, alignTo:nodeId, horizontal:"none", vertical:"center"}, function(res){
                    setTimeout(function () { //should wait here as well
                        expect(res).to.equal("success");
                        done();
                    },100);
                });

            });
        });
    }

    function layoutRequest(cyId) {
        it('agent.layoutRequest', function (done) {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                agent.sendRequest("agentRunLayoutRequest", {cyId:cyId}, function (val) {
                    setTimeout(function () { //should wait here as well
                        expect(val).to.equal("success");
                        done();
                    }, 100);
                });
            });
        });
    }

    function addCompound(cyId,type, inds){

        it('agent.addCompoundRequest', function(done) {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                //add first two nodes
                let  elementIds = [];
                inds.forEach(function(ind){
                    elementIds.push( modelManager.getModelNodesArr(cyId)[ind].id);
                });


                agent.sendRequest("agentAddCompoundRequest", {val:type, cyId: cyId, elementIds:elementIds}, function(data){
                    setTimeout(function () {

                        let node = modelManager.getModelNode(elementIds[0], cyId);

                        expect(data).to.equal("success");
                        expect(node.data.parent).to.be.ok;
                        let parent = modelManager.getModelNode(node.data.parent, cyId);
                        expect(parent.data.class).to.equal(type);
                        done();
                    },500);
                });
            });
        });
    }

    function undoAddCompound(cyId, ind) {
        it('agent.undoAddCompound', function (done) {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                agent.sendRequest("agentUndoRequest", null, function (undoActionStr) {
                    setTimeout(function () { //should wait here as well
                        let arr = modelManager.getModelNodesArr(cyId);

                        expect(arr[ind].data.parent).to.not.be.ok;

                        done();
                    }, 500);

                });
            });
        });
    }

    function changeNodeAttributes(cyId, ind) {

        it('agent.changeNodeAttributeRequest', function (done) {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                let id = modelManager.getModelNodesArr(cyId)[ind].id;

                let attr = [
                    {str: "highlightColor", val: '#991111'},
                    {str: "data.label", val: "abc"},
                    {str: "data.bbox.w", val: 400},
                    {str: "data.bbox.h", val: 200},
                    {str: "data.border-color", val: '#119911'},
                    {str: "data.font-family", val: "Times"},
                    {str: "data.font-weight", val: "bold"},
                    {str: "data.font-size", val: 10},
                    {str: "data.font-style", val: "normal"},
                    {str: "data.border-width", val: 5},
                    {str: "data.background-color", val:  '#111199'},
                    {str: "data.background-opacity", val: 0.2},
                    {str: "data.clonemarker", val: true}
                    //TODO: check this and statesandinfos later
                    // {str: "data.parent", val: parentId},
                    // {str: "data.statesandinfos", val:
                    //     [{clazz: 'state letiable', state: {value:'val', letiable:'let'}, bbox:{w:40, h:20}, parent: id
                    //     }, {clazz: 'unit of information', label: {text:'label'}, bbox:{w:40, h:20}, parent: id}]
                    // },
                ];


                for (let i = 0; i < attr.length; i++) {
                    let sendRequests = function (id, cyId, attStr, attVal, index) {
                        //Call like this because of asynchronicity
                        agent.sendRequest("agentChangeNodeAttributeRequest", {
                            id: id,
                            cyId: cyId,
                            attStr: attStr,
                            attVal: attVal
                        }, function () {
                            setTimeout(function () { //should wait here as well
                                let val = modelManager.getModelNodeAttribute(attStr, id, cyId);
                                expect(val).to.deep.equal(attVal);
                                if(index >= attr.length - 1)
                                    done();
                            }, 100);
                        });
                    }(id, cyId, attr[i].str, attr[i].val, i)
                }
            });
        });
    }

    function changeEdgeAttributes(cyId, ind) {

        it('agent.changeEdgeAttributeRequest', function (done) {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                let id = modelManager.getModelEdgesArr(cyId)[ind].id;

                let attr = [
                    {str: "highlightColor", val: '#991111'},
                    {str: "data.cardinality", val: 5},
                    {str: "data.width", val: 10},
                    {str: "data.line-color", val: '#119911'}

                    //Edge's source and targets should not be updated like this
                    //Chise does not allow this
                    //This also causes problem when we try to delete elements
                    // {str: "data.source", val: newSourceInd},
                    // {str: "data.target", val: newTargetInd},
                    // {str: "data.portsource", val: newSourceInd},
                    // {str: "data.porttarget", val: newTargetInd}

                ];


                for (let i = 0; i < attr.length; i++) {
                    let sendRequests = function (id, cyId, attStr, attVal, index) {
                        //Call like this because of asynchronicity
                        agent.sendRequest("agentChangeEdgeAttributeRequest", {
                            id: id,
                            cyId: cyId,
                            attStr: attStr,
                            attVal: attVal
                        }, function () {
                            setTimeout(function () { //should wait here as well
                                let val = modelManager.getModelEdgeAttribute(attStr, id, cyId);
                                expect(val).to.deep.equal(attVal);
                                if(index >= attr.length - 1)
                                    done();
                            }, 100);
                        });
                    }(id, cyId, attr[i].str, attr[i].val, i)
                }
            });
        });
    }

    function hideShow(cyId){
        it('agent.hide', function(done) {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                let id = modelManager.getModelNodesArr(cyId)[0].id;

                agent.sendRequest("agentUpdateVisibilityStatusRequest", {
                    val: "hide",
                    cyId: cyId,
                    elementIds: [id]
                }, function (out) {
                    setTimeout(function () { //should wait here as well
                        var vStatus = modelManager.getModelNodeAttribute("visibilityStatus", id,cyId);
                        expect(vStatus).to.equal("hide");
                        done();
                    }, 100);
                });
            });
        });

        it('agent.show', function(done) {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                let id = modelManager.getModelNodesArr(cyId)[0].id;

                agent.sendRequest("agentUpdateVisibilityStatusRequest", {
                    val: "show",
                    cyId: cyId,
                    elementIds: [id]
                }, function (out) {
                    setTimeout(function () { //should wait here as well
                        var vStatus = modelManager.getModelNodeAttribute("visibilityStatus", id, cyId);
                        expect(vStatus).to.equal("hide");
                        done();
                    }, 100);
                });
            });
        });


        it('agent.show', function(done) {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                let id = modelManager.getModelNodesArr(cyId)[0].id;

                agent.sendRequest("agentUpdateVisibilityStatusRequest", {
                    val: "showAll",
                    cyId: cyId
                }, function (out) {
                    setTimeout(function () { //should wait here as well
                        var vStatus = modelManager.getModelNodeAttribute("visibilityStatus", id, cyId);
                        expect(vStatus).to.equal("show");
                        done();
                    }, 100);
                });
            });
        });
    }

    function highlight(cyId){
        it('agent.highlightNeighbors', function(done) {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                let id = modelManager.getModelNodesArr(cyId)[0].id;
                let neighborId = modelManager.getModelNodesArr(cyId)[2].id;

                agent.sendRequest("agentUpdateHighlightStatusRequest", {cyId: cyId, val:"neighbors", elementIds:[id]}, function(out){
                    setTimeout(function () { //should wait here as well
                        var vStatus = modelManager.getModelNodeAttribute("highlightStatus", neighborId, cyId);
                        expect(vStatus).to.equal("highlighted") ;
                        done();
                    },100);
                });

            });
        });

        it('agent.highlightProcesses', function(done) {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                let id = modelManager.getModelNodesArr(cyId)[0].id;
                let processId = modelManager.getModelNodesArr(cyId)[2].id;

                agent.sendRequest("agentUpdateHighlightStatusRequest", {cyId:cyId, val:"processes", elementIds:[id]}, function(out){
                    setTimeout(function () { //should wait here as well
                        var vStatus = modelManager.getModelNodeAttribute("highlightStatus", processId, cyId);
                        expect(vStatus).to.equal("highlighted") ;
                        done();
                    },100);
                });

            });
        });

        it('agent.removeHighlights', function(done) {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                let id = modelManager.getModelNodesArr(cyId)[2].id;


                agent.sendRequest("agentUpdateHighlightStatusRequest", {val:"remove", cyId:cyId}, function(out){
                    setTimeout(function () { //should wait here as well
                        var vStatus = modelManager.getModelNodeAttribute("highlightStatus", id,cyId);
                        expect(vStatus).to.not.equal("highlighted") ;
                        done();
                    },100);
                });

            });
        });

    }


    function searchByLabel(cyId, ind, label) {
        it('agent.searchByLabel', function (done) {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                let id = modelManager.getModelNodesArr(cyId)[ind].id;

                agent.sendRequest("agentSearchByLabelRequest", {label:label, cyId:cyId}, function() {
                    setTimeout(function () { //should wait here as well
                        var vStatus = modelManager.getModelNodeAttribute("highlightStatus", id, cyId);
                        expect(vStatus).to.equal("highlighted") ;
                        done();
                    },100);
                });

            });
        });
    }


    function expandCollapse(cyId, ind) {
        it('agent.collapse', function (done) {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                let id = modelManager.getModelNodesArr(cyId)[ind].id;
                agent.sendRequest("agentUpdateExpandCollapseStatusRequest", {val:"collapse",cyId:cyId, elementIds:[id]}, function(){
                    setTimeout(function () { //should wait here as well
                        var status = modelManager.getModelNodeAttribute("expandCollapseStatus", id, cyId);
                        expect(status).to.equal("collapse") ;
                        done();
                    },100);
                });
            });
        });

        it('agent.expand', function (done) {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                let id = modelManager.getModelNodesArr(cyId)[ind].id;
                agent.sendRequest("agentUpdateExpandCollapseStatusRequest", {val:"expand", elementIds:[id], cyId:cyId}, function(out){
                    setTimeout(function () { //should wait here as well
                        var status = modelManager.getModelNodeAttribute("expandCollapseStatus", id, cyId);
                        expect(status).to.not.equal("collapse") ;
                        done();
                    },100);
                });
            });
        });
    }
    function merge(cyId){
     it('agent.merge', function(done) {
        expect(globalTestData.sbgnData2).to.be.ok;

        agent.sendRequest('agentMergeGraphRequest', {type: 'sbgn', graph: globalTestData.sbgnData2, cyId:cyId}, function (data) {
            expect(data).to.be.ok;
            done();
        });
     });
    }

    function newFile(cyId){
        it('agent.cleanAllRequest', function(done) {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                let jQuery = window.jQuery;

                agent.sendRequest("agentCleanAllRequest", {}, function(){
                    setTimeout(function () { //should wait here as well
                        let cy = modelManager.getModelCy(cyId);
                        expect(jQuery.isEmptyObject(window.appUtilities.getActiveCy().nodes) && jQuery.isEmptyObject(window.appUtilities.getActiveCy().edges)).to.equal(true);
                        done();
                    },100);
                });
            });
        });
    }



    function disconnect(){
        it('Agent disconnect', function(done) {
            agent.disconnect(function(){
                expect(agent.socket.subscribed).to.be.not.ok;
                done();
            });


        });

    }

    let cyId  = 0;
    newAgent();
    checkAgentProperties();
    loadModel();
    changeName();
    sendMessage();

    addNodeRequest(cyId, {position: {x: 30, y: 40 }, data:{class: "macromolecule"}});
    addNodeRequest(cyId, {position: {x: 50, y: 60 }, data:{class: "macromolecule"}});
    addNodeRequest(cyId, {position: {x: 90, y: 100} , data:{class: "process"}});
    addEdgeRequest(cyId, {data:{class: "consumption"}}, 0, 2);

    addCompound(cyId, "compartment", [0,1]); //complexes cannot have edges
    addCompound(cyId, "complex", [1,2]); //complexes cannot have edges
    //
    // undoAddCompound(cyId, 2);
    // undoAddCompound(cyId, 1);
    //
    moveNodeRequest(cyId, {x:100, y:80});
    alignRequest(cyId);
    layoutRequest(cyId);

    changeNodeAttributes(cyId, 1);
    changeEdgeAttributes(cyId, 0);
    //
    //
    hideShow(cyId);
    highlight(cyId);
    searchByLabel(cyId, 1, "abc");
    //
    deleteElesRequest(cyId, "simple", 0, 0, 1);
    // undoDeleteRequest(cyId);
    //
    // deleteElesRequest(cyId, "smart", 0, 1, 2);
    // undoDeleteRequest(cyId);
    // redoDeleteRequest(cyId);
    //
    //
    // addNodeRequest(cyId, {position: {x: 30, y: 40 }, data:{class: "macromolecule"}});
    // addNodeRequest(cyId, {position: {x: 50, y: 60 }, data:{class: "macromolecule"}});
    // addCompound(cyId, "complex", [0,1]); //complexes cannot have edges
    // expandCollapse(cyId, 2); //we can only expand collapse compound nodes

    newFile(cyId);
    //
    merge(cyId);
    disconnect();



});
