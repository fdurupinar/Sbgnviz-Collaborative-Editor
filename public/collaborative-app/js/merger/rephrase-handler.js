/**
 The module hereafter is a toolkit to do everything possible with what is called a "rephrase",
 i.e. an array of cytoscape objects (nodes and edges) that were extracted from a sbgn graph
 and then put in an order that reflects the one by which they were visited during the traversing of the graph.
 A rephrase also represents the graph in one dimension and is a convenient data structure
 to handle when it comes to play with gaphs, especially with sbgn graphs where not all nodes are considered the same way:
 for example when merging two sbgn graphs, one merges the molecules before the process nodes.
 The functions implemented allows one to create a rephrase from a json object, merge the nodes and the edges, convert the rephrase back to a json object, etc... and more to come !
 **/

//Author: David Servillo.

//Last change made the: 06/14/2017.

var cytoscape = require('cytoscape');
var intermedPriorityNodes = {'and': 1, 'association': 1, 'dissociation': 1, 'omitted process': 1, 'or': 1, 'process': 1, 'not': 1, 'source and sink': 1, 'uncertain process': 1};


class RephraseHandler {

    constructor(){

    }
    // Travel through the edges leaving the node.
    traverseThroughEdges(node, edges, npassages, backToSource, visitedNodes) {
        var next;
        var previousVisitedNodesLength;

        //Visit the edges.
        edges.forEach(edge => {
            if (!visitedNodes.map(visitedNodes => visitedNodes.id()).includes(edge.id())) {
                npassages += 1;

                //We are back to the current node again so re-add it to the rephrase.
                if(npassages > 1)
                    visitedNodes.push(node);

                visitedNodes.push(edge);

                previousVisitedNodesLength = visitedNodes.length;
                next = edge.target();

                if(backToSource)
                    next = edge.source();

                this.traverseGraph(next, visitedNodes);

                //The node we just visited through the edge has previously been visited already so remove it from the rephrase.
                if((visitedNodes.length === previousVisitedNodesLength) && (npassages > 1))
                    visitedNodes.pop();
            }
        });

        return npassages;
    }

    //Traverse the graph with the cytoscape library.
    //Return the visited nodes in an order that reflects
    //the chronology in which they were visited.
    //The resulting array is called the rephrase.
    traverseGraph(node, visitedNodes) {

        // break if we visit a node twice
        if (visitedNodes.map(visitedNodes => visitedNodes.id()).includes(node.id())) {
            visitedNodes.push(node);
            return visitedNodes;
        }

        // add visited node to collection
        visitedNodes.push(node);

        // get the edges leaving the node
        const edgesTo = node.outgoers(function (outgoer) {
            return outgoer.isEdge();
        });

        // get the edges entering the node
        const edgesFrom = node.incomers(function (incomer) {
            return incomer.isEdge();
        });

        // travel through the edges leaving the node
        var npassages = this.traverseThroughEdges(node, edgesTo, 0, 0, visitedNodes);

        // travel through the edges entering the node
        this.traverseThroughEdges(node, edgesFrom, npassages, 1, visitedNodes);

        return visitedNodes;
    }

    //Read the cytoscape object, traverse the graph and
    //returns the "rephrase", i.e. an array of nodes and edges
    //whose the order reflects the one to which the elements were visited.
    cytoscape2rephrase(cytoscape) {
        var i;
        var tmp;
        var idList = [];
        var indiceList;
        var rephrase = [];
        var indicesToExplore = [];

        for(i = 0; i < cytoscape.nodes().length; i++) {
            idList.push(cytoscape.nodes()[i].id());
            indicesToExplore.push(i);
        }

        while(indicesToExplore.length > 0) {
            indiceList = {};

            //Traverse the graph, starting with a node not already explored.
            tmp = this.traverseGraph(cytoscape.nodes()[indicesToExplore[0]], []);
            tmp.forEach(element => {
                if(element.isNode())
                    indiceList[idList.indexOf(element.id())] = 1;
            });

            i = 0;
            Object.keys(indiceList).sort(function(a, b){return a-b}).forEach(indice => {
                idList.splice(indice - i, 1);

                //Remove the indexes in cytoscape that have been explored.
                indicesToExplore.splice(indice - i, 1);
                i += 1;
            });

            tmp.forEach(element => {

                //Combine the rephrases together.
                rephrase.push(element);
            });
        }

        return rephrase;
    }

