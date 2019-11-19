/**
 * Author: Funda Durupinar Babur <f.durupinar@gmail.com>
 * Shared model handling operations.
 * Clients call these commands to update the model
 * Each room (docId) has one modelManager associated with it
 *
 **/


class ModelManager{

    /**
     *
     * @param {Object} model  shared model
     * @param {string} docId  room id/unique document id
     */
    constructor(model, docId){
        /**
         * @public
         */
        this.model = model;
        this.docId = docId;
    }

    /**
     *
     * @returns {Object} shared model including all model history
     */
    getModel() {
        return this.model;
    }

    /**
     *
     * @returns {Object} the model for this specific document
     */
    getPageDoc(){
        return this.model.get('documents.' + this.docId);
    }

    /**
     * Adds an image to the model
     * @param {Object} data
     * @param {string} user
     * @param {boolean} noHistUpdate whether this operation will be recorded in history
     */
    addImage(data, user, noHistUpdate) {
        let self = this;
        let images = this.model.get('documents.' + this.docId + '.images');
        if(images) {
            for (let i = 0; i < images.length; i++){
                if(images[i].tabIndex === data.tabIndex) { //overwrite
                    images[i] = data;
                    if (!noHistUpdate)
                        this.updateHistory({opName: 'overwrite', opTarget: 'image', opAttr: data.fileName});

                    //overwrite images
                    self.model.set('documents.' + self.docId + '.images', images);
                    return;
                }
            }
        }

        //if no such tab exists, insert a new tab
        this.model.pass({user: user}).push('documents.' + this.docId + '.images', data);

        if (!noHistUpdate)
            this.updateHistory({opName: 'add', opTarget: 'image', opAttr: data.fileName});
    }

    /**
     * Returns an array of images stored in the model
     * @returns {Array} images array
     */
    getImages(){
        return this.model.get('documents.' + this.docId + '.images');
    }

    /**
     * Sets user name for userId
     * @param {string} userId
     * @param {string} userName
     */
    setName (userId, userName) {
        this.model.set('documents.' + this.docId + '.users.' + userId +'.name', userName);
    }

    /**
     * Sets if user with userId is currently typing
     * @param {string} userId
     * @param {boolean} val
     */
    setUserTyping(userId, val){
        this.model.pass({user:"me"}).set('documents.' + this.docId + '.users.' + userId +'.isTyping', val);
    }

    /**
     * Returns userName for userId
     * @param {string} userId
     * @returns {string} userName
     */
    getName (userId) {
        return this.model.get('documents.' + this.docId + '.users.' + userId + '.name');
    }

    /***
     * Sets the color code of the user with userId
     * @param {string} userId id of the user we want to change color of
     * @param {string} color
     */
    setColorCode(userId, color){
        this.model.set('documents.' + this.docId + '.users.' + userId +'.colorCode', color);
    }

    /***
     * Randomly assigns a color to the user with userId
     * @param {string} userId of the user we want to change color of
     */
    changeColorCode(userId){
        this.model.set('documents.' + this.docId + '.users.' + userId +'.colorCode', getNewColor());
    }



    /***
     * @returns {Array} Active users in the room
     */
    getUserIds(){
        return this.model.get('documents.' + this.docId + '.userIds');
    }

    /***
     * Adds an active userId to the document and updates 'users' info
     * @param {string} userId
     * @param {string} userName
     * @param {string} colorCode
     */
    addUser(userId, userName, colorCode){
        let userIds = this.model.get('documents.' + this.docId + '.userIds');

        if(!userIds || userIds.indexOf(userId) < 0) //user not in the list
            this.model.at('documents.' + this.docId + '.userIds').push(userId);


        let usersPath = this.model.at('documents.' + this.docId + '.users');

        if(!usersPath.get(userId)){
            if(!userName) {
                //find maximum userId index
                let users = usersPath.get();
                let maxId = 0;
                for(let att in users){
                    if(users.hasOwnProperty(att)){
                        if(users[att].name && users[att].name.indexOf('User') > -1) {
                            let idNumber = Number(users[att].name.slice(4));
                            if (idNumber > maxId)
                                maxId = idNumber;
                        }
                    }
                }

                userName = "User" + (maxId +1);
            }
            if(!colorCode)
                colorCode = getNewColor();

            this.setName(userId, userName);
            this.setUserTyping(userId, false);
            this.setColorCode(userId, colorCode);
        }
    }

    /**
     * Deletes all the users
     */
    deleteAllUsers(){
        let self = this;
        let userIds = this.model.get('documents.' + this.docId + '.userIds');
        for(let i = userIds.length - 1; i>=0; i--){
            self.deleteUserId(userIds[i]);
        }
    }

    /**
     * Deletes user with userId
     * @param {string} userId
     */
    deleteUserId(userId){
        let self = this;

        let userIds = this.model.get('documents.' + this.docId + '.userIds');
        for(let i = 0; i < userIds.length; i++){
            if(userIds[i] === userId ){
                self.model.remove('documents.' + self.docId + '.userIds', i) ; //remove from the index
            }
        }
    }

    /**
     * Updates layout properties
     * @param {Object} properties
     */
    setLayoutProperties(properties){
        this.model.set('documents.' + this.docId + '.layoutProperties', properties);
    }

    /**
     *
     * @returns {Object} layoutProperties
     */
    getLayoutProperties(){
        return this.model.get('documents.' + this.docId + '.layoutProperties');
    }


    /**
     * Updates the oncoprint data
     * @param {Object} oncoprintVal
     */
    setOncoprint(oncoprintVal){
        this.model.set('documents.' + this.docId + '.oncoprint', oncoprintVal);
    }

    /**
     *
     * @returns {Object} oncoprint
     */
    getOncoprint(){
        return this.model.get('documents.' + this.docId + '.oncoprint');
    }

    /***
     *
     * @param {Object} cmd  {opName, opTarget,  elType, elId, opAttr,param, prevParam}
     * opName: set, load, open, add, select, unselect
     * opTarget: element, element group,  model, sample,
         * elType: node, edge
         * opAttr: highlightColor, lineColor, borderColor etc.
         */

    updateHistory (cmd) {
        let command = {
            date: new Date,
            opName: cmd.opName,
            opTarget: cmd.opTarget,
            elType: cmd.elType,
            opAttr: cmd.opAttr,
            elId: cmd.elId,
            cyId: cmd.cyId,
            param: cmd.param,
            prevParam: cmd.prevParam
        };

        if (cmd != null) {
            let ind = this.model.push('documents.' + this.docId + '.history', command) - 1;
            this.model.set('documents.' + this.docId + '.undoIndex', ind);
        }
    }

