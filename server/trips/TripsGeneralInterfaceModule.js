/**
 * Created by durupina on 5/17/17.
 * This is a Trips module to enable communication between trips and sbgnviz
 * Its role is to receive and decode messages and transfer them to all the clients
 * It handles general requests such as displaying, message sending and model building
 */
"use strict";
let request = require('request'); //REST call over http/https
let KQML = require('./util/KQML/kqml.js');
let TripsInterfaceModule = require('./TripsInterfaceModule.js');

/**
 * Class that handles general Trips requests
 */

class TripsGeneralInterfaceModule extends TripsInterfaceModule {

    /**
     *
     * @param {string} agentId
     * @param {string} agentName
     * @param {WebSocket} socket Socket connection between the module and the agent --not server
     * @param {Object} model
     * @param {function} askHuman
     */
    constructor(agentId, agentName, socket, model, askHuman){

        super('Sbgnviz-Interface-Agent', agentId, agentName, socket, model);

        let self = this;

        self.askHuman = askHuman;


        setTimeout(() =>{

            // self.tm.sendMsg({0: 'tell', content: ['start-conversation']});
            self.tm.sendMsg({0: 'broadcast', content: ['tell','start-conversation']});
            self.updateListeners();

        }, 2000);

    }

    disconnect(){
        super.disconnect();
    }

    /**
     * When socket changes, update the listeners on that socket
     */
    updateListeners(){
        let self = this;
        self.socket.on('relayMessageToTripsRequest', (data) => {

            let pattern = {0: 'tell', content: {0: 'started-speaking', mode: 'text', uttnum: data.uttNum, channel: 'Desktop', direction: 'input'}};
            self.tm.sendMsg(pattern);

            pattern = {0: 'tell', content: {0: 'stopped-speaking', mode: 'text', uttnum: data.uttNum, channel: 'Desktop', direction: 'input'}};
            self.tm.sendMsg(pattern);

            pattern = {0: 'tell', content: {0: 'word', 1: data.text, uttnum: data.uttNum, index: 1, channel: 'Desktop', direction: 'input'}};
            self.tm.sendMsg(pattern);

            pattern = {0: 'tell', content: {0: 'utterance', mode: 'text', uttnum: data.uttNum, text: data.text, channel: 'Desktop', direction: 'input'}};
            self.tm.sendMsg(pattern);

        });

    }

    /**
     * Send the request in the given format
     * @param {string} req
     * @param {Object} data
     */
    sendTripsRequest(req, data){

        let pattern = {0: 'request', content: {0: req, data: data}};
        this.tm.sendMsg(pattern);

    }

