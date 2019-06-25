/**
The module merge multiple json objects into a single one. The strategy that have been adopted here is to merge
the different elements of a graph sequentially, according to their level of priority: when merging,
    the molecules/complexes/etc... must be merged first, the process nodes must be merged second and the edges must be merged at last.
    Only such a procedure guarantees a proper merge. It relies on the assumption that the SBGN graph can be split
into triplets of node-edge-node where one of the nodes is a biological item (protein, DNA, compartment, multimers, ...) and
the other node is a process node (process, association, source and sink, ...) or a logic node (and, or, not). So weird results can happen
while merging graphs with logic nodes directly linked to process nodes for example.
                                                                           **/

//Author: David Servillo.

//Last change made the: 09/25/2017.

var _ = require('underscore');
var RephraseHandler = require('./rephrase-handler.js');
var rephraseToolBox = new RephraseHandler();


class JsonMerger {

    constructor(){

    }

    //Rewrithe the ids in the json object.
    rewriteIds(js, newId, old2newIds) {
        var i;
        var parent;
        var source;
        var target;
        var maxsize = newId.length;

        if(!js.nodes || js.nodes.length <= 0 )
            return;

        for(i = 0; i < js.nodes.length; i++) {
            old2newIds[js.nodes[i].data.id] = "ele" + newId;
            js.nodes[i].data.id = "ele" + newId;

            //The new id is as many 0s as necessary and a
            //variable number.
            //Example: id1 = '000001', id2 = '000002', etc
            newId = parseInt(newId) + 1;
            newId = "0".repeat(Math.abs(maxsize - newId.toString().length)) + newId.toString();
        }

        //Rewrite the ids in the 'parent' attributes.
        for(i = 0; i < js.nodes.length; i++) {
            parent = js.nodes[i].data.parent;
            if(parent !== undefined)
                js.nodes[i].data.parent = old2newIds[parent];
        }

        //Rewrite the ids of the sources and the targets of
        //the edges.
        for(i = 0; i < js.edges.length; i++) {
            source = old2newIds[js.edges[i].data.source];
            target = old2newIds[js.edges[i].data.target];
            js.edges[i].data.source = source;
            js.edges[i].data.target = target;
            js.edges[i].data.portsource = source;
            js.edges[i].data.porttarget = target;
            js.edges[i].data.id = source + "-" + target;
        }
    }

    //What REACH sentences, describing reactions, a node is associated to ?
    nodeId2sentence(js, sentenceNodeMap, rep1, rep2, id2pos) {
        var i;
        var sentence;

        for(i = 0; i < rep1.length; i++) {
            if(rep1[i].isNode()) {
                if(!(rep1[i].id() in sentenceNodeMap))
                    sentenceNodeMap[rep1[i].id()] = [];

                sentence = js[id2pos[rep2[i].id()]].sentence;
                sentenceNodeMap[rep1[i].id()].push(sentence);
            }
        }
    }

    //What REACH index card a node is associated to ?
    nodeId2idxCard(js, idxCardNodeMap, rep1, rep2, id2pos) {
        var i;
        var idxCard;

        for(i = 0; i < rep1.length; i++) {
            if(rep1[i].isNode()) {
                if(!(rep1[i].id() in idxCardNodeMap))
                    idxCardNodeMap[rep1[i].id()] = [];

                idxCard = js[id2pos[rep2[i].id()]].idxCard;
                idxCardNodeMap[rep1[i].id()].push(idxCard);
            }
        }
    }

