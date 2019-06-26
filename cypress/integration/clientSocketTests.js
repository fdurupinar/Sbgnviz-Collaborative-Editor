/***
 * Test for sending and receiving messages
 */

let globalTestData = require('../testData/globalTestData.js');
describe('Client side socket listener', () => {

    function connect(){
        it('Access global window object',  (done) => {
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

    function loadFile(){
        it("Load file", (done)=> {
            cy.window().should((window) => {
                let clientSideSocketListener = window.testApp.clientSideSocketListener;

                let data = {content: globalTestData.sbgnData, cyId:0 };
                clientSideSocketListener._loadFile(data, (val) => {
                    expect(val).to.eq("success");
                    done();
                });

            });
        });

    }


    function runLayout(){
        it("Run layout", (done)=> {
            cy.window().should((window) => {
                let clientSideSocketListener = window.testApp.clientSideSocketListener;
                let data = { cyId:0 };
                clientSideSocketListener._runLayout(data, (val) => {
                    expect(val).to.eq("success");
                    done();
                });

            });
        });

    }


    function cleanModel(){
        it("Clean model", (done)=> {
            cy.window().should((window) => {
                let clientSideSocketListener = window.testApp.clientSideSocketListener;
                let modelManager = window.testApp.modelManager;

                let data = {content: globalTestData.sbgnData, cyId:0 };
                clientSideSocketListener._cleanModel(data, (val) => {
                    expect(modelManager.getModelCy(0).nodes).to.be.not.ok;
                    expect(modelManager.getModelCy(0).edges).to.be.not.ok;
                    expect(modelManager.getImages(0)).to.be.not.ok;
                    expect(val).to.eq("success");

                    done();
                });

            });
        });
    }

    function addOperations(){

        let nodeId = "";
        it("Add  node", (done)=> {
            cy.window().should((window) => {
                let clientSideSocketListener = window.testApp.clientSideSocketListener;
                let chiseInstance = window.appUtilities.getChiseInstance(0);

                // get the associated cy instance
                let cyInstance = chiseInstance.getCy();

                let modelManager = window.testApp.modelManager;

                let data = { cyId:0 , position: {x: 100, y: 200} , data: {class: "macromolecule"}};
                clientSideSocketListener._addNode(data, (id) => {
                    nodeId = id;
                    expect(id).to.be.ok;
                    
                    expect(cyInstance.getElementById(id)).to.be.ok;

                    expect(modelManager.getModelNodeAttribute("data.id", id, 0)).to.equal(cyInstance.getElementById(id).data("id"));
                    expect(cyInstance.getElementById(id).data("class")).to.equal("macromolecule");
                    expect(cyInstance.getElementById(id).data("class")).to.equal(modelManager.getModelNodeAttribute("data.class", id, 0));

                    expect(cyInstance.getElementById(id).position("x")).to.equal(100);
                    expect(cyInstance.getElementById(id).position("x")).to.equal(modelManager.getModelNodeAttribute("position.x", id, 0));

                    expect(cyInstance.getElementById(id).position("y")).to.equal(200);
                    expect(cyInstance.getElementById(id).position("y")).to.equal(modelManager.getModelNodeAttribute("position.y", id, 0));
                    done();

                });

            });
        });


        it("Clone node", (done)=> {
            cy.window().should((window) => {
                let clientSideSocketListener = window.testApp.clientSideSocketListener;

                clientSideSocketListener._clone({elementIds:[nodeId], cyId:0}, (val) => {
                    expect(val).to.eq("success");
                    done();

                });

            });
        });


        it("Add compound", (done)=> {
            cy.window().should((window) => {
                let clientSideSocketListener = window.testApp.clientSideSocketListener;

                //get all node ids
                let nodesArr = window.testApp.modelManager.getModelNodesArr(0);
                let elementIds = [];
                nodesArr.forEach((node)=> elementIds.push(node.id));

                clientSideSocketListener._addCompound({elementIds: elementIds, cyId: 0, val:"complex"}, (val) => {

                    let newNodeCnt = window.testApp.modelManager.getModelNodesArr(0).length;
                    expect(newNodeCnt).to.eq(nodesArr.length + 1);
                    expect(val).to.eq("success");
                    done();


                });

            });
        });
    }


    function displayOncoprint(){
        it('Oncoprint',  (done) => {

            cy.window().should( (window) => {
                let modelManager = window.testApp.modelManager;
                // expect(document.getElementById('oncoprint-tab').style.visibility).to.be.equal('hidden');


                let clientSideSocketListener = window.testApp.clientSideSocketListener;
                clientSideSocketListener._displayOncoprint(globalTestData.gaData, ()=>{

                    setTimeout(()=>{

                        expect(modelManager.getOncoprint()).to.be.ok;
                        expect(window.testApp.oncoprintHandler.oncoprint.getTracks().length > 0).to.be.ok;
                        done();
                    }, 5000);

                });

            });

        });
    }



    connect();
    loadFile();
    runLayout();
    cleanModel();

    addOperations();

    displayOncoprint();


});
