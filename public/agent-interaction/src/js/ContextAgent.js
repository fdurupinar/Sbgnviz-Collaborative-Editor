
/**
 * Author: Funda Durupinar Babur
 * Created by durupina on 5/13/16.
 * This is a client-side agent that extends from the Agent class.
 */

if(typeof module !== 'undefined' && module.exports) {
    var Agent = require("./agentAPI.js");
}

ContextAgent.prototype = new Agent();

function ContextAgent(name, id) {

    this.agentName = name;
    this.agentId = id;


    this.cancerTypes = [
        {abbr: "ACC", longName:"Adrenocortical carcinoma"},
        {abbr: "BLCA",longName:"Bladder Urothelial Carcinoma"},
        {abbr:"BRCA",longName:"Breast invasive carcinoma"},
        {abbr:"CESC",longName:"Cervical squamous cell carcinoma and endocervical adenocarcinoma"},
        {abbr:"CHOL",longName:"Cholangiocarcinoma"},
        {abbr:"COAD",longName:"Colon adenocarcinoma"},
        {abbr:"COADREAD",longName:"Colorectal cancer"},
        {abbr:"DLBC",longName:"Lymphoid Neoplasm Diffuse Large B-cell Lymphoma"},
        {abbr:"GBM",longName:"Glioblastoma multiforme"},
        {abbr:"GBMLGG",longName:"Glioblastoma multiforme/Brain Lower Grade Glioma"},
        {abbr:"HNSC",longName:"Head and Neck squamous cell carcinoma"},
        {abbr:"KICH",longName:"Kidney Chromophobe"},
        {abbr:"KIPAN",longName:"Pan-Kidney"},
        {abbr:"KIRC",longName:"Kidney renal clear cell carcinoma"},
        {abbr:"KIRP",longName:"Kidney renal papillary cell carcinoma"},
        {abbr:"LAML",longName:"	Acute Myeloid Leukemia"},
        {abbr:"LGG",longName:"Brain Lower Grade Glioma"},
        {abbr:"LIHC",longName:"Liver hepatocellular carcinoma"},
        {abbr:"LUAD",longName:"Lung adenocarcinoma"},
        {abbr:"LUSC",longName:"Lung squamous cell carcinoma"},
        {abbr:"OV",longName:"Oletian serous cystadenocarcinoma"},
        {abbr:"PAAD",longName:"Pancreatic adenocarcinoma"},
        {abbr:"PCPG",longName:"Pheochromocytoma and Paraganglioma"},
        {abbr:"PRAD",longName:"Prostate adenocarcinoma"},
        {abbr:"READ",longName:"Rectum adenocarcinoma"},
        {abbr:"SARC", longName:"Sarcoma"},
        {abbr:"SKCM", longName:"Skin Cutaneous Melanoma"},
        {abbr:"STAD", longName:"Stomach adenocarcinoma"},
        {abbr:"STES", longName:"Stomach and Esophageal carcinoma"},
        {abbr:"TGCT", longName:"Testicular Germ Cell Tumors"},
        {abbr:"THCA", longName:"Thyroid carcinoma"},
        {abbr:"UCEC", longName:"Uterine Corpus Endometrial Carcinoma"},
        {abbr:"UCS", longName:"Uterine Carcinosarcoma"},
        {abbr:"UVM", longName:"Uveal Melanoma"}];


    this.cancerList = []; //cancerType, genes[{importance, interactionCount}], importance, confidence
    this.cancerInd; //most likely cancer

    //Must be objects to send over socket.io -- cannot be arrays
    this.speciesList = {}; //species types and their scores
    this.organList = {}; //organ types and their scores



    this.cancerQuestionInd; //for communication through chat

    this.neighborhoodQuestionInd; //for communication through chat


    this.mostImportantNeighborName;
    this.mostImportantGeneName;
    this.mostImportantNode;



}

/**
 * Read mutsig analysis data into memory
 */
ContextAgent.prototype.initCancerGeneInformation = function(cancerType,  fileContent){
    let self = this;
    let cancer = {cancerType: cancerType, genes:new Object(), relevance:0, confidence:1};


    let genes = fileContent.split("\n").slice(1); //start from the second line


    genes.forEach(function(gene){
        let geneInfo = gene.split("\t");
        let pVal = Number(geneInfo[17]);
        let importance = (pVal== 0) ? 100 : -Math.log10(pVal);


        cancer.genes[geneInfo[1]] = {importance: importance, exclude:false};


    });



    self.cancerList.push(cancer);

}


