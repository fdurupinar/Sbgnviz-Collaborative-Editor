function addNodeTest(cyId, id, className, posX, posY) {

  it('chise.addNode()', function () {
    cy.window().should(function(window){

      // get the chise instance for the given tab/cy id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the associated cy instance
      let cyInstance = chiseInstance.getCy();

      // perform the operation to test
      chiseInstance.addNode(posX, posY, className, id);

      // try to access the node with the given id
      let node = cyInstance.getElementById(id);

      // perform assertions on the node
      expect(node.length, "A node with id: " + id + " is added.").to.equal(1);
      expect(node.position('x'), 'x position of the node is as expected').to.equal(posX);
      expect(node.position('y'), 'y position of the node is as expected').to.equal(posY);
      expect(node.data('class'), 'the node has the expected sbgn class').to.equal(className);

      // check if the model manager is updated accordingly

      let modelManager = window.testModelManager;
      expect(modelManager, 'model manager is available here').to.be.ok;

      let nodeModel = modelManager.getModelNode(id, cyId);
      expect(nodeModel, 'node model is available here').to.be.ok;
      expect(modelManager.getModelNodeAttribute("data.id", id, cyId), "Node is equal in model and cytoscape").to.be.equal(cyInstance.getElementById(id).data("id"));
      expect(modelManager.getModelNodeAttribute("data.class", id, cyId), "Node class is equal in model and cytoscape.").to.be.equal(node.data("class"));
      expect(modelManager.getModelNodeAttribute("position.x", id, cyId), "Node position x is equal in model and cytoscape.").to.be.equal(node.position('x'));
      expect(modelManager.getModelNodeAttribute("position.y", id, cyId), "Node position y is equal in model and cytoscape.").to.be.equal(node.position('y'));
    });
  });
}

function addEdgeTest(cyId, id, src, tgt, className) {

  it('chise.addEdge()', function () {
    cy.window().should(function(window){

      // get the chise instance for the given tab/cy id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the related cy instance
      let cyInstance = chiseInstance.getCy();

      // perform the operation to test
      chiseInstance.addEdge(src, tgt, className, id);

      // try to get the edge with the given id
      let edge = cyInstance.getElementById(id);

      // perform assertions on the edge
      expect(edge, "An edge with id: " + id + " is added.").to.be.ok;
      expect(edge.data('source'), "the edge has the expected source").to.be.equal(src);
      expect(edge.data('target'), "the edge has the expected target").to.be.equal(tgt);

      // test if the model manager is updated accordingly
      let modelManager = window.testModelManager;
      let edgeModel = modelManager.getModelEdge(id, cyId);

      expect(edgeModel, "Edge is added to the model.").to.be.ok;
      expect(modelManager.getModelEdgeAttribute("data.id", id, cyId) , "Edge is equal in model and cytoscape").to.be.equal(cyInstance.getElementById(id).data("id"));
      expect(modelManager.getModelEdgeAttribute("data.class", id, cyId), "Edge class is equal in model and cytoscape.").to.be.equal(edge.data("class"));
      expect(modelManager.getModelEdgeAttribute("data.source", id, cyId), "Edge target x is equal in model and cytoscape.").to.be.equal(edge.data('source'));
      expect(modelManager.getModelEdgeAttribute("data.target", id, cyId), "Edge source y is equal in model and cytoscape.").to.be.equal(edge.data('target'));
    });
  });
}

function createCompoundTest(cyId, compoundType) {

  it('chise.createCompoundForGivenNodes()', function () {
    cy.window().should(function(window){

      // get the chise instance for the given cy/tab id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the associated cy instance
      let cyInstance = chiseInstance.getCy();

      // create a macromolecule to use in the actual test
      chiseInstance.addNode(100, 100, 'macromolecule', 'macromoleculeToCreateCompound');


      // Map the existing nodes before creating the compound
      let existingIdMap = {};

      // fill existing id map
      cyInstance.nodes().forEach(function (ele) {
        existingIdMap[ele.id()] = true;
      });

      // perform the operation to test
      chiseInstance.createCompoundForGivenNodes(cyInstance.getElementById('macromoleculeToCreateCompound'), compoundType);

      // The element who is not mapped before the operation is supposed to be the new compound
      let newEle = cyInstance.nodes().filter(function (ele) {
        return existingIdMap[ele.id()] !== true;
      });

      // perform assertions on the new element
      expect(newEle.length, "New compound is created").to.be.equal(1);
      expect(newEle.data('class'), "New compound has the expected class").to.be.equal(compoundType);

      // test if the model manager is updated accordingly
      let modelManager = window.testModelManager;
      let compoundModel = modelManager.getModelNode(newEle.id(), cyId);

      expect(compoundModel, "Compound is added to the model.").to.be.ok;
      expect(modelManager.getModelNodeAttribute("data.id", newEle.id(), cyId), "Compound is the parent of the node.").to.be.equal(cyInstance.getElementById('macromoleculeToCreateCompound').data("parent"));

      expect(modelManager.getModelNodeAttribute("data.class", newEle.id(), cyId), "Model compound has the correct sbgn class.").to.be.equal(compoundType);
    });
  });
}

function cloneElementsTest(cyId) {

  it('chise.cloneElements()', function () {
    cy.window().should(function(window){

      // get the chise instance for cy/tab id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the associated cy instance
      let cyInstance = chiseInstance.getCy();

      // get the initial size of the elements
      let initialSize = cyInstance.elements().length;

      // test the operation by cloning all elements
      chiseInstance.cloneElements(cyInstance.elements());

      // expect that the number of elements are doubled after the operation
      expect(cyInstance.elements().length, "Clone operation is successful").to.be.equal(initialSize * 2);
    });
  });
}

function cloneNodeTest(cyId, id) {

  it('chise.cloneElements()', function () {
    cy.window().should(function(window){

      // get the chise instance for the given cy/tab id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the associated cy instance
      let cyInstance = chiseInstance.getCy();

      // get the node to be cloned by its id
      let node = cyInstance.getElementById(id);

      // clone the node to perform testing
      chiseInstance.cloneElements(node);

      // TODO check if the node is cloned here

      // check if the model manager if updated accordingly
      let modelManager = window.testModelManager;
      let nodeModel = modelManager.getModelNode(id, cyId);

      for(let att in node.data()){
        if(node.data().hasOwnProperty(att) && att !== "bbox"){
          // assert.propEqual(nodeModel.data[att],node.data(att), 'Data ' + att +' of actual and cloned elements are the same.');
          expect(nodeModel.data[att], 'In model data ' + att +' of actual and cloned elements are the same.').to.deep.equal(node.data(att));
        }
      }
    });
  });
}

