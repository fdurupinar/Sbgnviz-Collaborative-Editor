/**
 * Created by durupina on 5/17/17.
 * This is a Trips module to enable communication between trips and causalityAgent
 * Its role is to receive and decode messages and transfer them to causalityAgent
 */
"use strict";
let KQML = require('./KQML/kqml.js');

let TripsInterfaceModule = require('./TripsInterfaceModule.js');

class TripsVisualizationInterfaceModule extends TripsInterfaceModule{


    // @param socket : socket connection between the module and the agent --not server
   constructor (agentId, agentName, socket,  model, askHuman) {

       super('Visualization-Interface-Agent',agentId, agentName, socket,  model);

       let self = this;

       self.askHuman = askHuman;

   }

    /***
     * Gets the standardized name of the gene from an EKB XML string
     * by sending a request to sense prioritization agent
     * @param termStr : EKB XML string
     * @param callback : Called when sense prioritization agent returns an answer
     */
    getTermName(termStr, callback) {

        let self = this;
        this.tm.sendMsg({0: 'request', content: {0: 'CHOOSE-SENSE', 'ekb-term': termStr}});


        let patternXml = {0: 'reply', 1: '&key', content: ['SUCCESS', '.', '*']};

        self.tm.addHandler(patternXml, function (textXml) {

            if(textXml.content && textXml.content.length >= 2 && textXml.content[2].length > 0) {

                let termNames = [];
                for(let i = 0; i < textXml.content[2].length; i++) {
                    let contentObj = KQML.keywordify(textXml.content[2][i]);
                    let termName = trimDoubleQuotes(contentObj.name);
                    termNames.push(termName);
                }

                if(termNames.length == 1 && callback)
                     callback(termNames[0]);
                else if(callback)
                    callback(termNames);
            }
        });
    }


    setHandlers() {
        let self = this;

        let pattern = {0: 'request', 1: '&key', content: ['move-gene', '.', '*']};
        self.tm.addHandler(pattern, function (text) {
            self.moveGene(text);
        });

        pattern = {0: 'request', 1: '&key', content: ['move-gene-stream', '.', '*']};
        self.tm.addHandler(pattern, function (text) {
            self.moveGeneStream(text);
        });

        pattern = {0: 'request', 1: '&key', content: ['highlight-gene-stream', '.', '*']};
        self.tm.addHandler(pattern, function (text) {
            self.highlightGeneStream(text);
        });



    }



    moveGene(text) {
        let self = this;
        let contentObj = KQML.keywordify(text.content);
        if (contentObj) {
            self.getTermName(contentObj.name, function (geneName) {
                let state = trimDoubleQuotes(contentObj.state);
                let location = trimDoubleQuotes(contentObj.location);
                self.askHuman(self.agentId, self.room, "moveGene", {name: geneName, state: state, location: location, cyId: "0"}, function (val) {

                    // self.tm.replyToMsg(text, {0: 'reply', content: {0: 'success'}});
                });
            });
        }
    }


    moveGeneStream(text) {
        let self = this;
        let contentObj = KQML.keywordify(text.content);
        if (contentObj) {
            self.getTermName(contentObj.name, function (geneName) {
                let state = trimDoubleQuotes(contentObj.state);
                let location = trimDoubleQuotes(contentObj.location);
                let direction = trimDoubleQuotes(contentObj.direction);
                if(direction.toLowerCase().indexOf("upstream")> 0)
                    direction = "up";
                else if(direction.toLowerCase().indexOf("downstream")> 0)
                    direction = "down";
                self.askHuman(self.agentId, self.room, "moveGeneStream", {name: geneName, state: state, location:location, cyId: "0", direction: direction}, function (val) {



                });
            });
        }
    }


    highlightGeneStream(text) {
        let self = this;
        let contentObj = KQML.keywordify(text.content);
        if (contentObj) {
            self.getTermName(contentObj.name, function (geneName) {
                let state = trimDoubleQuotes(contentObj.state);
                let direction = trimDoubleQuotes(contentObj.direction);
                if(direction.toLowerCase().indexOf("upstream")> 0)
                    direction = "up";
                else if(direction.toLowerCase().indexOf("downstream")> 0)
                    direction = "down";
                self.askHuman(self.agentId, self.room, "highlightGeneStream", {name: geneName, state: state, cyId: "0", direction: direction}, function (val) {


                });
            });
        }
    }
}


module.exports = TripsVisualizationInterfaceModule;


/////////////////////////////////////////////////
// Local functions
/////////////////////////////////////////////////

function trimDoubleQuotes(str){
    if(str[0]!== '"' || str[str.length-1]!== '"')
        return str;

    let strTrimmed = str.slice(1, str.length -1);

    return strTrimmed;

}

