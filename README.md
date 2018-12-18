<<<<<<< HEAD
SBGNViz Collaborative Editor User Guide
=======================================

The editor allows human curators and computer agents to work on the same
pathway model, and communicate through text and images. On the server
side, we have an application server that keeps the model, handles
communication across clients, and performs operational transformation.
Model visualization and editing are handled on the client side. The
editor visualizes information about cellular processes and pathways in
SBGN (Systems Biology Graphical Notation) format. It allows for
automatic graph layout, editing and highlighting facilities.

Installation
------------

### Install dependencies on Debian/Ubuntu

Install node.js and mongodb servers first.

Node:

```
curl -sL https://deb.nodesource.com/setup_0.12 | sudo -E bash - <br />
sudo apt-get install -y nodejs <br />
```

Mongo:
```
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com/ --recv EA312927 <br />
echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list <br />
sudo apt-get update <br />
sudo apt-get install -y mongodb-org <br />
```
If mongo does not work:
```
sudo apt-get install upstart-sysv
```

### Install dependencies on Mac

```
brew install node
brew install tcl-tk
brew install mongodb
brew install nodejs
```

### Clone from github and install node modules
```
https://github.com/fdurupinar/Sbgnviz-Collaborative-Editor.git
cd Sbgnviz-Collaborative-Editor
npm install
```

```
Running the server
------------------
```
node server
```
  ```

In order to open a client enter `http://localhost:3000` in the address bar of your browser.

Computer Agent API
------------------

Computer agents are connected to the node.js http server via websockets
(socket.io.js). An agent is initialized with a *name (string)* and a
unique *ID (string).*

**Constructor**: Agent (string name, string id)

### Public Attributes:

- **agentId**: (string) A unique id
- **agentName**: (string) Agent name
- **colorCode**: A specific color to identify the agent operations. It
should be a string in hsla format as: “hsla(*H*, *S*, *L*%, 1)”, where
*H (integer)*, *S (float)* and *L (float)* are hue, saturation and
lightness values.
- **selectedNode**: The node object on which the agent is performing
operations. It has attributes such as position
{x:< posX >,y:< posY >}, width, height, borderWidth,
borderHeight, backgroundColor, sbgnLabel, sbgnStatesAndInfos =
{clazz:< className >, state =
{value:< stateValue >,variable:< stateVariable >}}.
- **selectedEdge**: The edge object on which the agent is performing
operations. It has attributes such as cardinality, lineColor and width.
- **opHistory**: History of operations as an array of strings in the
format: “*UserName* (*date*): *Command*”.
- **chatHistory**: Chat history as an array of messages.
- **userList**: List of connected user ids.

### Private Attributes:

- **room**: The document id that identifies the shared model. It is the
string after http:<ip>:3000/ in the server address.
- **socket**: The web socket between the server and agent
- **pageDoc**: The document that the shared model is stored.


#### Requests to send to the server:


 **reqName**                          |  **param**                                                                         |