function expandCollapseTest(cyId, selector) {

  it('chise.collapseNodes() and chise.expandNodes()', function () {
    cy.window().should(function(window){

      // get the chise instance for cy/tab id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the associated cy instance
      let cyInstance = chiseInstance.getCy();

      // filter the nodes that obeys the selector
      let filteredNodes = cyInstance.nodes(selector);

      // get the number of children for the filtered nodes before the operation
      let initilChildrenSize = filteredNodes.children().length;

      // get the number of nodes and edges seperately before the operation
      let initialNodesSize = cyInstance.nodes().length;
      let initialEdgesSize = cyInstance.edges().length;

      // perform the collapse operation for testing purpose
      chiseInstance.collapseNodes(filteredNodes);

      // expect that filtered nodes should have no children after the collapse operation is performed
      expect(filteredNodes.children().length, "Collapse operation is successful").to.be.equal(0);

      // expand the filtered nodes back for testig purpose
      chiseInstance.expandNodes(filteredNodes);

      // expect that the initial children size should be preserved for the filtered nodes
      expect(filteredNodes.children().length, "Initial children size is protected after expand operation").to.be.equal(initilChildrenSize);

      // expect that initial node and edges sizes should be preserved seperately for the whole graph
      expect(cyInstance.nodes().length, "Initial nodes size is protected after expand operation").to.be.equal(initialNodesSize);
      expect(cyInstance.edges().length, "Initial edges size is protected after expand operation").to.be.equal(initialEdgesSize);

      // check if the model manager is updated accordingly
      let modelManager = window.testModelManager;

      filteredNodes.forEach(function(node){
        let expandCollapseStatus = modelManager.getModelNodeAttribute('expandCollapseStatus', node.id(), cyId);
        expect(expandCollapseStatus, "In model expand on node " + node.id()  + " is successful").to.be.equal("expand");
      });
    });
  });
}

function deleteElesTest(cyId, selector) {

  it('chise.deleteElesSimple()', function () {
    cy.window().should(function(window){

      // get the chise instance for the given cy/tab id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the associated cy instance
      let cyInstance = chiseInstance.getCy();

      // store the ids for the existing elements satisfiying the given selector
      // to test if the model manager if updated properly
      let nodeIds = [];
      let edgeIds = [];

      // fill the arrays to store ids
      cyInstance.elements(selector).forEach(function(ele){
        if(ele.isNode())
        nodeIds.push(ele.id());
        else
        edgeIds.push(ele.id());
      });

      // perform the delete operation for the testing purpose
      chiseInstance.deleteElesSimple(cyInstance.elements(selector));

      // expect that the number of elements that obeys the selector must be 0 after the deletion
      expect(cyInstance.elements(selector).length, "Delete simple operation is successful").to.be.equal(0);

      // check if the model manager is updated properly
      nodeIds.forEach(function(nodeId){
        expect(modelManager.getModelNode(nodeId, cyId), "In model node " + nodeId + " removed successfully.").not.to.be.ok;
      });

      edgeIds.forEach(function(edgeId){
        expect(modelManager.getModelEdge(edgeId, cyId), "In model edge " + edgeId + " removed successfully.").not.to.be.ok;
      });
    });
  });
}

function deleteNodesSmartTest(cyId, selector) {

  it('chise.deleteElesSmart()', function () {
    cy.window().should(function(window){

      // get the chise instance for the given cy/tab id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the associated cy instance
      let cyInstance = chiseInstance.getCy();

      // get the whole graph nodes
      let allNodes = cyInstance.nodes();

      // get the nodes that are satisfiying the selector
      let nodes = cyInstance.nodes(selector);

      // calculate nodes to keep and not to keep after the operation
      let nodesToKeep = chiseInstance.elementUtilities.extendRemainingNodes(nodes, allNodes);
      let nodesNotToKeep = allNodes.not(nodesToKeep);

      // variables for the array of ids of nodes not to keep and a selector to represent them,
      // these variables will be used to see if the nodes are removed and the model manager is updated
      // properly
      let removedIds = [];
      let removedIdsSelector = '';

      // fill the variables that are just defined
      nodesNotToKeep.forEach(function(node){
        if (removedIdsSelector != '') {
          removedIdsSelector += ',';
        }
        removedIds.push(node.id());
        removedIdsSelector += '#' + node.id();
      });

      // perform the deletion for testing purpose
      chiseInstance.deleteNodesSmart(nodes);

      // expect that none of the nodes not to keep exists in the graph after the operation
      expect(cyInstance.nodes(removedIdsSelector).length, "Delete smart operation is successful").to.be.equal(0);

      // check if the model manager is updated accordingly
      let modelManager = window.testModelManager;
      removedIds.forEach(function(nodeId){
        expect(modelManager.getModelNode(nodeId, cyId), "In model node " + nodeId + " removed successfully.").not.to.be.ok;
      });
    });
  });
}

function hideElesTest(cyId, selector) {

  it('chise.hideNodesSmart()', function () {
    cy.window().should(function(window){

      // get the chise instance for the given cy/tab id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the associated cy instance
      let cyInstance = chiseInstance.getCy();

      // get nodes to perform operation on
      let nodes = cyInstance.nodes(selector);

      // get the nodes that are already visible before the operation
      let alreadyVisibleNodes = cyInstance.nodes(':visible');

      // get the nodes that are already hidden before the operation
      let alreadyHiddenNodes = cyInstance.nodes(':hidden');

      // get the nodes that are not to be hidden during the operation
      let nodesNotToHide = chiseInstance.elementUtilities.extendRemainingNodes(nodes, alreadyVisibleNodes).nodes();

      // get the nodes that are to be hidden during the operation
      let nodesToHide = alreadyVisibleNodes.not(nodesNotToHide);

      // the whole nodes that are expected to be hidden after the operation is performed
      let nodesExpectedToBeHidden = nodesToHide.union(alreadyHiddenNodes);

      // perform hiding operation for testing purpose
      chiseInstance.hideNodesSmart(nodes);

      // expect that nodes expected to be hidden after the operation has the same length with the nodes
      // that actully has the hidden status after the operation is performed
      expect(cyInstance.nodes().filter(':hidden').length, "Hide operation is successful").to.be.equal(nodesExpectedToBeHidden.length);

      // check if the model manager is updated properly

      let modelManager = window.testModelManager;

      // check if the nodes are hidden on model manager as well
      nodes.forEach(function(node){
        let visibilityStatus = modelManager.getModelNodeAttribute('visibilityStatus', node.id(), cyId);
        expect(visibilityStatus, "In model hide on node " + node.id()  + " is successful").to.be.equal("hide");
      });
    });
  });
}