ContextAgent.prototype.initContext = function(callback){
    let self = this;

    let context = self.getContext();
    if(context) {
        if (context.speciesList)
            self.speciesList = context.speciesList;
        if (context.organList)
            self.organList = context.organList;
    }



    self.cancerTypes.forEach(function (cancerType) {
        this.readTextFile("TCGA/" + cancerType.abbr + "/scores-mutsig.txt", function (fileContent) {
            self.initCancerGeneInformation(cancerType, fileContent);
        });
    });

    //update each node's contribution by 1
    let nodes = self.getNodeList();


    //update cumulative contributions of nodes for each cancer type
    self.updateCancerRelevance(nodes);


    if(callback) callback();
}

Agent.prototype.getContext = function(){
    return this.pageDoc.context;
}


ContextAgent.prototype.isGene = function(node){
    if(node.sbgnlabel && node.sbgnclass && ( (node.sbgnclass.indexOf("macromolecule") > -1 || node.sbgnclass.indexOf("nucleic") > -1 || node.sbgnclass.indexOf("chemical") > -1)))
        return true;
    return false;
}

ContextAgent.prototype.updateCancerRelevance = function (nodes) {

    let self = this;


    self.cancerList.forEach(function (cancer) {
        let cumRelevance = 0;
        let geneCnt = 0;
        for(let nodeId in nodes){
            let node = nodes[nodeId];


            if(self.isGene(node) && cancer.genes[node.sbgnlabel.toUpperCase()]){
                let gene = cancer.genes[node.sbgnlabel.toUpperCase()];
                cumRelevance += node.interactionCount * gene.importance;



                geneCnt++;
            }
        }

        if(geneCnt > 0)
            cancer.relevance = cumRelevance/geneCnt;
        else
            cancer.relevance = 0;





    });
}

ContextAgent.prototype.evaluateMessage = function(callback){
    let self = this;
    self.socket.on('message', function(data){
    let answer;

        //FIXME: find a better solution to get human response
        if(data.userId != self.agentId) {
            console.log(self.chatHistory.length + " " + data);
            if(self.chatHistory.length  ==  self.cancerQuestionInd + 2) {  //means human answered in response to agent's question about cancer type

                answer = data.comment;

                if (answer.toLowerCase().search("ye") > -1) {  //yes
                    //self.cancerList[self.cancerInd].confidence = 100;
                    self.cancerList[self.cancerInd].confidence *= 2;

                    self.mostImportantNode = self.findMostImportantNodeInContext(self.getNodeList(), self.cancerList[self.cancerInd]);


                    if( self.mostImportantNode ) {
                        self.findMostImportantNeighborInContext(true, self.mostImportantNode.sbgnlabel.toUpperCase(), self.cancerList[self.cancerInd], function (neighborName) {


                            self.mostImportantNeighborName = neighborName;

                            self.informAboutNeighborhood(self.mostImportantNode.sbgnlabel.toUpperCase(), neighborName);
                        });
                    }

                }

                else if (answer.toLowerCase().search("n") > -1) {
                    //self.cancerList[self.cancerInd].confidence = 0;
                    self.cancerList[self.cancerInd].confidence *= 0.5;

                }
                //else don't do anything


            }
            else if(self.chatHistory.length  ==  self.neighborhoodQuestionInd + 2) {
                answer = data.comment;



                if (answer.toLowerCase().search("ye") > -1)  //yes
                    self.suggestNewGraph( self.mostImportantNode.sbgnlabel.toUpperCase(), self.mostImportantNeighborName);

                else if (answer.toLowerCase().search("no") > -1){

                    self.cancerList[self.cancerInd].genes[self.mostImportantNeighborName].exclude = true;

                    if( self.mostImportantNode ) {

                        self.findMostImportantNeighborInContext(false, self.mostImportantNode.sbgnlabel.toUpperCase(), self.cancerList[self.cancerInd], function (neighborName) {


                            self.mostImportantNeighborName = neighborName;


                            self.informAboutNeighborhood(self.mostImportantNode.sbgnlabel.toUpperCase(), neighborName);
                        });
                    }

                }
            }


            if(callback) callback();
        }

    });
}

