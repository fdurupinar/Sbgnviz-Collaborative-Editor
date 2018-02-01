/**
 * Created by durupina on 5/13/16.
 * Manages necessary commands to visually update the graph
 */



if(typeof module !== 'undefined' && module.exports){

    module.exports = VisHandler;
}

function VisHandler(modelManager){

    this.modelManager = modelManager;

}


const possibleStates = {
    "ont::phosphorylation": ["p", "phosphorylation", "phospho", "phosphorylated"]
}

/***
 * @param name
 */
//TODO: look at state
VisHandler.prototype.findNodeFromLabel = function(name, state, nodes) {

    let myNode = null;

    let possibleNodes = [];

    nodes.forEach(function(node) {
        let label = node.data("label");
        if (label && label.toLowerCase() === name.toLowerCase()) {
            possibleNodes.push(node);
        }
    });

    if(state == null && nodes.length > 0) //no need to compare
        myNode = nodes[0];
    else{


        //now look at possible nodes to compare states
        possibleNodes.forEach(function(node){

            let statesandinfos = node.data("statesandinfos");
            for (var i = 0; i < statesandinfos.length; i++) {
                var sbgnstateandinfo = statesandinfos[i];
                if (sbgnstateandinfo.clazz == "state variable") {
                    var value = sbgnstateandinfo.state.value;
                    if (value && value.toLowerCase() === state.toLowerCase() ||
                        value && possibleStates[state.toLowerCase()] && possibleStates[state.toLowerCase()].indexOf(value.toLowerCase()) || !value && state === '') //if any state matches this
                        myNode = node;
                }
            }

        });
    }

    return myNode;
}

/***
 *
 * @param name
 * @param location
 */
VisHandler.prototype.moveNode = function(data) {
    let self = this;

    let nodeToMove;
    let posToMove;

    let name = data.name;
    let state = data.state;
    let location = data.location;

    const extensionX = 120;
    const extensionY = 80;


    let cy = appUtilities.getCyInstance(data.cyId);
    appUtilities.setActiveNetwork(data.cyId);

    let nodes = appUtilities.getCyInstance(data.cyId).nodes();

    nodeToMove = self.findNodeFromLabel(name, state, nodes);

    //move our node first

    let bBox = cy.elements().boundingBox();

    //extend bbox
    bBox.x1 -= extensionX;
    bBox.x2 += extensionX;
    bBox.y1 -= extensionY;
    bBox.y2 += extensionY;

    if(location.indexOf('top')> -1)
        posToMove = {x: (bBox.x1 + bBox.x2) / 2, y: bBox.y1};
    else if(location.indexOf('bottom')> -1)
        posToMove = {x: (bBox.x1 + bBox.x2) / 2, y: bBox.y2};
    else if(location.indexOf('left')> -1)
        posToMove = {x: bBox.x1, y: (bBox.y1 + bBox.y2) / 2};
    else if(location.indexOf('right')> -1)
        posToMove = {x: bBox.x2, y: (bBox.y1 + bBox.y2) / 2};

    //move node -- no need to update the model for now
    nodeToMove.position(posToMove);

    //make sure model is updated accordingly
   self.modelManager.changeModelNodeAttribute("position", nodeToMove.data("id"), data.cyId, posToMove, "me");



   nodeToMove.lock();


    $("#perform-layout").trigger('click');

    let layoutCose = cy.layout({'name': 'cose', idealEdgeLength:5, edgeElasticity:5});
    layoutCose.run();

    cy.on('layoutstop', function() {
        nodeToMove.unlock();

        //move again

        let bBox = cy.elements().boundingBox();

        //extend bbox
        bBox.x1 -= extensionX;
        bBox.x2 += extensionX;
        bBox.y1 -= extensionY;
        bBox.y2 += extensionY;

        if(location.indexOf('top')> -1)
            posToMove = {x: (bBox.x1 + bBox.x2) / 2, y: bBox.y1};
        else if(location.indexOf('bottom')> -1)
            posToMove = {x: (bBox.x1 + bBox.x2) / 2, y: bBox.y2};
        else if(location.indexOf('left')> -1)
            posToMove = {x: bBox.x1, y: (bBox.y1 + bBox.y2) / 2};
        else if(location.indexOf('right')> -1)
            posToMove = {x: bBox.x2, y: (bBox.y1 + bBox.y2) / 2};

        //move node -- no need to update the model for now
        nodeToMove.position(posToMove);

        //make sure model is updated accordingly
        self.modelManager.changeModelNodeAttribute("position", nodeToMove.data("id"), data.cyId, posToMove, "me");

    });

}


