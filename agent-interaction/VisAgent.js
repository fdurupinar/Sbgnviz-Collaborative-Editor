/**
 * Created by durupina on 5/13/16.
 * Manages necessary commands to visually update the graph
 */
//TODO: move this to python


if(typeof module !== 'undefined' && module.exports){
    var Agent = require("./agentAPI.js");
    module.exports = VisAgent;
}
VisAgent.prototype = new Agent();

function VisAgent( id) {
    this.agentId = id;
    this.agentName = "VisA";
    this.colorCode = "#ff3f27"; //agents have different colors based on specialty

}

VisAgent.prototype.init = function(){
    this.sendRequest('agentConnectToTripsRequest', {isVisualizationAgent: true, userName: this.agentName}, function(result){
    });
}


/***
 * @param name
 */
VisAgent.prototype.findNodeFromLabel = function(name, state, nodes) {

    let node;
    for (var nodeInd in nodes) {
        if (nodes[nodeInd].data.label === name)
            node = nodes[nodeInd];
    }


    if(node)
        return node;
}

/***
 *
 * @param name
 * @param location
 */
VisAgent.prototype.moveNode = function(data) {
    let self = this;

    let nodeToMove;

    let name = data.name;
    let state = data.state;
    let location = data.location;
    let posToMove;
    let bBox = {left:100000, right: -100000, top: 100000, bottom: -100000};


    //first update agent's model
    this.loadModel(function() {
        
        let nodes = self.getNodeList(0);

        nodeToMove = self.findNodeFromLabel(name, state, nodes);
        for (var nodeInd in nodes) {
            var node = nodes[nodeInd];
            if (node.position.x < bBox.left)
                bBox.left = node.position.x;
            else if (node.position.x > bBox.right)
                bBox.right = node.position.x;

            if (node.position.y < bBox.top)
                bBox.top = node.position.y;
            else if (node.position.y > bBox.bottom)
                bBox.bottom = node.position.y;


        }

        let extensionX = 120;
        let extensionY = 80;

        //extend bbox
        bBox.left -= extensionX;
        bBox.right += extensionX;
        bBox.top -= extensionY;
        bBox.bottom += extensionY;


        location = location.toLowerCase();

        if(location.indexOf('top')> -1)
            posToMove = {x: (bBox.left + bBox.right) / 2, y: bBox['top']};
        else if(location.indexOf('bottom')> -1)
            posToMove = {x: (bBox.left + bBox.right) / 2, y: bBox['bottom']};
        else if(location.indexOf('left')> -1)
            posToMove = {x: bBox['left'], y: (bBox.top + bBox.bottom) / 2};
        else if(location.indexOf('right')> -1)
            posToMove = {x: bBox['right'], y: (bBox.top + bBox.bottom) / 2};


        self.sendRequest('agentMoveNodeRequest', {id: nodeToMove.data.id, cyId: 0, pos: posToMove}, function () {
            self.sendRequest('agentChangeLockStateRequest', {id: nodeToMove.data.id, cyId: 0, locked: true }, function () {
                self.sendRequest('agentRunLayoutRequest', {cyId: 0}, function () {
                    self.sendRequest('agentChangeLockStateRequest', {id: nodeToMove.data.id, cyId: 0, locked: false});
                });
            });
        });
    });
}


VisAgent.prototype.moveNodeStream = function(data) {

    let name = data.name;
    let state = data.state;
    let location = data.location;

    //first update agent's model
    this.loadModel(function() {
        let nodes = self.getNodeList(0);


    });

}












