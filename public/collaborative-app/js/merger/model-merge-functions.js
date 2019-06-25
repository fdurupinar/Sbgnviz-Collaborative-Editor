let JsonMerger = require('./json-merger.js');
let jsonMerger = new JsonMerger();
let appUtilities = window.appUtilities;


module.exports = function(){

    return {
        //Merge an array of json objects with the json of the current sbgn network
        //on display to output a single json object.
        mergeJsonWithCurrent: function (jsonGraph, cyId, modelManager, callback) {

            let chiseInstance = appUtilities.getChiseInstance(cyId);
            let currJson;
            if(chiseInstance.getMapType()!='PD' && chiseInstance.getMapType()!='AF' )
                currJson = chiseInstance.createJsonFromSif();
            else
                currJson = chiseInstance.createJsonFromSBGN();


            console.log(jsonGraph);

            modelManager.setRollbackPoint(cyId); //before merging.. for undo

            let jsonObj = jsonMerger.mergeJsonWithCurrent(jsonGraph, currJson);

            //get another sbgncontainer and display the new SBGN model.
            modelManager.newModel(cyId, "me", true);

            //this takes a while so wait before initiating the model
            appUtilities.getChiseInstance(cyId).updateGraph(jsonObj, function () {

                modelManager.initModel(appUtilities.getCyInstance(cyId).nodes(), appUtilities.getCyInstance(cyId).edges(), cyId,  "me");

                //select the new graph
                jsonGraph.nodes.forEach(function (node) {
                    appUtilities.getCyInstance(cyId).getElementById(node.data.id).select();
                });

                $("#perform-layout").trigger('click');

                appUtilities.getCyInstance(cyId).elements().unselect();

                // Call merge notification after the layout
                setTimeout(function () {
                    modelManager.mergeJsons(cyId, "me");
                    if (callback) callback("success");
                }, 1000);

            }, true);
        },

        //Merge an array of json objects to output a single json object.
        mergeJsons: function (jsonGraph, cyId, modelManager, callback) {
            let idxCardNodeMap = {};
            let sentenceNodeMap = {};

            modelManager.setRollbackPoint(cyId); //before merging.. for undo

            let jsonObj = jsonMerger.mergeJsons(jsonGraph, sentenceNodeMap, idxCardNodeMap);

            modelManager.newModel(cyId, "me", true);


            console.log(jsonObj);

            appUtilities.getChiseInstance(cyId).updateGraph(jsonObj, function(){

                modelManager.initModel( appUtilities.getCyInstance(cyId).nodes(), appUtilities.getCyInstance(cyId).edges(), cyId,  "me");

                //Call layout after init
                $("#perform-layout").trigger('click');


                //Call merge notification after the layout
                setTimeout(function () {
                    modelManager.mergeJsons(cyId, "me", true);

                    if (callback) callback();
                }, 1000);

            }, true);

            return {sentences: sentenceNodeMap, idxCards: idxCardNodeMap};
        },



    }
}