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

                let data = {cyId:0 };
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

    function addImage() {
        it('Add image',  () => {
            cy.fixture('modelRXN.png').then((content) => {

                cy.window().should( (window)  => {
                    let modelManager = window.testApp.modelManager;
                    let $ = window.$;
                    let imageTabList = ['RXN', 'CM', 'IM', 'SIM'];

                    // because file reading is not possible on the client side, store img in mwmory

                    for (let i = 0; i < imageTabList.length; i++) {

                        let imgData = {
                            img: ("data:image/png;base64," + content),
                            tabIndex: i,
                            tabLabel: imageTabList[i],
                            fileName: "modelRXN"
                        };


                        let clientSideSocketListener = window.testApp.clientSideSocketListener;
                        clientSideSocketListener._addImage(imgData, () => {

                            let images = modelManager.getImages();
                            let lastImage = images[i];

                            expect(images).to.be.ok;
                            expect(lastImage.tabIndex).to.equal(imgData.tabIndex);
                            expect(lastImage.tabLabel).to.equal(imgData.tabLabel);
                            setTimeout(() => {
                                expect($("#static-image-container-" + lastImage.tabIndex)).to.be.ok;
                            }, 100);

                        });
                    }


                });

            });

        });
    }

    function openPCQuery(){
        it('PC Query SBGN',  (done) => {
            cy.window().should( (window) => {
                let clientSideSocketListener = window.testApp.clientSideSocketListener;
                let data = {graph: globalTestData.sbgnData, cyId:0, type:'sbgn' };
                clientSideSocketListener._openPCQueryWindow(data, (val) => {
                    expect(val).to.eq("success");

                    done();

                });

            });
        });

        it('PC Query SIF',  (done) => {
            cy.window().should( (window) => {
                let clientSideSocketListener = window.testApp.clientSideSocketListener;
                let data = {graph: globalTestData.sifData, cyId:0, type:'sif' };
                clientSideSocketListener._openPCQueryWindow(data, (val) => {
                    expect(val).to.eq("success");

                    done();

                });

            });
        });
    }


    function displayGraphs(){

        it('Display SIF',  (done) => {
            cy.window().should( (window) => {
                let clientSideSocketListener = window.testApp.clientSideSocketListener;
                let data = {sif: globalTestData.sifData, cyId:0};
                clientSideSocketListener._displaySif(data, (val) => {
                    expect(val).to.eq("success");
                    done();

                });

            });

        });

        it('Display SBGN',  (done) => {
            cy.window().should( (window) => {
                let clientSideSocketListener = window.testApp.clientSideSocketListener;
                let data = {sbgn: globalTestData.sbgnData, cyId:0 };
                clientSideSocketListener._displaySbgn(data, (val) => {
                    expect(val).to.eq("success");
                    done();

                });

            });

        });


        it('Merge SBGN',  (done) => {
            cy.window().should( (window) => {
                let clientSideSocketListener = window.testApp.clientSideSocketListener;
                let data = {graph: globalTestData.sbgnData2, cyId:0 };
                setTimeout(()=>{
                    clientSideSocketListener._mergeSbgn(data, (val) => {
                        expect(val).to.eq("success");
                        done();

                    });
                }, 1000);

            });

        });






    }


    function displayAndCleanProvenance(){

        it('Display provenance',  (done) => {
            cy.window().should( (window) => {
                let clientSideSocketListener = window.testApp.clientSideSocketListener;


                let data = {title: "Test", html:"<p>Hello</p>"}
                clientSideSocketListener._addProvenance(data, (val) => {

                    let model = window.testApp.model;
                    expect(model.get('_page.doc.provenance').length).to.eq(1);
                    expect(val).to.eq("success");

                    done();

                });


            });

        });

        it("Clean model and provenance", (done)=> {
            cy.window().should((window) => {
                let clientSideSocketListener = window.testApp.clientSideSocketListener;
                let modelManager = window.testApp.modelManager;

                let data = { cyId:0 , shouldCleanProvenance:true};
                setTimeout(()=>{ //let the provenance to be loaded first
                    clientSideSocketListener._cleanModel(data, (val) => {


                        expect(modelManager.getModelCy(0).nodes).to.be.not.ok;
                        expect(modelManager.getModelCy(0).edges).to.be.not.ok;
                        expect(modelManager.getImages(0)).to.be.not.ok;
                        expect(val).to.eq("success");
                        let model = window.testApp.model;
                        expect(model.get('_page.doc.provenance')).to.be.not.ok;

                        done();
                    });
                }, 1000);

            });
        });

    }


    // Visualization Agent Tests
    function visAgentOperations(){

        it("Move gene", (done)=> {
            cy.window().should((window) => {
                let clientSideSocketListener = window.testApp.clientSideSocketListener;

                let data = {sbgn: globalTestData.sbgnData2, cyId:0 };

                clientSideSocketListener._displaySbgn(data, () => {
                });

                setTimeout(()=> { //wait for the file to load
                    let data2  = {name:"ERK", location:"top", cyId : 0};
                    clientSideSocketListener._moveGene(data2, (val)=>{
                        expect(val).to.eq("success");
                        done();
                    });

                }, 1000);


                });

        });


        it("Move gene stream", (done)=> {
            cy.window().should((window) => {
                let clientSideSocketListener = window.testApp.clientSideSocketListener;

                setTimeout(()=> { //wait for the file to load
                    let data  = {name:"ERK", location:"top", direction:"up", cyId : 0};
                    clientSideSocketListener._moveGeneStream(data, (val)=>{
                        expect(val).to.eq("success");
                        done();
                    });

                }, 1000);


            });

        });

        it("Highlight gene stream", (done)=> {
            cy.window().should((window) => {
                let clientSideSocketListener = window.testApp.clientSideSocketListener;

                setTimeout(()=> { //wait for the file to load
                    let data  = {name:"ERK", direction:"down", cyId : 0};
                    clientSideSocketListener._highlightGeneStream(data, (val)=>{
                        expect(val).to.eq("success");
                        done();
                    });

                }, 1000);


            });

        });

        it("Change lock state", (done)=> {
            cy.window().should((window) => {
                let clientSideSocketListener = window.testApp.clientSideSocketListener;

                setTimeout(()=> { //wait for the file to load
                    let data  = {id:"id_1", lock: true, cyId : 0};
                    clientSideSocketListener._changeLockState(data, (val)=>{
                        expect(val).to.eq("success");
                        done();
                    });

                }, 1000);


            });

        });


        it("Add cellular location", (done)=> {
            cy.window().should((window) => {
                let clientSideSocketListener = window.testApp.clientSideSocketListener;

                let model = window.testApp.model;

                setTimeout(()=> { //wait for the file to load
                    let data  = {genes:["ERK", "MEK"], compartment:"nucleus", cyId : 0};
                    clientSideSocketListener._addCellularLocation(data, (val)=>{

                        expect(model.get('_page.doc.cellularLocations.nucleus')).to.be.ok;
                        expect(model.get('_page.doc.cellularLocations.nucleus').lastIndexOf("ERK")).to.gte(0);
                        expect(model.get('_page.doc.cellularLocations.nucleus').lastIndexOf("MEK")).to.gte(0);

                        expect(val).to.eq("success");
                        done();
                    });

                }, 1000);

            });

        });


        it("Move out of cellular location", (done)=> {
            cy.window().should((window) => {
                let clientSideSocketListener = window.testApp.clientSideSocketListener;

                let model = window.testApp.model;

                setTimeout(()=> { //wait for the file to load
                    let data  = {genes:["ERK"], compartment:"nucleus", cyId : 0};
                    clientSideSocketListener._moveOutOfCellularLocation(data, (val)=>{

                        expect(model.get('_page.doc.cellularLocations.nucleus')).to.be.ok;
                        expect(model.get('_page.doc.cellularLocations.nucleus').lastIndexOf("ERK")).to.lte(0);
                        expect(model.get('_page.doc.cellularLocations.nucleus').lastIndexOf("MEK")).to.gte(0);

                        expect(val).to.eq("success");
                        done();
                    });

                }, 2000); //wait for them to be moved in

            });

        });


    }


    //
    connect();
    // loadFile();
    // runLayout();
    // cleanModel();
    //
    // addOperations();
    //
    //
    // addImage();
    //
    //
    // openPCQuery();
    // displayGraphs();
    // displayOncoprint();
    //
    // displayAndCleanProvenance();

    visAgentOperations();


});