function showAllElesTest(cyId) {

  it('chise.showAll()', function () {
    cy.window().should(function(window){

      // get the chise instance for the given cy/tab id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the associated cy instance
      let cyInstance = chiseInstance.getCy();

      // perform the show all operation for testing purpose
      chiseInstance.showAll()

      // expect that all nodes are visible after the operation
      expect(cyInstance.nodes().length, "Show all operation is successful").to.be.equal(cyInstance.nodes(':visible').length);

      // check if the model manager is updated properly

      let modelManager = window.testModelManager;

      cyInstance.nodes().forEach(function(node){
        let visibilityStatus = modelManager.getModelNodeAttribute('visibilityStatus', node.id(), cyId);
        expect(visibilityStatus, "In model show on node " + node.id()  + " is successful").not.to.be.equal("hide");
      });

    });
  });
}

function alignTest (cyId, selector, horizontal, vertical, alignToId) {

  it('chise.align()', function () {
    cy.window().should(function(window){

      // get the chise instance for cy/tab id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the associated cy instance
      let cyInstance = chiseInstance.getCy();

      // get the nodes that are represented by the selector
      let nodes = cyInstance.nodes(selector);

      // If node to align to is not set use the first node in the list
      let alignToNode = alignToId ? cyInstance.getElementById(alignToId) : nodes[0];

      // Return the alignment coordinate of the given node. This alignment coordinate is depandent on
      // the horizontal and vertical parameters and after the align operation all nodes should have the same
      // alignment coordinate of the align to node.
      let getAlignmentCoord = function(node) {
        if (vertical === 'center') {
          return node.position('x');
        }
        if (vertical === 'left') {
          return node.position('x') - node.outerWidth() / 2;
        }
        if (vertical === 'right') {
          return node.position('x') + node.outerWidth() / 2;
        }
        if (horizontal === 'middle') {
          return node.position('y');
        }
        if (horizontal === 'top') {
          return node.position('y') - node.outerHeight() / 2;
        }
        if (horizontal === 'bottom') {
          return node.position('y') + node.outerHeight() / 2;
        }
      }

      // get the alignment coordinate for the reference node
      // the other nodes are expected to have the same alignment coordinate
      let expectedCoord = getAlignmentCoord(alignToNode);


      // perform the align operation for testing purpose
      chiseInstance.align(nodes, horizontal, vertical, alignToNode);

      // filter the nodes that has the expected alignment coordinate
      // these nodes are the ones that are aligned properly
      let filteredNodes = nodes.filter(function(node) {
        let coord = getAlignmentCoord(node);
        return coord === expectedCoord;
      });

      // expect that all of the nodes are aligned as expected
      expect(filteredNodes.length, "Align operation is successful for all nodes " + horizontal + " " + vertical).to.be.equal(nodes.length);

      // check if the model manager is updated properly
      let modelManager = window.testModelManager;

      nodes.forEach(function(node){
        let posX = modelManager.getModelNodeAttribute('position.x', node.id(), cyId);
        let posY = modelManager.getModelNodeAttribute('position.y', node.id(), cyId);
        expect(posX, "In model x position of " + node.id()  + " is updated successfully").to.be.equal(node.position('x'));
        expect(posY, "In model y position of " + node.id()  + " is updated successfully").to.be.equal(node.position('y'));
      });
    });
  });
}

function highlightElesTest(cyId, selector) {

  it('chise.highlightEles()', function () {
    cy.window().should(function(window){

      // get the chise instance for the given cy/tab id
      var chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the associated cy instance
      var cyInstance = chiseInstance.getCy();

      // get the elements that obeys the selector
      let eles = cyInstance.$(selector);

      // Perform highlighting for testing purpose
      // This method highlights the given eles not the selected ones. It has an unfortune name.
      chiseInstance.highlightSelected(eles);

      // expect that all of the given elements are highlighted after the operation
      expect(eles.filter('.highlighted').length, "Highlight operation is successful").to.be.equal(eles.length);

      // check if the model manager is updated properly

      let modelManager = window.testModelManager;

      eles.forEach(function(ele){
        if(ele.isNode()){
          let highlightStatus = modelManager.getModelNodeAttribute('highlightStatus', ele.id(), cyId);
          expect(highlightStatus, "In model highlight on node " + ele.id()  + " is successful").to.be.equal("highlighted");
        }
        else{
          let highlightStatus = modelManager.getModelEdgeAttribute('highlightStatus', ele.id(), cyId);
          expect(highlightStatus, "In model highlight on edge " + ele.id()  + " is successful").to.be.equal("highlighted");
        }
      });

    });
  });
}

function removeHighlightsTest(cyId) {

  it('chise.removeHighlights()', function () {
    cy.window().should(function(window){

      // get the chise instance for the given cy/tab id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the associated cy instance
      let cyInstance = chiseInstance.getCy();

      // remove highlights from the map for testing purpose
      chiseInstance.removeHighlights();

      // expect that none of the elements is highlighted after the operation
      expect(cyInstance.elements('.highlighted').length, "Remove highlights operation is successful").to.be.equal(0);

      // check if the model manager is updated properly

      let modelManager = window.testModelManager;

      cyInstance.elements().forEach(function(ele){
        if(ele.isNode()){
          let highlightStatus = modelManager.getModelNodeAttribute('highlightStatus', ele.id(), cyId);
          expect(highlightStatus, "In model unhighlight on node " + ele.id()  + " is successful").to.be.equal("unhighlighted");
        }
        else{
          let highlightStatus = modelManager.getModelEdgeAttribute('highlightStatus', ele.id(), cyId);
          expect(highlightStatus, "In model unhighlight on edge " + ele.id()  + " is successful").to.be.equal("unhighlighted");
        }
      });
    });
  });
}