    //Divide the rephrase into triplets of node-edge-node and
    //when a triplet comes with no edge that is when a lonely node
    //, i.e. not surrounded by an edge and linked to nothing, is identified.
    getLonelyNodes(rephrase) {
        var lonelyNodeList = [];
        var triplet = new Array(3);

        //Duplicate both ends of the rephrase.
        rephrase.splice(0, 0, rephrase[0]);
        rephrase.splice(rephrase.length - 1, 0, rephrase[rephrase.length - 1]);

        rephrase.forEach(element => {
            triplet.shift();
            triplet.push(element);

            //A linely node is identified.
            if(triplet[0] != undefined
                && triplet[0].isNode()
                && triplet[1] != undefined
                && triplet[1].isNode()
                && triplet[2].isNode())
            {
                lonelyNodeList.push(triplet[1]);
            }
        });

        return lonelyNodeList;
    }

    //Get that string of characters made of
    //attribute values characterizing specifically a node,
    //that I call a "signature".
    //I use that function to output the signature of the elements
    //contained in a complex.
    getContentSignature(nodeArray) {
        var id = "";
        var idList = [];

        nodeArray.forEach(node => {

            //For each node, create its signature.
            id += node.data('label') + node.data('class');

            if(node.data('statesandinfos') != undefined && node.data('statesandinfos').length > 0) {

                node.data('statesandinfos').forEach(box => {
                    id += box.clazz + JSON.stringify(box.state) + JSON.stringify(box.label);
                });
            }

            //Add the signature in the collection of signature.
            idList.push(id);
            id = "";
        });

        //Return the signatures put in order and concatenated together.
        return idList.sort().join("");
    }

    //Get that string of characters made of
    //attribute values characterizing specifically a node,
    //that I call a "signature".
    getElementSignatures(rephrase) {
        var signature;
        var id2signature = {};
        var id2NbSignatureAlteration = {};

        rephrase.forEach(element => {

            //Read the rephrase and get the signature of each node.
            if(element.isNode()) {
                signature = element.data('label') + element.data('class');

                if(element.data('statesandinfos') != undefined && element.data('statesandinfos').length > 0) {

                    element.data('statesandinfos').forEach(box => {
                        signature += box.clazz + JSON.stringify(box.state) + JSON.stringify(box.label);
                    });
                }

                //Add the signature of all the nodes contained in the complex.
                if(element.data('class') == "complex")
                    signature += this.getContentSignature(element.descendants());

                id2signature[element.id()] = signature;
                id2NbSignatureAlteration[element.id()] = 0;
            }
        });

        rephrase.forEach(element => {

            //Alter the signature of a node when it is contained in another node.
            if(id2signature[element.data('parent')] && !id2NbSignatureAlteration[element.id()]) {
                id2signature[element.id()] += id2signature[element.data('parent')];
                id2NbSignatureAlteration[element.id()] = 1;
            }
        });

        return id2signature;
    }

    // Make sure that each edge has it source before it and
    // the target after it in the rephrase.
    rearrangeRephrase(rephrase) {
        var tmp;

        for(let i = 0; i < rephrase.length; i++) {

            if(rephrase[i].isEdge() && rephrase[i].source().id() != rephrase[i - 1].id()) {

                //Duplicate the nodes around the edge...
                rephrase.splice(i - 1, 0, rephrase[i - 1]);
                rephrase.splice(i + 2, 0, rephrase[i + 2]);

                //... and switch positions !
                tmp = rephrase[i + 2];
                rephrase[i + 2] = rephrase[i];
                rephrase[i] = tmp;
            }
        }
    }

    // When two nodes in the rephrase are the same but the ids differ
    // make the two nodes the same (they point to the same cytoscape object).
    mergeNodes(rephrase, id2signature) {
        var isHighPriorityNode;
        var nonRedundantNodeList = {};

        for(let i = 0; i < rephrase.length; i++) {
            isHighPriorityNode = rephrase[i].isNode() && intermedPriorityNodes[rephrase[i].data('class')] == undefined;

            //A duplicate node (i.e. that has the same signature as another node) is identified, replace it by the original one.
            if(isHighPriorityNode && id2signature[rephrase[i].id()] in nonRedundantNodeList)
                rephrase[i] = nonRedundantNodeList[id2signature[rephrase[i].id()]];
            else if(isHighPriorityNode)
                nonRedundantNodeList[id2signature[rephrase[i].id()]] = rephrase[i];
        }
    }