    /**
     *
     * @returns {string} Name of the latest command
     */
    getLastCommandName(){
        let undoIndex = this.model.get('documents.' + this.docId + '.undoIndex');
        let cmd = this.model.get('documents.' + this.docId + '.history.' + undoIndex);

        return cmd.opName;
    }


    /**
     *
     * @returns {boolean} if there are enough commands to undo
     */
    isUndoPossible() {
        return (this.model.get('documents.' + this.docId + '.undoIndex') > 0)
    }

    /**
     *
     * @returns {boolean} If we are not already at the latest command
     */
    isRedoPossible() {
        return (this.model.get('documents.' + this.docId + '.undoIndex') + 1 < this.model.get('documents.' + this.docId + '.history').length)
    }

    /**
     * Undo latest command
     */
    undoCommand() {
        let undoInd = this.model.get('documents.' + this.docId + '.undoIndex');
        let cmd = this.model.get('documents.' + this.docId + '.history.' + undoInd); // cmd: opName, opTarget, opAttr, elId, param


        if (cmd.opName == "set") {
            if (cmd.opTarget == "element" && cmd.elType == "node")
                this.changeModelNodeAttribute(cmd.opAttr, cmd.elId, cmd.cyId, cmd.prevParam, null); //user is null to enable updating in the editor

            else if (cmd.opTarget == "element" && cmd.elType == "edge")
                this.changeModelEdgeAttribute(cmd.opAttr, cmd.elId, cmd.cyId, cmd.prevParam, null);
            else if (cmd.opTarget == "element group")
                this.changeModelElementGroupAttribute(cmd.opAttr, cmd.elId, cmd.cyId, cmd.prevParam, null);

        }
        else if (cmd.opName == "add" || cmd.opName ==="restore") {
            if (cmd.opTarget == "element" && cmd.elType == "node")
                this.deleteModelNode(cmd.elId, cmd.cyId );
            else if (cmd.opTarget == "element" && cmd.elType == "edge")
                this.deleteModelEdge(cmd.elId, cmd.cyId);
            else if (cmd.opTarget == "compound")
                this.removeModelCompound(cmd.elId, cmd.cyId, cmd.param.childrenList, cmd.prevParam);
        }
        else if (cmd.opName == "delete") {
            if (cmd.opTarget == "element")
                this.restoreModelElement(cmd.elType, cmd.elId, cmd.cyId, cmd.prevParam);
            else if (cmd.opTarget == "element group"){

                this.restoreModelElementGroup(cmd.elId, cmd.cyId, cmd.prevParam);
            }
            else if (cmd.opTarget == "compound")
                this.addModelCompound(cmd.elId, cmd.cyId, cmd.prevParam.compoundAtts, cmd.prevParam.childrenList, cmd.prevParam.paramList);

        }
        // else if(cmd.opName === "update"){ //properties
        //     if(cmd.opTarget.indexOf('general') >= 0)
        //         this.updateGeneralProperties(cmd.prevParam);
        //     else if(cmd.opTarget.indexOf('layout') >= 0)
        //         this.updateLayoutProperties(cmd.prevParam);
        //     else if(cmd.opTarget.indexOf('grid') >= 0)
        //         this.updateGridProperties(cmd.prevParam);
        //
        // }
        else if (cmd.opName == "init") {
            this.newModel(cmd.cyId, null, true);
        }
        else if (cmd.opName == "new") { //delete all
            this.restoreModel( cmd.prevParam, cmd.cyId);

        }
        else if (cmd.opName == "merge") {
            this.newModel(cmd.cyId, null, true);
            this.restoreModel(cmd.prevParam, cmd.cyId);
        }

        undoInd = undoInd > 0 ? undoInd - 1 : 0;
        this.model.set('documents.' + this.docId + '.undoIndex', undoInd);

    }

    /**
     * Redo latest command
     */
    redoCommand () {
        let undoInd = this.model.get('documents.' + this.docId + '.undoIndex');
        let cmd = this.model.get('documents.' + this.docId + '.history.' + (undoInd + 1)); // cmd: opName, opTarget, opAttr, elId, param


        if (cmd.opName == "set") {
            if (cmd.opTarget == "element" && cmd.elType == "node")
                this.changeModelNodeAttribute(cmd.opAttr, cmd.elId, cmd.cyId, cmd.param, null); //user is null to enable updating in the editor
            else if (cmd.opTarget == "element" && cmd.elType == "edge")
                this.changeModelEdgeAttribute(cmd.opAttr, cmd.elId, cmd.cyId, cmd.param, null);
            else if (cmd.opTarget == "element group") {
                this.changeModelElementGroupAttribute(cmd.opAttr, cmd.elId, cmd.cyId, cmd.param, null);
            }
        }
        else if (cmd.opName == "add" ||cmd.opName == "restore") {
            if (cmd.opTarget == "element")
                this.restoreModelElement(cmd.elType, cmd.elId, cmd.cyId, cmd.param);
            else if (cmd.opTarget == "compound")
                this.addModelCompound(cmd.elId, cmd.cyId, cmd.param.compoundAtts, cmd.param.childrenList, cmd.param.paramList);
        }
        else if (cmd.opName == "delete") {
            if (cmd.opTarget == "element" && cmd.elType == "node")
                this.deleteModelNode(cmd.elId, cmd.cyId);
            else if (cmd.opTarget == "element" && cmd.elType == "edge")
                this.deleteModelEdge(cmd.elId, cmd.cyId);
            else if (cmd.opTarget == "element group")
                this.deleteModelElementGroup(cmd.elId, cmd.cyId);
            else if (cmd.opTarget == "compound")
                this.removeModelCompound(cmd.elId, cmd.cyId, cmd.param.childrenList, cmd.param);

        }
        // else if(cmd.opName === "update"){ //properties
        //     if(cmd.opTarget.indexOf('general') >= 0)
        //         this.updateGeneralProperties(cmd.param);
        //     else if(cmd.opTarget.indexOf('layout') >= 0)
        //         this.updateLayoutProperties(cmd.param);
        //     else if(cmd.opTarget.indexOf('grid') >= 0)
        //         this.updateGridProperties(cmd.param);
        //
        // }
        else if (cmd.opName == "init") {
            this.restoreModel(cmd.param, cmd.cyId );
        }
        else if (cmd.opName == "new") { //delete all
            this.newModel(cmd.cyId );
        }
        else if (cmd.opName == "merge") { //delete all
            this.restoreModel(cmd.param, cmd.cyId);
        }

        undoInd = undoInd < this.model.get('documents.' + this.docId + '.history').length - 1 ? undoInd + 1 : this.model.get('documents.' + this.docId + '.history').length - 1;
        this.model.set('documents.' + this.docId + '.undoIndex', undoInd);
    }