function highlightProcessesTest(cyId, selector) {

  it('chise.highlightProcesses()', function () {
    cy.window().should(function(window){

      // get the chise instance for the given cy/tab id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the associated cy instance
      let cyInstance = chiseInstance.getCy();

      // get the nodes obeying the selector
      let nodes = cyInstance.nodes(selector);

      // calculate the elements to highlight
      let elesToHighlight = chiseInstance.elementUtilities.extendNodeList(nodes);

      // perform highlight processes operation for testing purpose
      chiseInstance.highlightProcesses(nodes);

      // TODO replace assert with expect
      // expect that each of the calculated elements are highlighted
      assert.equal(elesToHighlight.filter('.highlighted').length, elesToHighlight.length, "Highlight processes operation is successful");

      // check if model manager is updated properly

      let modelManager = window.testModelManager;

      elesToHighlight.forEach(function(ele){
        if(ele.isNode()){
          let highlightStatus = modelManager.getModelNodeAttribute('highlightStatus', ele.id(), cyId);
          expect(highlightStatus, "In model highlight on node " + ele.id()  + " is successful").to.be.equal("highlighted");
        }
        else{
          let highlightStatus = modelManager.getModelEdgeAttribute('highlightStatus', ele.id(), cyId);
          expect(highlightStatus, "In model highlight on edge " + ele.id()  + " is successful").to.be.equal("highlighted");
        }
      });

    });
  });
}

function highlightNeighboursTest (cyId, selector) {

  it('chise.highlightNeighbours()', function () {
    cy.window().should(function(window){

      // get chise instance for the given cy/tab id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the associated cy instance
      let cyInstance = chiseInstance.getCy();

      // get the nodes obeying the selector
      let nodes = cyInstance.nodes(selector);

      // calculate the elements to be highlighted
      let elesToHighlight = chiseInstance.elementUtilities.getNeighboursOfNodes(nodes);

      // perform highlight neighbours operation for testing purpose
      chiseInstance.highlightNeighbours(nodes);

      // expect that all elements to be highlighted are highlighted after the operation
      expect(elesToHighlight.filter('.highlighted').length, "Highlight neighbours operation is successful").to.be.equal(elesToHighlight.length);

      // check if the model manager is updated properly

      let modelManager = window.testModelManager;

      elesToHighlight.forEach(function(ele){
        if(ele.isNode()){
          let highlightStatus = modelManager.getModelNodeAttribute('highlightStatus', ele.id(), cyId);
          expect(highlightStatus, "In model highlight on node " + ele.id()  + " is successful").to.be.equal("highlighted");
        }
        else{
          let highlightStatus = modelManager.getModelEdgeAttribute('highlightStatus', ele.id(), cyId);
          expect(highlightStatus, "In model highlight on edge " + ele.id()  + " is successful").to.be.equal("highlighted");
        }
      });

    });
  });
}

function changeNodeLabelTest(cyId, selector) {

  it('chise.changeNodeLabel()', function () {
    cy.window().should(function(window){

      // get the chise instance for given cy/tab id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the associated cy instance
      let cyInstance = chiseInstance.getCy();

      // get the nodes that obeys the selector
      let nodes = cyInstance.nodes(selector);

      // perform change node label operation for testing purpose
      chiseInstance.changeNodeLabel(nodes, 'test label');

      // expect that labels are updated as expected for all nodes that obeys the selector
      expect(nodes.filter('[label="test label"]').length, "Change node label operation is successful").to.be.equal(nodes.length);

      // check if the model manager is updated properly

      let modelManager = window.testModelManager;

      nodes.forEach(function(node){
        let newNodeLabel = modelManager.getModelNodeAttribute('data.label', node.id(), cyId);
        expect(newNodeLabel,  "In model change node label operation is successful").to.be.equal('test label');
      });
    });
  });
}

function resizeNodesTest(cyId, dimension) {

  it('chise.resizeNodes()', function () {
    cy.window().should(function(window){

      // get the chise instance for given cy/tab id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the associated cy instance
      let cyInstance = chiseInstance.getCy();

      // work on macromolecules to test
      let nodes = cyInstance.nodes('[class="macromolecule"]');

      // if 'dimension' parameter is 'w' update the width of nodes else update height of them
      if (dimension === 'w') {
        chiseInstance.resizeNodes(nodes, 100);
      }
      else {
        chiseInstance.resizeNodes(nodes, undefined, 100);
      }

      // filter the macromolecules whose desired dimension is updated properly
      let filteredNodes = nodes.filter(function(node) {
        return node.data('bbox')[dimension] === 100;
      });

      // expect that the operation is successful for the whole macromolecules
      expect(filteredNodes.length, "Change " + dimension + " operation is successful").to.be.equal(nodes.length);

      // check if the model manager is updated properly

      let modelManager = window.testModelManager;

      filteredNodes.forEach(function(node){
        let newNodeDimension = modelManager.getModelNodeAttribute('data.bbox', node.id(), cyId);
        console.log(newNodeDimension[dimension]);
        console.log(node.data('bbox')[dimension]);

        expect(newNodeDimension[dimension],  "In model change " + dimension + " operation is successful").to.be.equal(node.data('bbox')[dimension]);
      });
    });
  });
}

function changeDataTest(cyId, selector, name, testVal, parseFloatOnCompare, omitStyle) {

  it('chise.changeData()', function () {
    cy.window().should(function(window){

      // get the chise instance for given cy/tab id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the associated cy instance
      let cyInstance = chiseInstance.getCy();

      // get the elements that obeys the selector
      let elements = cyInstance.$(selector);

      // Unselect the given elements because node selection affects some style properties like border color
      elements.unselect();

      // perform change data operation for testing purpose
      chiseInstance.changeData(elements, name, testVal);

      // for some style properties we set the value as 3 and get the result as '3px'
      // for such cases we may need to make comparision by parsing the values as float
      // this function and 'parseFloatOnCompare' option together stand for solving this problem
      let evalByParseOpt = function(val) {
        if (parseFloatOnCompare) {
          return parseFloat(val);
        }
        return val;
      }

      // filter the elements whose desired data field are properly updated
      let dataUpdated = elements.filter(function(ele) {
        return evalByParseOpt(ele.data(name)) === testVal;
      });

      // expect that the desired data field is updated for whole of the given elements
      expect(dataUpdated.length, "Change " + name + " operation is successfully changed element data").to.be.equal(elements.length);

      // Generally data fields have a corresponding style fields that are updated by their values.
      // If there is an exceptional case 'omitStyle' flag should be set upon calling this function.
      if (!omitStyle) {
        let styleUpdated = elements.filter(function(ele) {
          return evalByParseOpt(ele.css(name)) === testVal;
        });

        expect(styleUpdated.length, "Change " + name + " operation is successfully changed element style").to.be.equal(elements.length);
      }

      // check if the model manager is properly updated

      let modelManager = window.testModelManager;

      elements.forEach(function(ele){
        let attStr = 'data.' + name;
        let attVal = ele.isNode() ? modelManager.getModelNodeAttribute(attStr, ele.id(), cyId) : modelManager.getModelEdgeAttribute(attStr, ele.id(), cyId);
        expect(attVal, "Change " + name + " operation is successful in the model.").to.be.equal(testVal);
      });
    });
  });
}

