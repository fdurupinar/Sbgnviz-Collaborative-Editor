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

/***
 * Makes sure we connect to trips to listen to visual manipulation requests
 */
VisHandler.prototype.initialize = function(){
    this.sendRequest('agentConnectToTripsRequest', {isVisualizationAgent: true, userName: this.agentName}, function(result){
    });
}


/***
 * @param name
 */
//TODO: look at state
VisHandler.prototype.findNodeFromLabel = function(name, state, nodes) {

    let myNode = null;


    nodes.forEach(function(node){
        let label = node.data("label");
        if(label && label.toLowerCase() === name.toLowerCase()){
            if(state == null) //no need to compare
                myNode = node;
            else {
                let statesandinfos = node.data("statesandinfos");
                for (var i = 0; i < statesandinfos.length; i++) {
                    var sbgnstateandinfo = statesandinfos[i];
                    if (sbgnstateandinfo.clazz == "state variable") {
                        var value = sbgnstateandinfo.state.value;
                        if (value && value.toLowerCase() === state.toLowerCase() || !value && state === '') //if any state matches this
                            myNode = node;
                    }
                }
            }
        }

    });

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

    // nodeToMove.lock();

    //perform layout on the rest of the elements
    //
    // //
    // let nodeEdges = nodeToMove._private.edges;
    // let elesRest = cy.elements().difference(nodeToMove.union(nodeEdges));
    //
    // let bBoxRest = bBox;
    //
    // // let bBoxRest = elesRest.boundingBox();
    //
    // // //update bounding box so that it constrains only one direction
    // // // bBoxRest.w = bBoxRest.h = 1000;
    //
    // if(location.indexOf('top')> -1) {
    //     bBoxRest.y1  =  posToMove.y + extensionY ;
    // }
    // else if(location.indexOf('bottom')> -1){
    //     bBoxRest.y2  =  posToMove.y - extensionY;
    // }
    //
    // else if(location.indexOf('left')> -1){
    //     bBoxRest.x1  =  posToMove.x + extensionX;
    // }
    //
    // else if(location.indexOf('right')> -1){
    //     bBoxRest.x2  =  posToMove.x - extensionX;
    // }
    //
    //
    //
    //
    // let layoutOptions = this.modelManager.getLayoutProperties();
    //
    // layoutOptions.name = 'cose';
    // layoutOptions.boundingBox = bBoxRest;
    //
    //
    // let layoutRest = elesRest.layout(layoutOptions);
    // layoutRest.run();
    //
    //
    // //let the others learn about the layout updates
    // let nodesRest = [];
    // let paramList = [];
    // elesRest.forEach(function(ele){
    //     if(ele.isNode()){
    //         nodesRest.push({id:ele.id(), isNode:true});
    //         paramList.push(ele.position());
    //
    //     }
    // });
    // self.modelManager.changeModelElementGroupAttribute("position", nodesRest, data.cyId, paramList, "me");
    //
    //
    //
    // //
    // let nodeEdges = nodeToMove._private.edges;
    // let elesRest = cy.elements().difference(nodeToMove.union(nodeEdges));
    //
    // let bBoxRest = bBox;
    //
    // // let bBoxRest = elesRest.boundingBox();
    //
    // // //update bounding box so that it constrains only one direction
    // // // bBoxRest.w = bBoxRest.h = 1000;
    //
    // if(location.indexOf('top')> -1) {
    //     bBoxRest.y1  =  posToMove.y + extensionY ;
    // }
    // else if(location.indexOf('bottom')> -1){
    //     bBoxRest.y2  =  posToMove.y - extensionY;
    // }
    //
    // else if(location.indexOf('left')> -1){
    //     bBoxRest.x1  =  posToMove.x + extensionX;
    // }
    //
    // else if(location.indexOf('right')> -1){
    //     bBoxRest.x2  =  posToMove.x - extensionX;
    // }
    //
    //
    //
    //
    // let layoutOptions = this.modelManager.getLayoutProperties();
    //
    // layoutOptions.name = 'cose';
    // layoutOptions.boundingBox = bBoxRest;
    //
    //
    // let layoutRest = elesRest.layout(layoutOptions);
    // layoutRest.run();
    //
    //
    // //let the others learn about the layout updates
    // let nodesRest = [];
    // let paramList = [];
    // elesRest.forEach(function(ele){
    //     if(ele.isNode()){
    //         nodesRest.push({id:ele.id(), isNode:true});
    //         paramList.push(ele.position());
    //
    //     }
    // });
    // self.modelManager.changeModelElementGroupAttribute("position", nodesRest, data.cyId, paramList, "me");
    //
    //

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
VisHandler.prototype.moveNodeStream = function(data){
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
    let restEles = cy.elements().difference(streamEles);

    let bBoxRest = restEles.boundingBox();
    let bBoxStream = streamEles.boundingBox();


    let posUpdate = {};
    posUpdate.x = Math.abs(bBoxStream.x - bBoxRest.x);
    posUpdate.y = Math.abs(bBoxStream.y - bBoxRest.y);
    //unselect again
    cy.elements().unselect();

    let modelEles = [];
    let paramList = [];
    streamEles.forEach(function(ele){
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