    /**
     * Notifies other users that a new tab has been opened
     * @param {Number} cyId Id of the tab that's closed
     * @param {string} user Parameter to test if the update comes from the same client
     */
    openCy(cyId, user){

        let cyPathStr = this.getModelCyPathStr(cyId);
        // this.model.pass({user: user}).set('documents.' + this.docId + '.newCy', cyId); //let others know
        this.model.pass({user:user}).set(cyPathStr + '.cyId', cyId);
    }

    /**
     * Does not remove the cy, only notifies other users that a tab is closed
     * @param {Number} cyId Id of the tab that's closed
     * @param {string} user Parameter to test if the update comes from the same client
     */
    closeCy(cyId, user){

        this.model.pass({user: user}).set('documents.' + this.docId + '.closedCy', cyId);
    }


    /**
     * Returns Newt tab ids with different cytoscape views
     * @returns {Array} Newt tabs
     */
    getCyIds(){
        let cyList = this.model.get('documents.' + this.docId + '.cy');
        let cyIds = [];
        for(var att in cyList){
            if(cyList.hasOwnProperty(att))
                cyIds.push(att);
        }

        return cyIds;
    }

    /**
     * Returns path to the cytoscape view with cyId
     * @param {Number} cyId
     * @returns {string}
     */
    getModelCyPathStr(cyId){
        return 'documents.' + this.docId + '.cy.' + cyId ;
    }

    /**
     * Returns path to the node with id in the view with cyId
     * @param {string} id
     * @param {Number} cyId
     * @returns {string}
     */
    getModelNodePathStr(id, cyId){
        return 'documents.' + this.docId + '.cy.' + cyId +'.nodes.' + id;
    }

    /**
     * Returns the node with id in the view with cyId
     * @param {string} id
     * @param {Number} cyId
     * @returns {Object}
     */
    getModelNode(id, cyId) {
        let nodePath = this.model.at(this.getModelNodePathStr(id, cyId));
        return nodePath.get();
    }

    /**
     * Returns all the nodes in the view with cyId as an array
     * @param {Number} cyId
     * @returns {Array}
     */
    getModelNodesArr(cyId){
        let nodes = this.model.get('documents.' + this.docId + '.cy.' + cyId + '.nodes');
        let nodeArr = [];
        for(var att in nodes){
            if(nodes.hasOwnProperty(att))
                nodeArr.push(nodes[att]);
        }

        return nodeArr;
    }

    /**
     * Returns all the nodes in the view with cyId as an object
     * @param {Number} cyId
     * @returns {Object}
     */
    getModelNodes(cyId) {
        let nodes = this.model.get('documents.' + this.docId + '.cy.' + cyId + '.nodes');
        return nodes;
    }

    /**
     * Tests if node with nodeId is in the view with cyId
     * @param {Number} cyId
     * @param {string} nodeId
     * @returns {boolean}
     */
    isNodeInModel(cyId, nodeId){
        let nodesArr = this.getModelNodesArr(cyId);

        for(let i = 0; i < nodesArr.length; i++){
            if(nodesArr[i].id == nodeId)
                return true;
        }

        return false;
    }

    /**
     * Tests if edge with edgeId is in the view with cyId
     * @param {Number} cyId
     * @param {string} edgeId
     * @returns {boolean}
     */
    isEdgeInModel(cyId, edgeId) {
        let edgesArr = this.getModelEdgesArr(cyId);

        for (let i = 0; i < edgesArr.length; i++) {
            if (edgesArr[i].id == edgeId)
                return true;
        }

        return false;
    }

    /**
     * Returns path to the edge with id in the view with cyId
     * @param {string} id
     * @param {Number} cyId
     * @returns {string}
     */
    getModelEdgePathStr(id, cyId){
        return 'documents.' + this.docId + '.cy.' + cyId +'.edges.' + id;
    }

    /**
     * Returns the edge with id in the view with cyId
     * @param {string} id
     * @param {Number} cyId
     * @returns {Object}
     */
    getModelEdge (id, cyId) {
        let edgePath = this.model.at(this.getModelEdgePathStr(id, cyId));
        return edgePath.get();
    }

    /**
     * Returns all the edges in the view with cyId as an array
     * @param {Number} cyId
     * @returns {Array}
     */
    getModelEdgesArr(cyId){
        let edges = this.model.get('documents.' + this.docId + '.cy.' + cyId +'.edges');
        let edgeArr = [];
        for(var att in edges){
            if(edges.hasOwnProperty(att))
                edgeArr.push(edges[att]);
        }

        return edgeArr;
    }

    /**
     * Highlights the cytoscape node with the color of the selecting user
     * @param {Object} node cytoscape node
     * @param {Number} cyId
     * @param {string} userId User who made the selection
     * @param {string} user parameter to test if the update comes from the same client
     * @returns {string} success or failure message
     */
    selectModelNode (node, cyId, userId, user) {

        let nodePathStr = this.getModelNodePathStr(node.id(), cyId);
        let nodePath = this.model.at(nodePathStr);
        if (nodePath.get() == null)
            return "Node id not found";

        let userPath = this.model.at('documents.' + this.docId + '.users.' + userId);

        this.model.pass({user: user}).set(nodePathStr + '.highlightColor', userPath.get('colorCode'));

        return "success"

    }


    /**
     * Highlights the cytoscape edge with the color of the selecting user
     * @param {Object} edge cytoscape edge
     * @param {Number} cyId
     * @param {string} userId User who made the selection
     * @param {string} user parameter to test if the update comes from the same client
     * @returns {string} success or failure message
     */
    selectModelEdge (edge, cyId, userId, user) {

        let edgePathStr = this.getModelEdgePathStr(edge.id(), cyId);
        let edgePath = this.model.at(edgePathStr);
        if (edgePath.get() == null)
            return "Edge id not found";
        let userPath = this.model.at('documents.' + this.docId + '.users.' + userId);
        this.model.pass({user: user}).set(edgePathStr + '.highlightColor', userPath.get('colorCode'));
        return "success";

    }

