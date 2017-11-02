/**
 * Created by durupina on 5/17/17.
 * This is a Trips module to enable communication between trips and causalityAgent
 * Its role is to receive and decode messages and transfer them to causalityAgent
 */
"use strict";
let KQML = require('./KQML/kqml.js');

let TripsInterfaceModule = require('./TripsInterfaceModule.js');

class TripsCausalityInterfaceModule extends TripsInterfaceModule{


    // @param socket : socket connection between the module and the agent --not server
   constructor (agentId, agentName, socket,  model) {

       super('Causality-Interface-Agent',agentId, agentName, socket,  model);

   }

    /***
     * Sends queries to CausalityAgent.js
     * @param id: Name of the gene to query
     * @param rel: Specific causal relationship
     * @param callback : Called when CausalityAgent returns an answer
     */
    requestCausalityElementsFromAgent(id, rel, callback){


        let self = this;
        let param = {id: id, pSite: '', rel:rel};


        //Request this information from the causalityAgent
        self.socket.emit("findCausalityTargets", param, function(elements){
            let indraJson = [];

            elements.forEach(function(el){
                indraJson.push(makeIndraJson(el));
            });


            let stringJson = JSON.stringify(indraJson);
            stringJson = '"'+  stringJson.replace(/["]/g, "\\\"") + '"';

            let response;
            if(indraJson.length > 0) {
                response = {0: 'reply', content: {0: 'success', paths: stringJson}};


            }
            else
                response = {0:'reply', content:{0:'failure',1: ':reason', 2: 'MISSING_MECHANISM'}};

            if(callback) callback(response);

        });
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

        //Listen to queries about the causal relationship between to genes
        //E.g. How does MAPK1 affect JUND?
        let pattern = { 0: 'request', 1:'&key', content: [ 'find-causal-path',  '.', '*']};
        self.tm.addHandler(pattern, function (text) { //listen to requests

            let contentObj = KQML.keywordify(text.content);


            self.getTermName(contentObj.source, function (source) {

                self.getTermName(contentObj.target, function (target) {

                    //todo:later
                    let resSource = '';
                    let posSource = '';
                    let resTarget = '';
                    let posTarget = '';

                    let param = {
                        source: {id: source, pSite: (resSource + posSource + resSource)},
                        target: {id: target, pSite: (resTarget + posTarget + resTarget)}
                    };


                    //Request this information from the causalityAgent
                    self.socket.emit('findCausality', param, function (causality) {

                        let indraJson;

                        if (!causality || !causality.rel)
                            self.tm.replyToMsg(text, {0: 'reply', content: {0: 'failure', 1: ':reason', 2: 'NO_PATH_FOUND'}});
                        else {


                            indraJson = [makeIndraJson(causality)];
                            let stringJson = JSON.stringify(indraJson);
                            stringJson = '"' + stringJson.replace(/["]/g, "\\\"") + '"';

                            let response = {0: 'reply', content: {0: 'success', paths: stringJson}};
                            self.tm.replyToMsg(text, response);
                        }
                    });

                });

            });
        });

        //Listen to queries asking the targets of a causal relationship
        //E.g. What genes does MAPK1 phosphorylate?
        pattern = { 0: 'request', 1:'&key', content: [ 'find-causality-target',  '.', '*']};

        self.tm.addHandler(pattern, function (text) { //listen to requests

            let contentObj = KQML.keywordify(text.content);

            if(contentObj) {
                self.getTermName(contentObj.target, function (target) {

                    let queryToRequestMap = {
                        '\"phosphorylation\"': "phosphorylates",
                        '\"dephosphorylation\"': "dephosphorylates",
                        '\"activate\"': "upregulates-expression",
                        '\"increase\"': "upregulates-expression",
                        '\"inhibit\"': "downregulates-expression",
                        '\"decrease\"': "downregulates-expression"
                    };


                    let requestType = queryToRequestMap[contentObj.type] || "modulates";


                    self.requestCausalityElementsFromAgent(target, requestType, function (response) {
                        self.tm.replyToMsg(text, response);
                    });
                });
            }
        });


        //Listen to queries asking the sources of a causal relationship
        //E.g. What genes phosphorylate MAPK1?
        pattern = { 0: 'request', 1:'&key', content: [ 'find-causality-source',  '.', '*']};

        self.tm.addHandler(pattern, function (text) { //listen to requests

            let contentObj = KQML.keywordify(text.content);
            if(contentObj) {

                self.getTermName(contentObj.source, function (source) {

                    let queryToRequestMap = {
                        '\"phosphorylation\"': "is-phosphorylated-by",
                        '\"dephosphorylation\"': "is-dephosphorylated-by",
                        '\"activate\"': "expression-is-upregulated-by",
                        '\"increase\"': "expression-is-upregulated-by",
                        '\"inhibit\"': "expression-is-downregulated-by",
                        '\"decrease\"': "expression-is-downregulated-by"
                    }


                    let requestType = queryToRequestMap[contentObj.type] || "modulates";

                    self.requestCausalityElementsFromAgent(source, requestType, function (response) {
                        self.tm.replyToMsg(text, response);

                    });
                });
            }

        });


        //Listen to requests for correlation queries
        pattern = { 0: 'request', 1:'&key', content: [ 'dataset-correlated-entity',  '.', '*']};
        self.tm.addHandler(pattern, function (text) { //listen to requests
            let contentObj = KQML.keywordify(text.content);


            self.getTermName(contentObj.source, function (source) {

                //Request this information from the causalityAgent
                self.socket.emit('findCorrelation', source, function (data) {


                    // We are not allowed to send a request if null, so put a temporary string
                    let pSite1 = data.pSite1 || '-';
                    let pSite2 = data.pSite2 || '-';


                    self.tm.replyToMsg(text, {0: 'reply', content: {0: 'success',  target:data.id2, correlation: data.correlation, explainable:data.explainable}});

                });
            });
        });


        //Listen to requests for common upstreams
        pattern = { 0: 'request', 1:'&key', content: [ 'find-common-upstreams',  '.', '*']};

        self.tm.addHandler(pattern, function (text) { //listen to requests
            let contentObj = KQML.keywordify(text.content);

            let geneNames = [];
            // contentObj.genes.forEach(function(gene){
            self.getTermName(contentObj.genes, function(geneNames){
                // // //Request this information from the causalityAgent
                self.socket.emit('findCommonUpstreams', geneNames, function (data) {

                    let response = {0: 'reply', content: {0: 'success', upstreams: data}};
                    self.tm.replyToMsg(text, response);
                });

            });



        });
        //Listen to requests for correlation queries
        pattern = { 0: 'request', 1:'&key', content: [ 'restart-causality-indices',  '.', '*']};
        self.tm.addHandler(pattern, function (text) { //listen to requests



            //Request this information from the causalityAgent
            self.socket.emit('restartCausalityIndices',  function (data) {


                self.tm.replyToMsg(text, {0: 'reply', content: {0: 'success'}});

            });

        });
    }
}


module.exports = TripsCausalityInterfaceModule;

/***
 * Converts the causal relationship information into JSON format so that INDRA can translate it into NL
 * @param causality : specific causal relationship with two genes
 * @returns {*}
 */
let makeIndraJson = function(causality){
    const indraRelationMap ={
        "PHOSPHORYLATES": "Phosphorylation",
        "IS-PHOSPHORYLATED-BY": "Phosphorylation",
        "IS-DEPHOSPHORYLATED-BY": "Dephosphorylation",
        "UPREGULATES-EXPRESSION": "IncreaseAmount",
        "EXPRESSION-IS-UPREGULATED-BY":"IncreaseAmount",
        "DOWNREGULATES-EXPRESSION": "DecreaseAmount",
        "EXPRESSION-IS-DOWNREGULATED-BY":"DecreaseAmount"
    }


    let indraJson;
    causality.rel = causality.rel.toUpperCase();

    //INDRA requires site info to be null if empty
    if(causality.pos1 === "") causality.pos1 = null;
    if(causality.res1 === "") causality.res1 = null;
    if(causality.pos2 === "") causality.pos2 = null;
    if(causality.res2 === "") causality.res2 = null;


    let relType = indraRelationMap[causality.rel];


    // If it's a phosphorylation
    if(causality.rel.indexOf("PHOSPHO")>=0) {
        if(causality.rel.indexOf("IS") >= 0) //passive
            indraJson = {
                type: relType,
                enz: {name: causality.id2,
                      mods: causality.mods2},
                sub: { name: causality.id1},
                residue: causality.mods1[0].residue,
                position:causality.mods1[0].position};
        else
            indraJson = {
                type: relType,
                enz: {name: causality.id1,
                      mods: causality.mods1},
                sub: {name: causality.id2},
                residue: causality.mods2[0].residue,
                position:causality.mods2[0].position};
    }
    // If it's not a phosphorylation
    else {
        if(causality.rel.indexOf("IS") >= 0)//passive
            indraJson = {
                type: relType,
                subj: {name: causality.id2,
                       mods: [{ mod_type: 'phosphorylation',
                                is_modified: true,
                                residue: causality.res2,
                                position: causality.pos2}]},
                obj: { name: causality.id1},
                residue: causality.res1,
                position:causality.pos1};
        else
            indraJson = {
                type: relType,
                subj: {name: causality.id1,
                       mods: [{ mod_type: 'phosphorylation',
                              is_modified: true,
                              residue: causality.res1,
                              position: causality.pos1}]},
                obj: {name: causality.id2},
                residue: causality.res2,
                position:causality.pos2};
    }


    return indraJson;

}

/////////////////////////////////////////////////
// Local functions
/////////////////////////////////////////////////

function trimDoubleQuotes(str){
    if(str[0]!== '"' || str[str.length-1]!== '"')
        return str;

    let strTrimmed = str.slice(1, str.length -1);

    return strTrimmed;

}

