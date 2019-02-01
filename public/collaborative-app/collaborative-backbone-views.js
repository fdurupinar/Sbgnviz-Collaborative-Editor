var jquery = $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');


var PathsBetweenQueryView = Backbone.View.extend({
    defaultQueryParameters: {
        geneSymbols: "mdm2\ntp53", //TODO: for easy debugging only
        lengthLimit: 1
    },
    currentQueryParameters: null,
    initialize: function () {
        var self = this;
        self.copyProperties();
        self.template = _.template($("#query-pathsbetween-template").html());
        self.template = self.template(self.currentQueryParameters);
    },
    copyProperties: function () {
        this.currentQueryParameters = _.clone(this.defaultQueryParameters);
    },
    render: function () {
        var self = this;
        self.template = _.template($("#query-pathsbetween-template").html());
        self.template = self.template(self.currentQueryParameters);
        $(self.el).html(self.template);

        $(self.el).modal('show');

        $("#query-pathsbetween-enable-shortest-k-alteration").change(function (e) {
            if (document.getElementById("query-pathsbetween-enable-shortest-k-alteration").checked) {
                $("#query-pathsbetween-shortest-k").prop("disabled", false);
            } else {
                $("#query-pathsbetween-shortest-k").prop("disabled", true);
            }
        });

        $(document).off("click", "#save-query-pathsbetween").on("click", "#save-query-pathsbetween", function (evt) {

            self.currentQueryParameters.geneSymbols = document.getElementById("query-pathsbetween-gene-symbols").value;
            self.currentQueryParameters.lengthLimit = Number(document.getElementById("query-pathsbetween-length-limit").value);

            if (self.currentQueryParameters.geneSymbols.length === 0) {
                document.getElementById("query-pathsbetween-gene-symbols").focus();
                return;
            }

            var queryURL = "http://www.pathwaycommons.org/pc2/graph?format=SBGN&kind=PATHSBETWEEN&limit="
                + self.currentQueryParameters.lengthLimit;

            var sources = "";
            var filename = "";
            var geneSymbolsArray = self.currentQueryParameters.geneSymbols.replace("\n", " ").replace("\t", " ").split(" ");

            for (var i = 0; i < geneSymbolsArray.length; i++) {
                var currentGeneSymbol = geneSymbolsArray[i];
                if (currentGeneSymbol.length == 0 || currentGeneSymbol == ' '
                    || currentGeneSymbol == '\n' || currentGeneSymbol == '\t') {
                    continue;
                }
                sources = sources + "&source=" + currentGeneSymbol;

            }

            appUtilities.getActiveChiseInstance().startSpinner('paths-between-spinner');



            queryURL = queryURL + sources;


            $.ajax({
                url: queryURL,
                type: 'GET',
                dataType: 'text',
                success: function (data) {

                    let chiseInst = appUtilities.createNewNetwork(); //opens a new tab


                    let jsonObj = chiseInst.convertSbgnmlTextToJson(data);

                    chiseInst.updateGraph(jsonObj, function() {

                    }, true);

                    // appUtilities.getChiseInstance(data.cyId).updateGraph(jsonObj, function(){
                    //     app.modelManager.initModel(appUtilities.getCyInstance(data.cyId).nodes(), appUtilities.getCyInstance(data.cyId).edges(), appUtilities, "me");
                    //
                    //     appUtilities.setActiveNetwork(data.cyId);
                    //
                    //     $("#perform-layout").trigger('click');
                    //
                    //     if (callback) callback("success");
                    // });
                    //
                    //
                    // // //because window opening takes a while
                    // setTimeout(function () {
                    //     var json = appUtilities.getActiveChiseInstance().convertSbgnmlTextToJson(data);
                    //     w.postMessage(JSON.stringify(json), "*");
                    // }, 2000);

                    appUtilities.getActiveChiseInstance().endSpinner('paths-between-spinner');
                },
                error: function (request, status, error) {
                    console.log(request.responseText);
                    appUtilities.getActiveChiseInstance().endSpinner('paths-between-spinner');
                }



            });

            $(self.el).modal('toggle');


        });

        $(document).off("click", "#cancel-query-pathsbetween").on("click", "#cancel-query-pathsbetween", function (evt) {
            $(self.el).modal('toggle');
        });

        return this;
    }
});

/**
 * Paths By URI Query view for the Sample Application.
 */
var PathsByURIQueryView = Backbone.View.extend({
    defaultQueryParameters: {
        URI: ""
    },
    currentQueryParameters: null,
    initialize: function () {
        var self = this;
        self.copyProperties();
        self.template = _.template($("#query-pathsbyURI-template").html());
        self.template = self.template(self.currentQueryParameters);
    },
    copyProperties: function () {
        this.currentQueryParameters = _.clone(this.defaultQueryParameters);
    },
    render: function () {
        var self = this;
        self.template = _.template($("#query-pathsbyURI-template").html());
        self.template = self.template(self.currentQueryParameters);
        $(self.el).html(self.template);

        $(self.el).modal('show');

        $(document).off("click", "#save-query-pathsbyURI").on("click", "#save-query-pathsbyURI", function (evt) {

            self.currentQueryParameters.URI = document.getElementById("query-pathsbyURI-URI").value;

            if (self.currentQueryParameters.URI.length === 0) {
                document.getElementById("query-pathsbyURI-gene-symbols").focus();
                return;
            }

            var queryURL = "http://www.pathwaycommons.org/pc2/get?uri="
                + self.currentQueryParameters.URI + "&format=SBGN";
            /*var queryURL = "http://www.pathwaycommons.org/pc2/get?uri=http://identifiers.org/uniprot/"
             + self.currentQueryParameters.URI + "&format=SBGN";*/
            var filename = "";
            var uri = self.currentQueryParameters.URI;
            //
            // if (filename == '') {
            //     filename = uri;
            // } else {
            //     filename = filename + '_' + uri;
            // }

            //filename = filename + '_URI.sbgnml';
            //setFileContent(filename);

            appUtilities.getActiveChiseInstance().startSpinner('paths-between-spinner');

            $.ajax({
                url: queryURL,
                type: 'GET',
                dataType: 'text',
                success: function (data) {
                    let chiseInst = appUtilities.createNewNetwork(); //opens a new tab


                    let jsonObj = chiseInst.convertSbgnmlTextToJson(data);

                    chiseInst.updateGraph(jsonObj, function() {

                    }, true);

                    appUtilities.getActiveChiseInstance().endSpinner('paths-between-spinner');


                }
            });

            $(self.el).modal('toggle');
        });

        $(document).off("click", "#cancel-query-pathsbyURI").on("click", "#cancel-query-pathsbyURI", function (evt) {
            $(self.el).modal('toggle');
        });

        return this;
    }
});


module.exports = {
    PathsBetweenQueryView: PathsBetweenQueryView,
    PathsByURIQueryView: PathsByURIQueryView,

};
