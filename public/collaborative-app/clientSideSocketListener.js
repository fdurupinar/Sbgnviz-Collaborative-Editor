/**
 * Created by durupina on 11/14/16.
 * Human listens to agent socket and performs menu operations requested by the agent
*/

let modelMergeFunctions = require('./model-merge-functions.js')();

module.exports =  function(app) {

    return {

        listen: function () {
            let self = this;

            self.listenToVisAgentRequests();

            app.socket.on('loadFile', function (data, callback) {
                try {
                    appUtilities.getChiseInstance(data.cyId).getSbgnvizInstance().loadSBGNMLText(data.content);

                    if (callback) callback("success");
                }
                catch (e) {
                    console.log(e);
                    if(callback) callback();

                }
            });





            app.socket.on('cleanAll', function ( data, callback) {

                self.cleanAll(callback);
            });

            app.socket.on('runLayout', function (data, callback) {
                try {
                    appUtilities.setActiveNetwork(data.cyId);
                    $("#perform-layout").trigger('click');
                    if (callback) callback("success");
                }
                catch (e) {
                    console.log(e);
                    if(callback) callback();

                }
            });


            app.socket.on('addNode', function (param, callback) {
                try {
                    //does not trigger cy events
                    let newNode = appUtilities.getChiseInstance(param.cyId).elementUtilities.addNode(param.position.x, param.position.y, param.data.class);


                    //notifies other clients
                    app.modelManager.addModelNode(newNode.id(), param.cyId, param, "me");
                    app.modelManager.initModelNode(newNode, param.cyId, "me");

                    if (callback) callback(newNode.id());
                }
                catch (e) {
                    console.log(e);
                    if(callback) callback();

                }
            });


            app.socket.on('deleteEles', function (data, callback) {
                try {
                    //unselect all others
                    appUtilities.getCyInstance(data.cyId).elements().unselect();


                    //first delete edges
                    data.elementIds.forEach(function (id) {
                        appUtilities.getCyInstance(data.cyId).getElementById(id).select();
                    });


                    if (data.type === "simple")
                        appUtilities.getChiseInstance(data.cyId).deleteElesSimple(appUtilities.getCyInstance(data.cyId).elements(':selected'));
                    else
                        appUtilities.getChiseInstance(data.cyId).deleteNodesSmart(appUtilities.getCyInstance(data.cyId).nodes(':selected'));

                    if(callback) callback("success");
                }
                catch (e) {
                    console.log(e);
                    if(callback) callback();

                }
            });

            app.socket.on('addImage', function (data, callback) {
                try {

                    let status = app.modelManager.addImage(data);
                    let images = app.modelManager.getImages();
                    app.dynamicResize();

                    if (callback) callback(status);

                }
                catch (e) {
                    console.log(e);
                    if(callback) callback();

                }
            });


            app.socket.on('align', function (data, callback) {
                try {
                    let nodes = appUtilities.getCyInstance(data.cyId).collection();
                    if (data.nodeIds === '*' || data.nodeIds === 'all')
                        nodes = appUtilities.getCyInstance(data.cyId).nodes();
                    else
                        data.nodeIds.forEach(function (nodeId) {
                            nodes.add(appUtilities.getCyInstance(data.cyId).getElementById(nodeId));
                        });

                    appUtilities.getChiseInstance(data.cyId).align(nodes, data.horizontal, data.vertical, appUtilities.getCyInstance(data.cyId).getElementById(data.alignTo));

                    if (callback) callback("success");
                }
                catch (e) {
                    console.log(e);
                    if (callback) callback();

                }

            });
            app.socket.on('updateVisibility', function (data, callback) {
                try {
                    //unselect all others
                    appUtilities.setActiveNetwork(data.cyId);
                    appUtilities.getCyInstance(data.cyId).elements().unselect();

                    if (data.val === "showAll")
                        $("#show-all").trigger('click');
                    else {
                        data.elementIds.forEach(function (id) {
                            appUtilities.getCyInstance(data.cyId).getElementById(id).select();
                        });

                        if (data.val == "show")
                            $("#show-selected").trigger('click');
                        else
                            $("#hide-selected").trigger('click');
                    }


                    if (callback) callback("success");
                }
                catch (e) {
                    console.log(e);
                    if (callback) callback();

                }
            });

            app.socket.on('searchByLabel', function (data, callback) {
                try {
                    //unselect all others

                    appUtilities.getCyInstance(data.cyId).elements().unselect();

                    appUtilities.getChiseInstance(data.cyId).searchByLabel(data.label);

                    if (callback) callback("success");
                }
                catch (e) {
                    console.log(e);
                    if (callback) callback();

                }
            });
            app.socket.on('updateHighlight', function (data, callback) {
                try {
                    //unselect all others
                    appUtilities.getCyInstance(data.cyId).elements().unselect();
                    appUtilities.setActiveNetwork(data.cyId);

                    if (data.val === "remove") {
                        $("#remove-highlights").trigger('click');
                    }
                    else {
                        data.elementIds.forEach(function (id) {
                            appUtilities.getCyInstance(data.cyId).getElementById(id).select();
                        });

                        if (data.val === "neighbors")
                            $("#highlight-neighbors-of-selected").trigger('click');
                        else if (data.val === "processes")
                            $("#highlight-processes-of-selected").trigger('click');
                    }

                    if (callback) callback("success");
                }
                catch (e) {
                    console.log(e);
                    if (callback) callback();

                }
            });

            app.socket.on('updateExpandCollapse', function (data, callback) {
                try {

                    //unselect all others
                    appUtilities.getCyInstance(data.cyId).elements().unselect();
                    appUtilities.setActiveNetwork(data.cyId);

                    data.elementIds.forEach(function (id) {
                        appUtilities.getCyInstance(data.cyId).getElementById(id).select();
                    });

                    if (data.val === "collapse")
                        $("#collapse-selected").trigger('click');
                    else
                        $("#expand-selected").trigger('click');

                    if (callback) callback("success");
                }
                catch (e) {
                    console.log(e);
                    if (callback) callback();

                }
            });


            app.socket.on('addCompound', function (data, callback) {
                try {
                    //unselect all others
                    appUtilities.getCyInstance(data.cyId).elements().unselect();

                    data.elementIds.forEach(function (elId) {
                        let el = appUtilities.getCyInstance(data.cyId).getElementById(elId);
                        if(el.isNode())
                            el.select();
                    });

                      appUtilities.getChiseInstance(data.cyId).createCompoundForGivenNodes(appUtilities.getCyInstance(data.cyId).nodes(':selected'), data.val);



                    if (callback) callback("success");
                }
                catch (e) {
                    console.log(e);
                    if (callback) callback();

                }

            });

            app.socket.on('clone', function (data, callback) {
                try {
                    appUtilities.getCyInstance(data.cyId).elements().unselect();
                    appUtilities.setActiveNetwork(data.cyId);

                    data.elementIds.forEach(function (nodeId) {
                        appUtilities.getCyInstance(data.cyId).getElementById(nodeId).select();
                    });

                    $("#clone-selected").trigger('click');


                    if (callback) callback("success");
                }
                catch (e) {
                    console.log(e);
                    if (callback) callback();

                }
            });



            //Open in another tab
            app.socket.on('openPCQueryWindow', function(data, callback){

                let chiseInst = appUtilities.createNewNetwork(); //opens a new tab



                let jsonObj = chiseInst.convertSbgnmlTextToJson(data.graph);

                chiseInst.updateGraph(jsonObj, function(){
                    app.modelManager.initModel(appUtilities.getCyInstance(chiseInst.cyId).nodes(), appUtilities.getCyInstance(chiseInst.cyId).edges(), chiseInst.cyId, appUtilities, "me");

                    appUtilities.setActiveNetwork(chiseInst.cyId);

                    $("#perform-layout").trigger('click');

                    if (callback) callback("success");
                });


            });

            app.socket.on("displaySbgn", function(data, callback){



                appUtilities.getCyInstance(data.cyId).remove(appUtilities.getCyInstance(data.cyId).elements());

                //get another sbgncontainer and display the new SBGN model.
                app.modelManager.newModel(data.cyId, "me", true);


                    let jsonObj = appUtilities.getChiseInstance(data.cyId).convertSbgnmlTextToJson(data.sbgn);



                    appUtilities.getChiseInstance(data.cyId).updateGraph(jsonObj, function(){
                        app.modelManager.initModel(appUtilities.getCyInstance(data.cyId).nodes(), appUtilities.getCyInstance(data.cyId).edges(), data.cyId, appUtilities, "me");

                        appUtilities.setActiveNetwork(data.cyId);

                        $("#perform-layout").trigger('click');

                        if (callback) callback("success");
                    });

            });

            app.socket.on("mergeSbgn", function (data, callback) {

                let newJson = appUtilities.getChiseInstance(data.cyId).convertSbgnmlTextToJson(data.graph);
                if(!data.cyId)
                    data.cyId = appUtilities.getActiveNetworkId();

                modelMergeFunctions.mergeJsonWithCurrent(newJson, data.cyId, app.modelManager, callback);

            });

            app.socket.on("mergeJsonWithCurrent", function (data, callback) {

                if(!data.cyId)
                    data.cyId = appUtilities.getActiveNetworkId();
                modelMergeFunctions.mergeJsonWithCurrent(data.graph, data.cyId, app.modelManager, callback);

            });



        },


        listenToVisAgentRequests: function () {


            app.socket.on('moveGene', function ( data, callback) {

                app.visHandler.moveNode(data);
            });


            app.socket.on('moveGeneStream', function ( data, callback) {

                app.visHandler.moveNodeStream(data);
            });

            app.socket.on('highlightGeneStream', function ( data, callback) {
                console.log(data);
                app.visHandler.highlightNodeStream(data);
            });


            app.socket.on("changeLockState", function(data, callback){
                if(!data.cyId)
                    data.cyId = appUtilities.getActiveNetworkId();


                if(data.lock)
                    appUtilities.getCyInstance(data.cyId).getElementById(data.id).lock();
                else
                    appUtilities.getCyInstance(data.cyId).getElementById(data.id).unlock();
            });

        },


        cleanAll: function( callback){
            try {

                let cyIds = app.modelManager.getCyIds();

                cyIds.forEach(function(cyId) {
                    console.log(cyId);
                    appUtilities.getCyInstance(cyId).remove(appUtilities.getCyInstance(cyId).elements());
                    app.modelManager.newModel(cyId, "me"); //do not delete cytoscape, only the model

                });


                appUtilities.closeOtherNetworks(0);

                app.model.set('_page.doc.images', null);

                app.dynamicResize(); //to clean the canvas

                app.model.set('_page.doc.provenance', null);

                if (callback) callback("success");
            }
            catch (e) {
                console.log(e);
                if(callback) callback();

            }
        }
    }
}