function addStateOrInfoboxTest (cyId, id, obj) {

  it('chise.addStateOrInfoBox()', function () {
    cy.window().should(function(window){

      // get the chise instance for the given tab/cy id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the associated cy instance
      let cyInstance = chiseInstance.getCy();

      // get the node to perform operation by its id
      let node = cyInstance.getElementById(id);

      // get the initial number of auxilary units of the node
      let initialUnitsSize = node.data('statesandinfos').length;

      // perform add auxilary unit operation on the node for testing purpose
      chiseInstance.addStateOrInfoBox(node, obj);

      // perform assertions on given statesandinfos, given statesandinfos are supposed to be the ones after
      // the operation is performed
      function performAssertions(statesandinfos, inModel) {

        // if the assertions are performed on model prepend that string to the messages
        let inModelStr = inModel ? 'In model ' : '';

        // expect that length of given statesandinfos is one more than the initial units size
        expect(statesandinfos.length, inModelStr + "a new auxiliary unit is successfully added").to.be.equal(initialUnitsSize + 1);

        // new unit is the last one in the array
        let newUnit = statesandinfos[statesandinfos.length - 1];

        // expect that new unit has the given class
        expect(newUnit.clazz, inModelStr + "new unit has the expected unit type").to.be.equal(obj.clazz);

        // expect that the new unit has the expected sizess
        expect(JSON.stringify(newUnit.bbox), inModelStr + "new unit has the expected sizes").to.be.equal(JSON.stringify(obj.bbox));

        // expect that the new unit has the given state/label
        // 'state' is valid for state variables 'label' is valid for units of information
        if (obj.state) {
          expect(JSON.stringify(newUnit.state), inModelStr + "new unit has the expected state object").to.be.equal(JSON.stringify(obj.state));
        }

        if (obj.label) {
          expect(JSON.stringify(newUnit.label), inModelStr + "new unit has the expected label object").to.be.equal(JSON.stringify(obj.label));
        }
      }

      // get the states and infos after the operation is performed
      let statesandinfos = node.data('statesandinfos');

      let modelManager = window.testModelManager;

      // get the states and infos for the model manager after the operation is performed
      let modelStatesandinfos = modelManager.getModelNodeAttribute("data.statesandinfos", node.id(), cyId);

      // perform assertions for states and infos of the cytoscape instance node
      performAssertions(statesandinfos);

      // perform assertions for states and infos of the model manager node
      // note that the second param is to specify that the assertions are performed on model manager
      performAssertions(modelStatesandinfos, true);
    });
  });
}

function changeStateOrInfoBoxTest (cyId, id, index, value, type) {

  it('chise.changeStateOrInfoBox()', function () {
    cy.window().should(function(window){

      // get the chise instance for the given cy/tab id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the associated cy instance
      let cyInstance = chiseInstance.getCy();

      // get the node with given id
      let node = cyInstance.getElementById(id);

      // perform change state or info box operation for testing purpose
      chiseInstance.changeStateOrInfoBox(node, index, value, type);

      // perform assertions on the given unit that is expected to be
      // the updated unit for cytoscape node or model manager node after the operation is
      // performed
      function performAssertions(unit, inModel) {

        // string to prepend the messages if the assertions are performed on the model manager
        let inModelStr = inModel ? 'In model ' : '';

        // expect that the unit is properly updated
        // if type is not set we assume that it is a unit of information
        if (type) {
          expect(unit.state[type], inModelStr + "state variable is updated by " + type + " field.").to.be.equal(value);
        }
        else {
          expect(unit.label['text'], inModelStr + "unit of information label text is updated correctly.").to.be.equal(value)
        }
      }

      // Get the updated unit to check if it is updated correctly
      let unit = node.data('statesandinfos')[index];

      // perform assertins on the unit of the cytoscape node
      performAssertions(unit);

      let modelManager = window.testModelManager;
      let modelUnit = modelManager.getModelNodeAttribute("data.statesandinfos", node.id(), cyId)[index];

      // perform assertions on the unit of modelManager node
      // second parameter shows that the assertions are performed for the model manager
      performAssertions(modelUnit, true);
    });
  });
}

function removeStateOrInfoBoxTest (cyId, id, index) {

  it('chise.removeStateOrInfoBox()', function () {
    cy.window().should(function(window){

      // get the chise instance for the given cy/tab id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the associated cy instance
      let cyInstance = chiseInstance.getCy();

      // get the node with given id
      let node = cyInstance.getElementById(id);

      let modelManager = window.testModelManager;

      // get the units to remove in cytoscape and model manager nodes
      let modelUnitToRemove = modelManager.getModelNodeAttribute("data.statesandinfos", node.id(), cyId)[index];
      let unitToRemove = node.data('statesandinfos')[index];

      // perform remove unit operation on the node for testing purpose
      chiseInstance.removeStateOrInfoBox(node, index);

      // expect that unit is removed from the cytoscape node
      let checkIndex = node.data('statesandinfos').indexOf(unitToRemove);
      expect(checkIndex, "Auxiliary unit is removed successfully").to.be.equal(-1);

      // expect the unit is removed from the model node
      let modelCheckIndex = modelManager.getModelNodeAttribute("data.statesandinfos", node.id(), cyId).indexOf(modelUnitToRemove);
      expect(modelCheckIndex, "Auxiliary unit is removed successfully from the model").to.be.equal(-1);
    });
  });
}

