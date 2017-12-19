/**
 * Created by durupina on 5/17/17.
 * This is a Trips module to enable communication between trips and sbgnviz
 * Its role is to receive and decode messages and transfer them to all the clients
 * It handles general requests such as displaying, message sending and model building
 */
"use strict";
let request = require('request'); //REST call over http/https
let KQML = require('./KQML/kqml.js');
let TripsInterfaceModule = require('./TripsInterfaceModule.js');


class TripsGeneralInterfaceModule extends TripsInterfaceModule {

    constructor(agentId, agentName, socket, model, askHuman){

        super('Sbgnviz-Interface-Agent', agentId, agentName, socket, model);

        let self = this;

        self.askHuman = askHuman;


        setTimeout(function(){

            self.tm.sendMsg({0: 'tell', content: ['start-conversation']});
            self.updateListeners();

        }, 2000);

    }

    /***
     * When socket changes, update the listeners on that socket
     */
    updateListeners(){
        let self = this;
        self.socket.on('relayMessageToTripsRequest', function (data) {

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

    setHandlers() {
        let self = this;

        //Listen to spoken sentences
        let pattern = {0: 'tell', 1: '&key', content: ['spoken', '.', '*']};
        self.tm.addHandler(pattern, function (text) {
            let contentObj = KQML.keywordify(text.content);

            if (contentObj) {
                let msg = {userName: self.agentName, userId: self.agentId, room: self.room, date: +(new Date)};
                msg.comment = trimDoubleQuotes(contentObj.what);
                self.model.add('documents.' + msg.room + '.messages', msg);
            }

        });


        pattern = {0: 'tell', 1: '&key', content: ['display-sbgn', '.', '*']};
        self.tm.addHandler(pattern, function (text) {
            self.displaySbgn(text);

        });


        pattern = {0: 'request', 1: '&key', content: ['display-sbgn', '.', '*']};
        self.tm.addHandler(pattern, function (text) {
            self.displaySbgn(text);
        });

        pattern = {0: 'request', 1: '&key', content: ['clean-model', '.', '*']};
        self.tm.addHandler(pattern, function (text) {
            self.cleanModel(text);
        });

        pattern = {0: 'tell', 1: '&key', content: ['clean-model', '.', '*']};
        self.tm.addHandler(pattern, function (text) {
            self.cleanModel(text);
        });

        pattern = {0: 'tell', 1: '&key', content: ['display-image', '.', '*']};
        self.tm.addHandler(pattern, function (text) {
            self.displayImage(text);
        });

        pattern = {0: 'request', 1: '&key', content: ['display-image', '.', '*']};
        self.tm.addHandler(pattern, function (text) {
            self.displayImage(text);
        });


        pattern = {0: 'tell', 1: '&key', content: ['add-provenance', '.', '*']};
        self.tm.addHandler(pattern, function (html) {
            self.addProvenance(html);

        });

        pattern = {0: 'request', 1: '&key', content: ['add-provenance', '.', '*']};
        self.tm.addHandler(pattern, function (text) {
            self.addProvenance(text);

        });

        //
        // //Listen to model id response from MRA
        pattern = {0: 'reply', 1: '&key', content: ['success', '.', '*'], sender: 'MRA'};

        self.tm.addHandler(pattern, function (text) { //listen to requests
            let contentObj = KQML.keywordify(text.content);


            if (contentObj.modelId) {

                self.modelId = contentObj.modelId;
                self.model.set('documents.' + self.room + '.pysb.modelId', self.modelId);
                self.model.set('documents.' + self.room + '.pysb.model', contentObj.model);


                console.log("New model started: " + self.modelId);

                //console.log(self.model.get('documents.' + socket.room + '.pysb.model'));
            }
        });
    }

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


            let imgPath = trimDoubleQuotes(contentObj.path);
            try {
                let fs = require('fs');
                fs.readFile(imgPath, function (error, fileContent) {
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
                    self.askHuman(self.agentId, self.room, "addImage", imgData, function (val) {
                      // self.tm.replyToMsg(text, {0: 'reply', content: {0: 'success'}});
                    });

                });
            }
            catch (error) {
                console.log("Error " + error);
            }

        }
    }


    displaySbgn(text) {

        let self = this;
        let contentObj = KQML.keywordify(text.content);
        if (contentObj) {

            let sbgnModel = contentObj.graph;

            
            sbgnModel = trimDoubleQuotes(sbgnModel);

            sbgnModel = sbgnModel.replace(/(\\")/g, '"');
            sbgnModel = "<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n" + sbgnModel;

            //The socket connection is between the interface and the agent, so we cannot directly emit messages
            //we must ask the client with the browser to do it for us
            //TODO: get the cyId from TRIPS
            self.askHuman(self.agentId, self.room, "displaySbgn", {sbgn: sbgnModel, cyId: 0}, function (val) {

                // self.tm.replyToMsg(text, {0: 'reply', content: {0: 'success'}});
            });
        }
    }

    //Clean model request comes from another agent
    cleanModel(){
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

        }, function (error) {

            if (error) {
                console.log(error);
            }
        });

        //this will clean the image tabs and sbgn model
        this.askHuman(this.agentId, this.room, "cleanAll",{},  function (val) {
        });


        this.sendResetCausalityRequest();
    }

    sendResetCausalityRequest(){
        let pattern = {0: 'request', content: {0: 'RESET-CAUSALITY-INDICES'}};
        this.tm.sendMsg(pattern);
    }

    /***
     * Extra messages that agents send
     * @param text
     */
    addProvenance(text){
        let self = this;
        let contentObj = KQML.keywordify(text.content);
        if(contentObj.html)
            contentObj.html = trimDoubleQuotes(contentObj.html);
        if(contentObj.pc)
            contentObj.pc = trimDoubleQuotes(contentObj.pc);
        //we can directly update the model
        if(contentObj.pc)
            self.model.push('documents.' + this.room + '.provenance', {html:contentObj.html, pc: contentObj.pc, userName: self.agentName});
        else
            self.model.push('documents.' + this.room + '.provenance', {html:contentObj.html, userName: self.agentName});

    }


}


module.exports = TripsGeneralInterfaceModule;

/////////////////////////////////////////////////
// Local functions
/////////////////////////////////////////////////

function trimDoubleQuotes(str){
    if(str[0]!== '"' || str[str.length-1]!== '"')
        return str;

    let strTrimmed = str.slice(1, str.length -1);

    return strTrimmed;

}
