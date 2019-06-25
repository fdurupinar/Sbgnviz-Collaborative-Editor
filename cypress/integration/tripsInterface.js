// /***
//  * Tests for communication with Bob
//  * This is different from other tests as it evaluates communication through regular system operation
//  */
//
//
// describe('TRIPS Interface Test', function () {
//     function connect(){
//         it('Access global window object', function (done) {
//             cy.visit('http://localhost:3000');
//             cy.window().should(function (window) {
//                 expect(window.testApp).to.be.ok;
//                 expect(window.testApp.model).to.be.ok;
//                 expect(window.testApp.docId).to.be.ok;
//                 expect(window.$).to.be.ok;
//                 expect(window.location.hostname).to.eq('localhost');
//
//                 done();
//             });
//         });
//     }
//
//     function testGetTripsAgent() {
//        it('get Trips Agent', function (done) {
//            cy.window().should(function (window) {
//                let tripsAgent = window.testApp.tripsAgent;
//                expect(tripsAgent).to.be.ok;
//                expect(tripsAgent.agentName).to.equal("Bob");
//                expect(tripsAgent.agentId).to.equal("Bob123");
//                expect(tripsAgent.socket).to.be.ok;
//                done();
//
//            });
//
//        });
//     }
//
//     function resetConversation(delay){
//         it('Reset conversation', function (done) {
//             cy.window().should(function (window) {
//                 let app = window.testApp;
//                 let $ = window.$;
//                 app.resetConversationOnTrips();
//
//                 setTimeout(function () {
//                     let pageList = app.model.get('_page.list');
//
//
//                     expect(pageList[pageList.length - 1].comment).to.equal("Tell me what you want to do now.");
//
//                     let images = app.modelManager.getImages();
//
//                     let modelCy = app.modelManager.getModelCy();
//                     let provenance = app.model.get('_page.doc.provenance');
//
//                     expect(!modelCy ||!modelCy.nodes || Object.keys(modelCy.nodes).length === 0).to.be.ok;
//                     expect(!modelCy ||!modelCy.edges || Object.keys(modelCy.edges).length === 0).to.be.ok;
//
//                     expect(provenance).to.be.not.ok;
//                     expect(images).to.be.not.ok;
//
//                     expect($("#static-image-container-0").length).to.be.equal(0);
//                     expect($("#static-image-container-1").length).to.be.equal(0);
//                     expect($("#static-image-container-2").length).to.be.equal(0);
//                     expect($("#static-image-container-3").length).to.be.equal(0);
//                     expect($("#static-image-container-4").length).to.be.equal(0);
//                     done();
//                 }, delay);
//
//
//
//             });
//         });
//     }
//
//     function speak(comment, answer, backInd, milliseconds){
//
//         it('speak', function (done) {
//
//             cy.window().should(function (window) {
//                 let app = window.testApp;
//                 let tripsAgent = app.tripsAgent;
//                 let $ = window.$;
//                 app.model.set('_page.newComment', comment);
//                 $('#send-message').trigger('click');
//
//
//                 setTimeout(function(){
//
//                     let pageList = app.model.get('_page.list');
//                     let bobMessages = pageList.filter(msg=>
//                         msg.userId === tripsAgent.agentId);
//
//                     expect(bobMessages).to.be.ok;
//                     expect(bobMessages[bobMessages.length - backInd].comment.toLowerCase()).to.include(answer.toLowerCase());
//                     done();
//
//                 }, milliseconds);
//                 //wait for Bob's answer
//
//             });
//         });
//
//     }
//
//     function testDisplayImage(milliseconds){
//         it('testDisplayImage', function(done){
//             cy.window().should(function (window) {
//                 let modelManager = window.testApp.modelManager;
//                 let images = modelManager.getImages();
//                 let $ = window.$;
//                 setTimeout(() => {
//                 expect(images).to.be.ok;
//                 expect(images.length).to.equal(1);
//                 expect(images[0].tabIndex).to.equal(1);
//                 expect(images[0].tabLabel).to.equal('RXN');
//
//                     expect($("#static-image-container-1")).to.be.ok;
//                     done();
//                 }, milliseconds);
//
//             });
//
//         });
//     }
//
//     function testDisplaySbgn(milliseconds){
//         it('testDisplaySbgn', function(done){
//             cy.window().should(function (window) {
//                 let modelManager = window.testApp.modelManager;
//                 let modelCy = modelManager.getModelCy();
//                 setTimeout(() => {
//                     expect(Object.keys(modelCy.nodes).length).to.be.greaterThan(0);
//                     expect(Object.keys(modelCy.edges).length).to.be.greaterThan(0);
//
//                     done();
//                 }, milliseconds);
//
//             });
//
//         });
//     }
//
//     connect();
//     testGetTripsAgent();
//     resetConversation(1000);
//     speak("hello", "hello",1, 1000);
//     speak("How does MAPK1 affect JUND?", "MAPK1 phosphorylated on Y187 phosphorylates JUND on S100.", 3, 5000);
//     speak("What genes does MAPK1 phosphorylate?", "MAPK1 phosphorylated on Y187", 3, 5000);
//     speak("What genes phosphorylate JUND?", "MAPK3 phosphorylated on T202", 3, 5000);
//     speak("What genes phosphorylate MAPK1?", "I don't have specific information on that", 2, 5000);
//     speak("Let's build a model.", "OK", 1, 5000);
//     speak("AKT1 phosphorylates MAPK1.", "I created a model", 1, 5000);
//     testDisplayImage(0);
//     testDisplaySbgn(0);
//     resetConversation(1000);
//     speak("Let's learn about AKT1.", "The largest explainable correlation of AKT-1 is the correlation with BRAF", 2, 5000);
//     speak("What is the next correlation of AKT1?", "PTPN", 2, 5000);
//     speak("What is the next correlation of AKT1?", "unexplainable", 2, 7000);
//
//
//
// });