| ----------------------------------- | ---------------------------------------------------- |
| “agentSendImageRequest”              | {room:< room >, userId:< agentId >, img: < image file >,                         |
|                                     | fileName < name of image file >, tabIndex: < index or id of the tab to display image >, tabLabel:< Label of tab to be displayed >}             |
| "agentSetLayoutPropertiesRequest"   | {room:< room >, userId:< agentId >,name: < layout name >,                       |
|                                     | nodeRepulsion: < node repulsion value > ,        |
|                                     | nodeOverlap:< node overlap percentage >,          |
|                                     | idealEdgeLength:< ideal edge length value >,      |
|                                     | edgeElasticity:< edge elasticity value >,    |
|                                     | nestingFactor:< nesting factor value >,      |
|                                     | gravity:< gravity value >,   |
|                                     | numIter:< number of iterations >,|
|                                     | tile:< boolean value to tile disconnected >,|
|                                     | animate:< boolean value >,    |
|                                     | randomize:< boolean value >}  |
|"agentSetGeneralPropertiesRequest"  | {room:< room >, userId:< agentId >} |
|"agentSetGridPropertiesRequest"  | {room:< room >, userId:< agentId >} |
|  “agentRunLayoutRequest”            | {room:< room >, userId:< agentId >}                          |
|  “agentAddNodeRequest”              | {room:< room >, userId:< agentId >,{{position: x: < position x >,           |
|                                     | y: < position y >}, data:{         |
|                                     | class: < sbgn class >}}   |
|  “agentAddEdgeRequest”              | {room:< room >, userId:< agentId >, {data:{source: < source node id >,  |
|                                     | target: < target node id >,   |
|                                     | class: < sbgn class >}}}    |
|"agentSearchByLabelRequest"          | {room:< room >, userId:< agentId >,label: < label to be highlighted>}   |
|"agentDeleteElesRequest"             | {room:< room >, userId:< agentId >,type: < "smart" or "simple" > elementIds: < element ids to delete simply >} |
|"agentUpdateVisibilityStatusRequest"       | {room:< room >, userId:< agentId >,val:< "hide" or "show" or "showAll" >,  elementIds:< array of element ids or null for showAll >|
|"agentUpdateHighlightStatusRequest"       | {room:< room >, userId:< agentId >,val:< "neighbors" or "processes" or "remove">,  elementIds:< array of element ids or null for remove >|
|"agentUpdateExpandCollapseStatusRequest"       | {room:< room >, userId:< agentId >,val:< "expand" or "collapse" >,  elementIds:<array of element ids>|
| “agentChangeNodeAttributeRequest”  | {room:< room >, userId:< agentId >,id: < node id >,             |
|                                     | attStr: < node attribute name in the model >             |
|                                     | attVal:< node attribute value >}                          |
|                                     | attStr takes the following values: “data”, “data.bbox”, “data.bbox.w”, “data.bbox.h”, “data.class”, “data.cloneMarker”, "data.font-family", "data.font-size", "data.font-weight", "data.font-style", "data.statesandinfos", "data.label", "data.labelsize", "data.parent", "data.ports", "data.border-width", "data.background-color", "data.background-opacity", "highlightColor, expandCollapseStatus", "highlightStatus", "visibilityStatus"   |
|  “agentChangeEdgeAttributeRequest”  | {room:< room >, userId:< agentId >,id: < node id >,                                   |
|                                     | attStr: < edge attribute name in the model >        |
|                                     | attVal:< edge attribute value >}                     |
|                                     | attStr takes the following values: “data.source”, “data.target”, “data.portsource”, “data.porttarget”, “data.class”,   “data.line-color”,  “data.width”, “data.cardinality”,“highlightColor”, "visibilityStatus", "highlightStatus" , "bendPoints"   |
|  “agentMoveNodeRequest”             | {room:< room >, userId:< agentId >,id: < node id >,   pos: {x:< new position x >, y: <  new position y >}}                   |
|  “agentAlignRequest”               | {room:< room >, userId:< agentId >,nodeIds: < node ids to align >, horizontal:<" top", "bottom", "center", "none" >, vertical:< "top", "bottom", "center", "none" > , alignTo:< node id to align nodes with nodeIds >     |
|  “agentAddCompoundRequest”          | {room:< room >, userId:< agentId >,type: < compound type as “complex” or “compartment” >,              |
|                                     | selectedNodeArr: < array of node ids >}                              |
|		"agentActiveRoomsRequest"					| {room:< room >, userId:< agentId >}-																																			|
|   "agentUndoRequest"          |  {room:< room >, userId:< agentId >} |
|   "agentRedoRequest"          |   {room:< room >, userId:< agentId >}|
|   "agentMessage"          |{room: <room>, userId: <agentId>, comment:  <message string -- can be raw html>, targets: < user ids or * to include all users in the room >}   |
|   "agentMergeGraphRequest"          |{room: <room>, userId: <agentId>, graph:<graph content>, type:<"sbgn" or "json">, cyId:<tab id | 0 if not specified>}   |
|   "agentDisplaySbgnRequest"          |{room: <room>, userId: <agentId>, sbgn:<sbgn content>, cyId:<tab id | 0 if not specified>}   |



In order to set up and run an agent:

```javascript
agent = new Agent(agentName, agentId);
    var socket = agent.connectToServer(serverIp, function(){
        //callback operations


    agent.loadModel(function() {
        agent.loadOperationHistory(function(){
            agent.loadChatHistory(function(){
                //callback operations
            });
        });
    });

    agent.listen(function(){
        socket.on('operation', function(data){
            //callback operations
        });

        socket.on('message', function(data){
            //callback operations
        });

        socket.on('userList', function(data){
            //callback operations
        });

        socket.on('imageFile', function(data){
            //callback operations
        });

        socket.on('processToIntegrate', function(data){
            //callback operations
        });
    });

});


```
An example web-based agent can be found in: `Sbgnviz-Collaborative-Editor/agent-interaction/computerAgent.html`

You can zoom and pan with the mouse wheel and left click + moving the mouse

Command History:

JSON array as:
```
[
    {
    userName: //name of the user who gave the command
    name: //name of the command
    id: //id of the affected element
    param: //operation parameters
    [
        {
        x: //node position x
        y: //node position y
        class: //node or edge sbgnclass
        source: //edge source
        target: //edge target
        }
    ]
    date: //date of the command
    }
]
```

History Manager
---------------

Each command is stored in the model as a part of command history.
Command structure is as follows:

- opName: set | add | delete | init
- opTarget: node | edge | node group | edge group
- opAttr: id| position | sbgnclass | sbgnlabel | width | height |
backgroundColor | borderColor | borderWidth | parent | isCloneMarker |
isMultimer | sbgnStatesAndInfos| source| target |lineColor | lineWidth|
sbgncardinality
- elId: id of the node or edge | id array of the node or edge group
- elType: "node" or "edge"
- param:
- prevParam:

### JSON Model Structure

-   users
    -   name
-   page
    -   list
    -   room
    -   doc
        -   userIds
        -   history
        -   undoIndex
        -   Images
        -   Context
            -   name
            -   relevance
            -   confidence
        -   cy //sbgn-related
            -   layoutProperties
            -   nodes
                -   \[nodeId\]
                    -   addedLater //to sync. node addition
                    -   visibilityStatus
                    -   highlightStatus
                    -   expandCollapseStatus
                    -   highlightColor
                    -   position
                    -   data
                        -   id
                        -   class
                        -   label
                        -   bbox
                            -   w
                            -   h
                        -   border-color
                        -   border-width
                        -   background-color
                        -   background-opacity
                        -   font-color
                        -   font-weight
                        -   font-style
                        -   font-size
                        -   cloneMarker
                        -   parent
                        -   ports
                        -   statesAndInfos

            -   edges
                -   \[edgeId\]
                    -   id
                    -   addedLater //to sync. edge addition
                    -   highlightStatus
                    -   visibilityStatus
                    -   expandCollapseStatus
                    -   highlightColor
                    -   bendPoints
                    -   data
                        -   class
                        -   source
                        -   target
                        -   portsource
                        -   porttarget
                        -   line-color
                        -   width
                        -   bendPointPositions
                        -   cardinality
        -   py // pysb-related
        -   //biopax-related

=======
# Newt: A Sample Application for ChiSE

Newt is a sample application for the web based library named [ChiSE](https://github.com/iVis-at-Bilkent/chise.js) developed to visualize and edit the pathway models represented by process description (PD) and activity flow (AF) languages of [SBGN](http://sbgn.org).

## Software

ChiSE and this sample application are distributed under [GNU Lesser General Public License](http://www.gnu.org/licenses/lgpl.html).

**A deployment of this sample application along with detailed documentation on its usage** can be found [here](http://newteditor.org/). ChiSE and Newt work on every platform that have Javascript support including mobile devices.

Please cite the following when you use this application or underlying libraries until a Newt publication is available:

M. Sari, I. Bahceci, U. Dogrusoz, S.O. Sumer, B.A. Aksoy, O. Babur, E. Demir, "[SBGNViz: a tool for visualization and complexity management of SBGN process description maps](http://journals.plos.org/plosone/article?id=10.1371/journal.pone.0128985)", PLoS ONE, 10(6), e0128985, 2015.

#### Running a Local Instance
In order to deploy and run a local instance of the tool, please follow the steps below:

- Installation
```
git clone https://github.com/iVis-at-Bilkent/newt.git
cd newt
npm install 
```

- Running the tool (Windows)
```
npm run debug-build
```
- Running the tool (MacOS/Linux)
```
sudo npm run debug-build
```

Then, open a web browser and navigate to localhost. Please note that the default port is 80 but you might have to run this application in another port such as 8080 in some platforms by setting 'port' environment variable.

## Credits

Icons made by [Freepik](http://www.freepik.com), 
[Daniel Bruce](http://www.flaticon.com/authors/daniel-bruce), 
[TutsPlus](http://www.flaticon.com/authors/tutsplus),
[Robin Kylander](http://www.flaticon.com/authors/robin-kylander),
[Catalin Fertu](http://www.flaticon.com/authors/catalin-fertu),
[Yannick](http://www.flaticon.com/authors/yannick),
[Icon Works](http://www.flaticon.com/authors/icon-works),
[Flaticon](http://www.flaticon.com) and licensed with 
[Creative Commons BY 3.0](http://creativecommons.org/licenses/by/3.0/)

Third-party libraries:
[Cytoscape.js](https://github.com/cytoscape/cytoscape.js),
[Backbone](https://github.com/jashkenas/backbone),
[Bootstrap](https://github.com/twbs/bootstrap),
[FileSaver.js](https://github.com/eligrey/FileSaver.js),
[jQuery](https://github.com/jquery/jquery),
[jquery-expander](https://github.com/kswedberg/jquery-expander),
[Konva](https://github.com/konvajs/konva),
[Libxmljs](https://github.com/libxmljs/libxmljs),
[lodash](https://github.com/lodash/lodash),
[underscore](https://github.com/jashkenas/underscore),
[express](https://github.com/expressjs/express),
[browserify](https://github.com/browserify/browserify),
[nodemon](https://github.com/remy/nodemon),
[Parallel Shell](https://github.com/darkguy2008/parallelshell) licensed with [MIT](https://opensource.org/licenses/MIT);
[chroma-js](https://github.com/gka/chroma.js) licensed with [BSD](https://opensource.org/licenses/BSD-3-Clause); 
[Mousetrap](https://github.com/ccampbell/mousetrap),
[Request](https://github.com/request/request) licensed with [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) and
[Intro.js](https://github.com/usablica/intro.js) licensed with [GNU LGPL](https://www.gnu.org/licenses/lgpl-3.0.html).

Thanks to JetBrains for an [Open Source License](https://www.jetbrains.com/buy/opensource/)

## Team

  * [Hasan Balci](https://github.com/hasanbalci), [Ahmet Candiroglu](https://github.com/ahmetcandiroglu), [Kaan Sancak](https://github.com/kaansancak), and [Ugur Dogrusoz](https://github.com/ugurdogrusoz) of [i-Vis at Bilkent University](http://www.cs.bilkent.edu.tr/~ivis), [Metin Can Siper](https://github.com/metincansiper), [Ozgun Babur](https://github.com/ozgunbabur), and [Emek Demir](https://github.com/emekdemir) of the Demir Lab at [OHSU](http://www.ohsu.edu/), and [Alexander Mazein](https://github.com/amazein) of [EISBM](http://eisbm.org)

#### Alumni

  * [Ilkin Safarli](https://github.com/kinimesi), [Ludovic Roy](https://github.com/royludo), [Leonard Dervishi](https://github.com/leonarddrv), [Istemi Bahceci](https://github.com/istemi-bahceci), Alper Karacelik, Selim Firat Yilmaz
>>>>>>> 9163e3282d3cf85a0a926d3d476c139ee9732b34