    /**
     * Removes the highlight of the cytoscape node
     * @param {Object} node cytoscape node
     * @param {Number} cyId
     * @param {string} user parameter to test if the update comes from the same client
     * @returns {string} success or failure message
     */
    unselectModelNode (node, cyId,  user) {

        let nodePathStr = this.getModelNodePathStr(node.id(), cyId);
        let nodePath = this.model.at(nodePathStr);

        if (nodePath.get() == null)
            return "Node id not found";

        this.model.pass({user: user}).set(nodePathStr + '.highlightColor', null);

        return "success";
    }

    /**
     * Removes the highlight of the cytoscape edge
     * @param {Object} edge cytoscape edge
     * @param {Number} cyId
     * @param {string} user parameter to test if the update comes from the same client
     * @returns {string} success or failure message
     */
    unselectModelEdge (edge,  cyId, user) {

        let edgePathStr = this.getModelEdgePathStr(edge.id(), cyId);
        let edgePath = this.model.at(edgePathStr);
        if (edgePath.get() == null)
            return "Edge id not found";

        this.model.pass({user: user}).set(edgePathStr + '.highlightColor', null);

        return "success";


    }

    /***
     *
     * Adds node with given attributes
     * @param {string} nodeId
     * @param {Number} cyId
     * @param {Object} param {position:, data:}
     * @param {string} user parameter to test if the update comes from the same client
     * @param {boolean} noHistUpdate whether this operation will be recorded in history
     * returns {string} success or failure message
     */

    addModelNode (nodeId, cyId, param, user, noHistUpdate) {
        let nodePathStr = this.getModelNodePathStr(nodeId, cyId);

        if (this.model.get(nodePathStr) != null)
            return "Node cannot be duplicated";

        this.model.pass({user: user}).set(nodePathStr + '.id', nodeId);
        this.model.pass({user: user}).set(nodePathStr + '.data.id', nodeId);
        this.model.pass({user: user}).set(nodePathStr + '.position', param.position);
        this.model.pass({user: user}).set(nodePathStr + '.data', param.data);

        //adding the node in cytoscape
        this.model.pass({user: user}).set(nodePathStr+ '.addedLater', true);



        if (!noHistUpdate)
        //We don't want all the attributes of the param to be printed
            this.updateHistory({
                opName: 'add',
                opTarget: 'element',
                elType: 'node',
                elId: nodeId,
                cyId: cyId,
                param: param

            });


        return "success";

    }

    /***
     *
     * Adds edge with given attributes
     * @param {string} edgeId
     * @param {Number} cyId
     * @param {Object} param {position:, data:}
     * @param {string} user parameter to test if the update comes from the same client
     * @param {boolean} noHistUpdate whether this operation will be recorded in history
     * returns {string} success or failure message
     */
    addModelEdge (edgeId, cyId, param, user, noHistUpdate) {

        let edgePathStr = this.getModelEdgePathStr(edgeId, cyId);
        if (this.model.get(edgePathStr) != null)
            return "Edge cannot be duplicated";

        this.model.pass({user: user}).set(edgePathStr+ '.data.id', edgeId);
        this.model.pass({user: user}).set(edgePathStr+ '.data', param.data);


        //adding the edge...other operations should be called after this
        this.model.pass({user: user}).set(edgePathStr + '.addedLater', true);


        if (!noHistUpdate)
            this.updateHistory({
                opName: 'add',
                opTarget: 'element',
                elType: 'edge',
                elId: edgeId,
                cyId: cyId,
                param: param

            });

        return "success";

    }

    /***
     * Adds a new compound with given attributes
     * @param {string} compoundId New compound's id
     * @param {Number} cyId
     * @param {Object} compoundAtts Attributes for new compound
     * @type {Object} compoundAtts Attributes for new compound
     * @property {string} compoundAtts.position
     * @property {string}compoundAtts.data
     * @param {Array} elList Children list
     * @property {string} elList[i].id
     * @property {string} elList[i].isNode
     * @param {Array} paramList Children's data attributes
     * @param {string} user Parameter to test if the update comes from the same client
     * @param {boolean} noHistUpdate Whether this operation will be recorded in history
     */

    addModelCompound (compoundId, cyId, compoundAtts, elList, paramList, user, noHistUpdate) {

        let prevParentList = [];
        paramList.forEach(function(param){
            // prevParentList.push(paramList.parent);
            prevParentList.push(param.parent);
        });

        this.addModelNode(compoundId, cyId, compoundAtts, user, true);

        this.changeModelElementGroupAttribute("data", elList, cyId, paramList,  user, true);



        if (!noHistUpdate)
            this.updateHistory({
                opName: 'add',
                opTarget: 'compound',
                elId: compoundId,
                cyId: cyId,
                param: {paramList: paramList, childrenList: elList, compoundAtts: compoundAtts},
                prevParam:  prevParentList //TODO
            });

    }


    /***
     * Removes compound and changes children's parents to their old parents
     * @param {string} compoundId  New compound's id
     * @param {Number} cyId
     * @param {Object} childrenList Children list as {id:, isNode:}
     * @param {Array} prevParentList Children's previous parents
     * @param {string} user Parameter to test if the update comes from the same client
     * @param {boolean} noHistUpdate Whether this operation will be recorded in history
     */

    removeModelCompound (compoundId, cyId, childrenList, prevParentList, user, noHistUpdate) {
        let self = this;

        let nodePath = this.model.at('documents.' + this.docId + '.cy.' + cyId + '.nodes.' + compoundId);

        let compoundAtts = {
            id: compoundId,
            class: nodePath.get('data.class'),
            x: nodePath.get('position.x'),
            y: nodePath.get('position.y')

        };

        let paramList = [];
        childrenList.forEach(function(child){
            let data = self.model.get(self.getModelNodePathStr(child.id, cyId));
            paramList.push(data);
        });

        //isolate the compound first, then delete
        this.changeModelElementGroupAttribute("data.parent", childrenList, cyId, prevParentList,   user, true);
        this.deleteModelNode(compoundId, cyId, user, true);

        if (!noHistUpdate)
            this.updateHistory({
                opName: 'delete',
                opTarget: 'compound',
                elId: compoundId,
                cyId: cyId,
                prevParam: {childrenList: childrenList, compoundAtts: compoundAtts, paramList: paramList},
                param: prevParentList
            });

    }


