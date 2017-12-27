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

/***
 *
 * @param geneName
 * @param location
 */
VisAgent.prototype.moveNode = function(geneName, location) {
    let self = this;

    let nodeToMove;

    let extension;
    let posToMove;
    let bBox = {left:100000, right: -100000, top: 100000, bottom: -100000};

    //first update agent's model
    this.loadModel(function() {
        let nodes = self.getNodeList(0);


        for (var nodeInd in nodes) {
            var node = nodes[nodeInd];
            if (node.position.x < bBox.left)
                bBox.left = node.position.x;
            else if (node.position.x > bBox.right)
                bBox.right = node.position.x

            if (node.position.y < bBox.top)
                bBox.top = node.position.y;
            else if (node.position.y > bBox.bottom)
                bBox.bottom = node.position.y;

            if (node.data.label === geneName)
                nodeToMove = node;
        }

        extension = 80;

        //extend bbox
        bBox.left -= extension;
        bBox.right += extension;
        bBox.top -= extension;
        bBox.bottom += extension;


        if (location === 'top' || location === 'bottom')
            posToMove = {x: (bBox.left + bBox.right) / 2, y: bBox[location]};
        else
            posToMove = {x: bBox[location], y: (bBox.top + bBox.bottom) / 2};


        self.sendRequest('agentMoveNodeRequest', {id: nodeToMove.data.id, cyId: 0, pos: posToMove}, function () {
            self.sendRequest('agentChangeLockStateRequest', {
                id: nodeToMove.data.id,
                cyId: 0,
                locked: true
            }, function () {
                self.sendRequest('agentRunLayoutRequest', {cyId: 0}, function () {

                    self.sendRequest('agentChangeLockStateRequest', {id: nodeToMove.data.id, cyId: 0, locked: false});
                });
            });


        });
    });


}















