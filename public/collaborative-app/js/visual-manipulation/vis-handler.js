/**
 * Created by durupina on 5/13/16.

 * Class with methods to visually update the graph based on commands from the agents.
 */

/**
 *
 * @type {{"ont::phosphorylation": string[]}}
 * TODO: extend this to other modification types e.g. ubiquination
 */
 const possibleStates = {
    "ont::phosphorylation": ["p", "phosphorylation", "phospho", "phosphorylated", "p@p"]
}

/**
 * Global variable to access appUtilities
 */
const appUtilities = window.appUtilities;

 class VisHandler  {
    /**
     *
     * @param {Object} modelManager Manager object for the model
     */
    constructor (modelManager) {

        /**
         *
         * @type {Object} modelManager
         *
         */

        this.modelManager = modelManager;

    }


    /**
     * Finds nodes with a given label. Does not check the node states.
     * @param {string} name Label name
     * @param {Array} nodes Nodes to search
     * @returns {Array} Nodes with the given label
     */
  findAllNodesFromLabel(name, nodes) {

        let possibleNodes = [];

        nodes.forEach(function (node) {
            let label = node.data("label");

            if (label) {
                label = label.replace('-', '');
                if (name && (typeof name === 'string' || name instanceof String)) {
                    name = name.replace('-', '');
                    if (label && label.toLowerCase() === name.toLowerCase()) {
                        possibleNodes.push(node);
                    }
                }
            }
        });

        return possibleNodes;
    }


    /***
     * Finds nodes with a given label. Checks the node states.
     * @param {string} name Label name
     * @param {string} state If null, no need to check state; otherwise look at class values of state values
     * @param {Array} nodes Nodes to search
     * @returns {Array} Nodes with the given label
     */

    findNodeFromLabel(name, state, nodes) {

        let myNodes = [];

        let possibleNodes = [];


        nodes.forEach(function (node) {
            let label = node.data("label");

            if (label) {
                label = label.replace('-', '');
                if (name && (typeof name === 'string' || name instanceof String)) {
                    name = name.replace('-', '');
                    if (label && label.toLowerCase() === name.toLowerCase()) {
                        possibleNodes.push(node);
                    }
                }
            }
        });

        if (!state && possibleNodes.length > 0) { //no need to compare
            return possibleNodes;
        } else {


            //now look at possible nodes to compare states
            possibleNodes.forEach(function (node) {

                let statesandinfos = node.data("statesandinfos");
                for (var i = 0; i < statesandinfos.length; i++) {
                    var sbgnstateandinfo = statesandinfos[i];
                    if (sbgnstateandinfo.clazz == "state variable") {
                        let value = sbgnstateandinfo.state.value;

                        if (value && value.toLowerCase() === state.toLowerCase() ||
                            value && possibleStates[state.toLowerCase()] && possibleStates[state.toLowerCase()].indexOf(value.toLowerCase()) > -1 || !value && state === '') //if any state matches this
                            myNodes.push(node);
                    }
                }

            });
        }

        return myNodes;
    }

    /***
     * Local function to update children's positions with node
     * @param {Object} positionDiff
     * @param {Object} node
     * @param {Number} cyId
     */
    moveNodeAndChildren (positionDiff, node, cyId) {
        let oldX = node.position("x");
        let oldY = node.position("y");
        node.position({
            x: oldX + positionDiff.x,
            y: oldY + positionDiff.y
        });

        this.modelManager.changeModelNodeAttribute("position", node.data("id"), cyId, node.position(), "me");

        let children = node.children();
        children.forEach((child) => {
            this.moveNodeAndChildren(positionDiff, child, true);
        });
    }

    /***
     * Moves node to the given location in data
     * @param {Object} data Node info {name:<string>, state:<string> , location:<string>}
     */
    moveNode(data) {

        let nodesToMove;
        let posToMove;

        let name = data.name;
        let state = data.state;
        let location = data.location;

        const extensionX = 40;
        const extensionY = 40;


        let cy = appUtilities.getCyInstance(data.cyId);
        appUtilities.setActiveNetwork(data.cyId);

        let nodes = appUtilities.getCyInstance(data.cyId).nodes();

        nodesToMove = this.findNodeFromLabel(name, state, nodes);

        nodesToMove.forEach((nodeToMove) => {

            //move our node first

            let bBox = cy.elements().boundingBox();

            //extend bbox
            bBox.x1 -= extensionX;
            bBox.x2 += extensionX;
            bBox.y1 -= extensionY;
            bBox.y2 += extensionY;


            if (location.toUpperCase().indexOf('TOP') > -1)
                posToMove = {x: (bBox.x1 + bBox.x2) / 2, y: bBox.y1};
            else if (location.toUpperCase().indexOf('BOTTOM') > -1)
                posToMove = {x: (bBox.x1 + bBox.x2) / 2, y: bBox.y2};
            else if (location.toUpperCase().indexOf('LEFT') > -1)
                posToMove = {x: bBox.x1, y: (bBox.y1 + bBox.y2) / 2};
            else if (location.toUpperCase().indexOf('RIGHT') > -1)
                posToMove = {x: bBox.x2, y: (bBox.y1 + bBox.y2) / 2};


            //move node -- no need to update the model for now
            nodeToMove.position(posToMove);

            if (nodeToMove.isParent()) {
                let posDiff = {x: posToMove.x - nodeToMove.position("x"), y: posToMove.y - nodeToMove.position("y")};
                this.moveNodeAndChildren(posDiff, nodeToMove);
            }

            //make sure model is updated accordingly
            this.modelManager.changeModelNodeAttribute("position", nodeToMove.data("id"), data.cyId, posToMove, "me");


            nodeToMove.lock();


            $("#perform-layout").trigger('click');

            let layoutCose = cy.layout({'name': 'cose', idealEdgeLength: 5, edgeElasticity: 5});
            layoutCose.run();

            cy.on('layoutstop', () => {
                nodeToMove.unlock();

                //move again

                let bBox = cy.elements().boundingBox();

                //extend bbox
                bBox.x1 -= extensionX;
                bBox.x2 += extensionX;
                bBox.y1 -= extensionY;
                bBox.y2 += extensionY;

                if (location.toUpperCase().indexOf('TOP') > -1)
                    posToMove = {x: (bBox.x1 + bBox.x2) / 2, y: bBox.y1};
                else if (location.toUpperCase().indexOf('BOTTOM') > -1)
                    posToMove = {x: (bBox.x1 + bBox.x2) / 2, y: bBox.y2};
                else if (location.toUpperCase().indexOf('LEFT') > -1)
                    posToMove = {x: bBox.x1, y: (bBox.y1 + bBox.y2) / 2};
                else if (location.toUpperCase().indexOf('RIGHT') > -1)
                    posToMove = {x: bBox.x2, y: (bBox.y1 + bBox.y2) / 2};


                if (nodeToMove.isParent()) {
                    let posDiff = {
                        x: posToMove.x - nodeToMove.position("x"),
                        y: posToMove.y - nodeToMove.position("y")
                    };
                    this.moveNodeAndChildren(posDiff, nodeToMove);
                }

                //move node -- no need to update the model for now
                nodeToMove.position(posToMove);

                //make sure model is updated accordingly
                this.modelManager.changeModelNodeAttribute("position", nodeToMove.data("id"), data.cyId, posToMove, "me");
            });
        });
    }


    /***
     * Highlights the upstream or downsteam of nodes given in data
     * @param {Object} data {name:, direction:, state:, cyId:}
     */
    highlightNodeStream (data) {

        let cy = appUtilities.getCyInstance(data.cyId);

        let chise = appUtilities.getChiseInstance(data.cyId)

        chise.getSbgnvizInstance().removeHighlights();
        this.selectNodeStream(data);

        appUtilities.getChiseInstance(data.cyId).highlightSelected(cy.elements(':selected'));

    }


    /***
     * Selects the upstream or downsteam of nodes given in data
     * @param {Object} data {name:, direction:, state:, cyId:}
     */
    selectNodeStream (data) {
        let cy = appUtilities.getCyInstance(data.cyId);


        let nodes = this.findNodeFromLabel(data.name, data.state, cy.nodes());

        let ids = [];
        nodes.forEach(function (node) {
            ids.push(node.data("id"));
        });


        let nodeIds = this._findStream(ids, ids, data.direction, cy);

        //unselect all first
        cy.elements().unselect();

        //select elements
        nodeIds.forEach(function (id) {
            cy.getElementById(id).select();
        });

    }


    /***
     * Moves the upstream or downsteam of nodes given in data to a location
     * @param {Object} data {name: <string>, direction: <"up", "down">, state:, cyId:<Number>, location: <"top", "bottom", "left", "right">}
     */
    moveNodeStream (data) {

        let cy = appUtilities.getCyInstance(data.cyId);

        let nodes = this.findNodeFromLabel(data.name, data.state, cy.nodes());

        let ids = [];
        if(!nodes)
            return;
        nodes.forEach(function (node) {
            ids.push(node.data("id"));
        });


        let nodeIds = this._findStream(ids, ids, data.direction, cy);

        if(!nodeIds)
            return;
        //unselect all first
        cy.elements().unselect();



        //select elements
        nodeIds.forEach(function (id) {
            cy.getElementById(id).select();
        });


        let streamEles = cy.elements(':selected');

        this.moveSelected(streamEles, data);
    }

    /**
     * Moves the given nodes to a specified location
     * @param {Array} nodesSelected
     * @param {Object} data
     */
    moveSelected (nodesSelected, data) {

        let cy = appUtilities.getCyInstance(data.cyId);
        let restEles = cy.elements().difference(nodesSelected);

        let bBoxRest = restEles.boundingBox();
        let bBoxSelected = nodesSelected.boundingBox();


        let posUpdate = {};
        posUpdate.x = Math.abs(bBoxSelected.x1 - bBoxRest.x1);
        posUpdate.y = Math.abs(bBoxSelected.y1 - bBoxRest.y1);
        //unselect again
        cy.elements().unselect();

        let modelEles = [];
        let paramList = [];
        nodesSelected.forEach(function (ele) {
            let currPos = ele.position();

            if (data.location.toUpperCase().indexOf('TOP') > -1)  //move up
                currPos.y -= 2 * Math.abs(currPos.y - bBoxRest.y1);
            else if (data.location.toUpperCase().indexOf('BOTTOM') > -1)
                currPos.y += 2 * Math.abs(currPos.y - bBoxRest.y2);
            else if (data.location.toUpperCase().indexOf('LEFt') > -1)
                currPos.x -= 2 * Math.abs(currPos.x - bBoxRest.x1);
            else if (data.location.toUpperCase().indexOf('RIGHT') > -1)
                currPos.x += 2 * Math.abs(currPos.x - bBoxRest.x2);

            ele.position(currPos);
            modelEles.push({id: ele.id(), isNode: ele.isNode()});
            paramList.push(currPos);

        });


        //update model so that others know
        this.modelManager.changeModelElementGroupAttribute("position", modelEles, data.cyId, paramList, "me");

    }

    /***
     * Finds the upstream or downstream elements for given nodes with ids
     * @param {Array} ids
     * @param {Array} visitedIds Ids of the nodes that we already visited
     * @param {string} direction : "up" or "down"
     * @param {Object} cy Cytoscape object
     * @returns {Array} nodeIds Node ids of upstream or downstream elements
     * @private
     */
    _findStream (ids, visitedIds, direction, cy) {

        let self = this;
        let nodeIds = [];

        let directionMap = {down: {node: "source", neighbor: "target"}, up: {node: "target", neighbor: "source"}};


        ids.forEach(function (nodeId) {

            let edgeStr = "[" + directionMap[direction].node + "='" + nodeId + "']";

            let edges = cy.edges(edgeStr);

            if(!edges)
                return [];


            edges.forEach((edge) => {
                let neighborId = edge.data(directionMap[direction].neighbor);

                if(visitedIds.lastIndexOf(neighborId) > -1) //we reached back an already tested node
                    return [];

                visitedIds.push(neighborId);

                let nextLevelNodeIds = self._findStream([neighborId], visitedIds, direction, cy);


                nodeIds = nodeIds.concat(nextLevelNodeIds);
                nodeIds.push(neighborId);
            });
        });

        return nodeIds;

    }

    /***
     * Returns nodes that the children of a given compartment
     * @param {Object} data  {name : <compartment name>}
     * @returns {Object} Children f the given compartment
     */
    findCompartmentNodes (data) {

        let cy = appUtilities.getCyInstance(data.cyId);

        let myComp;
        cy.nodes().forEach(function (node) {
            if (node.data("class") === "compartment" && node.data("label").toLowerCase() === data.name.toLowerCase()) {
                myComp = node;
            }
        });


        if (myComp)
            return myComp.children();

        return null;

    }

    /**
     * Moves the elements of the whole compartment to a given location
     * @param {Object} data {name:, direction: <"up", "dow">, state:, cyId:, location: <"top", "bottom", "left", "right">}
     */

    moveCompartmentNodes (data) {
        let nodes = this.findCompartmentNodes(data);


        nodes.select();

        this.moveSelected(nodes, data);

    }
}

module.exports = VisHandler;