/***
 *
 * @param data
 */
VisHandler.prototype.highlightNodeStream = function(data){

    let cy = appUtilities.getCyInstance(data.cyId);

    let chise = appUtilities.getChiseInstance(data.cyId)

    chise.getSbgnvizInstance().removeHighlights();
    this.selectNodeStream(data);


    appUtilities.getChiseInstance(data.cyId).highlightSelected(cy.elements(':selected'));

}

/***
 *
 * @param data
 */
VisHandler.prototype.selectNodeStream = function(data){
    let cy = appUtilities.getCyInstance(data.cyId);


    let nodeId = this.findNodeFromLabel(data.name, data.state, cy.nodes()).data("id");

    let nodeIds = this.findStream(nodeId, data.direction, cy);

    //unselect all first
    cy.elements().unselect();

    //select elements
    nodeIds.forEach(function(id) {
        cy.getElementById(id).select();
    });

}


/***
 * @param data
 */
VisHandler.prototype.moveNodeStream = function(data) {
    let self = this;

    let cy = appUtilities.getCyInstance(data.cyId);
    let nodeId = this.findNodeFromLabel(data.name, data.state, cy.nodes()).data("id");

    let nodeIds = this.findStream(nodeId, data.direction, cy);


    //unselect all first
    cy.elements().unselect();


    //select elements
    nodeIds.forEach(function(id) {
        cy.getElementById(id).select();
    });


    let streamEles = cy.elements(':selected');

    this.moveSelected(streamEles, data);
}


VisHandler.prototype.moveSelected = function(nodesSelected, data){

    let cy = appUtilities.getCyInstance(data.cyId);
    let restEles = cy.elements().difference(nodesSelected);

    let bBoxRest = restEles.boundingBox();
    let bBoxSelected = nodesSelected.boundingBox();


    let posUpdate = {};
    posUpdate.x = Math.abs(bBoxSelected.x - bBoxRest.x);
    posUpdate.y = Math.abs(bBoxSelected.y - bBoxRest.y);
    //unselect again
    cy.elements().unselect();

    let modelEles = [];
    let paramList = [];
    nodesSelected.forEach(function(ele){
        let currPos = ele.position();
        if(data.location.indexOf('top')> -1)  //move up
            currPos.y -= 2 * Math.abs(currPos.y - bBoxRest.y1);
        else if(data.location.indexOf('bottom')> -1)
            currPos.y += 2 * Math.abs(currPos.y - bBoxRest.y2);
        else if(data.location.indexOf('left')> -1)
            currPos.x -= 2 * Math.abs(currPos.x - bBoxRest.x1);
        else if(data.location.indexOf('right')> -1)
            currPos.x += 2 * Math.abs(currPos.x - bBoxRest.x2);

        ele.position(currPos);
        modelEles.push({id: ele.id(), isNode: ele.isNode()});
        paramList.push(currPos);

    });


    //update model so that others know
    this.modelManager.changeModelElementGroupAttribute("position", modelEles, data.cyId, paramList, "me");

}

/***
 * Returns the ids of nodes in the upstream or downstream of node with label data.name
 * @param nodeId
 * @param direction: "up" or "down"
 * @param cy
 */
VisHandler.prototype.findStream = function(nodeId, direction, cy){

    let self = this;
    let nodeIds = [];

    let directionMap = {down: {node: "source", neighbor:"target"}, up: {node: "target", neighbor:"source"} };


    let edgeStr = "[" + directionMap[direction].node  +"='" + nodeId + "']";

    let edges = cy.edges(edgeStr);


    edges.forEach(function(edge){
        let neighborId = edge.data(directionMap[direction].neighbor);

        let nextLevelNodeIds = self.findStream(neighborId, direction, cy);

        nodeIds = nodeIds.concat(nextLevelNodeIds);
        nodeIds.push(neighborId);
    });

    return nodeIds;

}

/***
 *
 * @param data.name : compartment name
 */
VisHandler.prototype.findCompartmentNodes = function(data){

    let cy = appUtilities.getCyInstance(data.cyId);

    let myComp;
    cy.nodes().forEach(function (node){
       if(node.data("class") === "compartment" && node.data("label").toLowerCase() === data.name.toLowerCase()){
            myComp = node;
       }
    });


    if(myComp)
        return myComp.children();

    return null;

}



VisHandler.prototype.moveCompartmentNodes = function (data) {
    let nodes = this.findCompartmentNodes(data);


    nodes.select();

    this.moveSelected(nodes, data);



}