    /**
     *
     * @param {string} attStr Attribute name in the model
     * @param {Array} elList Nodes and/or edges to change attributes
     * @param cyId
     * @param {Array} paramList New parameter values
     * @param {string} user Parameter to test if the update comes from the same client
     * @param {boolean} noHistUpdate Whether this operation will be recorded in history
     * @returns {string}
     */
    changeModelElementGroupAttribute (attStr, elList, cyId, paramList,   user, noHistUpdate) { //historyData){
        let self = this;
        let prevParamList = [];

        if (!noHistUpdate) {

            elList.forEach(function (el) {

                let prevAttVal;
                if (el.isNode)
                    prevAttVal = self.model.get(self.getModelNodePathStr(el.id, cyId) + '.' + attStr);
                else
                    prevAttVal = self.model.get(self.getModelEdgePathStr(el.id, cyId) + '.' + attStr);


                prevParamList.push(prevAttVal);
            });


            this.updateHistory({
                opName: 'set',
                opTarget: 'element group',
                elId: elList,
                cyId: cyId,
                opAttr: attStr,
                param: paramList,
                prevParam: prevParamList
            });

        }

        let ind = 0;
        elList.forEach(function (el) {
            let currAttVal = paramList[ind++];

            if (el.isNode)
                self.changeModelNodeAttribute(attStr, el.id, cyId, currAttVal, user, true); //don't update individual histories
            else
                self.changeModelEdgeAttribute(attStr, el.id, cyId, currAttVal, user, true);

        });

        return "success";

    }

    /**
     * Returns the node's attribute value
     * @param {string} attStr
     * @param {string} nodeId
     * @param {Number} cyId
     * @returns {Object}
     */
    getModelNodeAttribute(attStr, nodeId, cyId){
        let nodePathStr = this.getModelNodePathStr(nodeId, cyId);
        let nodePath = this.model.at(nodePathStr);

        return nodePath.get(attStr);
    }

    /**
     * Returns the edge's attribute value
     * @param {string} attStr
     * @param {string} edgeId
     * @param {Number} cyId
     * @returns {Object}
     */
    getModelEdgeAttribute(attStr, edgeId, cyId){

        if(!this.isEdgeInModel(cyId, edgeId))
            return;

        let edgePathStr = this.getModelEdgePathStr(edgeId, cyId);
        let edgePath = this.model.at(edgePathStr);

        return edgePath.get(attStr);
    }

    /**
     * @param {string} attStr attribute name in the model
     * @param {string} nodeId
     * @param {Number} cyId
     * @param {Object} attVal new value to assign
     * @param {string} user parameter to test if the update comes from the same client
     * @param {boolean} noHistUpdate whether this operation will be recorded in history
     * @returns {string} success or failure
     */

    changeModelNodeAttribute (attStr, nodeId, cyId, attVal, user, noHistUpdate) {

        if(!this.isNodeInModel(cyId, nodeId))
            return;

        let nodePathStr = this.getModelNodePathStr(nodeId, cyId);
        let nodePath = this.model.at(nodePathStr);


        let prevAttVal = nodePath.get(attStr);

        if(attStr === "width") //as we read this directly from cy.data
            attStr = "borderWidth";


        nodePath.pass({user: user}).set(attStr, attVal);

        if (attStr == "expandCollapseStatus") {
            if (attVal == "expand")
                prevAttVal = "collapse";
            else //if null or collapse
                prevAttVal = "expand";
        }

        if (attStr != 'interactionCount') {
            this.model.increment(nodePathStr +  '.interactionCount', 1);

            if (!noHistUpdate) {

                this.updateHistory({
                    opName: 'set',
                    opTarget: 'element',
                    elType: 'node',
                    elId: nodeId,
                    cyId: cyId,
                    opAttr: attStr,
                    param: attVal,
                    prevParam: prevAttVal
                });
            }
        }

        return "success";

    }

    /**
     * @param {string} attStr attribute name in the model
     * @param {string} edgeId
     * @param {Number} cyId
     * @param {Object} attVal new value to assign
     * @param {string} user parameter to test if the update comes from the same client
     * @param {boolean} noHistUpdate whether this operation will be recorded in history
     * @returns {string} success or failure
     */
    changeModelEdgeAttribute (attStr, edgeId, cyId, attVal, user, noHistUpdate) {
        let edgePathStr = this.getModelEdgePathStr(edgeId, cyId);
        let edgePath = this.model.at(edgePathStr);
        let prevAttVal = edgePath.get(attStr);
        edgePath.pass({user: user}).set(attStr, attVal);


        let sourceId = edgePath.get('source');
        let targetId = edgePath.get('target');

        if (sourceId){
            let sourcePathStr = this.getModelNodePathStr(sourceId, cyId);
            this.model.increment(sourcePathStr +  '.interactionCount', 1);
        }

        if (targetId){
            let targetPathStr = this.getModelNodePathStr(targetId, cyId);
            this.model.increment(targetPathStr +  '.interactionCount', 1);
        }


        if (!noHistUpdate) {

            this.updateHistory({
                opName: 'set',
                opTarget: 'element',
                elType: 'edge',
                elId: edgeId,
                cyId: cyId,
                opAttr: attStr,
                param: attVal,
                prevParam: prevAttVal
            });

        }

        return "success";
    }


    /**
     * Delete node from the shared model
     * @param {string} nodeId Node id to delete
     * @param {Number} cyId Cy id to delete node from
     * @param {string} user parameter to test if the update comes from the same client
     * @param {boolean} noHistUpdate Whether this operation will be recorded in history
     * @returns {string} Success or failure

     */
    deleteModelNode (nodeId, cyId, user, noHistUpdate) {
        let nodePathStr = this.getModelNodePathStr(nodeId, cyId);
        let nodePath = this.model.at(nodePathStr);

        if (nodePath.get() == null)
            return "Node id not found";

        if (!noHistUpdate) {


            let prevParam = nodePath.get();


            this.updateHistory({
                opName: 'delete',
                opTarget: 'element',
                elType: 'node',
                elId: nodeId,
                cyId: cyId,
                prevParam: prevParam

            });

        }

        this.model.pass({user: user}).del(nodePathStr);

        return "success";

    }

    /**
     * Delete edge from the shared model
     * @param {string} edgeId  Edge id to delete
     * @param {Number} cyId Cy id to delete edge from
     * @param {string} user parameter to test if the update comes from the same client
     * @param {boolean} noHistUpdate Whether this operation will be recorded in history
     * @returns {string} Success or failure
     */
    deleteModelEdge (edgeId, cyId, user, noHistUpdate) {
        let edgePathStr = this.getModelEdgePathStr(edgeId, cyId);
        let edgePath = this.model.at(edgePathStr);
        if (edgePath.get() == null)
            return "Edge id not found";


        if (!noHistUpdate) {

            let prevParam = edgePath.get();

            this.updateHistory({
                opName: 'delete',
                opTarget: 'element',
                elType: 'edge',
                elId: edgeId,
                cyId: cyId,
                prevParam: prevParam
            });

        }

        this.model.pass({user: user}).del(edgePathStr);

        return "success";

    }


