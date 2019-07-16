//
// /**
//  * Author: Funda Durupinar Babur
//  * Created by durupina on 5/13/16.
//  * This is a client-side agent that extends from the Agent class.
//  */
//
//
// //TODO: this should be written as a Python agent
// //NOT BEING USED NOW
// // if(typeof module !== 'undefined' && module.exports)
// let Agent = require("./agentAPI.js");
//
//
// const cancerTypes = [
//     {abbr: "ACC", longName:"Adrenocortical carcinoma"},
//     {abbr: "BLCA",longName:"Bladder Urothelial Carcinoma"},
//     {abbr:"BRCA",longName:"Breast invasive carcinoma"},
//     {abbr:"CESC",longName:"Cervical squamous cell carcinoma and endocervical adenocarcinoma"},
//     {abbr:"CHOL",longName:"Cholangiocarcinoma"},
//     {abbr:"COAD",longName:"Colon adenocarcinoma"},
//     {abbr:"COADREAD",longName:"Colorectal cancer"},
//     {abbr:"DLBC",longName:"Lymphoid Neoplasm Diffuse Large B-cell Lymphoma"},
//     {abbr:"GBM",longName:"Glioblastoma multiforme"},
//     {abbr:"GBMLGG",longName:"Glioblastoma multiforme/Brain Lower Grade Glioma"},
//     {abbr:"HNSC",longName:"Head and Neck squamous cell carcinoma"},
//     {abbr:"KICH",longName:"Kidney Chromophobe"},
//     {abbr:"KIPAN",longName:"Pan-Kidney"},
//     {abbr:"KIRC",longName:"Kidney renal clear cell carcinoma"},
//     {abbr:"KIRP",longName:"Kidney renal papillary cell carcinoma"},
//     {abbr:"LAML",longName:"	Acute Myeloid Leukemia"},
//     {abbr:"LGG",longName:"Brain Lower Grade Glioma"},
//     {abbr:"LIHC",longName:"Liver hepatocellular carcinoma"},
//     {abbr:"LUAD",longName:"Lung adenocarcinoma"},
//     {abbr:"LUSC",longName:"Lung squamous cell carcinoma"},
//     {abbr:"OV",longName:"Oletian serous cystadenocarcinoma"},
//     {abbr:"PAAD",longName:"Pancreatic adenocarcinoma"},
//     {abbr:"PCPG",longName:"Pheochromocytoma and Paraganglioma"},
//     {abbr:"PRAD",longName:"Prostate adenocarcinoma"},
//     {abbr:"READ",longName:"Rectum adenocarcinoma"},
//     {abbr:"SARC", longName:"Sarcoma"},
//     {abbr:"SKCM", longName:"Skin Cutaneous Melanoma"},
//     {abbr:"STAD", longName:"Stomach adenocarcinoma"},
//     {abbr:"STES", longName:"Stomach and Esophageal carcinoma"},
//     {abbr:"TGCT", longName:"Testicular Germ Cell Tumors"},
//     {abbr:"THCA", longName:"Thyroid carcinoma"},
//     {abbr:"UCEC", longName:"Uterine Corpus Endometrial Carcinoma"},
//     {abbr:"UCS", longName:"Uterine Carcinosarcoma"},
//     {abbr:"UVM", longName:"Uveal Melanoma"}];
//
// class ContextAgent extends Agent{
//     /**
//      *
//      * @param {string} name Agent name
//      * @param {string} id Agent id
//      */
//     constructor(name, id) {
//
//         super(name, id);
//
//         this.cancerList = []; //cancerType, genes[{importance, interactionCount}], importance, confidence
//         this.cancerInd; //most likely cancer
//
//         //Must be objects to send over socket.io -- cannot be arrays
//         this.speciesList = {}; //species types and their scores
//         this.organList = {}; //organ types and their scores
//
//         this.cancerQuestionInd; //for communication through chat
//         this.neighborhoodQuestionInd; //for communication through chat
//
//
//         this.mostImportantNeighborName;
//         this.mostImportantGeneName;
//         this.mostImportantNode;
//
//
//     }
//
//     /**
//      * Read mutsig analysis data into memory
//      * @param {string} cancerType
//      * @param {string} fileContent  Read from the disk
//      */
//     initCancerGeneInformation(cancerType,  fileContent){
//
//         let cancer = {cancerType: cancerType, genes:new Object(), relevance:0, confidence:1};
//
//         let genes = fileContent.split("\n").slice(1); //start from the second line
//
//         genes.forEach((gene) =>{
//             let geneInfo = gene.split("\t");
//             let pVal = Number(geneInfo[17]);
//             let importance = (pVal== 0) ? 100 : -Math.log10(pVal);
//
//             cancer.genes[geneInfo[1]] = {importance: importance, exclude:false};
//
//         });
//
//
//         this.cancerList.push(cancer);
//
//     }
//
//
//     initContext(callback){
//
//         let context = this.getContext();
//         if(context) {
//             if (context.speciesList)
//                 this.speciesList = context.speciesList;
//             if (context.organList)
//                 this.organList = context.organList;
//         }
//
//
//
//         cancerTypes.forEach((cancerType) => {
//             readTextFile("TCGA/" + cancerType.abbr + "/scores-mutsig.txt", (fileContent) => {
//                 this.initCancerGeneInformation(cancerType, fileContent);
//             });
//         });
//
//         //update each node's contribution by 1
//         let nodes = this.getNodeList();
//
//
//         //update cumulative contributions of nodes for each cancer type
//         this.updateCancerRelevance(nodes);
//
//
//         if(callback) callback();
//     }
//
//
//     getContext(){
//         return this.pageDoc.context;
//     }
//
//
//     isGene(node){
//         if(node.sbgnlabel && node.sbgnclass && ( (node.sbgnclass.indexOf("macromolecule") > -1 || node.sbgnclass.indexOf("nucleic") > -1 || node.sbgnclass.indexOf("chemical") > -1)))
//             return true;
//         return false;
//     }
//
//     updateCancerRelevance (nodes) {
//
//         this.cancerList.forEach( (cancer)=> {
//             let cumRelevance = 0;
//             let geneCnt = 0;
//             for(let nodeId in nodes){
//                 let node = nodes[nodeId];
//
//
//                 if(this.isGene(node) && cancer.genes[node.sbgnlabel.toUpperCase()]){
//                     let gene = cancer.genes[node.sbgnlabel.toUpperCase()];
//                     cumRelevance += node.interactionCount * gene.importance;
//
//
//                     geneCnt++;
//                 }
//             }
//
//             if(geneCnt > 0)
//                 cancer.relevance = cumRelevance/geneCnt;
//             else
//                 cancer.relevance = 0;
//
//
//
//
//
//         });
//     }
//
//     evaluateMessage(callback){
//
//         this.socket.on('message', (data)=>{
//         let answer;
//
//             //FIXME: find a better solution to get human response
//             if(data.userId != this.agentId) {
//                 console.log(this.chatHistory.length + " " + data);
//                 if(this.chatHistory.length  ==  this.cancerQuestionInd + 2) {  //means human answered in response to agent's question about cancer type
//
//                     answer = data.comment;
//
//                     if (answer.toLowerCase().search("ye") > -1) {  //yes
//                         //this.cancerList[this.cancerInd].confidence = 100;
//                         this.cancerList[this.cancerInd].confidence *= 2;
//
//                         this.mostImportantNode = this.findMostImportantNodeInContext(this.getNodeList(), this.cancerList[this.cancerInd]);
//
//
//                         if( this.mostImportantNode ) {
//                             this.findMostImportantNeighborInContext(true, this.mostImportantNode.sbgnlabel.toUpperCase(), this.cancerList[this.cancerInd],  (neighborName)=> {
//
//
//                                 this.mostImportantNeighborName = neighborName;
//
//                                 this.informAboutNeighborhood(this.mostImportantNode.sbgnlabel.toUpperCase(), neighborName);
//                             });
//                         }
//
//                     }
//
//                     else if (answer.toLowerCase().search("n") > -1) {
//                         //this.cancerList[this.cancerInd].confidence = 0;
//                         this.cancerList[this.cancerInd].confidence *= 0.5;
//
//                     }
//                     //else don't do anything
//
//
//                 }
//                 else if(this.chatHistory.length  ==  this.neighborhoodQuestionInd + 2) {
//                     answer = data.comment;
//
//
//
//                     if (answer.toLowerCase().search("ye") > -1)  //yes
//                         this.suggestNewGraph( this.mostImportantNode.sbgnlabel.toUpperCase(), this.mostImportantNeighborName);
//
//                     else if (answer.toLowerCase().search("no") > -1){
//
//                         this.cancerList[this.cancerInd].genes[this.mostImportantNeighborName].exclude = true;
//
//                         if( this.mostImportantNode ) {
//
//                             this.findMostImportantNeighborInContext(false, this.mostImportantNode.sbgnlabel.toUpperCase(), this.cancerList[this.cancerInd], (neighborName)=> {
//
//
//                                 this.mostImportantNeighborName = neighborName;
//
//
//                                 this.informAboutNeighborhood(this.mostImportantNode.sbgnlabel.toUpperCase(), neighborName);
//                             });
//                         }
//
//                     }
//                 }
//
//
//                 if(callback) callback();
//             }
//
//         });
//     }
//
//     findMostImportantNodeInContext(nodes, cancer){
//
//         let maxScore = -100000;
//         let bestNode;
//         for(let nodeInd in nodes){
//             let node = nodes[nodeInd];
//
//             // console.log(node.interactionCount);
//             if(this.isGene(node)){
//                 let gene = cancer.genes[node.sbgnlabel.toUpperCase()];
//                 if(gene && gene.importance* node.interactionCount > maxScore) {
//                     maxScore = gene.importance * node.interactionCount;
//                     bestNode = node;
//                 }
//
//             }
//         }
//
//         return bestNode;
//     }
//
//     /**
//      * Evaluates chat message outputs based on REACH response in fries format
//      */
//     updateContextSpeciesAndOrgans(callback){
//
//
//         this.socket.on("REACHResult", (data)=>{
//             let friesObj = JSON.parse(data);
//             if(friesObj.entities && friesObj.entities.frames){
//                 friesObj.entities.frames.forEach((frame)=>{
//                     if(frame.type == "species") {
//                         if(this.speciesList[frame.text])
//                             this.speciesList[frame.text]++;
//                         else
//                             this.speciesList[frame.text] = 1;
//                     }
//
//                     else if(frame.type == "organ") {
//                         if(this.organList[frame.text])
//                             this.organList[frame.text]++;
//                         else
//                             this.organList[frame.text] = 1;
//                     }
//                 });
//
//
//
//                 this.sendRequest("agentContextUpdate", {param:{ speciesList:this.speciesList, organList:this.organList}});
//
//                 if(callback) callback();
//
//             }
//         });
//     }
//
//
//
//
//     /**
//      * Update cancer scores at each operation
//      * @param op
//      */
//     updateContextCancer(callback){
//
//         let nodes = this.getNodeList(); //this is called after nodes are updated
//
//
//
//         this.updateCancerRelevance(nodes);
//
//         let prevcancerInd = this.cancerInd;
//         this.cancerInd = this.findBestContext();
//
//
//         if(this.cancerList[this.cancerInd].relevance *  this.cancerList[this.cancerInd].confidence >0){
//
//             //if cancer changed
//             if(!prevcancerInd  || (this.cancerInd>-1 && prevcancerInd!=this.cancerInd &&  this.cancerList[this.cancerInd].cancerType!= this.cancerList[prevcancerInd].cancerType )) { //only inform if the most likely cancer has changed
//
//                 let cancer = this.cancerList[this.cancerInd];
//                 this.informAboutCancer(cancer);
//
//
//             }
//
//
//             //update most important node and its neighbor
//             let node = this.findMostImportantNodeInContext(nodes, this.cancerList[this.cancerInd]);
//             if(node) {
//
//                 let prevNeighborName = this.mostImportantNeighborName;
//                 let prevGeneName = this.mostImportantGeneName;
//                 if (prevNeighborName != this.mostImportantNeighborName && prevGeneName != this.mostImportantGeneName) {
//                     this.findMostImportantNeighborInContext(true, node.sbgnlabel.toUpperCase(), this.cancerList[this.cancerInd], (neighborName)=> {
//
//                         this.mostImportantNeighborName = neighborName;
//                         this.mostImportantGeneName = node.sbgnlabel.toUpperCase();
//
//
//                         this.informAboutNeighborhood(node.sbgnlabel.toUpperCase(), neighborName);
//                     });
//                 }
//             }
//         }
//
//         // this.sendRequest("agentContextUpdate", {param: {cancerType: this.cancerList[this.cancerInd].cancerType, geneName: this.mostImportantGeneName,
//         // neighborName: this.mostImportantNeighborName}}); //only send the names of most important values
//
//         if (callback) callback();
//
//
//
//
//     }
//
//
//     printcancerList(){
//         this.cancerList.forEach((cancer)=>{
//             console.log(cancer);
//         })
//     }
//     printMutationData(cancerData){
//         cancerData.forEach((study)=> {
//             if(study.seqCaseCnt > 0){
//
//                 console.log(study.id +  ": %"+  (study.mutationCaseIds.length*100/study.seqCaseCnt));
//             }
//
//         });
//     }
//
//     findBestContext(){
//
//
//         let maxScore = - 100000;
//         let maxcancerInd = -1;
//         let ind = 0;
//         this.cancerList.forEach((cancer)=>{
//             let score = cancer.relevance * cancer.confidence;
//             if (score> maxScore) {
//                 maxScore = score;
//                 maxcancerInd = ind;
//             }
//             ind++;
//         });
//
//         return maxcancerInd;
//     }
//
//     informAboutCancer(cancer){
//
//
//
//         let agentComment = "The most likely cancer type is  " + cancer.cancerType.longName;
//         agentComment +=". Do you agree?"
//
//         let targets = [];
//         for(let i = 0; i < this.userList.length; i++){ //FIXME: send to all the users for now
//             targets.push({id: this.userList[i].userId});
//         }
//
//
//         this.sendMessage(agentComment, targets);
//
//         this.cancerQuestionInd = this.chatHistory.length - 1; //last question ind in history
//
//
//     }
//
//     informAboutNeighborhood(geneName, neighborName){
//
//
//         let agentComment =   neighborName + " is another important gene in the neighborhood of " + geneName +
//             ". Are you interested in seeing the neighborhood graph?";
//
//
//
//         this.sendMessage(agentComment,"*"); //send all
//
//         this.neighborhoodQuestionInd = this.chatHistory.length - 1; //last question ind in history
//
//
//     }
//
//     ///////////////////////////////////////////////////////////////////////////
//     ///////////////////////////////////////////////////////////////////////////
//     ///////////////////////////////////////////////////////////////////////////
//     isInModel(geneName){
//
//
//         let nodes = this.getNodeList();
//
//         for(let nodeInd in nodes){
//             if(this.isGene(nodes[nodeInd]))
//                 if(nodes[nodeInd].sbgnlabel.toUpperCase() == geneName.toUpperCase())
//                     return true;
//         }
//
//         return false;
//     }
//
//     /**
//      *
//      * @param order
//      * @param geneName
//      * @param cancer
//      * @param callback
//      */
//     findMostImportantNeighborInContext(tellGeneName, geneName, cancer, callback){
//
//
//
//
//         let pc2URL = "http://www.pathwaycommons.org/pc2/";
//         let format = "graph?format=BINARY_SIF";
//         let kind = "&kind=NEIGHBORHOOD";
//
//         let sources = "&source=" +geneName;
//
//         pc2URL = pc2URL + format + kind + sources;
//
//
//         if(geneName) {
//
//             this.socket.emit('PCQuery', {url: pc2URL, type: "sif"});
//             if(tellGeneName)
//                 this.sendMessage(("The most important gene  in your network for this cancer type is " + geneName +". I'm looking up its neighborhood alterations..."), "*");
//         }
//
//
//         this.socket.on('PCQueryResult', (data)=> {
//             if(data.type == "sif"){
//
//
//                 let neighbors = this.findAllControllingNeighbors(geneName, data.graph);
//
//
//                 let importantNeighborName;
//                 const MIN_IMPORTANCE  = 2; //p-value of 0.01
//                 let maxScore = -100000;
//
//                 neighbors.forEach((neighborName)=> {
//                     if (!this.isInModel(neighborName) && cancer.genes[neighborName] && !cancer.genes[neighborName].exclude && cancer.genes[neighborName].importance > MIN_IMPORTANCE && cancer.genes[neighborName].importance > maxScore) {
//
//                         maxScore = cancer.genes[neighborName].importance;
//                         importantNeighborName = neighborName;
//                     }
//                 });
//
//
//                 if(callback && importantNeighborName)
//                     callback(importantNeighborName);
//                 else
//                     console.log("No important neighbors");
//
//
//             }
//
//         });
//
//     }
//
//     suggestNewGraph(geneName, importantNeighborName) {
//
//
//         let pc2URL = "http://www.pathwaycommons.org/pc2/";
//         let format = "graph?format=SBGN";
//         let kind = "&kind=PATHSBETWEEN";
//         let limit = "&limit=1";
//
//
//         //PC only supports homo sapiens???
//         // let species = "";
//         // if(this.speciesInd > -1)
//         //     species = "&organism=" + this.speciesList[this.speciesInd];
//
//         let sources = "&source=" + geneName + "&source=" + importantNeighborName;
//
//         pc2URL = pc2URL + format + kind + limit   + sources;
//
//
//         this.sendRequest('AgentPCQueryRequest', {url: pc2URL, type: "sbgn"});
//
//
//         this.socket.on('PCQueryResult', (data)=> {
//             if (data.type == "sbgn") {
//                 //if neighbor does not appear in the new graph, call the query with limit = 2
//                 // if(limit.indexOf("=1")>-1 && data.graph.indexOf(importantNeighborName)<0){
//                 //     limit = "&limit=2";
//                 //     pc2URL = "http://www.pathwaycommons.org/pc2/" + format + kind + limit + sources;
//                 //     this.socket.emit('PCQuery', {url: pc2URL, type: "sbgn"});
//                 // }
//                 // else {
//                 this.sendRequest("agentMergeGraphRequest", {graph: data.graph, type:"sbgn"});
//                 // }
//             }
//
//         });
//     }
//
//
//     /**
//      * Parses a graph in sif format and returns nodes that have edges that control state change
//      * @param sifGraph
//      * @param geneName: find the molecule that is different from geneName
//      *
//      */
//     findAllControllingNeighbors(geneName, sifGraph){
//         let lines = sifGraph.split("\n");
//         let neighbors = [];
//
//         lines.forEach((line)=>{
//
//             let rel = line.split("\t");
//
//             if(rel[1].indexOf("controls") >= 0){
//                 if(rel[0] == geneName && neighbors.indexOf(rel[2]) < 0)
//                     neighbors.push(rel[2]);
//                 else if(rel[2] == geneName && neighbors.indexOf(rel[0]) < 0)
//                     neighbors.push(rel[0]);
//             }
//
//         });
//
//
//
//         return neighbors;
//     }
//
// }
//
// /**
//  * Local function to read a file
//  * @param filePath
//  * @param callback
//  */
// function readTextFile(filePath, callback) {
//
//     var rawFile;
//
//     rawFile = new XMLHttpRequest();
//
//     rawFile.open("GET", filePath, false);
//
//     rawFile.onreadystatechange = function () {
//
//         if(rawFile.readyState === 4) {
//             if(rawFile.status === 200 || rawFile.status == 0) {
//                 var allText = rawFile.responseText;
//                 console.log("File reading complete");
//                 callback(allText);
//
//
//             }
//         }
//     }
//     rawFile.send(null);
// }
//
// // if(typeof module !== 'undefined' && module.exports)
// module.exports = ContextAgent;
//
//
