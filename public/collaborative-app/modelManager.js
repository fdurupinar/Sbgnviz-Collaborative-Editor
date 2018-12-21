/*
 *	Shared model handling operations.
 *  Clients call these commands to update the model
 *  Each room (docId) has one modelManager associated with it
 *	Author: Funda Durupinar Babur<f.durupinar@gmail.com>
 */

const Promise = require('bluebird');


class ModelManager{

    constructor(model, docId){
        this.model = model;
        this.docId = docId;
    }

    getModel() {
        return this.model;
    }

    getPageDoc(){
        return this.model.get('documents.' + this.docId);
    }



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

    getImages(){
        return this.model.get('documents.' + this.docId + '.images');
    }

    setName (userId, userName) {
        this.model.set('documents.' + this.docId + '.users.' + userId +'.name', userName);
    }

    getName (userId) {
        return this.model.get('documents.' + this.docId + '.users.' + userId + '.name');
    }

    /***
     *
     * @param id of the user we want to change color of
     * @param color
     */
    setColorCode(id, color){
        this.model.set('documents.' + this.docId + '.users.' + id +'.colorCode', color);
    }

    changeColorCode(id){
        this.model.set('documents.' + this.docId + '.users.' + id +'.colorCode', getNewColor());
    }

    getMessages(){
        return this.model.get('documents.' + this.docId + '.messages');
    }

    /***
     * User information for current and previous users
     * No need to be active users
     * @param userId
     */
    getUserId(userId){
        return this.model.get('documents.' + this.docId + '.users.' + userId);
    }


    /***
     * Active users on the document
     */
    getUserIds(){
        return this.model.get('documents.' + this.docId + '.userIds');
    }