    /**
     * Handlers that listen to TRIPS requests and perform functions on the editor
     */
    setHandlers() {
        //Listen to spoken sentences
        let pattern = {0: 'tell', 1: '&key', content: ['spoken', '.', '*']};
        this.tm.addHandler(pattern, (text) => {
            let contentObj = KQML.keywordify(text.content);

            if (contentObj) {
                let msg = {userName: this.agentName, userId: this.agentId, room: this.room, date: +(new Date)};

                msg.comment = this.trimDoubleQuotes(contentObj.what);

                if (msg.comment) {

                    this.model.add('documents.' + msg.room + '.messages', msg);
                }
           }

        });


        pattern = {0: 'tell', 1: '&key', content: ['display-pc-path', '.', '*']};
        this.tm.addHandler(pattern,  (text) => {
            this.displayPCPath(text);

        });

        pattern = {0: 'request', 1: '&key', content: ['display-pc-path', '.', '*']};
        this.tm.addHandler(pattern,  (text) => {
            this.displayPCPath(text);

        });


        pattern = {0: 'tell', 1: '&key', content: ['display-sbgn', '.', '*']};
        this.tm.addHandler(pattern,  (text) => {
            console.log("display sbgn request");
            this.displaySbgn(text);

        });

        pattern = {0: 'request', 1: '&key', content: ['display-sbgn', '.', '*']};
        this.tm.addHandler(pattern,  (text) => {
            console.log("display sbgn request");
            this.displaySbgn(text);
        });


        pattern = {0: 'tell', 1: '&key', content: ['display-sif', '.', '*']};
        this.tm.addHandler(pattern,  (text) => {
            this.displaySif(text);

        });

        pattern = {0: 'request', 1: '&key', content: ['display-sif', '.', '*']};
        this.tm.addHandler(pattern,  (text) => {
            this.displaySif(text);
        });

        pattern = {0: 'request', 1: '&key', content: ['open-query-window', '.', '*']};
        this.tm.addHandler(pattern, (text) => {
            this.openQueryWindow(text);
        });

        pattern = {0: 'tell', 1: '&key', content: ['open-query-window', '.', '*']};
        this.tm.addHandler(pattern, (text) => {
            this.openQueryWindow(text);
        });

        pattern = {0: 'request', 1: '&key', content: ['clean-model', '.', '*']};
        this.tm.addHandler(pattern, (text) => {
            this.cleanModel(text);
        });

        pattern = {0: 'tell', 1: '&key', content: ['clean-model', '.', '*']};
        this.tm.addHandler(pattern, (text) =>{
            this.cleanModel(text);
        });

        pattern = {0: 'tell', 1: '&key', content: ['display-image', '.', '*']};
        this.tm.addHandler(pattern, (text) => {
            this.displayImage(text);
        });

        pattern = {0: 'request', 1: '&key', content: ['display-image', '.', '*']};
        this.tm.addHandler(pattern, (text) => {
            this.displayImage(text);
        });


        pattern = {0: 'tell', 1: '&key', content: ['add-provenance', '.', '*']};
        this.tm.addHandler(pattern, (html) => {
            this.addProvenance(html);

        });

        pattern = {0: 'request', 1: '&key', content: ['add-provenance', '.', '*']};
        this.tm.addHandler(pattern, (text) => {
            this.addProvenance(text);

        });

        pattern = {0: 'request', 1: '&key', content: ['display-oncoprint', '.', '*']};
        this.tm.addHandler(pattern, (text) => {
            this.displayOncoprint(text);

        });

        pattern = {0: 'tell', 1: '&key', content: ['display-oncoprint', '.', '*']};
        this.tm.addHandler(pattern, (text) => {
            this.displayOncoprint(text);

        });

        //Listen to model json request from MRA
        // pattern = {0: 'reply', 1: '&key', content: ['success', '.', '*'], sender: 'MRA'};
        //
        // self.tm.addHandler(pattern,  (text)=> { //listen to requests
        //     let contentObj = KQML.keywordify(text.content);
        //
        //
        //     if (contentObj.modelId) {
        //
        //         self.modelId = contentObj.modelId;
        //         self.model.set('documents.' + self.room + '.pysb.modelId', self.modelId);
        //         self.model.set('documents.' + self.room + '.pysb.model', contentObj.model);
        //
        //
        //         console.log("New model started: " + self.modelId);
        //
        //         //console.log(self.model.get('documents.' + socket.room + '.pysb.model'));
        //     }
        // });
    }

    /**
     * Asks a browser client to display an image
     * @param {Object} text {content {Object}}
      */
    displayImage(text) {
        let self = this;
        let contentObj = KQML.keywordify(text.content);

        if (contentObj) {
            let imageTabMap = {
                'reactionnetwork': {ind: 1, label: 'RXN'},
                'contactmap': {ind: 2, label: 'CM'},
                'influencemap': {ind: 3, label: 'IM'},
                'simulation': {ind: 4, label: 'SIM'}
            };


            let imgPath = this.trimDoubleQuotes(contentObj.path);
            try {
                let fs = require('fs');
                fs.readFile(imgPath,  (error, fileContent) => {
                    if (error) {
                        console.log('exec error: ' + error);
                        return;
                    }

                    let imgContent = 'data:image/png;base64,' + fileContent.toString('base64');


                    let imgData = {
                        img: imgContent,
                        tabIndex: imageTabMap[contentObj.type].ind,
                        tabLabel: imageTabMap[contentObj.type].label,
                        fileName: imgPath
                    };


                    //The socket connection is between the interface and the agent, so we cannot directly emit messages
                    //we must ask the client with the browser to do it for us
                    self.askHuman(self.agentId, self.room, "addImage", imgData, (val)  => {
                        console.log(val);
                      // self.tm.replyToMsg(text, {0: 'reply', content: {0: 'success'}});
                    });

                });
            }
            catch (error) {
                console.log("Error " + error);
            }

        }
    }

