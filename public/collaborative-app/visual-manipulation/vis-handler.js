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
 * Find the bounding box of a group of nodes
 * @param nodes
 */
VisHandler.prototype.findBoundingBox = function(nodes){

    let bBox = {left:100000, right: -100000, top: 100000, bottom: -100000};
    nodes.forEach(function(node){
        let nodePos = node.position();
        if (nodePos.x < bBox.left)
            bBox.left = nodePos.x;
        else if (nodePos.x > bBox.right)
            bBox.right = nodePos.x;

        if (nodePos.y < bBox.top)
            bBox.top = nodePos.y;
        else if (nodePos.y > bBox.bottom)
            bBox.bottom = nodePos.y;

    });

    return bBox;

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
    let bBox = self.findBoundingBox(nodes);
    //extend bbox
    bBox.left -= extensionX;
    bBox.right += extensionX;
    bBox.top -= extensionY;
    bBox.bottom += extensionY;

    //move node -- no need to update the model for now
    nodeToMove.position(posToMove);

    nodeToMove.lock();
    $("#perform-layout").trigger('click'); //run layout
    cy.on('layoutstop', function() {
        nodeToMove.unlock();

        nodes = appUtilities.getCyInstance(data.cyId).nodes();


        //recompute bbox to update the node position
        bBox = self.findBoundingBox(nodes);

        bBox.left -= extensionX;
        bBox.right += extensionX;
        bBox.top -= extensionY;
        bBox.bottom += extensionY;

        location = location.toLowerCase();


        if(location.indexOf('top')> -1)
            posToMove = {x: (bBox.left + bBox.right) / 2, y: bBox.top};
        else if(location.indexOf('bottom')> -1)
            posToMove = {x: (bBox.left + bBox.right) / 2, y: bBox.bottom};
        else if(location.indexOf('left')> -1)
            posToMove = {x: bBox['left'], y: (bBox.top + bBox.bottom) / 2};
        else if(location.indexOf('right')> -1)
            posToMove = {x: bBox['right'], y: (bBox.top + bBox.bottom) / 2};


        //update position
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

    //select elements
    nodeIds.forEach(function(id) {
        cy.getElementById(nodeId).select();
    });

}

/***
 * TODO
 * @param data
 */
VisHandler.prototype.moveNodeStream = function(data){
    let self = this;

    let cy = appUtilities.getCyInstance(data.cyId);
    let nodeId = this.findNodeFromLabel(data.name, data.state, cy.nodes()).data("id");

    let nodeIds = this.findStream(nodeId, data.direction, cy);

    //highlight nodes nodeIds
    nodeIds.forEach(function(id){
        self.sendRequest("agentChangeNodeAttributeRequest", { id: id, cyId: data.cyId, attStr:"highlightStatus", attVal: "highlighted"});
    });
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











