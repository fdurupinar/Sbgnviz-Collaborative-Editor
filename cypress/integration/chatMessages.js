/***
 * Test for sending and receiving messages
 */


describe('Chat Test', function () {


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


    sendMessage("test1");
    sendMessage("test2");


    messageContent();


});
