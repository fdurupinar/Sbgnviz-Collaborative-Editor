/**
 * Functions for the browser client to perform on the editor as requested by an agent through the agent socket
 * @param  {Object} app Derby.js application
 * @return {Object} {{listenToVisAgentRequests: listenToVisAgentRequests, listen: listen, cleanModel: cleanModel}}
 */



let ModelMergeFunctions = require('./merger/model-merge-functions.js');
let modelMergeFunctions = new ModelMergeFunctions();
const appUtilities = window.appUtilities;
const $ = require('jquery');


class ClientSideSocketListener{

    /**
     *
     * @param {Object} app Derby,js application
     */
    constructor(app) {
        this.app = app;
    }

    /**
     * Listens to Trips agent, visAgent and menu function requests via the server
     *
     */
    listen () {
        this.app.socket.on('loadFile',  (data, callback) => this._loadFile(data, callback));
        this.app.socket.on('cleanModel',(data, callback) => this._cleanModel(data, callback));
        this.app.socket.on('runLayout',(data, callback) => this._runLayout(data, callback));
        this.app.socket.on('addNode',(data, callback) => this._addNode(data, callback));
        this.app.socket.on('deleteEles',(data, callback) => this._deleteEles(data, callback));
        this.app.socket.on('addImage',(data, callback) => this._addImage(data, callback));
        this.app.socket.on('align',(data, callback) => this._align(data, callback));
        this.app.socket.on('updateVisibility',(data, callback) => this._updateVisibility(data, callback));
        this.app.socket.on('searchByLabel',(data, callback) => this._searchByLabel(data, callback));
        this.app.socket.on('updateHighlight',(data, callback) => this._updateHighlight(data, callback));
        this.app.socket.on('updateExpandCollapse',(data, callback) => this._updateExpandCollapse(data, callback));
        this.app.socket.on('addCompound',(data, callback) => this._addCompound(data, callback));
        this.app.socket.on('clone',(data, callback) => this._clone(data, callback));
        this.app.socket.on('openPCQueryWindow',(data, callback) => this._openPCQueryWindow(data, callback));
        this.app.socket.on('displayOncoprint',(data, callback) => this._displayOncoprint(data, callback));
        this.app.socket.on('displaySif',(data, callback) => this._displaySif(data, callback));
        this.app.socket.on('displaySbgn',(data, callback) => this._displaySbgn(data, callback));
        this.app.socket.on('mergeSbgn',(data, callback) => this._mergeSbgn(data, callback));
        this.app.socket.on('mergeJsonWithCurrent',(data, callback) => this._mergeJsonWithCurrent(data, callback));
        this.app.socket.on('addProvenance',(data, callback) => this._addProvenance(data, callback));
        this.app.socket.on('removeBob',(data, callback) => this._removeBob(data, callback));


        //VisAgent requests
        this.app.socket.on('moveGene',  (data, callback) => this._moveGene(data, callback));
        this.app.socket.on('moveGeneStream',  (data, callback) => this._moveGeneStream(data, callback));
        this.app.socket.on('highlightGeneStream',  (data, callback) => this._highlightGeneStream(data, callback));
        this.app.socket.on('changeLockState',  (data, callback) => this._changeLockState(data, callback));
        this.app.socket.on('addCellularLocation',  (data, callback) => this._addCellularLocation(data, callback));
        this.app.socket.on('moveOutOfCellularLocation',  (data, callback) => this._moveOutOfCellularLocation(data, callback));

    }


    _loadFile(data, callback){
        try {
            appUtilities.getChiseInstance(data.cyId).getSbgnvizInstance().loadSBGNMLText(data.content);

            if (callback) callback("success");
        }
        catch (e) {
            console.log(e);
            if(callback) callback();

        }
    }

