let JsonMerger = require('./json-merger.js');
let jsonMerger = new JsonMerger();
let appUtilities = window.appUtilities;

/**
 * Merge functions through the editor and the model
 */
class ModelMergeFunctions{
    constructor() {
    }


    /**
     * Merge a json object with the json of the current sbgn network
     * @param {Object} jsonGraph
     * @param {Number} cyId
     * @param {Object} modelManager
     * @param {function} callback
     * @returns {Object}
     */
    mergeJsonWithCurrent (jsonGraph, cyId, modelManager, callback) {

        let chiseInstance = appUtilities.getChiseInstance(cyId);
        let currJson;
        if(chiseInstance.getMapType()== 'SIF' )
            currJson = chiseInstance.createJsonFromSif();
        else
            currJson = chiseInstance.createJsonFromSBGN();


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
    }


    /**
     * Merge an array of json objects to output a single json object.
     * @param {Array} jsonGraph
     * @param {Number} cyId
     * @param {Object} modelManager
     * @param {function} callback
     * @returns {Object}
     */
    mergeJsons(jsonGraph, cyId, modelManager, callback) {
        let idxCardNodeMap = {};
        let sentenceNodeMap = {};

        modelManager.setRollbackPoint(cyId); //before merging.. for undo

        let jsonObj = jsonMerger.mergeJsons(jsonGraph, sentenceNodeMap, idxCardNodeMap);

        modelManager.newModel(cyId, "me", true);



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
    }



}

module.exports = ModelMergeFunctions;