    /**
     * Delete the elements in selectedEles group
     * @param {Array} selectedEles
     * @param cyId
     * @param {string} user parameter to test if the update comes from the same client
     * @param {boolean} noHistUpdate Whether this operation will be recorded in history
     * @returns {string} Success or failure
     */
    deleteModelElementGroup (selectedEles, cyId, user, noHistUpdate) {
        let prevParamsNodes = [];
        let prevParamsEdges = [];
        let self = this;


        if(selectedEles.edges!= null){
            selectedEles.edges.forEach(function (edge) {
                let edgePathStr = self.getModelEdgePathStr(edge.id, cyId);
                let edgePath = self.model.at(edgePathStr);
                prevParamsEdges.push(edgePath.get());
            });


            selectedEles.edges.forEach(function (edge) {
                self.deleteModelEdge(edge.id, cyId, user, true); //will not update children history
            });
        }

        if(selectedEles.nodes!= null) {
            selectedEles.nodes.forEach(function (node) {
                let nodePathStr = self.getModelNodePathStr(node.id, cyId);
                let nodePath = self.model.at(nodePathStr);

                prevParamsNodes.push(nodePath.get());
            });


            selectedEles.nodes.forEach(function (node) {
                self.deleteModelNode(node.id, cyId, user, true); //will not update children history
            });
        }
        if (!noHistUpdate)
            this.updateHistory({
                opName: 'delete',
                opTarget: 'element group',
                elId: selectedEles,
                cyId: cyId,
                prevParam: {nodes: prevParamsNodes, edges: prevParamsEdges}
            });


    }

    /**
     * Restores the deleted elements into the shared model
     * @param {Array} elList Elements to restore
     * @param {Number} cyId
     * @param {Object} param
     * @param {string} user parameter to test if the update comes from the same client
     * @param {boolean} noHistUpdate Whether this operation will be recorded in history
     */
    restoreModelElementGroup (elList, cyId, param, user, noHistUpdate) {
        let self = this;
        //Restore nodes first


        for (let i = 0; i < elList.nodes.length; i++) {
            self.restoreModelNode(elList.nodes[i].id, cyId, param.nodes[i], user, noHistUpdate);
        }

        //restore edges later
        for (let i = 0; i < elList.edges.length; i++) {
            self.restoreModelEdge(elList.edges[i].id, cyId,  param.edges[i], user, noHistUpdate);
        }

        //change parents after adding them all
        for (let i = 0; i < elList.nodes.length; i++) {
            self.changeModelNodeAttribute('parent', elList.nodes[i].id, cyId, param.nodes[i].parent, null, noHistUpdate);
        }



        if (!noHistUpdate)
            self.updateHistory({
                opName: 'restore',
                opTarget: 'element group',
                elId: elList,
                cyId: cyId,
                param: param

            });
    }


    /**
     * Restores the deleted node into the shared model
     * @param {string} nodeId Node to restore
     * @param {Number} cyId
     * @param {Object} param Node data and position
     * @param {string} user parameter to test if the update comes from the same client
     * @param {boolean} noHistUpdate Whether this operation will be recorded in history
     */
    restoreModelNode (nodeId, cyId, param, user, noHistUpdate) {

        //param is the previous node data
        //history is updated as restore command
        this.addModelNode(nodeId, cyId, param, user, true);

        //No need to init -- data and position are updated in the next steps

        if (!noHistUpdate)
            this.updateHistory({opName: 'restore', opTarget: 'element', elType: 'node', elId: nodeId, cyId: cyId, param:param});
    }


    /**
     * Restores the deleted edge into the shared model
     * @param {string} edgeId Edge to restore
     * @param {Number} cyId
     * @param {Object} param Edge data
     * @param {string} user parameter to test if the update comes from the same client
     * @param {boolean} noHistUpdate Whether this operation will be recorded in history
     */
    restoreModelEdge (edgeId, cyId, param, user, noHistUpdate) {
        //param is the previous edge data
        //history is updated as restore command
        this.addModelEdge(edgeId, cyId, param, user, true);
        //No need to init -- data and position are updated in the next steps


        if (!noHistUpdate)
            this.updateHistory({opName: 'restore', opTarget: 'element', elType: 'edge', elId: edgeId, cyId: cyId, param:param});
    }


    /**
     * Restores the deleted element into the shared model
     * @param {string} elType "node" or "edge"
     * @param {string} elId Element to restore
     * @param {Number} cyId
     * @param {Object} param Element data
     * @param {string} user parameter to test if the update comes from the same client
     * @param {boolean} noHistUpdate Whether this operation will be recorded in history
     */
    restoreModelElement (elType, elId, cyId, param, user, noHistUpdate) {

        if (elType == "node")
            this.restoreModelNode(elId, cyId, param, user, noHistUpdate);
        else
            this.restoreModelEdge(elId, cyId, param, user, noHistUpdate);


    }


    /**
     * This function is used to undo newModel and redo initModel
     * @param {Object} modelCy : nodes and edges to be restored
     * @param {Number} cyId
     * @param {string} user parameter to test if the update comes from the same client
     * @param {boolean} noHistUpdate Whether this operation will be recorded in history
     */
    restoreModel (modelCy, cyId, user, noHistUpdate) {
        let cyPathStr = this.getModelCyPathStr(cyId);
        let prevParam = this.model.get(cyPathStr);
        this.model.pass({user: user}).set(cyPathStr , modelCy);


        // this.setSampleInd(-1, null, true); //to get a new container

        if (!noHistUpdate)
            this.updateHistory({opName: 'restore', prevParam: prevParam, param: modelCy, cyId: cyId, opTarget: 'model'});

    }


