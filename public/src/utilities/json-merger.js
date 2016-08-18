/** The json-merger module merges two JSON models into one. Such a process requires the consistency of the node ids. The strategy of the action lies in the comparison only of the edges between the two jsons, such that nodes which do not take part in an edge are not considered and may or not appear in the result of the merge. This last point needs to be revised in a potential update. The implementation is below.
 **/

//Author: David Servillo.

//Date of the last change: 08/18/2016.

module.exports = {

    //Merge two JSON models.
    merge: function(json1, json2) {
        var jsnString1 = JSON.stringify(json1);
        var nodepositions1 = {};
        var container1 = {};
        var i;
        //Rename the identifiers under the form glyphN where N is an integer. The identifiers between the two jsons
        //are consistent so no identifiers is repeated.
        for(i=0; i<json1.nodes.length; i++) {
            nodepositions1["glyph"+(i+1)] = i;

            jsnString1 = jsnString1.replace(new RegExp('"glyph'+(i+1)+'"', "g"), '');
            jsnString1 = jsnString1.replace(new RegExp('"'+json1.nodes[i].data.id+'"', "g"), '"glyph'+(i+1)+'"');
            jsnString1 = jsnString1.replace(new RegExp(':,"', "g"), ':"'+json1.nodes[i].data.id+'","');
            jsnString1 = jsnString1.replace(new RegExp(':}', "g"), ':"'+json1.nodes[i].data.id+'"}');

            jsnString1 = jsnString1.replace(new RegExp('"glyph'+(i+1)+'-', "g"), '"-');
            jsnString1 = jsnString1.replace(new RegExp('"'+json1.nodes[i].data.id+'-', "g"), '"glyph'+(i+1)+'-');
            jsnString1 = jsnString1.replace(new RegExp(':"-', "g"), ':"'+json1.nodes[i].data.id+'-');

            jsnString1 = jsnString1.replace(new RegExp('-glyph'+(i+1)+'"', "g"), '-');
            jsnString1 = jsnString1.replace(new RegExp('-'+json1.nodes[i].data.id+'"', "g"), '-glyph'+(i+1)+'"');
            jsnString1 = jsnString1.replace(new RegExp('-,"', "g"), '-'+json1.nodes[i].data.id+'","');

            json1 = JSON.parse(jsnString1);
        }

        //Identify and store the container nodes, which are nodes able to contain other nodes in it.
        //Store the content of the containers as well.
        for(i=0; i<json1.nodes.length; i++) {
            if(json1.nodes[i].data.parent != "") {
                if(container1[json1.nodes[i].data.parent] === undefined)
                    container1[json1.nodes[i].data.parent] = [json1.nodes[i].data.id];
                else
                    container1[json1.nodes[i].data.parent].push(json1.nodes[i].data.id);
            }
        }

        var edgepositions1 = {};
        var outcompsource1 = {};
        var outcomptarget1 = {};
        //Identify the nodes in containers and which connect to other nodes out of the containers.
        //Store their neighbors as well.
        for(i=0; i< json1.edges.length; i++) {
            edgepositions1[json1.edges[i].data.id] = i;
            if(json1.nodes[nodepositions1[json1.edges[i].data.source]].data.parent != "" && json1.nodes[nodepositions1[json1.edges[i].data.target]].data.parent == "") {
                if(outcompsource1[json1.edges[i].data.source] === undefined)
                    outcompsource1[json1.edges[i].data.source] = [json1.edges[i].data.target];
                else
                    outcompsource1[json1.edges[i].data.source].push(json1.edges[i].data.target);
            }
            if(json1.nodes[nodepositions1[json1.edges[i].data.target]].data.parent != "" && json1.nodes[nodepositions1[json1.edges[i].data.source]].data.parent == "") {
                if(outcomptarget1[json1.edges[i].data.target] === undefined)
                    outcomptarget1[json1.edges[i].data.target] = [json1.edges[i].data.source];
                else
                    outcomptarget1[json1.edges[i].data.target].push(json1.edges[i].data.source);
            }
        }

        var j;

        //Create an edge between the container and its content's neighbors lying outside of the container.
        //This will be useful in the comparison step, as it only compares edges
        //and thus can't compare lonely nodes not involved in an edge (like a compartment).
        //Here, the source is the container and the target the neighbors.
        outcompsourcekeys = Object.keys(outcompsource1);
        for(i=0; i<outcompsourcekeys.length; i++) {
            for(j=0; j<outcompsource1[outcompsourcekeys[i]].length; j++) {
                json1.edges.push({});
                json1.edges[json1.edges.length - 1].data = {};
                json1.edges[json1.edges.length - 1].data.id = json1.nodes[nodepositions1[outcompsourcekeys[i]]].data.parent+'-'+json1.nodes[nodepositions1[outcompsource1[outcompsourcekeys[i]][j]]].data.id;
                json1.edges[json1.edges.length - 1].data.bendPointPositions = [];
                json1.edges[json1.edges.length - 1].data.sbgncardinality = 0;
                json1.edges[json1.edges.length - 1].data.source = json1.nodes[nodepositions1[outcompsourcekeys[i]]].data.parent;
                json1.edges[json1.edges.length - 1].data.target = json1.nodes[nodepositions1[outcompsource1[outcompsourcekeys[i]][j]]].data.id;
                json1.edges[json1.edges.length - 1].data.portsource = json1.edges[json1.edges.length - 1].data.source;
                json1.edges[json1.edges.length - 1].data.porttarget = json1.edges[json1.edges.length - 1].data.target;
            }
        }

        //Create an edge between the container and its content's neighbors lying outside of the container.
        //This will be useful in the comparison step, as it only compares edges
        //and thus can't compare lonely nodes not involved in an edge (like a compartment).
        //Here, the target is the container and the source the neighbors.
        outcomptargetkeys = Object.keys(outcomptarget1);
        for(i=0; i<outcomptargetkeys.length; i++) {
            for(j=0; j<outcomptarget1[outcomptargetkeys[i]].length; j++) {
                json1.edges.push({});
                json1.edges[json1.edges.length - 1].data = {};
                json1.edges[json1.edges.length - 1].data.id = json1.nodes[nodepositions1[outcomptarget1[outcomptargetkeys[i]][j]]].data.id+'-'+json1.nodes[nodepositions1[outcomptargetkeys[i]]].data.parent;
                json1.edges[json1.edges.length - 1].data.bendPointPositions = [];
                json1.edges[json1.edges.length - 1].data.sbgncardinality = 0;
                json1.edges[json1.edges.length - 1].data.source = json1.nodes[nodepositions1[outcomptarget1[outcomptargetkeys[i]][j]]].data.id;
                json1.edges[json1.edges.length - 1].data.target = json1.nodes[nodepositions1[outcomptargetkeys[i]]].data.parent;
                json1.edges[json1.edges.length - 1].data.portsource = json1.edges[json1.edges.length - 1].data.source;
                json1.edges[json1.edges.length - 1].data.porttarget = json1.edges[json1.edges.length - 1].data.target;
            }
        }

        var jsnString2 = JSON.stringify(json2);
        var nodepositions2 = {};
        var container2 = {};
        //Rename the identifiers under the form glyphN where N is an integer. The identifiers between the two jsons
        //are consistent so no identifiers is repeated.
        for(i=json1.nodes.length; i<json1.nodes.length+json2.nodes.length; i++) {
            nodepositions2["glyph"+(i+1)] = i-json1.nodes.length;

            jsnString2 = jsnString2.replace(new RegExp('"glyph'+(i+1)+'"', "g"), '');
            jsnString2 = jsnString2.replace(new RegExp('"'+json2.nodes[i-json1.nodes.length].data.id+'"', "g"), '"glyph'+(i+1)+'"');
            jsnString2 = jsnString2.replace(new RegExp(':,"', "g"), ':"'+json2.nodes[i-json1.nodes.length].data.id+'","');
            jsnString2 = jsnString2.replace(new RegExp(':}', "g"), ':"'+json2.nodes[i-json1.nodes.length].data.id+'"}');

            jsnString2 = jsnString2.replace(new RegExp('"glyph'+(i+1)+'-', "g"), '"-');
            jsnString2 = jsnString2.replace(new RegExp('"'+json2.nodes[i-json1.nodes.length].data.id+'-', "g"), '"glyph'+(i+1)+'-');
            jsnString2 = jsnString2.replace(new RegExp(':"-', "g"), ':"'+json2.nodes[i-json1.nodes.length].data.id+'-');

            jsnString2 = jsnString2.replace(new RegExp('-glyph'+(i+1)+'"', "g"), '-');
            jsnString2 = jsnString2.replace(new RegExp('-'+json2.nodes[i-json1.nodes.length].data.id+'"', "g"), '-glyph'+(i+1)+'"');
            jsnString2 = jsnString2.replace(new RegExp('-,"', "g"), '-'+json2.nodes[i-json1.nodes.length].data.id+'","');

            json2 = JSON.parse(jsnString2);
        }

        //Identify and store the container nodes, which are nodes able to contain other nodes in it.
        //Store the content of the containers as well.
        for(i=0; i<json2.nodes.length; i++) {
            if(json2.nodes[i].data.parent != "") {
                if(container2[json2.nodes[i].data.parent] === undefined)
                    container2[json2.nodes[i].data.parent] = [json2.nodes[i].data.id];
                else
                    container2[json2.nodes[i].data.parent].push(json2.nodes[i].data.id);
            }
        }

        var edgepositions2 = {};
        var outcompsource2 = {};
        var outcomptarget2 = {};
        //Identify the nodes in containers and which connect to other nodes out of the containers.
        //Store their neighbors as well.
        for(i=0; i< json2.edges.length; i++) {
            edgepositions2[json2.edges[i].data.id] = i;
            if(json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent != "" && json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent == "") {
                if(outcompsource2[json2.edges[i].data.source] === undefined)
                    outcompsource2[json2.edges[i].data.source] = [json2.edges[i].data.target];
                else
                    outcompsource2[json2.edges[i].data.source].push(json2.edges[i].data.target);
            }
            if(json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent != "" && json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent == "") {
                if(outcomptarget2[json2.edges[i].data.target] === undefined)
                    outcomptarget2[json2.edges[i].data.target] = [json2.edges[i].data.source];
                else
                    outcomptarget2[json2.edges[i].data.target].push(json2.edges[i].data.source);
            }
        }

        //Create an edge between the container and its content's neighbors lying outside of the container.
        //This will be useful in the comparison step, as it only compares edges
        //and thus can't compare lonely nodes not involved in an edge (like a compartment).
        //Here, the source is the container and the target the neighbors.
        outcompsourcekeys = Object.keys(outcompsource2);
        for(i=0; i<outcompsourcekeys.length; i++) {
            for(j=0; j<outcompsource2[outcompsourcekeys[i]].length; j++) {
                json2.edges.push({});
                json2.edges[json2.edges.length - 1].data = {};
                json2.edges[json2.edges.length - 1].data.id = json2.nodes[nodepositions2[outcompsourcekeys[i]]].data.parent+'-'+json2.nodes[nodepositions2[outcompsource2[outcompsourcekeys[i]][j]]].data.id;
                json2.edges[json2.edges.length - 1].data.bendPointPositions = [];
                json2.edges[json2.edges.length - 1].data.sbgncardinality = 0;
                json2.edges[json2.edges.length - 1].data.source = json2.nodes[nodepositions2[outcompsourcekeys[i]]].data.parent;
                json2.edges[json2.edges.length - 1].data.target = json2.nodes[nodepositions2[outcompsource2[outcompsourcekeys[i]][j]]].data.id;
                json2.edges[json2.edges.length - 1].data.portsource = json2.edges[json2.edges.length - 1].data.source;
                json2.edges[json2.edges.length - 1].data.porttarget = json2.edges[json2.edges.length - 1].data.target;
            }
        }

        //Create an edge between the container and its content's neighbors lying outside of the container.
        //This will be useful in the comparison step, as it only compares edges
        //and thus can't compare lonely nodes not involved in an edge (like a compartment).
        //Here, the target is the container and the source the neighbors.
        outcomptargetkeys = Object.keys(outcomptarget2);
        for(i=0; i<outcomptargetkeys.length; i++) {
            for(j=0; j<outcomptarget2[outcomptargetkeys[i]].length; j++) {
                json2.edges.push({});
                json2.edges[json2.edges.length - 1].data = {};
                json2.edges[json2.edges.length - 1].data.id = json2.nodes[nodepositions2[outcomptarget2[outcomptargetkeys[i]][j]]].data.id+'-'+json2.nodes[nodepositions2[outcomptargetkeys[i]]].data.parent;
                json2.edges[json2.edges.length - 1].data.bendPointPositions = [];
                json2.edges[json2.edges.length - 1].data.sbgncardinality = 0;
                json2.edges[json2.edges.length - 1].data.source = json2.nodes[nodepositions2[outcomptarget2[outcomptargetkeys[i]][j]]].data.id;
                json2.edges[json2.edges.length - 1].data.target = json2.nodes[nodepositions2[outcomptargetkeys[i]]].data.parent;
                json2.edges[json2.edges.length - 1].data.portsource = json2.edges[json2.edges.length - 1].data.source;
                json2.edges[json2.edges.length - 1].data.porttarget = json2.edges[json2.edges.length - 1].data.target;
            }
        }

        var tmp;
        //json1 has too be the bigger than json2.
        if(json2.nodes.length > json1.nodes.length) {
            tmp = JSON.stringify(json2);
            json2 = JSON.parse(JSON.stringify(json1));
            json1 = JSON.parse(tmp);

            tmp = JSON.stringify(nodepositions2);
            nodepositions2 = JSON.parse(JSON.stringify(nodepositions1));
            nodepositions1 = JSON.parse(tmp);

            tmp = JSON.stringify(container2);
            container2 = JSON.parse(JSON.stringify(container1));
            container1 = JSON.parse(tmp);

            tmp = JSON.stringify(outcompsource2);
            outcompsource2 = JSON.parse(JSON.stringify(outcompsource2));
            outcompsource1 = JSON.parse(tmp);

            tmp = JSON.stringify(outcomptarget2);
            outcomptarget2 = JSON.parse(JSON.stringify(outcomptarget2));
            outcomptarget1 = JSON.parse(tmp);
        }

        var jsn = {"nodes": [], "edges": []};

        jsn.nodes = jsn.nodes.concat(JSON.parse(JSON.stringify(json1)).nodes);
        jsn.edges = jsn.edges.concat(JSON.parse(JSON.stringify(json1)).edges);

//******************************************************************************************
//										Caution !
//
//Start of the comparison step: it compares the edges (source, target and type of interaction)
//of the smallest json with the biggest one.
//When a match is found the edge of the smallest json is not added in the final one.
//******************************************************************************************

        var k;
        var l;
        var count1;
        var count2;
        var found1;
        var found2;
        var found4;
        var found5;
        var match1;
        var match2;
        var matches = 0;
        for(i=0; i<json2.edges.length; i++) {
            count1 = 0;
            count2 = 0;
            found1 = json1.edges.length + 1;
            found2 = 2*(json1.edges.length + 1);
            found4 = 0;
            found5 = 0;
            match1 = found1;
            match2 = found2;
            j = 0;
            while(match1 != match2 && j<json1.edges.length) {

//********************************************************************************
//source: is there the same source node in the other json ?
//********************************************************************************

                //The source of the edge in the smallest json is a container and has a label.
                if(container2[json2.edges[i].data.source] !== undefined && json2.nodes[nodepositions2[json2.edges[i].data.source]].data.sbgnlabel !== undefined && json2.nodes[nodepositions2[json2.edges[i].data.source]].data.sbgnlabel != "null") {
                    if(JSON.stringify(json2.nodes[nodepositions2[json2.edges[i].data.source]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.edges[j].data.source]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                        found1 = j + 1;
                        match1 = found1;
                    }
                    //The source of the edge in the smallest json is a container and has no label.
                } else if(container2[json2.edges[i].data.source] !== undefined && container1[json1.edges[j].data.source] !== undefined) {
                    if(container2[json2.edges[i].data.source].length == container1[json1.edges[j].data.source].length) {
                        for(k=0; k<container2[json2.edges[i].data.source].length; k++) {
                            for(l=0; l<container1[json1.edges[j].data.source].length; l++) {
                                if(JSON.stringify(json2.nodes[nodepositions2[container2[json2.edges[i].data.source][k]]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[container1[json1.edges[j].data.source][l]]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                                    count1 = count1 + 1;
                                }
                            }
                        }
                        if(count1 >= container2[json2.edges[i].data.source].length) {
                            found1 = j + 1;
                            match1 = found1;
                        }
                    }
                    //The container in which lies the source of the edge in the smallest json has a label.
                } else if(container2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent] !== undefined && json2.nodes[nodepositions2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent]].data.sbgnlabel !== undefined && json2.nodes[nodepositions2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent]].data.sbgnlabel != "null") {
                    if(JSON.stringify(json2.nodes[nodepositions2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.edges[j].data.source]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                        json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent = json1.edges[j].data.source;  //The container is found.
                        for(l=0; l<container1[json1.edges[j].data.source].length; l++) {

                            //There is a match in the container.
                            if(JSON.stringify(json2.nodes[nodepositions2[json2.edges[i].data.source]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[container1[json1.edges[j].data.source][l]]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                                for(k=0; k<json1.edges.length; k++) {
                                    //The match is a source.
                                    if(json1.edges[k].data.source == container1[json1.edges[j].data.source][l] && json1.edges[k].data.target == outcompsource1[container1[json1.edges[j].data.source][l]][0]) {
                                        found1 = k + 1;
                                        match1 = found1;
                                        //The match is a target.
                                    } else if(json1.edges[k].data.target == container1[json1.edges[j].data.source][l] && json1.edges[k].data.source == outcomptarget1[container1[json1.edges[j].data.source][l]][0]) {
                                        tmp = json1.edges[k].data.source;
                                        json1.edges[k].data.source = json1.edges[k].data.target;
                                        json1.edges[k].data.target = tmp;

                                        found1 = k + 1;
                                        match1 = found1;
                                    }
                                }
                            }
                        }
                    }
                    //The container in which lies the source of the edge in the smallest json and has no label.
                } else if(container2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent] !== undefined && container1[json1.edges[j].data.source] !== undefined) {
                    if(container2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent].length == container1[json1.edges[j].data.source].length) {
                        for(k=0; k<container2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent].length; k++) {
                            for(l=0; l<container1[json1.edges[j].data.source].length; l++) {
                                if(JSON.stringify(json2.nodes[nodepositions2[container2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent][k]]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[container1[json1.edges[j].data.source][l]]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                                    count1 = count1 + 1;
                                }
                            }
                        }
                        if(count1 >= container2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent].length) {
                            found1 = edgepositions1[json1.edges[j].data.id] + 1;
                            match1 = found1;
                        }
                    }
                    //The node is a regular node, without a container.
                } else {
                    if(JSON.stringify(json2.nodes[nodepositions2[json2.edges[i].data.source]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.edges[j].data.source]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                        found1 = j + 1;
                        match1 = found1;
                        if(json2.nodes[nodepositions2[json2.edges[i].data.source]].data.sbgnlabel === undefined || json2.nodes[nodepositions2[json2.edges[i].data.source]].data.sbgnlabel == "null") {
                            found1 = 0;
                        }
                    }
                }

//********************************************************************************
//target: is there the same target node in the other json ?
//********************************************************************************

                //The target of the edge in the smallest json is a container and has a label.
                if(container2[json2.edges[i].data.target] !== undefined && json2.nodes[nodepositions2[json2.edges[i].data.target]].data.sbgnlabel !== undefined && json2.nodes[nodepositions2[json2.edges[i].data.target]].data.sbgnlabel != "null") {
                    if(JSON.stringify(json2.nodes[nodepositions2[json2.edges[i].data.target]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.edges[j].data.target]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                        found2 = j + 1;
                        match2 = found2;
                    }
                    //The target of the edge in the smallest json is a container and has no label.
                } else if(container2[json2.edges[i].data.target] !== undefined && container1[json1.edges[j].data.target] !== undefined) {
                    if(container2[json2.edges[i].data.target].length == container1[json1.edges[j].data.target].length) {
                        for(k=0; k<container2[json2.edges[i].data.target].length; k++) {
                            for(l=0; l<container1[json1.edges[j].data.target].length; l++) {
                                if(JSON.stringify(json2.nodes[nodepositions2[container2[json2.edges[i].data.target][k]]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[container1[json1.edges[j].data.target][l]]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                                    count2 = count2 + 1;
                                }
                            }
                        }
                        if(count2 >= container2[json2.edges[i].data.target].length) {
                            found2 = j + 1;
                            match2 = found2;
                        }
                    }
                    //The container in which lies the target of the edge in the smallest json has a label.
                } else if(container2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent] !== undefined && json2.nodes[nodepositions2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent]].data.sbgnlabel !== undefined && json2.nodes[nodepositions2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent]].data.sbgnlabel != "null") {
                    if(JSON.stringify(json2.nodes[nodepositions2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.edges[j].data.target]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                        json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent = json1.edges[j].data.target;  //The container is found.
                        for(l=0; l<container1[json1.edges[j].data.target].length; l++) {

                            //There is a match in the container.
                            if(JSON.stringify(json2.nodes[nodepositions2[json2.edges[i].data.target]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[container1[json1.edges[j].data.target][l]]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                                for(k=0; k<json1.edges.length; k++) {
                                    //The match is a target.
                                    if(json1.edges[k].data.target == container1[json1.edges[j].data.target][l] && json1.edges[k].data.source == outcomptarget1[container1[json1.edges[j].data.target][l]][0]) {
                                        found2 = k + 1;
                                        match2 = found2;
                                        //The match is a source.
                                    } else if(json1.edges[k].data.source == container1[json1.edges[j].data.target][l] && json1.edges[k].data.target == outcompsource1[container1[json1.edges[j].data.target][l]][0]) {
                                        tmp = json1.edges[k].data.source;
                                        json1.edges[k].data.source = json1.edges[k].data.target;
                                        json1.edges[k].data.target = tmp;

                                        found2 = k + 1;
                                        match2 = found2;
                                    }
                                }
                            }
                        }
                    }
                    //The container in which lies the target of the edge in the smallest json and has no label.
                } else if(container2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent] !== undefined && container1[json1.edges[j].data.target] !== undefined) {
                    if(container2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent].length == container1[json1.edges[j].data.target].length) {
                        for(k=0; k<container2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent].length; k++) {
                            for(l=0; l<container1[json1.edges[j].data.target].length; l++) {
                                if(JSON.stringify(json2.nodes[nodepositions2[container2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent][k]]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[container1[json1.edges[j].data.target][l]]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                                    count2 = count2 + 1;
                                }
                            }
                        }
                        if(count2 >= container2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent].length) {
                            found2 = edgepositions1[json1.edges[j].data.id] + 1;
                            match2 = found2;
                        }
                    }
                    //The node is a regular node, without a container.
                } else {
                    if(JSON.stringify(json2.nodes[nodepositions2[json2.edges[i].data.target]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.edges[j].data.target]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                        found2 = j + 1;
                        match2 = found2;
                        if(json2.nodes[nodepositions2[json2.edges[i].data.target]].data.sbgnlabel === undefined || json2.nodes[nodepositions2[json2.edges[i].data.target]].data.sbgnlabel == "null") {
                            found2 = 0;
                        }
                    }
                }

//********************************************************************************
//source: is there the same node (as a target this time !) in the other json ?
//********************************************************************************

                //The source of the edge in the smallest json is a container and has a label.
                if(container2[json2.edges[i].data.source] !== undefined && json2.nodes[nodepositions2[json2.edges[i].data.source]].data.sbgnlabel !== undefined && json2.nodes[nodepositions2[json2.edges[i].data.source]].data.sbgnlabel != "null") {
                    if(JSON.stringify(json2.nodes[nodepositions2[json2.edges[i].data.source]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.edges[j].data.target]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                        found4 = j + 1;
                        match1 = found4;
                    }
                    //The source of the edge in the smallest json is a container and has no label.
                } else if(container2[json2.edges[i].data.source] !== undefined && container1[json1.edges[j].data.target] !== undefined) {
                    if(container2[json2.edges[i].data.source].length == container1[json1.edges[j].data.target].length) {
                        for(k=0; k<container2[json2.edges[i].data.source].length; k++) {
                            for(l=0; l<container1[json1.edges[j].data.target].length; l++) {
                                if(JSON.stringify(json2.nodes[nodepositions2[container2[json2.edges[i].data.source][k]]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[container1[json1.edges[j].data.target][l]]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                                    count1 = count1 + 1;
                                }
                            }
                        }
                        if(count1 >= container2[json2.edges[i].data.source].length) {
                            found4 = j + 1;
                            match1 = found4;
                        }
                    }
                    //The container in which lies the source of the edge in the smallest json has a label.
                } else if(container2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent] !== undefined && json2.nodes[nodepositions2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent]].data.sbgnlabel !== undefined && json2.nodes[nodepositions2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent]].data.sbgnlabel != "null") {
                    if(JSON.stringify(json2.nodes[nodepositions2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.edges[j].data.target]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                        json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent = json1.edges[j].data.target;  //The container is found.
                        for(l=0; l<container1[json1.edges[j].data.target].length; l++) {

                            //There is a match in the container.
                            if(JSON.stringify(json2.nodes[nodepositions2[json2.edges[i].data.source]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[container1[json1.edges[j].data.target][l]]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                                for(k=0; k<json1.edges.length; k++) {
                                    //The match is a target.
                                    if(json1.edges[k].data.target == container1[json1.edges[j].data.target][l] && json1.edges[k].data.source == outcomptarget1[container1[json1.edges[j].data.target][l]][0]) {
                                        found4 = k + 1;
                                        match1 = found4;
                                        //The match is a source.
                                    } else if(json1.edges[k].data.source == container1[json1.edges[j].data.source][l] && json1.edges[k].data.target == outcompsource1[container1[json1.edges[j].data.source][l]][0]) {
                                        tmp = json1.edges[k].data.source;
                                        json1.edges[k].data.source = json1.edges[k].data.target;
                                        json1.edges[k].data.target = tmp;

                                        found4 = k + 1;
                                        match1 = found4;
                                    }
                                }
                            }
                        }
                    }
                    //The container in which lies the source of the edge in the smallest json and has no label.
                } else if(container2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent] !== undefined && container1[json1.edges[j].data.target] !== undefined) {
                    if(container2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent].length == container1[json1.edges[j].data.target].length) {
                        for(k=0; k<container2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent].length; k++) {
                            for(l=0; l<container1[json1.edges[j].data.target].length; l++) {
                                if(JSON.stringify(json2.nodes[nodepositions2[container2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent][k]]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[container1[json1.edges[j].data.target][l]]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                                    count1 = count1 + 1;
                                }
                            }
                        }
                        if(count1 >= container2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent].length) {
                            found4 = edgepositions1[json1.edges[j].data.id] + 1;
                            match1 = found4;
                        }
                    }
                    //The node is a regular node, without a container.
                } else {
                    if(JSON.stringify(json2.nodes[nodepositions2[json2.edges[i].data.source]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.edges[j].data.target]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                        found4 = j + 1;
                        match1 = found4;
                        if(json2.nodes[nodepositions2[json2.edges[i].data.source]].data.sbgnlabel === undefined || json2.nodes[nodepositions2[json2.edges[i].data.source]].data.sbgnlabel == "null") {
                            found4 = 0;
                        }
                    }
                }

//********************************************************************************
//target: is there the same node (as a source this time !) in the other json ?
//********************************************************************************

                //The target of the edge in the smallest json is a container and has a label.
                if(container2[json2.edges[i].data.target] !== undefined && json2.nodes[nodepositions2[json2.edges[i].data.target]].data.sbgnlabel !== undefined && json2.nodes[nodepositions2[json2.edges[i].data.target]].data.sbgnlabel != "null") {
                    if(JSON.stringify(json2.nodes[nodepositions2[json2.edges[i].data.target]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.edges[j].data.source]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                        found5 = j + 1;
                        match2 = found5;
                    }
                    //The target of the edge in the smallest json is a container and has no label.
                } else if(container2[json2.edges[i].data.target] !== undefined && container1[json1.edges[j].data.source] !== undefined) {
                    if(container2[json2.edges[i].data.target].length == container1[json1.edges[j].data.target].length) {
                        for(k=0; k<container2[json2.edges[i].data.target].length; k++) {
                            for(l=0; l<container1[json1.edges[j].data.source].length; l++) {
                                if(JSON.stringify(json2.nodes[nodepositions2[container2[json2.edges[i].data.target][k]]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[container1[json1.edges[j].data.source][l]]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                                    count2 = count2 + 1;
                                }
                            }
                        }
                        if(count2 >= container2[json2.edges[i].data.target].length) {
                            found5 = j + 1;
                            match2 = found5;
                        }
                    }
                    //The container in which lies the target of the edge in the smallest json has a label.
                } else if(container2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent] !== undefined && json2.nodes[nodepositions2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent]].data.sbgnlabel !== undefined && json2.nodes[nodepositions2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent]].data.sbgnlabel != "null") {
                    if(JSON.stringify(json2.nodes[nodepositions2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.edges[j].data.source]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                        json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent = json1.edges[j].data.source; //The container is found.
                        for(l=0; l<container1[json1.edges[j].data.source].length; l++) {

                            //There is a match in the container.
                            if(JSON.stringify(json2.nodes[nodepositions2[json2.edges[i].data.target]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[container1[json1.edges[j].data.source][l]]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                                for(k=0; k<json1.edges.length; k++) {
                                    //The match is a source.
                                    if(json1.edges[k].data.source == container1[json1.edges[j].data.source][l] && json1.edges[k].data.target == outcompsource1[container1[json1.edges[j].data.source][l]][0]) {
                                        found5 = k + 1;
                                        match2 = found5;
                                        //The match is a target.
                                    } else if(json1.edges[k].data.target == container1[json1.edges[j].data.source][l] && json1.edges[k].data.source == outcomptarget1[container1[json1.edges[j].data.source][l]][0]) {
                                        tmp = json1.edges[k].data.source;
                                        json1.edges[k].data.source = json1.edges[k].data.target;
                                        json1.edges[k].data.target = tmp;

                                        found5 = k + 1;
                                        match2 = found5;
                                    }
                                }
                            }
                        }
                    }
                    //The container in which lies the target of the edge in the smallest json and has no label.
                } else if(container2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent] !== undefined && container1[json1.edges[j].data.source] !== undefined) {
                    if(container2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent].length == container1[json1.edges[j].data.source].length) {
                        for(k=0; k<container2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent].length; k++) {
                            for(l=0; l<container1[json1.edges[j].data.source].length; l++) {
                                if(JSON.stringify(json2.nodes[nodepositions2[container2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent][k]]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[container1[json1.edges[j].data.source][l]]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                                    count2 = count2 + 1;
                                }
                            }
                        }
                        if(count2 >= container2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent].length) {
                            found5 = edgepositions1[json1.edges[j].data.id] + 1;
                            match2 = found5;
                        }
                    }
                    //The node is a regular node, without a container.
                } else {
                    if(JSON.stringify(json2.nodes[nodepositions2[json2.edges[i].data.target]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.edges[j].data.source]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                        found5 = j + 1;
                        match2 = found5;
                        if(json2.nodes[nodepositions2[json2.edges[i].data.target]].data.sbgnlabel === undefined || json2.nodes[nodepositions2[json2.edges[i].data.target]].data.sbgnlabel == "null") {
                            found5 = 0;
                        }
                    }
                }

                j = j + 1;
            }

//******************************************************************************************
//End of the comparison step.
//******************************************************************************************

            //The target node is not in json1, then add it to the final json.
            if(found1%(json1.edges.length + 1) != 0 && found2%(json1.edges.length + 1) == 0 && !found4 && !found5) {
                jsn.nodes.push(json2.nodes[nodepositions2[json2.edges[i].data.target]]);
                if(container2[json2.edges[i].data.target] !== undefined) {  //Create both the container and its content.
                    for(j=0; j<container2[json2.edges[i].data.target].length; j++) {
                        jsn.nodes.push(json2.nodes[nodepositions2[container2[json2.edges[i].data.target][j]]]);
                    }
                }
                jsn.edges.push(json2.edges[i]);
                jsn.edges[jsn.edges.length - 1].data.source = json1.edges[found1 - 1].data.source;
                jsn.edges[jsn.edges.length - 1].data.portsource = json1.edges[found1 - 1].data.portsource;
            }

            //The source node is not in json1, then add it to the final json.
            if(found1%(json1.edges.length + 1) == 0 && found2%(json1.edges.length + 1) != 0 && !found4 && !found5) {
                jsn.nodes.push(json2.nodes[nodepositions2[json2.edges[i].data.source]]);
                if(container2[json2.edges[i].data.source] !== undefined) {  //Create both the container and its content.
                    for(j=0; j<container2[json2.edges[i].data.source].length; j++)
                        jsn.nodes.push(json2.nodes[nodepositions2[container2[json2.edges[i].data.source][j]]]);
                }
                jsn.edges.push(json2.edges[i]);
                jsn.edges[jsn.edges.length - 1].data.target = json1.edges[found2 - 1].data.target;
                jsn.edges[jsn.edges.length - 1].data.porttarget = json1.edges[found2 - 1].data.porttarget;
            }

            //The target node is not in json1, then add it to the final json.
            if(found1%(json1.edges.length + 1) == 0 && found2%(json1.edges.length + 1) == 0 && found4 && !found5) {
                jsn.nodes.push(json2.nodes[nodepositions2[json2.edges[i].data.target]]);
                if(container2[json2.edges[i].data.target] !== undefined) {  //Create both the container and its content.
                    for(j=0; j<container2[json2.edges[i].data.target].length; j++) {
                        jsn.nodes.push(json2.nodes[nodepositions2[container2[json2.edges[i].data.target][j]]]);
                    }
                }
                jsn.edges.push(json2.edges[i]);
                jsn.edges[jsn.edges.length - 1].data.source = json1.edges[found4 - 1].data.target;
                jsn.edges[jsn.edges.length - 1].data.portsource = json1.edges[found4 - 1].data.porttarget;
            }

            //The source node is not in json1, then add it to the final json.
            if(found1%(json1.edges.length + 1) == 0 && found2%(json1.edges.length + 1) == 0 && !found4 && found5) {
                jsn.nodes.push(json2.nodes[nodepositions2[json2.edges[i].data.source]]);
                if(container2[json2.edges[i].data.source] !== undefined) {  //Create both the container and its content.
                    for(j=0; j<container2[json2.edges[i].data.source].length; j++)
                        jsn.nodes.push(json2.nodes[nodepositions2[container2[json2.edges[i].data.source][j]]]);
                }
                jsn.edges.push(json2.edges[i]);
                jsn.edges[jsn.edges.length - 1].data.target = json1.edges[found5 - 1].data.source;
                jsn.edges[jsn.edges.length - 1].data.porttarget = json1.edges[found5 - 1].data.portsource;
            }

            //Neither the target node nor the source node are in json1, then add all the edge.
            if(found1%(json1.edges.length + 1) == 0 && found2%(json1.edges.length + 1) == 0 && !found4 & !found5) {
                jsn.nodes.push(json2.nodes[nodepositions2[json2.edges[i].data.source]]);
                if(container2[json2.edges[i].data.source] !== undefined) {  //Create both the container and its content.
                    for(j=0; j<container2[json2.edges[i].data.source].length; j++)
                        jsn.nodes.push(json2.nodes[nodepositions2[container2[json2.edges[i].data.source][j]]]);
                }
                jsn.nodes.push(json2.nodes[nodepositions2[json2.edges[i].data.target]]);
                if(container2[json2.edges[i].data.target] !== undefined) {  //Create both the container and its content.
                    for(j=0; j<container2[json2.edges[i].data.target].length; j++)
                        jsn.nodes.push(json2.nodes[nodepositions2[container2[json2.edges[i].data.target][j]]]);
                }
                jsn.edges.push(json2.edges[i]);
            }

            //Both the target node and the source node are in json1. Only add the interaction type of the edge.
            if(found1%(json1.edges.length + 1) != 0 && found2%(json1.edges.length + 1) != 0) {
                jsn.edges.push(json2.edges[i]);
                jsn.edges[jsn.edges.length - 1].data.source = json1.edges[found1 - 1].data.source;
                jsn.edges[jsn.edges.length - 1].data.portsource = json1.edges[found1 - 1].data.portsource;

                jsn.edges[jsn.edges.length - 1].data.target = json1.edges[found2 - 1].data.target;
                jsn.edges[jsn.edges.length - 1].data.porttarget = json1.edges[found2 - 1].data.porttarget;

                //Both the target node and the source node are in json1. Only add the interaction type of the edge.
            } else if(found4 && found5) {
                jsn.edges.push(json2.edges[i]);
                jsn.edges[jsn.edges.length - 1].data.source = json1.edges[found4 - 1].data.target;
                jsn.edges[jsn.edges.length - 1].data.portsource = json1.edges[found4 - 1].data.porttarget;

                jsn.edges[jsn.edges.length - 1].data.target = json1.edges[found5 - 1].data.source;
                jsn.edges[jsn.edges.length - 1].data.porttarget = json1.edges[found5 - 1].data.portsource;
            }

            //Both the target node and the source node are in json1. Only add the interaction type of the edge.
            if(found1%(json1.edges.length + 1) != 0 && found2%(json1.edges.length + 1) == 0 && !found4 && found5) {
                jsn.edges.push(json2.edges[i]);
                jsn.edges[jsn.edges.length - 1].data.source = json1.edges[found1 - 1].data.source;
                jsn.edges[jsn.edges.length - 1].data.portsource = json1.edges[found1 - 1].data.portsource;

                jsn.edges[jsn.edges.length - 1].data.target = json1.edges[found5 - 1].data.source;
                jsn.edges[jsn.edges.length - 1].data.porttarget = json1.edges[found5 - 1].data.portsource;
            }

            //Both the target node and the source node are in json1. Only add the interaction type of the edge.
            if(found1%(json1.edges.length + 1) == 0 && found2%(json1.edges.length + 1) != 0 && found4 && !found5) {
                jsn.edges.push(json2.edges[i]);
                jsn.edges[jsn.edges.length - 1].data.source = json1.edges[found4 - 1].data.target;
                jsn.edges[jsn.edges.length - 1].data.portsource = json1.edges[found4 - 1].data.porttarget;

                jsn.edges[jsn.edges.length - 1].data.target = json1.edges[found2 - 1].data.target;
                jsn.edges[jsn.edges.length - 1].data.porttarget = json1.edges[found2 - 1].data.porttarget;
            }

            //The source, the target and the interaction type of the edge were all found.
            if(match1 == match2 && jsn.edges[jsn.edges.length - 1].data.sbgnclass == json1.edges[match1 - 1].data.sbgnclass) {
                matches = matches + 1;
            }
        }

        //There were only matches. json2 is useless, only json1 becomes the final json.
        if(matches == json2.edges.length)
            jsn = json1;

        return jsn;
    }
}