    //Merge an array of json objects to output a single json object.
    mergeJsons(jsonGraph, sentenceNodeMap, idxCardNodeMap) {
        var i, j;
        var newId;
        var edgejs;
        var nodejs;
        var tmp = [];
        var rephrase2;
        var id2pos = {};
        var idList = {};
        var idmaxsize = 0;
        var old2newIds = {};
        var old2newIdList = {};

        if(!jsonGraph.length)
            return;

        var jsonObj = {"nodes": [], "edges": []};
        var cy = rephraseToolBox.json2cytoscape(jsonObj);

        //Get ready to rewrite the ids in the json object.
        //The new id is as many 0s as necessary and a
        //variable number.
        //Example: id1 = '000001', id2 = '000002', etc
        //Here, I compute the number of 0s needed.
        for(i = 0; i < jsonGraph[0].json.nodes.length; i++) {
            if(jsonGraph[0].json.nodes[i].data.id.length > idmaxsize)
                idmaxsize = jsonGraph[0].json.nodes[i].data.id.length;
        }

        newId = "0".repeat(idmaxsize + 1);
        //Rewrite the ids in the json object.
        for(i = 1; i < jsonGraph.length; i++) {
            this.rewriteIds(jsonGraph[i].json, newId, old2newIds);
            newId = "0".repeat(newId.length + 1);
        }

        //Convert the jsonGraph into one single cytoscape object.
        for(i = 0; i < jsonGraph.length; i++) {
            cy.add(jsonGraph[i].json);
            for(j = 0; j < jsonGraph[i].json.nodes.length; j++)
                id2pos[jsonGraph[i].json.nodes[j].data.id] = i;
        }

        //Rephrase the cytoscape object, in order to get the array of nodes and edges.
        var rephrase = rephraseToolBox.cytoscape2rephrase(cy);

        //Save the lonely nodes. It is mostly made to handle the nodes contained in complexes.
        //Since they are not connected to any edge, they will be discarded when merging process nodes.
        var lonelyNodeList = rephraseToolBox.getLonelyNodes(rephrase);
        var id2signature = rephraseToolBox.getElementSignatures(rephrase);

        //Rearrange the orders of the nodes around the edges in the rephrase for the subsequent operations.
        rephraseToolBox.rearrangeRephrase(rephrase);

        //What REACH sentences, describing reactions, a node is associated to,
        //and what REACH index card a node is associated to ?
        this.nodeId2sentence(jsonGraph, sentenceNodeMap, rephrase, rephrase, id2pos);
        this.nodeId2idxCard(jsonGraph, idxCardNodeMap, rephrase, rephrase, id2pos);

        rephrase2 = new Array(rephrase.length);
        for(i = 0; i < rephrase.length; i++)
            rephrase2[i] = rephrase[i];

        rephraseToolBox.mergeNodes(rephrase, id2signature); //Merge the nodes.

        //The rephrase has changed so update the two dictionaries.
        this.nodeId2sentence(jsonGraph, sentenceNodeMap, rephrase, rephrase2, id2pos);
        this.nodeId2idxCard(jsonGraph, idxCardNodeMap, rephrase, rephrase2, id2pos);

        Object.keys(sentenceNodeMap).forEach(key => {
            if(sentenceNodeMap[key].length == 1) {
                delete sentenceNodeMap[key];
                delete idxCardNodeMap[key];
            } else {
                sentenceNodeMap[key] = _.uniq(sentenceNodeMap[key]);
                idxCardNodeMap[key] = _.uniq(idxCardNodeMap[key]);
            }
        });

        //After merging the nodes, some nodes may have disappeared to be replaced by others.
        //Update the collection of lonely nodes previously saved.
        if(lonelyNodeList.length) {
            for(i = 0; i < rephrase.length; i++) {
                idList[rephrase[i].id()] = 1;
                old2newIdList[rephrase2[i].id()] = rephrase[i].id();
            }

            for(i = 0; i < lonelyNodeList.length; i++) {
                if(lonelyNodeList[i].id() in idList)
                    tmp.push(lonelyNodeList[i]);
            }
        }

        //Update the lonely node collection.
        lonelyNodeList = tmp;

        //Merge the edges then merge the process nodes and the whole reaction they are involved in.
        rephraseToolBox.mergeEdges(rephrase, id2signature);
        rephraseToolBox.mergeProcessNodes(rephrase, id2signature);

        //Create the merged json object.
        for(i = 0; i < rephrase.length; i++) {
            if(rephrase[i].isNode()) {
                nodejs = rephrase[i].json();
                if(nodejs.data.parent)
                    nodejs.data.parent = old2newIdList[nodejs.data.parent];

                jsonObj.nodes.push(nodejs);
            } else {
                edgejs = rephrase[i].json();
                edgejs.data.source = rephrase[i - 1].id();
                edgejs.data.target = rephrase[i + 1].id();

                jsonObj.edges.push(edgejs);
            }
        }

        //Add the lonely nodes that were discarded at the process node merge stage.
        for(i = 0; i < lonelyNodeList.length; i++) {
            nodejs = lonelyNodeList[i].json();
            if(nodejs.data.parent)
                nodejs.data.parent = old2newIdList[nodejs.data.parent];

            jsonObj.nodes.push(nodejs);
        }

        return jsonObj;
    }

