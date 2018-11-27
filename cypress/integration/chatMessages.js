/***
 * Test for sending and receiving messages
 */


describe('Chat Test', function () {
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



    function sendMessage(text) {

        it('Send message', function (done) {
            cy.window().should(function (window) {
                let app = window.testApp;
                let $ = window.$;
                app.model.set('_page.newComment', text);
                $('#send-message').trigger('click');
                //we should wait a little while for the message to get on the list
                setTimeout(() => {
                    let pageList = app.model.get('_page.list');
                    expect(pageList).to.be.ok;
                    expect(pageList[pageList.length - 1].comment).to.equal(text);
                    done();
                }, 100);
            });
        });
    }

    function messageContent() {
        it('Message content', function () {
            cy.window().should(function (window) {
                let app = window.testApp;
                let messages = app.model.get('_page.list');
                let msg1 = messages[messages.length-1];
                let userId = app.model.get('_session.userId');
                expect(userId).to.be.ok;
                expect(userId).to.equal(msg1.userId);

                let userName = app.model.get('_page.doc.users.' + userId + '.name');
                expect(userName).to.be.ok;
                expect(userName).to.equal(msg1.userName);
            });
        });

    }

    connect();
    sendMessage("test1");
    sendMessage("test2");


    messageContent();


});