    /**
     * Deletes the model and everything in it
     * Should be called before loading a new graph to prevent id confusion
     * @param {Number} cyId
     * @param {string} user parameter to test if the update comes from the same client
     * @param {boolean} noHistUpdate Whether this operation will be recorded in history
     */
    newModel (cyId, user, noHistUpdate) {

        let self = this;
        let cyPathStr = this.getModelCyPathStr(cyId);
        let prevModelCy = this.model.get(cyPathStr);


        if (!noHistUpdate)
            this.updateHistory({opName: 'new', prevParam: prevModelCy, cyId: cyId, opTarget: 'model'});

        let edges = this.model.get(cyPathStr +'.edges');
        let nodes = this.model.get(cyPathStr +'.nodes');


        for (let att in edges) {
            if (edges.hasOwnProperty(att)) {
                self.deleteModelEdge(edges[att].id, cyId, user, true);
            }
        }

        for (let att in nodes) {
            if (nodes.hasOwnProperty(att)) {
                self.deleteModelNode(nodes[att].id, cyId, user, true);
            }
        }

        this.model.pass({user: user}).del('documents.' + this.docId + '.cy.' + cyId +'.edges');
        this.model.pass({user: user}).del('documents.' + this.docId + '.cy.' + cyId +'.nodes');

    }



    /**
     * Cleans up the model without deleting the model itself
     * should be called before loading a new graph to prevent id confusion
     * @param {Array} nodes Nodes to delete
     * @param {Array} edges Edges to delete
     * @param {Number} cyId
     * @param {string} user parameter to test if the update comes from the same client
     * @param {boolean} noHistUpdate Whether this operation will be recorded in history
     */
    deleteAll (nodes, edges, cyId, user, noHistUpdate) {

        let self = this;
        if (!noHistUpdate)
            this.updateHistory({opName: 'new', cyId: cyId, opTarget: 'model'});


        edges.forEach(function (edge) {
            self.deleteModelEdge(edge.id(), cyId,  user, noHistUpdate);
        });

        nodes.forEach(function (node) {
            self.deleteModelNode(node.id(), cyId, user, noHistUpdate);
        });

    }


    /**
     * Returns the model nodes and edges as a json object
     * @param {Number} cyId Newt tab id
     * @returns {Object} Model as a json object of nodes and edges
     */
    getJsonFromModel (cyId) {

        let cyPathStr = this.getModelCyPathStr(cyId);
        let nodes = this.model.get(cyPathStr +'.nodes');

        if (nodes == null)
            return null;

        let edges = this.model.get(cyPathStr +'.edges');

        let jsonNodes = [];
        let jsonEdges = [];


        for (let att in nodes) {

            if (nodes.hasOwnProperty(att)) {
                let node = nodes[att];
                let jsonNode = {
                    data: node.data
                };

                jsonNodes.push(jsonNode);
            }
        }

        for (let att in edges) {
            if (edges.hasOwnProperty(att)) {
                let edge = edges[att];

                let jsonEdge = {
                    data: edge.data
                };

                jsonEdges.push(jsonEdge);
            }
        }

        return {nodes: jsonNodes, edges: jsonEdges};
    }

    /***
     * Takes a cytoscape node and loads it into the model
     * @param {Object} node Cytoscape node
     * @param {Number} cyId
     * @param {string} user Parameter to test if the update comes from the same client
     * @param {boolean} noHistUpdate Whether this operation will be recorded in history
     */
    initModelNode (node, cyId, user, noHistUpdate) {

        let nodePathStr = this.getModelNodePathStr(node.id(), cyId);
        let nodePath = this.model.at(nodePathStr);

        if (!noHistUpdate)
            this.updateHistory({opName: 'init', opTarget: 'element', elType: 'node', elId: node.id(), cyId: cyId});


        nodePath.set('id', node.id());

        // node._private.data.annotationsView = null;

        let interactionCount = nodePath.get('interactionCount');

        if (interactionCount == null) //this is not stored in cy
            this.changeModelNodeAttribute('interactionCount', node.id(), cyId,  0, user, true); //don't update history

        let data = nodePath.get('data');
        //bbox is a random data parameter to make sure all data parts are already in the model
        //if the only data parameters are id and class, it means it has just been added without initialization
        if (data != null && data.bbox!=null) //it means data has been added before
            node.data(data);

        else {
            //correct the labels from PC queries
            let nodeData = node.data();
            if(nodeData == null)
                nodeData = node._private.data;


            nodeData.annotationsView = null;

            // nodeData.auxunitlayouts = null;
            // This line was causing the auxiliary units being
            // hidden, so not being rendered, when they come from
            // display sbgnviz (it was goning back to normal after page refresh)
            // Commenting out this line looks to solve that bug and looks safe to me
            // for now. Looks like ``nodeData.auxunitlayouts`` is a json serializable
            // object. TODO: revise this if a related problem occurs in a way.
            // nodeData.auxunitlayouts = null;

            if(nodeData.statesandinfos) {

                for (let i = 0; i < nodeData.statesandinfos.length; i++) {

                    if (nodeData.statesandinfos[i].clazz === "state letiable") {
                        if (nodeData.statesandinfos[i].state.value === "opthr") {
                            nodeData.statesandinfos[i].state.value = "p";
                            nodeData.statesandinfos[i].state.letiable = "T" + nodeData.statesandinfos[i].state.letiable;
                        }
                        else if (nodeData.statesandinfos[i].state.value === "opser") {
                            nodeData.statesandinfos[i].state.value = "p";
                            nodeData.statesandinfos[i].state.letiable = "S" + nodeData.statesandinfos[i].state.letiable;
                        }
                        else if (nodeData.statesandinfos[i].state.value === "optyr") {
                            nodeData.statesandinfos[i].state.value = "p";
                            nodeData.statesandinfos[i].state.letiable = "Y" + nodeData.statesandinfos[i].state.letiable;
                        }
                    }

                }
                node._private.data.statesandinfos = nodeData.statesandinfos;
            }
            this.changeModelNodeAttribute('data', node.id(), cyId, nodeData, user, noHistUpdate);
        }

        //make this initially unselected
        //    nodePath.set('highlightColor', null);


        let pos = nodePath.get('position');

        if (pos != null)
            node.position(pos);

        else {
            let nodePosition = node.position();
            if(nodePosition == null)
                nodePosition = node._private.position;
            this.changeModelNodeAttribute('position', node.id(), cyId, nodePosition, user, noHistUpdate);
        }

        //Initializing css properties causes bypass problems!!

    }