ContextAgent.prototype.findMostImportantNodeInContext = function(nodes, cancer){
    let self = this;
    let maxScore = -100000;
    let bestNode;
    for(let nodeInd in nodes){
        let node = nodes[nodeInd];

        // console.log(node.interactionCount);
        if(self.isGene(node)){
            let gene = cancer.genes[node.sbgnlabel.toUpperCase()];
            if(gene && gene.importance* node.interactionCount > maxScore) {
                maxScore = gene.importance * node.interactionCount;
                bestNode = node;
            }

        }
    }

    return bestNode;
}

/**
 * Evaluates chat message outputs based on REACH response in fries format
 */
ContextAgent.prototype.updateContextSpeciesAndOrgans = function(callback){
    let self = this;

    self.socket.on("REACHResult", function(data){
        let friesObj = JSON.parse(data);
        if(friesObj.entities && friesObj.entities.frames){
            friesObj.entities.frames.forEach(function(frame){
                if(frame.type == "species") {
                    if(self.speciesList[frame.text])
                        self.speciesList[frame.text]++;
                    else
                        self.speciesList[frame.text] = 1;
                }

                else if(frame.type == "organ") {
                    if(self.organList[frame.text])
                        self.organList[frame.text]++;
                    else
                        self.organList[frame.text] = 1;
                }
            });



            self.sendRequest("agentContextUpdate", {param:{ speciesList:self.speciesList, organList:self.organList}});

            if(callback) callback();

        }
    });
}




/**
 * Update cancer scores at each operation
 * @param op
 */
ContextAgent.prototype.updateContextCancer = function(callback){
    let self = this;
    let nodes = self.getNodeList(); //this is called after nodes are updated




    self.updateCancerRelevance(nodes);

    let prevcancerInd = self.cancerInd;
    self.cancerInd = self.findBestContext();


    if(self.cancerList[self.cancerInd].relevance *  self.cancerList[self.cancerInd].confidence >0){

        //if cancer changed
        if(!prevcancerInd  || (self.cancerInd>-1 && prevcancerInd!=self.cancerInd &&  self.cancerList[self.cancerInd].cancerType!= self.cancerList[prevcancerInd].cancerType )) { //only inform if the most likely cancer has changed

            let cancer = self.cancerList[self.cancerInd];
            self.informAboutCancer(cancer);


        }


        //update most important node and its neighbor
        let node = self.findMostImportantNodeInContext(nodes, self.cancerList[self.cancerInd]);
        if(node) {

            let prevNeighborName = self.mostImportantNeighborName;
            let prevGeneName = self.mostImportantGeneName;
            if (prevNeighborName != self.mostImportantNeighborName && prevGeneName != self.mostImportantGeneName) {
                self.findMostImportantNeighborInContext(true, node.sbgnlabel.toUpperCase(), self.cancerList[self.cancerInd], function (neighborName) {

                    self.mostImportantNeighborName = neighborName;
                    self.mostImportantGeneName = node.sbgnlabel.toUpperCase();


                    self.informAboutNeighborhood(node.sbgnlabel.toUpperCase(), neighborName);
                });
            }
        }
    }

    // self.sendRequest("agentContextUpdate", {param: {cancerType: self.cancerList[self.cancerInd].cancerType, geneName: self.mostImportantGeneName,
    // neighborName: self.mostImportantNeighborName}}); //only send the names of most important values

    if (callback) callback();




}


ContextAgent.prototype.printcancerList = function(){
    this.cancerList.forEach(function(cancer){
        console.log(cancer);
    })
}
ContextAgent.prototype.printMutationData = function(cancerData){
    cancerData.forEach(function(study) {
        if(study.seqCaseCnt > 0){

            console.log(study.id +  ": %"+  (study.mutationCaseIds.length*100/study.seqCaseCnt));
        }

    });
}

ContextAgent.prototype.findBestContext = function(){
    let self = this;

    let maxScore = - 100000;
    let maxcancerInd = -1;
    let ind = 0;
    self.cancerList.forEach(function(cancer){
        let score = cancer.relevance * cancer.confidence;
        if (score> maxScore) {
            maxScore = score;
            maxcancerInd = ind;
        }
        ind++;
    });

    return maxcancerInd;
}

ContextAgent.prototype.informAboutCancer = function(cancer){

    let self = this;

    let agentComment = "The most likely cancer type is  " + cancer.cancerType.longName;
    agentComment +=". Do you agree?"

    let targets = [];
    for(let i = 0; i < self.userList.length; i++){ //FIXME: send to all the users for now
        targets.push({id: self.userList[i].userId});
    }


    self.sendMessage(agentComment, targets);

    self.cancerQuestionInd = self.chatHistory.length - 1; //last question ind in history


}