function setMultimerStatusTest (cyId, selector, status) {

  it('chise.setMultimerStatus()', function () {
    cy.window().should(function(window){

      // get the chise instance for the given cy/tab id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the associated cy instance
      let cyInstance = chiseInstance.getCy();

      // get the nodes that obeys the selector
      let nodes = cyInstance.nodes(selector);

      // perform the set multimer status operation for testing purpose
      chiseInstance.setMultimerStatus(nodes, status);

      // filter the nodes whose multimer status are updated as expected
      let filteredNodes = nodes.filter(function(node) {
        let isMultimer = node.data('class').indexOf('multimer') > -1;
        return isMultimer === status;
      });

      // expect that whole of the given nodes pass the filter
      expect(filteredNodes.length, "Multimer status is set/unset for all nodes").to.be.equal(nodes.length);

      // check if the model manager is updated properly

      let modelManager = window.testModelManager;

      nodes.forEach(function(node){
        let isMultimer = modelManager.getModelNodeAttribute('data.class', node.id(), cyId).indexOf('multimer') > -1;
        expect(isMultimer,  "In model multimer status is set/unset for node#" + node.id()).to.be.equal(status);
      });
    });
  });
}

function setCloneMarkerStatusTest (cyId, selector, status) {

  it('chise.setCloneMarkerStatus()', function () {
    cy.window().should(function(window){

      // get the chise instance for the given cy/tab id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the associated cy instance
      let cyInstance = chiseInstance.getCy();

      // get the nodes that obeys the selector
      let nodes = cyInstance.nodes(selector);

      // perform set clone marker status operation for testing purpose
      chiseInstance.setCloneMarkerStatus(nodes, status);

      // filter the nodes whose clone marker status is updated properly
      let filteredNodes = nodes.filter(function(node) {
        let isCloneMarker = ( node.data('clonemarker') === true );
        return isCloneMarker === status;
      });

      // expect that whole of the given nodes pass the filter
      expect(filteredNodes.length, "clonemarker status is set/unset for all nodes").to.be.equal(nodes.length);

      // check if the model manager properly updated

      let modelManager = window.testModelManager;

      nodes.forEach(function(node){
        let isCloneMarker = modelManager.getModelNodeAttribute('data.clonemarker', node.id(), cyId) === true;
        expect(isCloneMarker,  "in model clonemarker status is set/unset for node#" + node.id()).to.be.equal(status);
      });
    });
  });
}

function changeFontPropertiesTest (cyId, selector, data) {

  it('chise.changeFontProperties()', function () {
    cy.window().should(function(window){

      // get the chise instance for given cy/tab id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the associated cy instance
      let cyInstance = chiseInstance.getCy();

      // get the nodes that obeys the selector
      let nodes = cyInstance.nodes(selector);

      // perform change font properties operation for testing purpose
      chiseInstance.changeFontProperties(nodes, data);

      // filter the nodes whose font properties in data object are properly updated
      let filteredNodes = nodes.filter(function(node) {
        for (let prop in data) {
          if (node.data(prop) !== data[prop]) {
            return false;
          }

          return true;
        }
      });

      // expect that font properties are properly updated for whole of the given nodes
      expect(filteredNodes.length, "Font properties are updated for all nodes").to.be.equal(nodes.length);

      // check if the model manager is properly updated

      let modelManager = window.testModelManager;

      nodes.forEach(function(node){
        for (let prop in data) {
          let propStr = 'data.' + prop;
          let val = modelManager.getModelNodeAttribute(propStr, node.id(), cyId);
          expect(val, "In model font properties are updated node#" + node.id()).to.be.equal(data[prop]);
        }
      });
    });
  });
}

function changeParentTest(cyId, selector, newParentId, posDiffX, posDiffY) {

  it('chise.changeParentTest()', function () {
    cy.window().should(function(window){

      // get the chise instance for the given cy/tab id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the associated cy instance
      let cyInstance = chiseInstance.getCy();

      // Keep initial positions of the nodes to be able to check if they are repositioned as expected
      let oldPositions = {};

      // get the nodes that obeys the selector
      let nodes = cyInstance.nodes(selector);

      let modelManager = window.testModelManager;

      // fill the old positions object
      nodes.forEach(function(node) {
        oldPositions[node.id()] = {
          x: node.position('x'),
          y: node.position('y')
        };
      });

      // perform change parent operation for testing purpose
      chiseInstance.changeParent(nodes, newParentId, posDiffX, posDiffY);

      // Node list should be updated after change parent operation get the updated list
      let updatedNodes = cyInstance.nodes(selector);

      // Filter the nodes that are moved to the new parent
      let filteredNodes = updatedNodes.filter(function (node) {
        return node.data('parent') === newParentId;
      });

      // expect that all of given nodes pass the filter
      expect(filteredNodes.length, "All nodes are moved to the new parent").to.be.equal(nodes.length);

      // check if the node parents are updated properly in model manager
      updatedNodes.forEach(function(node){
        let parentId = modelManager.getModelNodeAttribute('data.parent', node.id(), cyId);
        expect(parentId, "In model parent node is updated node#" + node.id()).to.be.equal(newParentId);
      });

      let allRepositionedCorrectly = true;

      // Check if the nodes are repositioned as expected
      updatedNodes.forEach(function(node) {
        if (node.position('x') - oldPositions[node.id()].x !== posDiffX
        || node.position('y') - oldPositions[node.id()].y !== posDiffY) {
          allRepositionedCorrectly = false;
        }
      });

      // expect that all of the nodes whose parent are changed are repositioned correctly
      expect(allRepositionedCorrectly, "All nodes are repositioned as expected").to.be.equal(true);

      // expect that the nodes whose parent are changed are repositioned correctly in the model manager as well
      updatedNodes.forEach(function(node){
        let posX = modelManager.getModelNodeAttribute('position.x', node.id(), cyId);
        let posY = modelManager.getModelNodeAttribute('position.y', node.id(), cyId);
        expect(posX - oldPositions[node.id()].x, "In model pos x is updated correctly for node#" + node.id()).to.be.equal(posDiffX);
        expect(posY - oldPositions[node.id()].y, "In model pos y is updated correctly for node#" + node.id()).to.be.equal(posDiffY);
      });
    });
  });
}

