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

       this.askHuman = askHuman;

       this.geneList = []; //list of molecules in the current pysb model
   }
   disconnect(){
       super.disconnect();
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
        this.tm.addHandler(pattern,  (text) =>{
            self.moveGene(text);
            this.tm.replyToMsg(text, {0: 'reply', content: {0: 'success'}});
        });

        pattern = {0: 'request', 1: '&key', content: ['move-compartment', '.', '*']};
        self.tm.addHandler(pattern,  (text) => {

            self.moveCompartment(text);
            this.tm.replyToMsg(text, {0: 'reply', content: {0: 'success'}});
        });
        pattern = {0: 'request', 1: '&key', content: ['move-gene-stream', '.', '*']};
        self.tm.addHandler(pattern,  (text) => {
            self.moveGeneStream(text);
            this.tm.replyToMsg(text, {0: 'reply', content: {0: 'success'}});
        });

        pattern = {0: 'request', 1: '&key', content: ['highlight-gene-stream', '.', '*']};
        self.tm.addHandler(pattern,  (text) => {
            self.highlightGeneStream(text);
            this.tm.replyToMsg(text, {0: 'reply', content: {0: 'success'}});
        });


        pattern = {0: 'request', 1: '&key', content: ['put-into-compartment', '.', '*']};
        this.tm.addHandler(pattern, (text) => {

            let genes;
            let termStr =  text.content[2];

            if(termStr.toLowerCase() === 'ont::all')
                genes = "ont::all";
            else
                genes = this.extractGeneNamesFromEkb(termStr);

            let compartment = trimDoubleQuotes(text.content[4]);
            this.askHuman(this.agentId, this.room, "addCellularLocation", {genes: genes, compartment:compartment},  () => {
                this.tm.replyToMsg(text, {0: 'reply', content: {0: 'success'}});
            });



        });


        pattern = {0: 'request', 1: '&key', content: ['put-out-of-compartment', '.', '*']};
        this.tm.addHandler(pattern, (text) => {

            let genes;
            let termStr =  text.content[2];

            if(termStr.toLowerCase() === 'ont::all')
                genes = "ont::all";
            else
                genes = this.extractGeneNamesFromEkb(termStr);

            let compartment = trimDoubleQuotes(text.content[4]);
            this.askHuman(this.agentId, this.room, "moveOutOfCellularLocation", {genes: genes, compartment:compartment},  () => {
                this.tm.replyToMsg(text, {0: 'reply', content: {0: 'success'}});
            });



        });


        pattern = {0: 'request', 1: '&key', content: ['get-common-cellular-location', '.', '*']};
        this.tm.addHandler(pattern, (text) => {

            console.log("get common location query " +  text.content);
            let modelId = text.content[2];
            this.modelGetJson(modelId, (jsonModel)=> {

                let geneList = this.getGeneList(jsonModel);


                if(geneList.length > 0 && areListsDifferent(geneList, this.geneList)) {

                    this.geneList = geneList;
                    this.tm.sendMsg({
                        0: 'request',
                        content: {0: 'FIND-CELLULAR-LOCATION-FROM-NAMES', genes: geneList}
                    });

                    let patternXml = {0: 'reply', 1: '&key', content: ['success', '.', '*'], sender: 'CAUSALA'};

                    this.tm.addHandler(patternXml, (response) => {

                        this.tm.replyToMsg(text, {
                            0: 'reply',
                            content: {0: 'success', components: response.content[2], genes: geneList}
                        });

                    });
                }
            });

        });

    }



    moveGene(text) {
        let contentObj = KQML.keywordify(text.content);
        if (contentObj) {
            this.getTermName(contentObj.name,  (geneName) => {
                let state = trimDoubleQuotes(contentObj.state);
                let location = trimDoubleQuotes(contentObj.location);

                this.askHuman(this.agentId, this.room, "moveGene", {name: geneName, state: state, location: location, cyId: "0"},  (val) => {

                    // this.tm.replyToMsg(text, {0: 'reply', content: {0: 'success'}});
                });
            });
        }
    }
    moveCompartment(text) {
        let contentObj = KQML.keywordify(text.content);
        if (contentObj) {
            let compartmentName = trimDoubleQuotes(contentObj.name).replace("W::", '');
            compartmentName = compartmentName.replace("ONT::", '');
            let location = trimDoubleQuotes(contentObj.location);



            this.askHuman(this.agentId, this.room, "moveGene", {name: compartmentName, state: "", location: location, cyId: "0"},  (val)  => {

            });
        }
    }

    moveGeneStream(text) {
        let contentObj = KQML.keywordify(text.content);
        if (contentObj) {
            this.getTermName(contentObj.name,  (geneName) => {
                let state = trimDoubleQuotes(contentObj.state);
                let location = trimDoubleQuotes(contentObj.location);
                let direction = trimDoubleQuotes(contentObj.direction);
                if(direction.toLowerCase().indexOf("upstream")> -1)
                    direction = "up";
                else if(direction.toLowerCase().indexOf("downstream")> -1)
                    direction = "down";
                this.askHuman(this.agentId, this.room, "moveGeneStream", {name: geneName, state: state, location:location, cyId: "0", direction: direction},  (val) => {
                });
            });
        }
    }


    highlightGeneStream(text) {
        let contentObj = KQML.keywordify(text.content);
        if (contentObj) {
            this.getTermName(contentObj.name,  (geneName) => {
                let state = trimDoubleQuotes(contentObj.state);
                let direction = trimDoubleQuotes(contentObj.direction);

                if(direction.toLowerCase().indexOf("upstream")> -1)
                    direction = "up";
                else if(direction.toLowerCase().indexOf("downstream")> -1)
                    direction = "down";


                this.askHuman(this.agentId, this.room, "highlightGeneStream", {name: geneName, state: state, cyId: "0", direction: direction},  (val) => {


                });
            });
        }
    }

    /***
     * Find the variables between <name></name> tags
     * @param termStr: ekb string
     * @returns {Array} of gene names
     */
    extractGeneNamesFromEkb(termStr){

        var re = new RegExp(/<name>\s*(.*?)\s*<\/name>/g);

        var genes = [];
        let m = re.exec(termStr);
        while (m) {
            genes.push(m[1]);
            m = re.exec(termStr);
        }

        return genes;
    }

    getGeneList(jsonModel){

        let geneList = [];
        jsonModel.forEach((interaction) => {
            if (interaction.enz)
                geneList.push(interaction.enz.name);
            if (interaction.sub)
                geneList.push(interaction.sub.name);
            if (interaction.subj)
                geneList.push(interaction.subj.name);
            if (interaction.obj)
                geneList.push(interaction.obj.name);
        });


        //unique elements
        geneList = geneList.filter(function(elem, index, self) {
            return index === self.indexOf(elem);
        });

        return geneList;

    }
    /***
     * Gets the INDRA model in json format
     */
    modelGetJson(modelId, callback){

        this.tm.sendMsg({0: 'request', content: {0: 'MODEL-GET-JSON', 'MODEL-ID': modelId}});


        let patternXml = {0: 'reply', 1: '&key', content: ['success', '.', '*'], sender: 'MRA'};

        this.tm.addHandler(patternXml, (response) => {

            let jsonStr = trimDoubleQuotes(response.content[2]);

            jsonStr = jsonStr.replace(/(\\")/g, '"');
            let jsonModel = JSON.parse(jsonStr);

            if(callback) callback(jsonModel);
        });
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


function areListsDifferent(list1, list2){

    Array.prototype.diff = function(a) {
        return this.filter(function(i) {return a.indexOf(i) < 0;});
    };

    return((list1.diff(list2)).length > 0 || (list2.diff(list1)).length > 0 )
}