/***
 * Tests for non-cy-related modelManager methods
 */




describe('modelManager User Operations Test', function () {


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
    function setName(userName) {

        it('Set name', function () {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                let userId = window.sessionUserId;
                modelManager.setName(userId, userName);
                let modelName = modelManager.getName(userId);
                expect(modelName).to.equal(userName);
            });
        });
    }


    function addUser(userId) {

        it('Add user', function () {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                modelManager.addUser(userId);

                let userIds = modelManager.getUserIds();
                expect(userIds).to.be.ok;
                expect(userIds[userIds.length - 1]).to.equal(userId);

                let user = modelManager.getUserId(userId);
                expect(user).to.be.ok;
            });
        });
    }


    function deleteUser(userId) {
        it('Delete user', function () {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                modelManager.deleteUserId(userId);

                let userIds = modelManager.getUserIds();
                expect(userIds).to.be.ok;
                expect(userIds).to.not.include(userId);

            });
        });
    }

    function deleteAllUsers() {
        it('Delete all users', function () {
            cy.window().should(function (window) {
                let modelManager = window.testApp.modelManager;
                modelManager.deleteAllUsers();

                let userIds = modelManager.getUserIds();
                expect(userIds.length).to.equal(0);

            });
        });
    }


    function addImage() {
        it('Add image', function () {
            cy.fixture('modelRXN.png').then((content) => {

                cy.window().should(function (window) {
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


                            modelManager.addImage(imgData);
                            let images = modelManager.getImages();
                            let lastImage = images[i];

                            expect(images).to.be.ok;
                            expect(lastImage.tabIndex).to.equal(imgData.tabIndex);
                            expect(lastImage.tabLabel).to.equal(imgData.tabLabel);
                            setTimeout(() => {
                                expect($("#static-image-container-" + lastImage.tabIndex)).to.be.ok;
                            }, 100);
                        }
                    });

            });

        });
    }

    connect();
    addImage();
    setName("testUser1");
    addUser("testUser2");
    addUser("testUser3");
    addUser("testUser4");
    deleteUser("testUser3");
    deleteAllUsers();
    addUser("testUser1");

});