    /**
     * Asks a browser client to open a new PC tab
     * @param {string} text
     */
    displayPCPath(text) {
        let self = this;

        let contentObj = KQML.keywordify(text.content);
        if (contentObj) {

            this.getTermName(contentObj.source, (source) => {
                this.getTermName(contentObj.target, (target) => {


                    self.callPCQuery("pathsbetween?directed=false", source, target, 1, (result) => {


                        if (result == "success")
                            self.tm.replyToMsg(text, {0: 'reply', content: {0: 'success', type:"pathsbetween", limit: 1}});
                        else if (result === "failure")
                            self.tm.replyToMsg(text, {0: 'reply', content: {0: 'failure'}});
                        else {
                            console.log("looking at limit = 2");
                            self.callPCQuery("pathsbetween?directed=false", source, target, 2, (result2) => {
                                if (result2 == "success")
                                    self.tm.replyToMsg(text, {0: 'reply', content: {0: 'success', type:"pathsbetween", limit:2}});
                                else if (result2 === "failure")
                                    self.tm.replyToMsg(text, {0: 'reply', content: {0: 'failure'}});
                                else {

                                    console.log("looking at neighborhood");
                                    self.callPCQuery("neighborhood?direction=BOTHSTREAM", source, target, 1, (result3) => {

                                        console.log(result3);
                                        if (result3 == "success")
                                            self.tm.replyToMsg(text, {0: 'reply', content: {0: 'success', type:"neighborhood", limit:1}});
                                        else
                                            self.tm.replyToMsg(text, {0: 'reply', content: {0: 'failure'}});
                                    });
                                }
                            });
                        }


                    });
                });
            });
        }
    }

    /**
     *
     * @param {string} queryType
     * @param {string} source
     * @param {string} target
     * @param {number} limit Path length limit
     * @param {function} callback
     */
    callPCQuery(queryType, source, target, limit, callback){
        let self = this;
        let responseHeaders = {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
            "access-control-allow-headers": "content-type, accept",
            // "access-control-max-age": 10,
            // "Content-Type": "application/json"
        };

        let url = 'https://www.pathwaycommons.org/sifgraph/v1/'+ queryType + '&limit=' + limit + '&source=' +  source + "&source=" + target;

        console.log(url);
        request({
            url: url,
            method: 'GET',
            headers: responseHeaders,

        },  (error, response, body) => {

            if (error) {
                callback("failure")
            }
            else {
                if (response.statusCode === 200) {
                    if(body.length == 0)
                        callback("");
                    else {
                        self.askHuman(self.agentId, self.room, "openPCQueryWindow", {graph: body, type: 'sif'}, (val) => {
                            console.log(val);
                            callback("success");
                        });
                    }
                }
            }
        });
    }