    /***
     * Add an active userId to the document and update 'users' info
     * @param userId
     * @param userName
     * @param colorCode
     */
    addUser(userId, userName, colorCode){
        let userIds = this.model.get('documents.' + this.docId + '.userIds');

        if(!userIds || userIds.indexOf(userId) < 0) //user not in the list
            this.model.at('documents.' + this.docId + '.userIds').push(userId);


        let usersPath = this.model.at('documents.' + this.docId + '.users');

        if(!usersPath.get(userId)){
            if(!userName) {
                let userCnt = this.getUserIds().length;
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
            this.setColorCode(userId, colorCode);
        }
    }

    deleteAllUsers(){
        let self = this;
        let userIds = this.model.get('documents.' + this.docId + '.userIds');
        for(let i = userIds.length - 1; i>=0; i--){
            self.deleteUserId(userIds[i]);
        }
    }

    deleteUserId(userId){
        let self = this;

        let userIds = this.model.get('documents.' + this.docId + '.userIds');
        for(let i = 0; i < userIds.length; i++){
            if(userIds[i] === userId ){
                self.model.remove('documents.' + self.docId + '.userIds', i) ; //remove from the index
            }
        }
    }

    setLayoutProperties(properties){
        this.model.set('documents.' + this.docId + '.layoutProperties', properties);
    }

    getLayoutProperties(){
        return this.model.get('documents.' + this.docId + '.layoutProperties');
    }

    updateFactoidModel(factoidModel, user, noHistUpdate){
        this.model.pass({user:user}).set('documents.' + this.docId + '.factoid', factoidModel);

        if(!noHistUpdate){
            let prevFactoidModel = this.model.get('documents.' + this.docId + '.factoid');
            this.updateHistory({opName:'factoid',  prevParam: prevFactoidModel, param: factoidModel, opTarget:'model'});
        }

    }

    getFactoidModel(){
        return this.model.get('documents.' + this.docId + '.factoid');
    }

    /***
     *
     * @param cmd  {opName, opTarget,  elType, elId, opAttr,param, prevParam}
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

    getLastCommandName(){
        let undoIndex = this.model.get('documents.' + this.docId + '.undoIndex');
        let cmd = this.model.get('documents.' + this.docId + '.history.' + undoIndex);

        return cmd.opName;
    }


    printHistory(){
        console.log("HISTORY:");
        let hist = this.model.get('documents.' + this.docId + '.history');
        for(let i = 0 ; i <hist.length;i++)
            console.log(i + " " + hist[i].opName);
    }


    isUndoPossible() {
        return (this.model.get('documents.' + this.docId + '.undoIndex') > 0)
    }

    isRedoPossible() {
        return (this.model.get('documents.' + this.docId + '.undoIndex') + 1 < this.model.get('documents.' + this.docId + '.history').length)
    }

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


    openCy(cyId, user){ //to notify other users that a new tab has been opened
        let cyPathStr = this.getModelCyPathStr(cyId);
        // this.model.pass({user: user}).set('documents.' + this.docId + '.newCy', cyId); //let others know
        this.model.pass({user:user}).set(cyPathStr + '.cyId', cyId);
    }

    //Does not remove the cy, only lets other users that cy is closed
    closeCy(cyId, user, noHistUpdate){
        let cyPathStr = this.getModelCyPathStr(cyId);

        let prevParam = this.model.get(cyPathStr); //because cy indices are integers, cy path is recognized as an array
        // this.model.pass({user:user}).remove('documents.' + this.docId + '.cy', cyId);
        // this.model.pass({user:user}).del(cyPathStr);

        // this.model.pass({user:user}).set(cyPathStr, null);

        // notify other users that a new tab has been closed
        this.model.pass({user: user}).set('documents.' + this.docId + '.closedCy', cyId);

        if (!noHistUpdate)
            this.updateHistory({opName: 'delete', prevParam: prevParam, param: null, cyId: cyId, opTarget: 'model'});
    }


    getCyIds(){
        let cyList = this.model.get('documents.' + this.docId + '.cy');
        let cyIds = [];
        for(var att in cyList){
            if(cyList.hasOwnProperty(att))
                cyIds.push(att);
        }

        return cyIds;
    }

    getModelCyPathStr(cyId){
        return 'documents.' + this.docId + '.cy.' + cyId ;
    }

    getModelNodePathStr(id, cyId){
        return 'documents.' + this.docId + '.cy.' + cyId +'.nodes.' + id;
    }

    getModelNode(id, cyId) {
        let nodePath = this.model.at(this.getModelNodePathStr(id, cyId));
        return nodePath.get();
    }

    getModelNodesArr(cyId){
        let nodes = this.model.get('documents.' + this.docId + '.cy.' + cyId + '.nodes');
        let nodeArr = [];
        for(var att in nodes){
            if(nodes.hasOwnProperty(att))
                nodeArr.push(nodes[att]);
        }

        return nodeArr;
    }


    getModelEdgePathStr(id, cyId){
        return 'documents.' + this.docId + '.cy.' + cyId +'.edges.' + id;
    }

    getModelEdge (id, cyId) {
        let edgePath = this.model.at(this.getModelEdgePathStr(id, cyId));
        return edgePath.get();
    }


    getModelEdgesArr(cyId){
        let edges = this.model.get('documents.' + this.docId + '.cy.' + cyId +'.edges');
        let edgeArr = [];
        for(var att in edges){
            if(edges.hasOwnProperty(att))
                edgeArr.push(edges[att]);
        }

        return edgeArr;
    }
    selectModelNode (node, cyId, userId, user,  noHistUpdate) {

        let nodePathStr = this.getModelNodePathStr(node.id(), cyId);
        let nodePath = this.model.at(nodePathStr);
        if (nodePath.get() == null)
            return "Node id not found";


        let userPath = this.model.at('documents.' + this.docId + '.users.' + userId);



        this.model.pass({user: user}).set(nodePathStr + '.highlightColor', userPath.get('colorCode'));


        return "success";

    }


    selectModelEdge (edge, cyId, userId, user,  noHistUpdate) {

        let edgePathStr = this.getModelEdgePathStr(edge.id(), cyId);
        let edgePath = this.model.at(edgePathStr);
        if (edgePath.get() == null)
            return "Edge id not found";
        let userPath = this.model.at('documents.' + this.docId + '.users.' + userId);
        this.model.pass({user: user}).set(edgePathStr + '.highlightColor', userPath.get('colorCode'));
        return "success";

    }

    unselectModelNode (node, cyId,  user, noHistUpdate) {

        let nodePathStr = this.getModelNodePathStr(node.id(), cyId);
        let nodePath = this.model.at(nodePathStr);


        if (nodePath.get() == null)
            return "Node id not found";

        this.model.pass({user: user}).set(nodePathStr + '.highlightColor', null);

        return "success";

    }


    unselectModelEdge (edge,  cyId, user, noHistUpdate) {

        let edgePathStr = this.getModelEdgePathStr(edge.id(), cyId);
        let edgePath = this.model.at(edgePathStr);
        if (edgePath.get() == null)
            return "Edge id not found";

        this.model.pass({user: user}).set(edgePathStr + '.highlightColor', null);

        return "success";


    }

    /***
     *
     * @param nodeId
     * @param param {position:, data:}
     * @param user
     * @param noHistUpdate
     * @returns {*}
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
     * @param edgeId
     * @param param: {data:}
     * @param user
     * @param noHistUpdate
     * @returns {*}
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
     *
     * @param compoundId : new compound's id
     * @param compoundAtts: new compounds id, size, sbgnclass, position
     * @param childrenList: in the format {id:, isNode} for do/undo
     * @param prevParentList: children's old parents
     * @param user
     * @param noHistUpdate
     */
    addModelCompound (compoundId, cyId, compoundAtts, elList, paramList, user, noHistUpdate) {


        let prevParentList = [];
        paramList.forEach(function(param){
            prevParentList.push(paramList.parent);
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

    //change children's parents to their old parents
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



    //attStr: attribute namein the model
    //historyData is for  sbgnStatesAndInfos only
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

    getModelNodeAttribute(attStr, nodeId, cyId){
        let nodePathStr = this.getModelNodePathStr(nodeId, cyId);
        let nodePath = this.model.at(nodePathStr);

        return nodePath.get(attStr);
    }

    getModelEdgeAttribute(attStr, edgeId, cyId){
        let edgePathStr = this.getModelEdgePathStr(edgeId, cyId);
        let edgePath = this.model.at(edgePathStr);

        return edgePath.get(attStr);
    }
    //attStr: attribute namein the model
    //historyData is for  sbgnStatesAndInfos only
    changeModelNodeAttribute (attStr, nodeId, cyId, attVal, user, noHistUpdate) { //historyData){

        let nodePathStr = this.getModelNodePathStr(nodeId, cyId);
        let nodePath = this.model.at(nodePathStr);


        let prevAttVal = nodePath.get(attStr);


        if(attStr === "width") //as we read this directly from cy.data
            attStr = "borderWidth";


        nodePath.pass({user: user}).set(attStr, attVal);

        // let st = nodePath.get('data.statesandinfos');
        //
        // if(st)
        // console.log(st);
        //
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

    //willUpdateHistory: Depending on the parent command, history will be updated or not
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
     *
     * Restore operations for global undo/redo
     */
    restoreModelNode (nodeId, cyId, param, user, noHistUpdate) {

        //param is the previous node data
        //history is updated as restore command
        this.addModelNode(nodeId, cyId, param, user, true);

        //No need to init -- data and position are updated in the next steps

        if (!noHistUpdate)
            this.updateHistory({opName: 'restore', opTarget: 'element', elType: 'node', elId: nodeId, cyId: cyId, param:param});
    }


    restoreModelEdge (edgeId, cyId, param, user, noHistUpdate) {
        //param is the previous edge data
        //history is updated as restore command
        this.addModelEdge(edgeId, cyId, param, user, true);
        //No need to init -- data and position are updated in the next steps


        if (!noHistUpdate)
            this.updateHistory({opName: 'restore', opTarget: 'element', elType: 'edge', elId: edgeId, cyId: cyId, param:param});
    }


    restoreModelElement (elType, elId, cyId, param, user, noHistUpdate) {

        if (elType == "node")
            this.restoreModelNode(elId, cyId, param, user, noHistUpdate);
        else
            this.restoreModelEdge(elId, cyId, param, user, noHistUpdate);


    }


    /**
     * This function is used to undo newModel and redo initModel
     * @param modelCy : nodes and edges to be restored
     * @param user
     * @param noHistUpdate
     */
    restoreModel (modelCy, cyId, user, noHistUpdate) {
        let cyPathStr = this.getModelCyPathStr(cyId);
        let prevParam = this.model.get(cyPathStr);
        this.model.pass({user: user}).set(cyPathStr , modelCy);


        // this.setSampleInd(-1, null, true); //to get a new container

        if (!noHistUpdate)
            this.updateHistory({opName: 'restore', prevParam: prevParam, param: modelCy, cyId: cyId, opTarget: 'model'});

    }

    //should be called before loading a new graph to prevent id confusion
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


    }


    //should be called before loading a new graph to prevent id confusion
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

    //convert model to array
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
     *
     * @param node: Cytoscape node
     * @param user: to make sure we don't update the data of same client
     * @param noHistUpdate
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

    initModelEdge (edge, cyId, user, noHistUpdate) {
        let edgePathStr = this.getModelEdgePathStr(edge.id(), cyId);
        let edgePath = this.model.at(edgePathStr);

        if (!noHistUpdate)
            this.updateHistory({opName: 'init', opTarget: 'element', elType: 'edge', elId: edge.id(), cyId: cyId});

        edgePath.set('id', edge.id());

        // edge._private.data.annotationsView = null;

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


            //This is a workaround to handle (.) dots in mongo
            if(edgeData.siteLocSet){ //dots in Pathway Commons links are causing problems
                edgeData.siteLocSet = JSON.stringify(edgeData.siteLocSet);
            }

            this.changeModelEdgeAttribute('data', edge.id(), cyId, edgeData, user, noHistUpdate);
        }

    }

    /***
     *
     * @param nodes: cy elements
     * @param edges: cy elements
     * @param appUtilities: to update properties
     * @param user
     * @param noHistUpdate
     */
    initModel ( nodes, edges, cyId, appUtilities, user, noHistUpdate) {

        let self = this;

        console.log("inited");

        nodes.forEach(function (node) {
            self.initModelNode(node, cyId, user, true);
        });

        edges.forEach(function (edge) {
            self.initModelEdge(edge, cyId, user, true);
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



    setRollbackPoint (cyId) {
        let modelCy = this.getModelCy(cyId);
        this.model.set('documents.' + this.docId + '.prevCy.' + cyId, modelCy);
    }

    getModelCy (cyId) {
        let cyPathStr = this.getModelCyPathStr(cyId);
        return this.model.get(cyPathStr);
    }

    //for undo/redo only
    mergeJsons (cyId, user, noHistUpdate) {
        let cyPathStr = this.getModelCyPathStr(cyId);
        let modelCy = this.model.get(cyPathStr);
        let prevModelCy = this.model.get('documents.' + this.docId + '.prevCy.' + cyId); //updated at rollback point

        if (!noHistUpdate) {

            this.updateHistory({opName: 'merge', cyId: cyId, prevParam: prevModelCy, param: modelCy, opTarget: 'model'});
        }

    }

    addModelCellularLocation(genes, location, user, noHistUpdate) {

        this.model.pass({user:user}).set('documents.' + this.docId +'.cellularLocations.'+ location, genes);
    }

    removeModelCellularLocation(location, user, noHistUpdate) {
        this.model.pass({user:user}).remove('documents.' + this.docId +'.cellularLocations', location);

    }

}

module.exports = ModelManager;

function getNewColor(){
    let oneColor = require('onecolor');

    let gR = 1.618033988749895; //golden ratio
    let h = Math.floor((Math.random() * gR * 360));//Math.floor((cInd * gR - Math.floor(cInd * gR))*360);
    let cHsl = [h, 70 + Math.random() * 30, 60 + Math.random() * 10];
    let strHsl = 'hsl('+cHsl[0]  +', '+ cHsl[1] + '%, ' + cHsl[2] +'%)';

    return oneColor(strHsl).hex();
}