    // Divide the rephrase into triplets of node-edge-node and identify
    // the process nodes that have the same set of triplets as neighbors
    // (i.e. the reactions that have the same inputs and outputs).
    // Among the duplicates, select only one of them.
    mergeProcessNodes(rephrase, id2signature) {
        var i, j;
        var key;
        var processId;
        var signature;
        var toRemove = 0;
        var idsBySignature = {};
        var signaturesById = {};
        var tripletsByProcId = {};
        var triplet = new Array(3);

        rephrase.forEach(element => {
            triplet.shift();
            triplet.push(element);

            if(triplet[1] != undefined && triplet[1].isEdge()) {

                //The triplets around the same process node are stored together.
                //First identify which node is the process node in the triplet and get its id.
                processId = triplet[0].id();
                if(intermedPriorityNodes[triplet[2].data('class')])
                    processId = triplet[2].id();

                if(tripletsByProcId[processId] == undefined)
                    tripletsByProcId[processId] = [];

                //Save the triplets.
                tripletsByProcId[processId].push([triplet[0], triplet[1], triplet[2]]);
            }
        });

        //The triplets in the previous hash tables are transformed into their signatures
        //and concatenated to obtain one signature of a reaction.
        //Then, the keys of the hash table become the values and the values become the keys.
        //After that operation, the signature of each reaction is associated to an array of ids
        //of process nodes that perform the same reaction.
        Object.keys(tripletsByProcId).forEach(id => {
            tripletsByProcId[id].forEach(triplet => {
                signature = "";

                //Get the signature of the triplet.
                for(i = 0; i < 3; i++)
                    signature += id2signature[triplet[i].id()];

                if(signaturesById[id] == undefined)
                    signaturesById[id] = [];

                //Save the signatures.
                signaturesById[id].push(signature);
            });

            //The key now is the reaction signature.
            key = signaturesById[id].sort().join("");
            if(idsBySignature[key] == undefined)
                idsBySignature[key] = [];

            //Role switching: reaction signatures are the keys while the process node ids are the values.
            idsBySignature[key].push(id);
        });

        i = 0;
        Object.keys(idsBySignature).forEach(signature => {

            //For each reaction signature, select just the triplets of the reaction of the
            //process node corresponding to the first process node id in the array of
            //process node ids.
            tripletsByProcId[idsBySignature[signature][0]].forEach(triplet => {

                for(j = 0; j < 3; j++)
                    rephrase[i + j] = triplet[j]; //Rewrite the rephrase with the new triplets.

                i = i + 3;
                toRemove = rephrase.length - i
            });
        });

        //The above operations result in a reduction of information.
        //Remove the rest of the rephrase that is rendered useless.
        rephrase.splice(i, toRemove);
    }

    // Divide the rephrase in triplets of node-edge-node and identify
    // the duplicates and remove them.
    mergeEdges(rephrase, id2signature) {
        var i, j;
        var signature;
        var toRemove = [];
        var nonRedundantSignatureList = {};
        var triplet = new Array(3);

        for(i = 0; i < rephrase.length; i++) {
            triplet.shift();
            triplet.push(rephrase[i]);

            if(triplet[1] != undefined && triplet[1].isEdge()) {
                signature = "";

                for(j = 0; j < 3; j++)
                    signature += id2signature[triplet[j].id()]; //Get the signature of the triplet.

                //A duplicate triplet of node-edge-node is identified and
                //both source and target are the same as the one in the original triplet.
                //Store the position of the triplet which is to be removed later.
                if(nonRedundantSignatureList[signature]
                    && triplet[0] == nonRedundantSignatureList[signature][0]
                    && triplet[2] == nonRedundantSignatureList[signature][2])
                {
                    toRemove.push(i - 2);
                } else {
                    nonRedundantSignatureList[signature] = new Array(3);

                    for(j = 0; j < 3; j++)
                        nonRedundantSignatureList[signature][j] = triplet[j];
                }
            }
        }

        //Remove the duplicate triplets.
        toRemove.forEach(startposition => {
            rephrase.splice(startposition, 3);
        });
    }

    //Convert a json object to acytoscape object.
    json2cytoscape(jsObj) {
        return cytoscape({
            elements: jsObj,
            headless: true,
            styleEnabled: true
        });
    }
}

module.exports = RephraseHandler;