    /***
     * Cleans Trips model
     * @param {Object} data
     * @property{Boolean} data.shouldCleanProvenance  check if provenance content should be deleted
     * @param {Function} callback
     */
    _cleanModel(data, callback) {
        try {

            let cyIds = this.app.modelManager.getCyIds();

            cyIds.forEach((cyId) => {
                appUtilities.getCyInstance(cyId).remove(appUtilities.getCyInstance(cyId).elements());
                this.app.modelManager.newModel(cyId, "me"); //do not delete cytoscape, only the model

            });

            appUtilities.closeOtherNetworks(0);
            this.app.model.set('_page.doc.images', null);
            this.app.dynamicResize(); //to clean the canvas

            if(data.shouldCleanProvenance)
                this.app.model.set('_page.doc.provenance', null);

            if (callback) callback("success");


        } catch (e) {
            console.log(e);
            if (callback) callback();
        }
    }

    _runLayout(data, callback) {
        try {
            appUtilities.setActiveNetwork(data.cyId);
            $("#perform-layout")[0].click();
            if (callback) callback("success");
        } catch (e) {
            console.log(e);
            if (callback) callback();
        }
    }

    /**
     * Adds node to the system and modelManager and returns the node id in the callback
     * @param {Object} data Node info
     * @param {Function} callback
     * @private
     */
    _addNode(data, callback) {
        try {
            //does not trigger cy events
            let newNode = appUtilities.getChiseInstance(data.cyId).elementUtilities.addNode(data.position.x, data.position.y, data.data.class);

            //notifies other clients
            this.app.modelManager.addModelNode(newNode.id(), data.cyId, data, "me");
            this.app.modelManager.initModelNode(newNode, data.cyId, "me");

            if (callback) callback(newNode.id());
        }
        catch (e) {
            console.log(e);
            if(callback) callback();
        }
    }