function setPortsOrderingTest(cyId, selector, ordering) {

  it('chise.setPortsOrdering()', function () {
    cy.window().should(function(window){

      // get the chise instance for the given cy/tab id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the associated cy instance
      let cyInstance = chiseInstance.getCy();

      // get the nodes that obeys the selector
      let nodes = cyInstance.nodes(selector);

      // perform set ports ordering operation for testing purpose
      chiseInstance.setPortsOrdering(nodes, ordering);

      // get the common ordering of the nodes after the operation
      let commonOrdering = chiseInstance.elementUtilities.getPortsOrdering(nodes);

      // expect that the common ordering after operation is equal to the desired ordering
      expect(commonOrdering, "Ports ordering is set for all nodes").to.be.equal(ordering);

      // check if the model manager is updated properly

      let modelManager = window.testModelManager;

      nodes.forEach(function(node){
        let modelOrdering = modelManager.getModelNodeAttribute('data.portsordering', node.id(), cyId);
        expect(modelOrdering, "In model ports ordering is updated correctly for node#" + node.id()).to.be.equal(ordering);
      });
    });
  });
}

function resetMapTypeTest(cyId) {

  it('chise.resetMapType()', function () {
    cy.window().should(function(window){

      // get the chise instance for the given cy/tab id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // reset map type for testing purpose
      chiseInstance.resetMapType();

      // expect that map type is no more set
      expect(chiseInstance.elementUtilities.mapType).not.to.be.ok;
    });
  });
}

function checkVisibility(cyId, selector) {

  it('checkVisibility', function () {
    cy.window().should(function(window){

      // get the chise instance for given cy/tab id
      let chiseInstance = window.appUtilities.getChiseInstance(cyId);

      // get the associated cy instance
      let cyInstance = chiseInstance.getCy();

      // expect that whole nodes are visible
      expect(cyInstance.nodes(selector).length, "It is visible").to.be.equal(cyInstance.nodes(selector).filter(":visible").length);
    });
  });
}

// Test if creating new network works as expected
function createNewNetworkTest () {

  it('createNewNetwork', function () {
    cy.window().should(function(window){

      // get the initial length of networks
      let initilNetworksSize = window.appUtilities.networkIdsStack.length;

      // get the id of the network to be created
      let networkId = window.appUtilities.nextNetworkId;

      // get the selector of new network panel
      let panelSelector = window.appUtilities.getNetworkPanelSelector(networkId);

      // get the selector of new tab
      let tabSelector = window.appUtilities.getNetworkTabSelector(networkId);

      // create a new network
      window.appUtilities.createNewNetwork();

      // Cypress enables jQuery access by Cypress.$ (Please see: https://docs.cypress.io/api/utilities/$.html#)

      // expect that the panel for the new network is created
      expect(Cypress.$(panelSelector), "Panel for the new network is created").to.be.ok;

      // expect that the tab for the new network is created
      expect(Cypress.$(tabSelector), "Tab for the new network is created").to.be.ok;

      // expect that number of networks is incremented by one
      expect(window.appUtilities.networkIdsStack.length, "A new network is created").to.be.equal(initilNetworksSize + 1);
    });
  });

}

// Test if choosing a network tab programatically works as expected
function chooseNetworkTabTest (networkId) {

  it('chooseNetworkTab', function () {

    cy.window().should(function(window){

      // get the selector of panel for the network id
      let panelSelector = window.appUtilities.getNetworkPanelSelector(networkId);

      // get the selector of tab for the network id
      let tabSelector = window.appUtilities.getNetworkTabSelector(networkId);

      // programatically choose the tab with given id
      window.appUtilities.chooseNetworkTab(networkId);

      // expect that the tab that new active network id is equal to the given network id
      expect(window.appUtilities.getActiveNetworkId(), "New active network id is updated as expected after choose tab operation").to.be.equal(networkId);

      // expect that the panel for the choosen tab has the class 'active'
      expect(Cypress.$(panelSelector).hasClass('active'), "Panel for the tab that is just choosen is active").to.be.ok;

      // expect that the choosen tab has the class 'active'
      expect(Cypress.$(tabSelector).hasClass('active'), "The tab that is just choosen is active").to.be.ok;

    });

  });
}

// Test if the active network can be closed as expected
function closeActiveNetworkTest () {

  it('closeActiveNetwork', function () {

    cy.window().should(function(window){

      // get the active network id
      let activeNetworkId = window.appUtilities.getActiveNetworkId();

      // get the selector of panel for the active network id
      let activePanelSelector = window.appUtilities.getNetworkPanelSelector(activeNetworkId);

      // get the selector of tab for the active network id
      let activeTabSelector = window.appUtilities.getNetworkTabSelector(activeNetworkId);

      // close the active network
      window.appUtilities.closeActiveNetwork();

      // expect that old active network id is no more included in network ids stack
      expect(window.appUtilities.networkIdsStack.indexOf(activeNetworkId), "Old active network is removed from networks list").to.be.equal(-1);

      // expect that active network id is updated
      expect(window.appUtilities.getActiveNetworkId(), "Active network id is updated after closing the active tab").not.to.be.equal(activeNetworkId);

      // expect that the old active panel is no more exists
      expect(Cypress.$(activePanelSelector).length, "Panel for the closed network no more exists").to.be.equal(0);

      // expect that the old active tab no more exists
      expect(Cypress.$(activeTabSelector).length, "Tab for the closed network no more exists").to.be.equal(0);

    });

  });
}

// inital expected network ids to traverse
var initialNetworkIds = [0, 1];

function networkIdsTest () {

  it('networkIdsTest', function () {

      cy.window().should(function (window) {

        // expect that actual networkIdsStack is deep equal to our initial expected network ids
        expect(window.appUtilities.networkIdsStack, "Network id stack is as expected before the chise user tests").to.deep.equal(initialNetworkIds);

      });
  });
}