    /**
     * Open a new tab to show query result
     * @param {string} text
     */
    openQueryWindow(text){
        let self = this;
        let contentObj = KQML.keywordify(text.content);
        if (contentObj) {

            let sbgnModel = contentObj.graph;


            sbgnModel = this.trimDoubleQuotes(sbgnModel);

            sbgnModel = sbgnModel.replace(/(\\")/g, '"');
            sbgnModel = "<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n" + sbgnModel;

            //The socket connection is between the interface and the agent, so we cannot directly emit messages
            //we must ask the client with the browser to do it for us
            self.askHuman(self.agentId, self.room, "openPCQueryWindow", {graph: sbgnModel},  (val) => {
                console.log(val);
                // self.tm.replyToMsg(text, {0: 'reply', content: {0: 'success'}});
            });
        }

    }

    /**
     * Display a graph in sif format
     * @param {string} text
     */
    displaySif(text) {

        let contentObj = KQML.keywordify(text.content);
        if (contentObj) {

            // the related document
            // (https://docs.google.com/document/d/160PVa6SbhCEyC5Wj-dlmid7kAalT7nvW_Cbw4ZFmdwc/edit#heading=h.yy2qssi2d7s2)
            // tells that the graph data must be included in 'sif' parameter. However, in the related feature branch
            // ('sif_models' branch of 'bioagents') it is included in 'graph' parameter.
            // let sifModel = contentObj.sif;
            let sifModel = contentObj.graph;


            sifModel = this.trimDoubleQuotes(sifModel);

            sifModel = sifModel.replace(/(\\")/g, '"');

            let cyId = contentObj.cyid
              && this.trimDoubleQuotes(contentObj.cyid).replace(/(\\")/g, '"');


            //The socket connection is between the interface and the agent, so we cannot directly emit messages
            //we must ask the client with the browser to do it for us
            //TODO: get the cyId from TRIPS
            this.askHuman(this.agentId, this.room, "displaySif", {sif: sifModel, cyId: cyId || "0"},  (val) => {
                console.log(val);
            });
        }
    }

    /**
     * Display a graph in sbgn format
     * @param {string} text
     */
    displaySbgn(text) {
        let contentObj = KQML.keywordify(text.content);
        if (contentObj) {

            // the related document
            // (https://docs.google.com/document/d/160PVa6SbhCEyC5Wj-dlmid7kAalT7nvW_Cbw4ZFmdwc/edit#heading=h.7d75t5vxl65z)
            // tells that the graph data must be included in 'sbgn' parameter but it actually
            // is included in 'graph' parameter
            // let sbgnModel = contentObj.sbgn;
            let sbgnModel = contentObj.graph;

            sbgnModel = this.trimDoubleQuotes(sbgnModel);

            sbgnModel = sbgnModel.replace(/(\\")/g, '"');
            sbgnModel = "<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n" + sbgnModel;

            let cyId = contentObj.cyid
              && this.trimDoubleQuotes(contentObj.cyid).replace(/(\\")/g, '"');

            //The socket connection is between the interface and the agent, so we cannot directly emit messages
            //we must ask the client with the browser to do it for us
            //TODO: get the cyId from TRIPS
            this.askHuman(this.agentId, this.room, "displaySbgn", {sbgn: sbgnModel, cyId: cyId || "0"},  (val) => {
                console.log(val);
            // this.askHuman(this.agentId, this.room, "mergeSbgn", {graph: sbgnModel,  type:'sbgn', cyId: contentObj.cyId || "0"},  () => {

            // this.tm.replyToMsg(text, {0: 'reply', content: {das: 'success'}});
            });
        }
    }

    /**
     * Display oncoprint result on the dedicated tab
     * @param {string} text
     */
    displayOncoprint(text){

        let contentObj = KQML.keywordify(text.content);
        if (contentObj) {

            let data = contentObj.data;

            // data = data.replace(/[\']/g, '\"');
            data = data.replace(/’/g, "'");
            data = data.replace(/'/g, '"');
            data = data.replace(/”/g, '"');

            data  =  data.substr(1, data.length - 2);

            try {
                let json = JSON.parse(data);
                this.askHuman(this.agentId, this.room, "displayOncoprint", json, (val) => {
                    console.log(val);
                });
            }
            catch(e) {
                console.log(e);
            }
        }
    }


    /**
     * Clean model request comes from another agent
     * @param {boolean} shouldCleanProvenance
     */
    cleanModel(shouldCleanProvenance){
        let responseHeaders = {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
            "access-control-allow-headers": "content-type, accept",
            "access-control-max-age": 10,
            "Content-Type": "application/json"
        };

        //The socket connection is between the interface and the agent, so we cannot directly emit messages
        //we must ask the client with the browser to do it for us
        //Reset through clic
        request({
            url: 'http://localhost:8000/clic/initiate-reset', //URL to hit
            headers: responseHeaders,
            form: ''

        },  (error) => {

            if (error) {
                console.log(error);
            }
        });


        //this will clean the image tabs and sbgn model
        this.askHuman(this.agentId, this.room, "cleanModel", {shouldCleanProvenance: shouldCleanProvenance},   (val) =>{
            console.log(val);
        });


        this.sendResetCausalityRequest();
    }


    sendResetCausalityRequest(){
        let pattern = {0: 'request', content: {0: 'RESET-CAUSALITY-INDICES'}};
        this.tm.sendMsg(pattern);
    }


    /***
     * Extra messages that agents send
     * @param {string} text
     */
    addProvenance(text){

        let contentObj = KQML.keywordify(text.content);
        if(contentObj.html)
            contentObj.html = this.trimDoubleQuotes(contentObj.html);
        if(contentObj.pc)
            contentObj.pc = this.trimDoubleQuotes(contentObj.pc);

        this.askHuman(this.agentId, this.room, "addProvenance", contentObj);

    }
}


module.exports = TripsGeneralInterfaceModule;