    /**
     *
     * @param {Object} data
     * @param {function} callback
     * @private
     */
    _deleteEles(data, callback){
        try {
            //unselect all others
            appUtilities.getCyInstance(data.cyId).elements().unselect();

            //first delete edges
            data.elementIds.forEach( (id) => {
                appUtilities.getCyInstance(data.cyId).getElementById(id).select();
            });

            //then delete modes
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
    }

    /**
     *
     * @param {Object} data
     * @param {function} callback
     * @private
     */
    _addImage(data, callback){
        try {
            let status = this.app.modelManager.addImage(data);
            this.app.dynamicResize();

            if (callback) callback(status);

        }
        catch (e) {
            console.log(e);
            if(callback) callback();
        }
    }

    /**
     *
     * @param {Object} data
     * @param {function} callback
     * @private
     */
    _align(data, callback) {
        try {
            let nodes = appUtilities.getCyInstance(data.cyId).collection();
            if (data.nodeIds === '*' || data.nodeIds === 'all')
                nodes = appUtilities.getCyInstance(data.cyId).nodes();
            else
                data.nodeIds.forEach((nodeId) => {
                    nodes.add(appUtilities.getCyInstance(data.cyId).getElementById(nodeId));
                });

            appUtilities.getChiseInstance(data.cyId).align(nodes, data.horizontal, data.vertical, appUtilities.getCyInstance(data.cyId).getElementById(data.alignTo));

            if (callback) callback("success");
        } catch (e) {
            console.log(e);
            if (callback) callback();
        }
    }

    /**
     *
     * @param {Object} data
     * @param {function} callback
     * @private
     */
    _updateVisibility(data, callback){
        try {
            //unselect all others
            appUtilities.setActiveNetwork(data.cyId);
            appUtilities.getCyInstance(data.cyId).elements().unselect();

            if (data.val === "showAll")
                $("#show-all")[0].click();
            else {
                data.elementIds.forEach((id) => {
                    appUtilities.getCyInstance(data.cyId).getElementById(id).select();
                });

                if (data.val == "show")
                    $("#show-selected")[0].click();
                else
                    $("#hide-selected")[0].click();
            }

            if (callback) callback("success");
        }
        catch (e) {
            console.log(e);
            if (callback) callback();
        }
    }

    /**
     *
     * @param {Object} data
     * @param {function} callback
     * @private
     */
    _searchByLabel(data, callback){
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
    }

    /**
     *
     * @param {Object} data
     * @param {function} callback
     * @private
     */
    _updateHighlight(data, callback){
        try {
            //unselect all others
            appUtilities.getCyInstance(data.cyId).elements().unselect();
            appUtilities.setActiveNetwork(data.cyId);

            if (data.val === "remove") {
                $("#remove-highlights")[0].click();
            }
            else {
                data.elementIds.forEach( (id) => {
                    appUtilities.getCyInstance(data.cyId).getElementById(id).select();
                });

                if (data.val === "neighbors")
                    $("#highlight-neighbors-of-selected")[0].click();
                else if (data.val === "processes")
                    $("#highlight-processes-of-selected")[0].click();
            }

            if (callback) callback("success");
        }
        catch (e) {
            console.log(e);
            if (callback) callback();
        }
    }

    /**
     *
     * @param {Object} data
     * @param {function} callback
     * @private
     */
    _updateExpandCollapse(data, callback){
        try {
            //unselect all others
            appUtilities.getCyInstance(data.cyId).elements().unselect();
            appUtilities.setActiveNetwork(data.cyId);

            data.elementIds.forEach( (id) => {
                appUtilities.getCyInstance(data.cyId).getElementById(id).select();
            });

            if (data.val === "collapse")
                $("#collapse-selected")[0].click();
            else
                $("#expand-selected")[0].click();

            if (callback) callback("success");
        }
        catch (e) {
            console.log(e);
            if (callback) callback();
        }
    }

    /**
     *
     * @param {Object} data
     * @param {function} callback
     * @private
     */
    _addCompound(data, callback){
        try {
            //unselect all others
            appUtilities.getCyInstance(data.cyId).elements().unselect();

            data.elementIds.forEach( (elId) => {
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
    }

    /**
     *
     * @param {Object} data
     * @param {function} callback
     * @private
     */
    _clone(data, callback){
        try {
            appUtilities.getCyInstance(data.cyId).elements().unselect();
            appUtilities.setActiveNetwork(data.cyId);

            data.elementIds.forEach( (nodeId) => {
                appUtilities.getCyInstance(data.cyId).getElementById(nodeId).select();
            });

            $("#clone-selected")[0].click();


            if (callback) callback("success");
        }
        catch (e) {
            console.log(e);
            if (callback) callback();
        }
    }

    /**
     * Open the graph in another tab
     * @param {{Object}} data Format is {type:<sif or sbgn>, graph:<>}
     * @param {function} callback
     * @private
     */
    _openPCQueryWindow(data, callback){
        try {
            let chiseInst = appUtilities.createNewNetwork(); //opens a new tab
            let cy = chiseInst.getCy();

            let jsonObj;
            if (data.type && data.type == 'sif')
                jsonObj = chiseInst.convertSifTextToJson(data.graph);
            else
                jsonObj = chiseInst.convertSbgnmlTextToJson(data.graph);

            let currentLayoutProperties = appUtilities.getScratch(cy, 'currentLayoutProperties');

            chiseInst.updateGraph(jsonObj,  () => {
                this.app.modelManager.initModel(cy.nodes(), cy.edges(), chiseInst.cyId,  "me");

                appUtilities.setActiveNetwork(chiseInst.cyId);
                //
                $("#perform-layout")[0].click();

                if (callback) callback("success");

            }, currentLayoutProperties);
        }
        catch (e) {
            console.log(e);
            if (callback) callback();
        }

    }

    /**
     * Display oncoprint data on the oncoprint tab
     * @param {Object} data
     * @param {function} callback
     * @private
     */
    _displayOncoprint(data, callback){
        try{
            let timeOut = 0;
            if (document.getElementById('oncoprint-tab').style.visibility == 'hidden') {

                timeOut = 4000;
                document.getElementById('oncoprint-tab').style.visibility = 'visible';
            }

            setTimeout(() => {

                    this.app.modelManager.setOncoprint(data);
                    this.app.oncoprintHandler.updateData(data);

                }, timeOut
            );

            if (callback) callback("success");
        }
        catch (e) {
            console.log(e);
            if (callback) callback();
        }
    }

    /*
     * Display a sif graph on the current tab
     * @param {Object} data Format is {sif:<sif>, cyId:<number>}
     * @param {function} callback
     * @private
     */
    _displaySif(data, callback){
        try {
            let chiseInst;
            if (!data.cyId) {
                data.cyId = appUtilities.getActiveNetworkId();
                chiseInst = appUtilities.getActiveChiseInstance();
            } else {

                data.cyId = parseInt(data.cyId);


                if (!appUtilities.doesNetworkExist(data.cyId))
                    chiseInst = appUtilities.createNewNetwork(data.cyId); //opens a new tab
                else
                    chiseInst = appUtilities.getChiseInstance(data.cyId);

            }

            let cy = chiseInst.getCy();

            cy.remove(cy.elements());


            let jsonObj = chiseInst.convertSifTextToJson(data.sif);
            let currentLayoutProperties = appUtilities.getScratch(cy, 'currentLayoutProperties');

            chiseInst.updateGraph(jsonObj, () => {

                this.app.modelManager.newModel(appUtilities.getActiveNetworkId(), "me"); //delete the existing model first so that ids don't get mixed up


                this.app.modelManager.initModel(cy.nodes(), cy.edges(), data.cyId,  "me");


                appUtilities.setActiveNetwork(data.cyId);

                setTimeout(() => {

                    // $("#perform-layout")[0].click();

                    // this.app.callLayout(data.cyId);
                    //open the network view and rerender it otherwise the graph becomes invisible
                    $("#defaultOpen")[0].click();

                    this.app.dynamicResize();
                    cy.panzoom().fit();


                    if (callback) callback("success");
                }, 1000);


            }, currentLayoutProperties);
        }
        catch (e) {
            console.log(e);
            if (callback) callback();
        }

    }

    /*
     * Display an sbgn graph on the current tab
     * @param {Object} data Format is {sbgn:<sbgn>, cyId:<number>}
     * @param {function} callback
     * @private
     */
    _displaySbgn(data, callback){
        try {
            let chiseInst;

            if (!data.cyId) {
                data.cyId = appUtilities.getActiveNetworkId();
                chiseInst = appUtilities.getActiveChiseInstance();
            } else {

                data.cyId = parseInt(data.cyId);
                if (!appUtilities.doesNetworkExist(data.cyId))
                    chiseInst = appUtilities.createNewNetwork(data.cyId); //opens a new tab
                else
                    chiseInst = appUtilities.getChiseInstance(data.cyId);

            }

            let cy = chiseInst.getCy();


            cy.remove(cy.elements());


            let jsonObj = chiseInst.convertSbgnmlTextToJson(data.sbgn);
            let currentLayoutProperties = appUtilities.getScratch(cy, 'currentLayoutProperties');


            chiseInst.updateGraph(jsonObj, () => {

                this.app.modelManager.newModel(appUtilities.getActiveNetworkId(), "me"); //delete the existing model first so that ids don't get mixed up


                this.app.modelManager.initModel(cy.nodes(), cy.edges(), data.cyId,  "me");


                appUtilities.setActiveNetwork(data.cyId);

                setTimeout(() => {

                    // $("#perform-layout")[0].click();

                    // this.app.callLayout(data.cyId);
                    //open the network view and rerender it otherwise the graph becomes invisible
                    $("#defaultOpen")[0].click();

                    this.app.dynamicResize();
                    cy.panzoom().fit();


                    if (callback) callback("success");
                }, 1000);


            }, currentLayoutProperties);

            //update cellular locations
            this.app.updateCellularLocations();

        }
        catch (e) {
            console.log(e);
            if (callback) callback();
        }
    }

    /**
     *
     * @param {Object} data
     * @param {function} callback
     * @private
     */
    _mergeSbgn(data, callback){
        try {

            if (!data.cyId)
                data.cyId = appUtilities.getActiveNetworkId();

            let newJson = appUtilities.getChiseInstance(data.cyId).convertSbgnmlTextToJson(data.graph);

            modelMergeFunctions.mergeJsonWithCurrent(newJson, data.cyId, this.app.modelManager, callback);

        }
        catch (e) {
            console.log(e);
            if (callback) callback();
        }
    }

    /**
     * Merge data.graph with the current model in the active tab or a given tab
     * @param {Object} data
     * @param {function} callback
     * @private
     */
    _mergeJsonWithCurrent(data, callback){
        try {
            if (!data.cyId)
                data.cyId = appUtilities.getActiveNetworkId();
            modelMergeFunctions.mergeJsonWithCurrent(data.graph, data.cyId, this.app.modelManager, callback);
        }
        catch (e) {
            console.log(e);
            if (callback) callback();
        }
    }

    /**
     * Adds links and other info to the provenance tab
     * @param {Object} data
     * @param {function} callback
     * @private
     */
    _addProvenance(data, callback){
        try {
            if (!data.cyId)
                data.cyId = appUtilities.getActiveNetworkId();


            if (data.pc)
                this.app.model.push('_page.doc.provenance', {
                    html: data.html,
                    pc: data.pc,
                    title: data.title
                });
            else if (data.title)
                this.app.model.push('_page.doc.provenance', {
                    html: data.html,
                    title: data.title
                });
            else
                this.app.model.push('_page.doc.provenance', {html: data.html});

            if (callback)
                callback("success");
        }
        catch (e) {
            console.log(e);
            if (callback) callback();
        }
    }

    /**
     * To use with CLARE so that Bob does not interfere
     * @param data
     * @param callback
     * @private
     */
    _removeBob(data, callback){
        try {
            if (this.app.tripsAgent) {

                this.app.tripsAgent.disconnect();
                if (callback) {

                    callback();
                }
            }
        }
        catch (e) {
            console.log(e);
            if (callback) callback();
        }
    }

    /**
     *
     * @param {Object} data Node info {name:<string>, state:<string> , location:<string>}
     * @param {function} callback
     * @private
     */
    _moveGene(data, callback){
        try {
            this.app.visHandler.moveNode(data);
            if (callback) callback("success");
        }
        catch (e) {
            console.log(e);
            if (callback) callback();
        }
    }

    /**
     *
     * @param {Object} data {name:<string>, direction: <"up", "down">, state:, cyId:<Number>, location: <"top", "bottom", "left", "right">}
     * @param {function} callback
     * @private
     */
    _moveGeneStream(data, callback){
        try {
            this.app.visHandler.moveNodeStream(data);
            if (callback) callback("success");
        }
        catch (e) {
            console.log(e);
            if (callback) callback();
        }
    }

    /**
     *
     * @param {Object} data {name:<string>, direction:<"up" or "down">, state:<string>, cyId:<number>}
     * @param {function} callback
     * @private
     */
    _highlightGeneStream(data, callback){
        try {
            this.app.visHandler.highlightNodeStream(data);
            if (callback) callback("success");
        }
        catch (e) {
            console.log(e);
            if (callback) callback();
        }
    }

    /**
     *
     * @param {Object} data {id {string}, cyId {number}, lock {boolean}}
     * @param {function} callback
     * @private
     */
    _changeLockState(data, callback){
        try {
            if (!data.cyId)
                data.cyId = appUtilities.getActiveNetworkId();

            if (data.lock)
                appUtilities.getCyInstance(data.cyId).getElementById(data.id).lock();
            else
                appUtilities.getCyInstance(data.cyId).getElementById(data.id).unlock();

            if (callback) callback("success");
        }
        catch (e) {
            console.log(e);
            if (callback) callback();
        }
    }

    /**
     *
     * @param {Object} data {genes {Array} Array of gena names, cyId {number}, compartment {string}}
     * @param {function} callback
     * @private
     */
    _addCellularLocation(data, callback){
        try {
            this.app.addCellularLocation(data.genes, data.compartment, data.cyId);

            this.app.modelManager.addModelCellularLocation(data.genes, data.compartment, "me");

            if (callback) callback("success");
        }
        catch (e) {
            console.log(e);
            if (callback) callback();
        }
    }

    /**
     *
     * @param {Object} data {genes {Array} Array of gena names, cyId {number}, compartment {string}}
     * @param {function} callback
     * @private
     */
    _moveOutOfCellularLocation(data, callback){
        try {

            this.app.moveOutOfCellularLocation(data.genes, data.compartment, data.cyId);
            this.app.modelManager.removeNodesFromCellularLocation(data.genes, data.compartment,  "me");


            if (callback) callback("success");
        }
        catch (e) {
            console.log(e);
            if (callback) callback();
        }
    }


}

module.exports = ClientSideSocketListener;
