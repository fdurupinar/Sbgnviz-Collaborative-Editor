/**
 * Created by durupina on 11/14/16.
 */

let modelMergeFunctions = require('../model-merge-functions.js')();

module.exports =  function(app) {

    let idxcardjson = require('../reach-functions/idxcardjson-to-json-converter.js');

    let socket = io();
    let idxCardView = require('../reach-functions/idxCard-info.js');
    let jsonGraphs;
    let nodeMap;
    let text= 'We introduce a new method. MDM2 phosphorylates TP53.  MDM2 deactivates RAF. A Sos-1-E3b1 complex directs Rac activation by entering into a tricomplex with Eps8.';
    let pmcID = "PMC2797771";


    return   {
        initialize: function(){

            $('#factoidBox')[0].value = text;

            let factoidModel = app.modelManager.getFactoidModel();

            if(factoidModel != null){

                jsonGraphs = factoidModel.jsonGraphs;
                nodeMap = factoidModel.nodeMap;
                this.updateTextBox(jsonGraphs);
            }

            this.listenToEvents();

        },

        updateTextBox: function(jsonGraphs){
            let textFromJsons = "";
            for(let i = 0; i < jsonGraphs.length; i++)
                textFromJsons+= jsonGraphs[i].sentence + '. ';

            text = textFromJsons;
            $('#factoidBox')[0].value = text = textFromJsons;
        },

        loadFactoidModel: function(inputStr){
            //parse each input sentence one by one

            let self = this;
            let jsonGraphs = [];

            let notyView = noty({layout: "bottom",text: "Sending REACH queries"});

            // let p = new Promise(function (resolve) {
                socket.emit("REACHQuery", "indexcard", inputStr, function (data) {
                    let cards = JSON.parse(data).cards;

                    cards.forEach(function(card){
                        let jsonData = idxcardjson.createJson({cards: [card]});
                            jsonGraphs.push({sentence: card.evidence[0], json: jsonData, idxCard:card});
                    });

                    notyView.setText( "Merging graphs...");

                    nodeMap = modelMergeFunctions.mergeJsons(jsonGraphs, appUtilities.getActiveNetworkId(), app.modelManager, function(){

                        //save it to the model -- no hist update
                        app.modelManager.updateFactoidModel({jsonGraphs: jsonGraphs, nodeMap: nodeMap, text: text}, "me", true);
                    }); //mapping between sentences and node labels
                    notyView.close();

                 });
            // });
        },



        highlightSentenceInText: function(nodeId, highlightColor){


            try {
                let el = $('#factoidBox');


                if (highlightColor == null) {
                    el.highlightTextarea('destroy');
                    return;
                }

                if(nodeMap) {
                    let sentences = nodeMap.sentences[nodeId];

                    let idxCards = nodeMap.idxCards[nodeId];


                    //TODO: open this!!!!!! qtip not working
                    // try {
                    //     cy.$(('#' + nodeId)).qtip({
                    //         content: {
                    //             text: function (event, api) {
                    //
                    //                 let info = (new idxCardView(idxCards)).render();
                    //                 let html = $('#idxCard-container').html();
                    //
                    //
                    //                 api.set('content.text', html);
                    //
                    //                 return html;
                    //
                    //
                    //             }
                    //         },
                    //         show: {
                    //             ready: true
                    //         },
                    //         position: {
                    //             my: 'top center',
                    //             at: 'top middle',
                    //             adjust: {
                    //                 cyViewport: true
                    //             },
                    //             effect: false
                    //         },
                    //         style: {
                    //             classes: 'qtip-bootstrap',
                    //             tip: {
                    //                 width: 20,
                    //                 height: 20
                    //             }
                    //         }
                    //     });
                    //
                    // }
                    // catch(e){
                    //     console.log(e);
                    // }


                    if (sentences) {

                        let ranges = [];

                        for (let i = 0; i < sentences.length; i++) {
                            let startInd = el[0].value.indexOf(sentences[i]);
                            let endInd = startInd + sentences[i].length;
                            ranges.push([startInd, endInd]);
                        }
                        console.log(ranges);

                        el.highlightTextarea({
                            ranges: [{
                                color: highlightColor,//('#FFFF0'),
                                ranges: ranges
                            }]
                        });

                    }
                }
            }
            catch(e){
                console.log(e);
            }
        },

        setFactoidModel: function(factoidModel){
            nodeMap = factoidModel.nodeMap;
            jsonGraphs = factoidModel.jsonGraphs;
            text = factoidModel.text;
        },


        loadFactoidPMC: function() {

            let link = "https://www.ncbi.nlm.nih.gov/pmc/articles/" + $('#pmcBox').val() ;
            socket.emit("HTTPRequest", link,  function(result){
                //console.log(result);

                $('#factoidBox')[0].value = result;
            });
            // loadFactoidModel($(, menu);
        },

        loadFactoidFile: function(e){

            let extension = $("#factoid-file-input")[0].files[0].name.split('.').pop().toLowerCase();


            if(extension == "pdf") {

                let reader = new FileReader();
                reader.onload = function (e) {

                    socket.emit('pdfConvertRequest',this.result, function(pages){

                        //Combine pages
                        let txt  = "";
                        pages.forEach(function(page){

                            page.forEach(function(el){

                                txt += el + " ";
                            });
                            // txt += '\n';
                        });



                        //TODO txtData needs some kind of cleaning
                        $('#factoidBox')[0].value = txt;

                    });



                };
                reader.readAsArrayBuffer($("#factoid-file-input")[0].files[0]);



            }
            else{
                let reader = new FileReader();
                reader.onload = function (e) {

                    $('#factoidBox')[0].value =  this.result; //change text

                };
                reader.readAsText($("#factoid-file-input")[0].files[0]);
            }
        },

        listenToEvents: function(){
            let self = this;

            $('#factoid-text-submit-button').click(function () {
                self.loadFactoidModel($('#factoidBox').val());

            });

            $('#factoid-text-clear-button').click(function () {
                self.text = '';
                $('#factoidBox')[0].value = '';

            });


            $('#factoid-file-input').change(function (e) {
                self.loadFactoidFile(e);

            });

            $('#pmc-id-submit-button').click(function (e) {
                self.loadFactoidPMC();

            });

        }

    };
}



// if( typeof module !== 'undefined' && module.exports){ // expose as a nodejs module
//     module.exports = new FactoidInput();