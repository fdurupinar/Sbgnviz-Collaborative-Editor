/***
 * Tests for communication with Bob
 * This is different from other tests as it evaluates communication through regular system operation
 */


describe('TRIPS Interface Test', function () {
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

    function testGetTripsAgent() {
       it('get Trips Agent', function (done) {
           cy.window().should(function (window) {
               let tripsAgent = window.testApp.tripsAgent;
               expect(tripsAgent).to.be.ok;
               expect(tripsAgent.agentName).to.equal("Bob");
               expect(tripsAgent.agentId).to.equal("Bob123");
               expect(tripsAgent.socket).to.be.ok;
               done();

           });

       });
    }

    function resetConversation(delay){
        it('Reset conversation', function (done) {
            cy.window().should(function (window) {
                let app = window.testApp;
                let $ = window.$;
                app.resetConversationOnTrips();

                setTimeout(function () {
                    let pageList = app.model.get('_page.list');


                    expect(pageList[pageList.length - 1].comment).to.equal("Tell me what you want to do now.");

                    let images = app.modelManager.getImages();

                    let modelCy = app.modelManager.getModelCy();
                    let provenance = app.model.get('_page.doc.provenance');

                    expect(!modelCy ||!modelCy.nodes || Object.keys(modelCy.nodes).length === 0).to.be.ok;
                    expect(!modelCy ||!modelCy.edges || Object.keys(modelCy.edges).length === 0).to.be.ok;

                    expect(provenance).to.be.not.ok;
                    expect(images).to.be.not.ok;

                    expect($("#static-image-container-0").length).to.be.equal(0);
                    expect($("#static-image-container-1").length).to.be.equal(0);
                    expect($("#static-image-container-2").length).to.be.equal(0);
                    expect($("#static-image-container-3").length).to.be.equal(0);
                    expect($("#static-image-container-4").length).to.be.equal(0);
                    done();
                }, delay);



            });
        });
    }

    function speak(comment, answer, backInd, milliseconds){

        it('speak', function (done) {

            cy.window().should(function (window) {
                let app = window.testApp;
                let tripsAgent = app.tripsAgent;
                let $ = window.$;
                app.model.set('_page.newComment', comment);
                $('#send-message').trigger('click');


                setTimeout(function(){

                    let pageList = app.model.get('_page.list');
                    let bobMessages = pageList.filter(msg=>
                        msg.userId === tripsAgent.agentId);


                    expect(bobMessages).to.be.ok;
                    expect(bobMessages[bobMessages.length - backInd].comment.toLowerCase()).to.include(answer.toLowerCase());
                    done();

                }, milliseconds);
                //wait for Bob's answer

            });
        });

    }

    function testDisplayImage(milliseconds){
        it('testDisplayImage', function(done){
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                let images = modelManager.getImages();
                let $ = window.$;
                setTimeout(() => {
                expect(images).to.be.ok;
                expect(images.length).to.equal(3);
                expect(images[0].tabIndex).to.equal(1);
                expect(images[0].tabLabel).to.equal('RXN');

                    expect($("#static-image-container-1")).to.be.ok;
                    done();
                }, milliseconds);

            });

        });
    }

    function testDisplaySbgn(milliseconds){
        it('testDisplaySbgn', function(done){
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                let modelCy = modelManager.getModelCy(0);


                console.log(modelCy);
                let cy = window.appUtilities.getActiveCy();


                setTimeout(() => {
                    expect(cy.nodes.length > 0).to.be.ok;
                    expect(cy.edges.length > 0).to.be.ok;
                    expect(modelCy.nodes).to.be.ok;
                    expect(modelCy.edges).to.be.ok;


                    done();
                }, milliseconds);

            });

        });
    }

    //Should be called after speak - query about a relationship
    function testProvenance(){

        it('Reset conversation', function (done) {
            cy.window().should(function (window) {
                let app = window.testApp;

                let provenance = app.model.get('_page.doc.provenance');
                expect(provenance).to.be.ok;

                done();



            });
        });

    }

    connect();
    testGetTripsAgent();

    //should wait long enough
    // speak("hello", "hello",1, 4000);

    resetConversation(2000);

    speak("Let's build a model.", "Okay.", 1, 4000);
    speak("RAS activates RAF.", "Okay.", 1, 4000);

    testDisplayImage(0);

    testDisplaySbgn(2000);

    speak("What phosphorylates SOCS1?", "found", 1, 4000);

    testProvenance();



});