    /**
     * Takes a cytoscape edge and loads it into the model
     * @param {Object} edge Cytoscape edge
     * @param {Number} cyId
     * @param {string} user Parameter to test if the update comes from the same client
     * @param {boolean} noHistUpdate Whether this operation will be recorded in history
     */
    initModelEdge (edge, cyId, user, noHistUpdate) {
        let edgePathStr = this.getModelEdgePathStr(edge.id(), cyId);
        let edgePath = this.model.at(edgePathStr);

        if (!noHistUpdate)
            this.updateHistory({opName: 'init', opTarget: 'element', elType: 'edge', elId: edge.id(), cyId: cyId});

        edgePath.set('id', edge.id());



        //make this initially unselected
        //edgePath.set('highlightColor', null);

        let data = edgePath.get('data');
        //cardinality is a random data parameter to make sure all data parts are already in the model
        //if the only data parameters are id and class, it means it has just been added without initialization
        if (data != null && data.cardinality != null)
            edge.data(data);

        else {


            let edgeData = edge.data();
            if(edgeData == null)
                edgeData = edge._private.data;


            edgeData.annotationsView = null;
            //This is a workaround to handle (.) dots in mongo
            if(edgeData.siteLocSet){ //dots in Pathway Commons links are causing problems
                edgeData.siteLocSet = JSON.stringify(edgeData.siteLocSet);
            }
            if(edgeData.pcIDSet){ //same workaround
                edgeData.pcIDSet = JSON.stringify(edgeData.pcIDSet);

            }


            this.changeModelEdgeAttribute('data', edge.id(), cyId, edgeData, user, noHistUpdate);
        }

    }

    /***
     * Initializes the model with cytoscape elements
     * @param {Array} nodes cy elements
     * @param {Array} edges cy elements
     * @param {Number} cyId
     * @param {string} user Parameter to test if the update comes from the same client
     * @param {boolean} noHistUpdate Whether this operation will be recorded in history
     */
    initModel ( nodes, edges, cyId, user, noHistUpdate) {

        console.log("inited");

        nodes.forEach( (node) => {
            this.initModelNode(node, cyId, user, true);
        });

        edges.forEach( (edge) => {
            this.initModelEdge(edge, cyId, user, true);
        });


        let newModelCy = this.model.get('documents.' + this.docId + '.cy.' + cyId );

        if (!noHistUpdate) {
            this.updateHistory({opName: 'init', cyId: cyId, param: newModelCy, opTarget: 'model'});
        }

        console.log("Init model finished");
        //notifies other clients to update their cy graphs
        let cyPathStr = this.getModelCyPathStr(cyId);
        this.model.pass({user:"me"}).set(cyPathStr +'.initTime', new Date());

    }

    /**
     * Saves the current model as prevCy
     * @param {Number} cyId
     */
    setRollbackPoint (cyId) {
        let modelCy = this.getModelCy(cyId);
        this.model.set('documents.' + this.docId + '.prevCy.' + cyId, modelCy);
    }

    /**
     * Retuns the model cytoscape json
     * @param {Number} cyId
     * @returns {Object}
     */
    getModelCy (cyId) {
        let cyPathStr = this.getModelCyPathStr(cyId);
        return this.model.get(cyPathStr);
    }


    /**
     * This is used for undo/redo purposes only
     * @param {Number} cyId
     * @param {string} user Parameter to test if the update comes from the same client
     * @param {boolean} noHistUpdate Whether this operation will be recorded in history
     */
    mergeJsons (cyId, user, noHistUpdate) {
        let cyPathStr = this.getModelCyPathStr(cyId);
        let modelCy = this.model.get(cyPathStr);
        let prevModelCy = this.model.get('documents.' + this.docId + '.prevCy.' + cyId); //updated at rollback point

        if (!noHistUpdate) {
            this.updateHistory({opName: 'merge', cyId: cyId, prevParam: prevModelCy, param: modelCy, opTarget: 'model'});
        }

    }

    /**
     * Assigns genes to a cellular location
     * @param {Array} genes Gene names
     * @param {string} location Cellular location such as "nucleus"
     * @param {string} user Parameter to test if the update comes from the same client
     * @param {boolean} noHistUpdate Whether this operation will be recorded in history
     */
    addModelCellularLocation(genes, location, user, noHistUpdate) {

        let prevModelCellularLocationGenes = this.model.get('documents.' + this.docId +'.cellularLocations.'+ location);

        this.model.pass({user:user}).set('documents.' + this.docId +'.cellularLocations.'+ location, genes);

        if (!noHistUpdate) {
            this.updateHistory({opName: 'addCellularLocation', param: {location: location, genes: genes}, prevParam: {location:location, genes:prevModelCellularLocationGenes}, opTarget: 'model'});
        }
    }

    /**
     * Removes the cellular location and anything associated with it
     * @param {string} location Cellular location such as "nucleus"
     * @param {string} user Parameter to test if the update comes from the same client
     * @param {boolean} noHistUpdate Whether this operation will be recorded in history
     */
    removeModelCellularLocation(location, user, noHistUpdate) {
        this.model.pass({user:user}).remove('documents.' + this.docId +'.cellularLocations', location);

        if (!noHistUpdate) {
            this.updateHistory({opName: 'removeCellularLocation', param: null, prevParam: location, opTarget: 'model'});
        }

    }

    /**
     * Remove gene names from cellular location
     * @param {Array} genes Gene names
     * @param {string} location Cellular location such as "nucleus"
     * @param {string} user  Parameter to test if the update comes from the same client
     * @param {boolean} noHistUpdate Whether this operation will be recorded in history
     */
    removeNodesFromCellularLocation(genes, location, user, noHistUpdate){
        let modelGenes = this.model.get('documents.' + this.docId +'.cellularLocations.' + location);


        let filteredGenes = modelGenes.filter(function(val){
           return genes.indexOf(val) < 0
        });

        //reassign genes
        this.model.pass({user:user}).set('documents.' + this.docId +'.cellularLocations.' + location, filteredGenes);


        if (!noHistUpdate) {
            this.updateHistory({opName: 'removeNodesFromCellularLocation', param: {location:location, genes: filteredGenes}, prevParam: {location:location, genes: modelGenes}, opTarget: 'model'});
        }
    }

}

module.exports = ModelManager;

/**
 * Local function that returns a random hexadecimal color value
 * @returns {string} hexadecimal color code
 */
function getNewColor(){
    let oneColor = require('onecolor');

    let gR = 1.618033988749895; //golden ratio
    let h = Math.floor((Math.random() * gR * 360));//Math.floor((cInd * gR - Math.floor(cInd * gR))*360);
    let cHsl = [h, 70 + Math.random() * 30, 60 + Math.random() * 10];
    let strHsl = 'hsl('+cHsl[0]  +', '+ cHsl[1] + '%, ' + cHsl[2] +'%)';

    return oneColor(strHsl).hex();
}