    //Merge an array of json objects with the json of the current sbgn network
    //on display to output a single json object.
    mergeJsonWithCurrent(jsonGraph, currJson){
        var i;
        var edgejs;
        var newId;
        var nodejs;
        var tmp = [];
        var rephrase2;
        var idList = {};
        var idmaxsize = 0;
        var old2newIds = {};
        var old2newIdList = {};

        if(!("nodes" in jsonGraph) || !jsonGraph.nodes.length)
            return;

        var jsonObj = {"nodes": [], "edges": []};
        var cy = rephraseToolBox.json2cytoscape(jsonObj);

        //Get ready to rewrite the ids in the json object.
        //The new id is as many 0s as necessary and a
        //variable number.
        //Example: id1 = '000001', id2 = '000002', etc
        //Here, I compute the number of 0s needed.
        for(i = 0; i < jsonGraph.nodes.length; i++) {
            if(jsonGraph.nodes[i].data.id.length > idmaxsize)
                idmaxsize = jsonGraph.nodes[i].data.id.length;
        }

        newId = "0".repeat(idmaxsize + 1);


        //Rewrite the ids in the current json object.
        this.rewriteIds(currJson, newId, old2newIds);



        //Fuse the two json objects.
        if(currJson && currJson.nodes) {
            jsonGraph.nodes = jsonGraph.nodes.concat(currJson.nodes);
        }
        if(currJson && currJson.edges) {
            jsonGraph.edges = jsonGraph.edges.concat(currJson.edges);
        }


        //Convert the json list into one single cytoscape object.
        //for(i = 0; i < jsonGraph.length; i++)
        cy.add(jsonGraph);

        //Rephrase the cytoscape object, in order to get the array of nodes and edges.
        var rephrase = rephraseToolBox.cytoscape2rephrase(cy);

        //Save the lonely nodes. It is mostly made to handle the nodes contained in complexes.
        //Since they are not connected to any edge, they will be discarded when merging process nodes.
        var lonelyNodeList = rephraseToolBox.getLonelyNodes(rephrase);
        var id2signature = rephraseToolBox.getElementSignatures(rephrase);

        //Rearrange the orders of the nodes around the edges in the rephrase for the subsequent operations.
        rephraseToolBox.rearrangeRephrase(rephrase);

        if(lonelyNodeList.length) {
            rephrase2 = new Array(rephrase.length);
            for(i = 0; i < rephrase.length; i++)
                rephrase2[i] = rephrase[i];
        }

        //Merge the nodes.
        rephraseToolBox.mergeNodes(rephrase, id2signature);

        //After merging the nodes, some nodes may have disappeared to be replaced by others.
        //Update the collection of lonely nodes previously saved.
        if(lonelyNodeList.length) {
            for(i = 0; i < rephrase.length; i++) {
                idList[rephrase[i].id()] = 1;
                old2newIdList[rephrase2[i].id()] = rephrase[i].id();
            }

            for(i = 0; i < lonelyNodeList.length; i++) {
                if(lonelyNodeList[i].id() in idList)
                    tmp.push(lonelyNodeList[i]);
            }
        }

        //Update the lonely node collection.
        lonelyNodeList = tmp;

        //Merge the edges then merge the process nodes and the whole reaction they are involved in.
        rephraseToolBox.mergeEdges(rephrase, id2signature);
        rephraseToolBox.mergeProcessNodes(rephrase, id2signature);

        //Create the merged json object.
        for(i = 0; i < rephrase.length; i++) {
            if(rephrase[i].isNode()) {
                nodejs = rephrase[i].json();
                if(nodejs.data.parent)
                    nodejs.data.parent = old2newIdList[nodejs.data.parent];

                jsonObj.nodes.push(nodejs);
            } else {
                edgejs = rephrase[i].json();
                edgejs.data.source = rephrase[i - 1].id();
                edgejs.data.target = rephrase[i + 1].id();

                jsonObj.edges.push(edgejs);
            }
        }

        //Add the lonely nodes that were discarded at the process node merge stage.
        for(i = 0; i < lonelyNodeList.length; i++) {
            nodejs = lonelyNodeList[i].json();
            if(nodejs.data.parent)
                nodejs.data.parent = old2newIdList[nodejs.data.parent];

            jsonObj.nodes.push(nodejs);
        }

        return jsonObj;
    }
}

module.exports  = JsonMerger;