ContextAgent.prototype.informAboutNeighborhood = function(geneName, neighborName){
    let self = this;

    let agentComment =   neighborName + " is another important gene in the neighborhood of " + geneName +
        ". Are you interested in seeing the neighborhood graph?";



    self.sendMessage(agentComment,"*"); //send all

    self.neighborhoodQuestionInd = self.chatHistory.length - 1; //last question ind in history


}

///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
ContextAgent.prototype.isInModel = function(geneName){
    let self = this;

    let nodes = self.getNodeList();

    for(let nodeInd in nodes){
        if(self.isGene(nodes[nodeInd]))
            if(nodes[nodeInd].sbgnlabel.toUpperCase() == geneName.toUpperCase())
                return true;
    }

    return false;
}

/**
 *
 * @param order
 * @param geneName
 * @param cancer
 * @param callback
 */
ContextAgent.prototype.findMostImportantNeighborInContext = function(tellGeneName, geneName, cancer, callback){
    let self = this;



    let pc2URL = "http://www.pathwaycommons.org/pc2/";
    let format = "graph?format=BINARY_SIF";
    let kind = "&kind=NEIGHBORHOOD";

    let sources = "&source=" +geneName;

    pc2URL = pc2URL + format + kind + sources;


    if(geneName) {

        self.socket.emit('PCQuery', {url: pc2URL, type: "sif"});
        if(tellGeneName)
            self.sendMessage(("The most important gene  in your network for this cancer type is " + geneName +". I'm looking up its neighborhood alterations..."), "*");
    }


    self.socket.on('PCQueryResult', function(data) {
        if(data.type == "sif"){


            let neighbors = self.findAllControllingNeighbors(geneName, data.graph);


            let importantNeighborName;
            const MIN_IMPORTANCE  = 2; //p-value of 0.01
            let maxScore = -100000;

            neighbors.forEach(function(neighborName) {
                if (!self.isInModel(neighborName) && cancer.genes[neighborName] && !cancer.genes[neighborName].exclude && cancer.genes[neighborName].importance > MIN_IMPORTANCE && cancer.genes[neighborName].importance > maxScore) {

                    maxScore = cancer.genes[neighborName].importance;
                    importantNeighborName = neighborName;
                }
            });


            if(callback && importantNeighborName)
                callback(importantNeighborName);
            else
                console.log("No important neighbors");


        }

    });

}

ContextAgent.prototype.suggestNewGraph = function(geneName, importantNeighborName) {

    let self = this;
    let pc2URL = "http://www.pathwaycommons.org/pc2/";
    let format = "graph?format=SBGN";
    let kind = "&kind=PATHSBETWEEN";
    let limit = "&limit=1";


    //PC only supports homo sapiens???
    // let species = "";
    // if(self.speciesInd > -1)
    //     species = "&organism=" + self.speciesList[self.speciesInd];

    let sources = "&source=" + geneName + "&source=" + importantNeighborName;

    pc2URL = pc2URL + format + kind + limit   + sources;


    self.sendRequest('AgentPCQueryRequest', {url: pc2URL, type: "sbgn"});


    self.socket.on('PCQueryResult', function (data) {
        if (data.type == "sbgn") {
            //if neighbor does not appear in the new graph, call the query with limit = 2
            // if(limit.indexOf("=1")>-1 && data.graph.indexOf(importantNeighborName)<0){
            //     limit = "&limit=2";
            //     pc2URL = "http://www.pathwaycommons.org/pc2/" + format + kind + limit + sources;
            //     self.socket.emit('PCQuery', {url: pc2URL, type: "sbgn"});
            // }
            // else {
            self.sendRequest("agentMergeGraphRequest", {graph: data.graph, type:"sbgn"});
            // }
        }

    });
}


/**
 * Parses a graph in sif format and returns nodes that have edges that control state change
 * @param sifGraph
 * @param geneName: find the molecule that is different from geneName
 *
 */
ContextAgent.prototype.findAllControllingNeighbors = function(geneName, sifGraph){
    let lines = sifGraph.split("\n");
    let neighbors = [];

    lines.forEach(function(line){

        let rel = line.split("\t");

        if(rel[1].indexOf("controls") >= 0){
            if(rel[0] == geneName && neighbors.indexOf(rel[2]) < 0)
                neighbors.push(rel[2]);
            else if(rel[2] == geneName && neighbors.indexOf(rel[0]) < 0)
                neighbors.push(rel[0]);
        }

    });



    return neighbors;
}