describe('CWC Test', function(){

    // create a new network/tab
    createNewNetworkTest();

    networkIdsTest();

    // Perform the tests for the all existing open networks,
    // traversing window.appUtilities.networkIdsStack would be a safer way
    // but currently we are not able to access it from here.
    // If another open/close file operation is done in before then the
    // array that is traversed here should be updated accordingly.
    initialNetworkIds.forEach( function( cyId ) {

      addNodeTest(cyId, 'pdNode0', 'macromolecule', 100, 100);
      addNodeTest(cyId, 'pdNode1', 'process', 100, 200);
      checkVisibility(cyId, '#pdNode1');
      addNodeTest(cyId, 'pdNode2', 'macromolecule', 200, 200);

      addEdgeTest(cyId, 'pdEdge', 'pdNode1', 'pdNode2', 'necessary stimulation');

      let pdNodeTypes = ['macromolecule', 'complex', 'simple chemical', 'unspecified entity',
      'nucleic acid feature', 'perturbing agent', 'source and sink', 'phenotype', 'process',
      'omitted process', 'uncertain process', 'association', 'dissociation', 'tag',
      'compartment', 'submap', 'and', 'or', 'not'
      ];

      for (let i = 0; i < pdNodeTypes.length; i++) {
      let id = 'pdNode' + (i + 3);
          addNodeTest(cyId, id, pdNodeTypes[i], 300, 200);
      }

      resetMapTypeTest(cyId); // Reset the map type here to unknown to allow adding AF elements

      let afNodeTypes = ['biological activity', 'BA plain', 'BA unspecified entity',
      'BA simple chemical', 'BA macromolecule', 'BA nucleic acid feature',
      'BA perturbing agent', 'BA complex', 'delay'];

      for (let i = 0; i < afNodeTypes.length; i++) {
      let id = 'afNode' + i;
          addNodeTest(cyId, id, afNodeTypes[i], 300, 200);
      }

      let pdEdgeTypes = ['consumption', 'production', 'modulation', 'stimulation',
      'catalysis', 'necessary stimulation', 'logic arc', 'equivalence arc'];

      for (let i = 0; i < pdEdgeTypes.length; i++) {
          let id = 'pdEdge' + i;
          let src = 'pdNode' + i;
          let tgt = 'pdNode' + (pdNodeTypes.length - i - 1);
          addEdgeTest(cyId, id, src, tgt, pdEdgeTypes[i]);
      }

      let afEdgeTypes = ['unknown influence', 'positive influence', 'negative influence'];

      for (let i = 0; i < afEdgeTypes.length; i++) {
          let id = 'afEdge' + i;
          let src = 'afNode' + i;
          let tgt = 'afNode' + (afNodeTypes.length - i - 1);
          addEdgeTest(cyId, id, src, tgt, afEdgeTypes[i]);
      }

      createCompoundTest(cyId, 'complex');
      cloneElementsTest(cyId);
      cloneNodeTest(cyId, 'pdNode5');

      expandCollapseTest(cyId, ':parent');
      deleteElesTest(cyId, '#pdNodeO');
      deleteNodesSmartTest(cyId, '#pdNode7');

      checkVisibility(cyId, '#pdNode1');
      // checkVisibility(cyId, '#pdNode1');
      hideElesTest(cyId, '#pdNode1');
      showAllElesTest(cyId);

      alignTest(cyId, 'node', 'left');
      alignTest(cyId, 'node', 'center');
      alignTest(cyId, 'node', 'none', 'top');
      alignTest(cyId, 'node', 'none', 'bottom');
      alignTest(cyId, 'node', 'none', 'middle');

      highlightElesTest(cyId, '[class="macromolecule"]');
      removeHighlightsTest(cyId);
      highlightNeighboursTest(cyId, '[class="macromolecule"]');
      removeHighlightsTest(cyId);
      highlightProcessesTest(cyId, '[class="macromolecule"]');
      removeHighlightsTest(cyId);

      changeNodeLabelTest(cyId, '[class="macromolecule"]');
      resizeNodesTest(cyId, 'w');
      resizeNodesTest(cyId, 'h');

      changeDataTest(cyId, '[class="macromolecule"]', 'border-color', '#b6f442');
      changeDataTest(cyId, '[class="macromolecule"]', 'background-color', '#15076d');
      changeDataTest(cyId, '[class="macromolecule"]', 'border-width', 2, true);
      changeDataTest(cyId, '[class="macromolecule"]', 'background-opacity', 1, true);
      changeDataTest(cyId, 'edge', 'width', 3.5, true);
      changeDataTest(cyId, 'edge', 'cardinality', 3, true, true);
      changeDataTest(cyId, 'edge', 'line-color', '#b6f442');

      let stateVarObj = {};
      stateVarObj.clazz = 'state variable';
      stateVarObj.state = {
          value: 'val',
          variable: 'let'
      };
      stateVarObj.bbox = {
          w: 40,
          h: 20
      };

      let unitOfInfoObj = {};
      unitOfInfoObj.clazz = 'unit of information';
      unitOfInfoObj.label = {
          text: 'label'
      };
      unitOfInfoObj.bbox = {
          w: 40,
          h: 20
      };

      addStateOrInfoboxTest(cyId, 'pdNode3', stateVarObj);
      addStateOrInfoboxTest(cyId, 'pdNode3', unitOfInfoObj);

      changeStateOrInfoBoxTest(cyId, 'pdNode3', 0, 'updated val', 'value');
      changeStateOrInfoBoxTest(cyId, 'pdNode3', 0, 'updated let', 'variable');
      changeStateOrInfoBoxTest(cyId, 'pdNode3', 1, 'updated label');

      removeStateOrInfoBoxTest(cyId, 'pdNode3', 0);

      setMultimerStatusTest(cyId, '[class="macromolecule"]', true);
      setCloneMarkerStatusTest(cyId, '[class="macromolecule multimer"]', true);

      setMultimerStatusTest(cyId, '[class="macromolecule multimer"]', false);
      setCloneMarkerStatusTest(cyId, '[class="macromolecule"]', false);

      changeFontPropertiesTest(cyId, '[class="macromolecule"]', {
      'font-size': '10px',
      'font-family': 'Arial',
      'font-weight': 'bolder'
      });

      addNodeTest(cyId, 'aCompartment', 'compartment', 100, 1000);
      addNodeTest(cyId, 'mm1', 'macromolecule', 150, 150);
      addNodeTest(cyId, 'mm2', 'macromolecule', 150, 190);
      changeParentTest(cyId, '#mm1, #mm2', 'aCompartment', 5, 5);

      addNodeTest(cyId, 'process1', 'process', 50, 50);
      addNodeTest(cyId, 'process2', 'omitted process', 50, 100);
      setPortsOrderingTest(cyId, '#process1, #process2', 'T-to-B');

    }

    // tests for switching between the tabs
    chooseNetworkTabTest(0);
    chooseNetworkTabTest(1);

    // test for closing active network
    closeActiveNetworkTest();

    // create another network
    createNewNetworkTest();
});
