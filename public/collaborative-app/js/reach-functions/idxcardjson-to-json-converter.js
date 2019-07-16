/** The idxcardjson-to-json-converter module translates an indexcard JSON from the Reach API into a JSON valid for SBGNviz. Its implementation is below.
 **/

// Author: David Servillo.

//Date of the last change: 09/20/2017

var idxCardToJson = {

    //Create the SBGNviz-compatible JSON
    createJson: function(idxcardjsonObj) {
        var jsonObj = {};
        jsonObj.nodes = [];
        jsonObj.edges = [];

        var entityBbox = {
            "compartment": {x:0, y:0, w:60, h:60},
            "complex": {x:0, y:0, w:60, h:60},
            "macromolecule": {x:0, y:0, w:120, h:60},
            "process": {x:0, y:0, w:20, h:20},
            "sourceandsink": {x:0, y:0, w:60, h:60}
        };

        var statesandinfosbbox = {x:0, y:-50, w:40, h:12};
        var addmodifstatesandinfosbbox = {x:0, y:50, w:40, h:12};

        var stateInfos = {
            "acetylation": "Ac",
            "glycosylation": "G",
            "hydroxylation": "OH",
            "methylation": "Me",
            "myristoylation": "My",
            "palmytoylation": "Pa",
            "phosphorylation": "P",
            "prenylation": "Pr",
            "protonation": "H",
            "sulfation": "S",
            "sumoylation": "Su",
            "ubiquitination": "Ub"
        }

        var i;
        for(i=0; i<idxcardjsonObj.cards.length; i++) {

            //Create the first glyph
            var newNode0 = {
                data: {
                    id:"ele"+i+1,
                    class: "macromolecule",
                    bbox: entityBbox.macromolecule,
                    statesandinfos: [{bbox: statesandinfosbbox,
                        id: "ele"+i+2,
                        clazz: "unit of information",
                        label: {text:"mt:prot"},
                        coordType:  "relativeToCenter",
                        anchorSide: "top",
                        isDisplayed: false}],
                    parent: "",
                    ports: []
                }
            };

            if('participant_a' in idxcardjsonObj.cards[i].extracted_information)
                newNode0.data.label = idxcardjsonObj.cards[i].extracted_information.participant_a.entity_text;
            else
                newNode0.data.label = "";

            jsonObj.nodes.push(newNode0);

            //Create the second glyph
            var newNode1 = {
                data: {
                    id: "ele"+i+3,
                    class: "macromolecule",
                    bbox: entityBbox.macromolecule,
                    label: idxcardjsonObj.cards[i].extracted_information.participant_b.entity_text,
                    statesandinfos: [{bbox: statesandinfosbbox,
                        id:"ele"+i+6,
                        clazz:"unit of information",
                        label:{text:"mt:prot"},
                        coordType:  "relativeToCenter",
                        anchorSide: "top",
                        isDisplayed: false}],
                    parent: "",
                    ports: []
                }
            };

            jsonObj.nodes.push(newNode1);

            //Create the third glyph
            var newNode2 = {
                data: {
                    id: "ele"+i+5,
                    class: "process",
                    label: "null",
                    statesandinfos: [],
                    bbox: entityBbox.process,
                    parent: "",
                    ports: []
                }
            };

            jsonObj.nodes.push(newNode2);

            var newNode3 = {
                data: {
                    id: "ele"+i+6,
                    class: "",
                    label: "",
                    statesandinfos: [],
                    bbox: {x:0, y:0, w:0, h:0},
                    parent: "",
                    ports: []
                }
            };

            jsonObj.nodes.push(newNode3);

            var newNode4;
            //Create the first arc
            var newEdge0 = {
                data: {
                    id: newNode3.data.id + "-" + newNode2.data.id,
                    class: "consumption",
                    bendPointPositions: [],
                    cardinality: 0,
                    source: newNode3.data.id,
                    target: newNode2.data.id,
                    portsource: newNode3.data.id,
                    porttarget: newNode2.data.id
                }
            };

            jsonObj.edges.push(newEdge0);

            //Create the second arc
            var newEdge1 = {
                data: {
                    id: newNode2.data.id + "-" + newNode1.data.id,
                    class: "production",
                    bendPointPositions: [],
                    cardinality: 0,
                    source: newNode2.data.id,
                    target: newNode1.data.id,
                    portsource: newNode2.data.id,
                    porttarget: newNode1.data.id
                }
            };

            jsonObj.edges.push(newEdge1);

            //Create the third arc
            var newEdge2 = {
                data: {
                    id: newNode0.data.id + "-" + newNode2.data.id,
                    class: "consumption",
                    bendPointPositions: [],
                    cardinality: 0,
                    source: newNode0.data.id,
                    target: newNode2.data.id,
                    portsource: newNode0.data.id,
                    porttarget: newNode2.data.id
                }
            };

            jsonObj.edges.push(newEdge2);

            if(idxcardjsonObj.cards[i].extracted_information.interaction_type == "increases_activity")  //The interaction is a type of stimulation.
                newEdge2.data.class = "stimulation";

            else if(idxcardjsonObj.cards[i].extracted_information.interaction_type == "decreases_activity")  //The interaction is a type of inhibition.
                newEdge2.data.class = "inhibition";

            else if(idxcardjsonObj.cards[i].extracted_information.interaction_type == "binds") {  //The interaction is a binding.

                //The "source and sink" glyph is transformed into a macromolecular glyph
                newNode3.data.class = "macromolecule";
                newNode3.data.label = idxcardjsonObj.cards[i].extracted_information.participant_b.entity_text;
                newNode3.data.bbox = entityBbox.macromolecule;
                newNode3.data.statesandinfos[0] = {};
                newNode3.data.statesandinfos[0].bbox = statesandinfosbbox;
                newNode3.data.statesandinfos[0].id = "ele"+i+9;
                newNode3.data.statesandinfos[0].clazz = "unit of information";
                newNode3.data.statesandinfos[0].label = {};
                newNode3.data.statesandinfos[0].label.text = "mt:prot";
                newNode3.data.statesandinfos[0].coordType = "relativeToCenter";
                newNode3.data.statesandinfos[0].anchorSide = "top";
                newNode3.data.statesandinfos[0].isDisplayed = false;

                //The result of the reaction is a complex
                newNode1.data.class = "complex";
                newNode1.data.bbox = entityBbox.complex;
                delete newNode1.data.label;
                newNode1.data.statesandinfos = [];

                //First glyph in the complex
                newNode4 = {
                    data: {
                        id:"ele"+i+10,
                        class: "macromolecule",
                        bbox: entityBbox.macromolecule,
                        label: idxcardjsonObj.cards[i].extracted_information.participant_b.entity_text,
                        statesandinfos: [{bbox: statesandinfosbbox,
                            id:"ele"+i+4,
                            clazz: "unit of information",
                            label: {text:"mt:prot"},
                            coordType:  "relativeToCenter",
                            anchorSide: "top",
                            isDisplayed: false}],
                        parent: "ele"+i+3,
                        ports: []
                    }
                };

                jsonObj.nodes.push(newNode4);

                //Second glyph in the complex
                var newNode5 = {
                    data: {
                        id: "ele"+i+11,
                        class: "macromolecule",
                        bbox: entityBbox.macromolecule,
                        statesandinfos: [{bbox: statesandinfosbbox,
                            id: "ele"+i+12,
                            clazz: "unit of information",
                            label:{text:"mt:prot"},
                            coordType:  "relativeToCenter",
                            anchorSide: "top",
                            isDisplayed: false}],
                        label: newNode0.data.label,
                        parent: "ele"+i+3,
                        ports: []
                    }
                };

                jsonObj.nodes.push(newNode5);

                newNode2.data.class = "association";

                newEdge2.data.class = "consumption";
            }

            else if(idxcardjsonObj.cards[i].extracted_information.interaction_type == "adds_modification") { //The interaction is a chemical modification
                newEdge2.data.class = "stimulation";

                //That glyph is not a "source and sink" glyph anymore, but a macromolecule
                newNode3.data.class = "macromolecule";
                newNode3.data.label = idxcardjsonObj.cards[i].extracted_information.participant_b.entity_text;
                newNode3.data.bbox = entityBbox.macromolecule;
                newNode3.data.statesandinfos[0] = {};
                newNode3.data.statesandinfos[0].id = "ele"+i+8;
                newNode3.data.statesandinfos[0].clazz = "unit of information";
                newNode3.data.statesandinfos[0].label = {};
                newNode3.data.statesandinfos[0].label.text = "mt:prot";
                newNode3.data.statesandinfos[0].bbox = statesandinfosbbox;
                newNode3.data.statesandinfos[0].coordType = "relativeToCenter";
                newNode3.data.statesandinfos[0].anchorSide = "top";
                newNode3.data.statesandinfos[0].isDisplayed = false;
                newNode3.data.parent = "";
                newNode3.data.ports = [];

                var j;
                for(j=0; j<idxcardjsonObj.cards[i].extracted_information.modifications.length; j++) {
                    var newStateInfos = {
                        id: "ele"+i+7,
                        clazz: "state variable",
                        bbox: addmodifstatesandinfosbbox,
                        state: {value: stateInfos[idxcardjsonObj.cards[i].extracted_information.modifications[j].modification_type]},
                        coordType:  "relativeToCenter",
                        anchorSide: "top",
                        isDisplayed: false
                    };

                    newNode1.data.statesandinfos.push(newStateInfos);
                }
            }
            else if(idxcardjsonObj.cards[i].extracted_information.interaction_type == "translocates") {  //The interaction is a translocation

                //jsonObj.edges[3*i+2].data.class = "consumption";

                //A second compartment
                if(idxcardjsonObj.cards[i].extracted_information.to_location_text !== undefined) {
                    newNode4 = {
                        data: {
                            id:"ele"+i+10,
                            class: "compartment",
                            bbox: entityBbox.compartment,
                            label: idxcardjsonObj.cards[i].extracted_information.to_location_text,
                            statesandinfos: [],
                            parent: "",
                            ports: []
                        }
                    };

                    jsonObj.nodes.push(newNode4);

                    newNode1.data.parent = "ele"+i+10;
                }

                //The "source and sink" glyph is transformed into a macromolecule
                newNode3.data.class = "macromolecule";
                newNode3.data.label = idxcardjsonObj.cards[i].extracted_information.participant_b.entity_text;
                newNode3.data.bbox = entityBbox.macromolecule;
                newNode3.data.statesandinfos[0] = {};
                newNode3.data.statesandinfos[0].bbox = statesandinfosbbox;
                newNode3.data.statesandinfos[0].id = "ele"+i+9;
                newNode3.data.statesandinfos[0].clazz = "unit of information";
                newNode3.data.statesandinfos[0].label = {};
                newNode3.data.statesandinfos[0].coordType = "relativeToCenter";
                newNode3.data.statesandinfos[0].anchorSide = "top";
                newNode3.data.statesandinfos[0].isDisplayed = false;
                newNode3.data.statesandinfos[0].label.text = "mt:prot";

                //The first glyph is transformed into a compartment
                if(idxcardjsonObj.cards[i].extracted_information.from_location_text !== undefined) {
                    newNode0.class = "compartment";
                    newNode0.statesandinfos = [];
                    newNode0.label = idxcardjsonObj.cards[i].extracted_information.from_location_text;
                    newNode0.bbox = entityBbox.compartment.bbox;

                    newNode3.data.parent = "ele"+i+1;
                } else {
                    newNode0.label = idxcardjsonObj.cards[i].extracted_information.participant_b.entity_text;
                    newNode3 = {};
                    newEdge0 = {};
                }
            }
        }
        return jsonObj;
    }
};

// if( typeof module !== 'undefined' && module.exports) // expose as a nodejs module
module.exports = idxCardToJson;