
/**
 * Created by durupina on 11/14/16.
 * Class to visualize oncoprint data
 */

const Oncoprint = require('oncoprintjs');
var DEFAULT_GREY = "rgba(190, 190, 190, 1)";
var MUT_COLOR_MISSENSE = '#008000';
var MUT_COLOR_FUSION = '#8B00C9';
var MUT_COLOR_GERMLINE = '#FFFFFF';
var PROT_COLOR_UP = "#9224A6";
var PROT_COLOR_DOWN = "#00BCD4";

const geneticRuleSet = {
    'type': 'gene',
    'legend_label': 'Genetic Alteration',
    'legend_base_color': DEFAULT_GREY,
    'rule_params':  {

        // Default: gray rectangle
        '*': {
            shapes: [{
                'type': 'rectangle',
                'fill': DEFAULT_GREY,
                'z': 1
            }],
            legend_label: 'No alterations',
        },
        // Copy number alteration
        'disp_cna': {
            // Red rectangle for amplification
            'amp': {
                shapes: [{
                    'type': 'rectangle',
                    'fill': 'rgba(255,0,0,1)',
                    'x': '0%',
                    'y': '0%',
                    'width': '100%',
                    'height': '100%',
                    'z': 2,
                }],
                legend_label: 'Amplification',
            },
            // Light red rectangle for gain
            'gain': {
                shapes: [{
                    'type': 'rectangle',
                    'fill': 'rgba(255,182,193,1)',
                    'x': '0%',
                    'y': '0%',
                    'width': '100%',
                    'height': '100%',
                    'z': 2,
                }],
                legend_label: 'Gain',
            },
            // Blue rectangle for deep deletion
            'homdel': {
                shapes: [{
                    'type': 'rectangle',
                    'fill': 'rgba(0,0,255,1)',
                    'x': '0%',
                    'y': '0%',
                    'width': '100%',
                    'height': '100%',
                    'z': 2,
                }],
                legend_label: 'Deep Deletion',
            },
            // Light blue rectangle for shallow deletion
            'hetloss': {
                shapes: [{
                    'type': 'rectangle',
                    'fill': 'rgba(143, 216, 216,1)',
                    'x': '0%',
                    'y': '0%',
                    'width': '100%',
                    'height': '100%',
                    'z': 2,
                }],
                legend_label: 'Shallow Deletion',
            }
        },
        // mRNA regulation
        'disp_mrna': {
            // Light red outline for upregulation
            'up': {
                shapes: [{
                    'type': 'rectangle',
                    'fill': 'rgba(0, 0, 0, 0)',
                    'stroke': 'rgba(255, 153, 153, 1)',
                    'stroke-width': '2',
                    'x': '0%',
                    'y': '0%',
                    'width': '100%',
                    'height': '100%',
                    'z': 3,
                }],
                legend_label: 'mRNA Upregulation',
            },
            // Light blue outline for downregulation
            'down': {
                shapes: [{
                    'type': 'rectangle',
                    'fill': 'rgba(0, 0, 0, 0)',
                    'stroke': 'rgba(102, 153, 204, 1)',
                    'stroke-width': '2',
                    'x': '0%',
                    'y': '0%',
                    'width': '100%',
                    'height': '100%',
                    'z': 3,
                }],
                legend_label: 'mRNA Downregulation',
            },
        },
        // protein expression regulation
        'disp_prot': {
            // small top rectangle for upregulated
            'up': {
                shapes: [{
                    'type': 'rectangle',
                    'fill': PROT_COLOR_UP,
                    'x':"0%",
                    'y':"0%",
                    'width':"100%",
                    'height':"20%",
                    'z': 4,
                }],
                legend_label: 'Protein Upregulation',
            },
            // small bottom rectangle for upregulated
            'down': {
                shapes: [{
                    'type': 'rectangle',
                    'fill': PROT_COLOR_DOWN,
                    'x':"0%",
                    'y':"80%",
                    'width':"100%",
                    'height':"20%",
                    'z': 4,
                }],
                legend_label: 'Protein Downregulation',
            }
        },
        // fusion
        'disp_fusion': {
            // tall inset purple rectangle for fusion
            'true': {
                shapes: [{
                    'type': 'rectangle',
                    'fill': MUT_COLOR_FUSION,
                    'x': '0%',
                    'y': '20%',
                    'width': '100%',
                    'height': '60%',
                    'z': 5
                }],
                legend_label: 'Fusion'
            }
        },
        // germline
        'disp_germ': {
            // white stripe in the middle
            'true': {
                shapes: [{
                    'type': 'rectangle',
                    'fill': MUT_COLOR_GERMLINE,
                    'x': '0%',
                    'y': '46%',
                    'width': '100%',
                    'height': '8%',
                    'z': 7
                }],
                legend_label: 'Germline Mutation'
            }
        },
        'disp_mut': {
            'trunc,inframe,missense,promoter,trunc_rec,inframe_rec,missense_rec,promoter_rec': {
                shapes: [{
                    'type': 'rectangle',
                    'fill': MUT_COLOR_MISSENSE,
                    'x': '0%',
                    'y': '33.33%',
                    'width': '100%',
                    'height': '33.33%',
                    'z': 6
                }],
                legend_label: 'Mutation',

            }
        }
    }
};

class OncoprintHandler{

    /**
     *
     * @param {Number} width Width of the container element
     */
    constructor(width){
        /**
         *
         * @type {module:oncoprintjs}
         */
        this.oncoprint = new Oncoprint('#oncoprint-container', width);
        // this.updateData(ga_data);
        this.listenToEvents();
    }

    /**
     * Update the Oncoprint with data
     * @param {Object} data
     */
    updateData(data) {
        //clean previous data


        if (this.oncoprint.getTracks().length > 0)
            this.oncoprint.removeAllTracks();

        let share_id = null;

        for (let i = 0; i < data.length; i++) {

            let track_params = {
                'rule_set_params': geneticRuleSet,
                'label': data[i].gene,
                'target_group': 0,
                'sortCmpFn': geneticComparator(),
                'description': data[i].desc,
                'na_z': 1.1,
                'value_key': 'frequency',
                'value_range': [0, 100],

            };
            let new_ga_id = this.oncoprint.addTracks([track_params])[0];
            data[i].track_id = new_ga_id;
            if (i === 0) {
                share_id = new_ga_id;
            } else {
                this.oncoprint.shareRuleSet(share_id, new_ga_id);
            }

        }

        this.oncoprint.hideIds([], true);
        this.oncoprint.keepSorted(false);

        for (let i = 0; i < data.length; i++) {
            this.oncoprint.setTrackData(data[i].track_id, data[i].data, 'sample');
            this.oncoprint.setTrackInfo(data[i].track_id, "");

            this.oncoprint.setTrackTooltipFn(data[i].track_id,  (data) => {
                let sampleInfo = "<b>Sample: " + data.sample + "</b>";
                if(data.disp_mut)
                    sampleInfo += "<p>" + data.disp_mut + " </p>";
                if(data.disp_cna)
                    sampleInfo += "<p>" + data.disp_cna + " </p>";
                if(data.disp_prot)
                    sampleInfo += "<p>" + data.disp_prot + " </p>";
                if(data.disp_fusion)
                    sampleInfo += "<p>" + data.disp_fusion + " </p>";
                if(data.disp_germ)
                    sampleInfo += "<p>" + data.disp_germ + " </p>";
                if(data.disp_mrna)
                    sampleInfo += "<p>" + data.disp_mrna + " </p>";

                return sampleInfo;


            });
        }
        this.oncoprint.keepSorted(false);
        this.oncoprint.releaseRendering();
    }

    /**
     * Listens to Oncoprint events
     */
    listenToEvents() {

        // Basic rangeslider initialization
        $('#oncoprint-zoom').rangeslider({
          // Deactivate the feature detection
          polyfill: false,
          rangeClass: 'rangeslider',
          disabledClass: 'rangeslider--disabled',
          horizontalClass: 'rangeslider--horizontal',
          fillClass: 'rangeslider__fill',
          handleClass: 'rangeslider__handle_custom',


          // Callback function
          onInit: function() {

          },
          // Callback function
          onSlide: function(position, value) {
              let zoom = value/100.0;

              this.oncoprint.setHorzZoom(zoom);
              $('#oncoprint-zoom-value').val(value);

          },

        });

     }

}

module.exports = OncoprintHandler;

function geneticComparator() {
  let cna_key = 'disp_cna';
  let cna_order = {'amp': 0, 'homdel': 1, 'gain': 2, 'hetloss': 3, 'diploid': 4, undefined: 5};
  let mut_type_key = 'disp_mut';
  let mut_order = {'trunc': 0, 'inframe': 1, 'promoter': 2, 'missense': 3, undefined: 4};
  let mrna_key = 'disp_mrna';
  let prot_key = 'disp_prot';
  let reg_order = {'up': 0, 'down': 1, undefined: 2};
  return function (d1, d2) {
    let keys = [cna_key, mut_type_key, mrna_key, prot_key];
    let orders = [cna_order, mut_order, reg_order, reg_order];
    let diff = 0;
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      let order = orders[i];
      if (d1[key] && d2[key]) {
        diff = order[d1[key]] - order[d2[key]];
      } else if (d1[key]) {
        diff = -1;
      } else if (d2[key]) {
        diff = 1;
      }
    }
    return diff;
  }
}


//Sample data
// let ga_data = [
//   {
//     "gene": "GENE0",
//     "frequency": 10,
//
//     "desc": "Annotation for GENE0",
//     "data": [
//       {
//         "disp_cna": "hetloss",
//         "disp_mut": "promoter_rec",
//         "disp_germ": "true",
//         "sample": "TCGA-00"
//       },
//       {
//         "disp_mrna": "up",
//         "disp_prot": "up",
//         "sample": "TCGA-01"
//       },
//       {
//         "disp_cna": "hetloss",
//         "sample": "TCGA-02"
//       },
//       {
//         "sample": "TCGA-03",
//         "disp_germ": "true",
//         "disp_mut": "trunc"
//       },
//       {
//         "disp_mut": "inframe",
//         "sample": "TCGA-04"
//       },
//       {
//         "sample": "TCGA-05"
//       },
//       {
//         "sample": "TCGA-06"
//       },
//       {
//         "disp_cna": "homdel",
//         "sample": "TCGA-07",
//         "disp_mrna": "up"
//       },
//       {
//         "sample": "TCGA-08"
//       },
//       {
//         "sample": "TCGA-09"
//       },
//       {
//         "disp_cna": "amp",
//         "sample": "TCGA-10",
//         "disp_mrna": "up"
//       },
//       {
//         "disp_mrna": "up",
//         "disp_mut": "inframe",
//         "sample": "TCGA-11"
//       },
//       {
//         "disp_cna": "homdel",
//         "disp_mut": "promoter",
//         "sample": "TCGA-12"
//       },
//       {
//         "disp_mut": "promoter",
//         "sample": "TCGA-13"
//       },
//       {
//         "disp_mut": "promoter",
//         "sample": "TCGA-14"
//       },
//       {
//         "disp_mrna": "up",
//         "sample": "TCGA-15"
//       },
//       {
//         "disp_mut": "trunc",
//         "sample": "TCGA-16"
//       },
//       {
//         "disp_mrna": "down",
//         "sample": "TCGA-17"
//       },
//       {
//         "sample": "TCGA-18"
//       },
//       {
//         "disp_prot": "up",
//         "sample": "TCGA-19"
//       },
//       {
//         "disp_prot": "down",
//         "sample": "TCGA-20"
//       },
//       {
//         "disp_mrna": "down",
//         "sample": "TCGA-21"
//       },
//       {
//         "disp_cna": "hetloss",
//         "disp_mut": "trunc",
//         "sample": "TCGA-22",
//         "disp_mrna": "up"
//       },
//       {
//         "sample": "TCGA-23"
//       },
//       {
//         "sample": "TCGA-24"
//       },
//       {
//         "disp_mrna": "up",
//         "sample": "TCGA-25"
//       },
//       {
//         "disp_cna": "hetloss",
//         "sample": "TCGA-26"
//       },
//       {
//         "sample": "TCGA-27"
//       },
//       {
//         "disp_mut": "trunc",
//         "sample": "TCGA-28"
//       },
//       {
//         "sample": "TCGA-29"
//       },
//       {
//         "sample": "TCGA-30"
//       },
//       {
//         "sample": "TCGA-31"
//       },
//       {
//         "disp_cna": "amp",
//         "disp_mut": "inframe",
//         "sample": "TCGA-32"
//       },
//       {
//         "disp_mut": "trunc",
//         "sample": "TCGA-33"
//       },
//       {
//         "sample": "TCGA-34"
//       },
//       {
//         "disp_mut": "promoter",
//         "sample": "TCGA-35"
//       },
//       {
//         "disp_cna": "gain",
//         "disp_prot": "down",
//         "sample": "TCGA-36"
//       },
//       {
//         "disp_cna": "gain",
//         "disp_mut": "inframe",
//         "sample": "TCGA-37"
//       },
//       {
//         "disp_mut": "inframe",
//         "sample": "TCGA-38"
//       },
//       {
//         "sample": "TCGA-39"
//       },
//       {
//         "disp_prot": "down",
//         "sample": "TCGA-40"
//       },
//       {
//         "disp_prot": "up",
//         "sample": "TCGA-41"
//       },
//       {
//         "disp_mrna": "down",
//         "disp_prot": "down",
//         "sample": "TCGA-42"
//       },
//       {
//         "disp_prot": "down",
//         "sample": "TCGA-43"
//       },
//       {
//         "disp_cna": "gain",
//         "sample": "TCGA-44"
//       },
//       {
//         "disp_cna": "amp",
//         "sample": "TCGA-45"
//       },
//       {
//         "disp_cna": "amp",
//         "disp_prot": "up",
//         "disp_mut": "trunc",
//         "sample": "TCGA-46",
//         "disp_mrna": "up"
//       },
//       {
//         "disp_mut": "promoter",
//         "sample": "TCGA-47"
//       },
//       {
//         "disp_cna": "amp",
//         "sample": "TCGA-48"
//       },
//       {
//         "disp_prot": "down",
//         "sample": "TCGA-49"
//       }
//     ]
//   },
//   {
//     "gene": "GENE1",
//     "desc": "Annotation for GENE1",
//     "data": [
//       {
//         "sample": "TCGA-00"
//       },
//       {
//         "sample": "TCGA-01"
//       },
//       {
//         "disp_mut": "inframe",
//         "sample": "TCGA-02"
//       },
//       {
//         "disp_mrna": "down",
//         "disp_prot": "up",
//         "disp_mut": "trunc",
//         "sample": "TCGA-03"
//       },
//       {
//         "disp_mut": "missense",
//         "sample": "TCGA-04"
//       },
//       {
//         "sample": "TCGA-05"
//       },
//       {
//         "disp_prot": "up",
//         "disp_mut": "missense",
//         "sample": "TCGA-06"
//       },
//       {
//         "sample": "TCGA-07"
//       },
//       {
//         "sample": "TCGA-08"
//       },
//       {
//         "sample": "TCGA-09"
//       },
//       {
//         "disp_cna": "homdel",
//         "disp_mut": "missense",
//         "sample": "TCGA-10"
//       },
//       {
//         "disp_prot": "up",
//         "sample": "TCGA-11"
//       },
//       {
//         "disp_mrna": "up",
//         "sample": "TCGA-12"
//       },
//       {
//         "disp_cna": "gain",
//         "disp_mut": "promoter",
//         "sample": "TCGA-13"
//       },
//       {
//         "disp_cna": "diploid",
//         "sample": "TCGA-14"
//       },
//       {
//         "disp_cna": "gain",
//         "disp_mut": "promoter",
//         "sample": "TCGA-15"
//       },
//       {
//         "sample": "TCGA-16"
//       },
//       {
//         "sample": "TCGA-17"
//       },
//       {
//         "disp_cna": "diploid",
//         "disp_mut": "trunc",
//         "sample": "TCGA-18",
//         "disp_mrna": "up"
//       },
//       {
//         "disp_mrna": "up",
//         "disp_prot": "up",
//         "sample": "TCGA-19"
//       },
//       {
//         "disp_prot": "down",
//         "disp_mut": "missense",
//         "sample": "TCGA-20"
//       },
//       {
//         "disp_cna": "hetloss",
//         "sample": "TCGA-21"
//       },
//       {
//         "disp_mut": "inframe",
//         "sample": "TCGA-22"
//       },
//       {
//         "disp_cna": "amp",
//         "sample": "TCGA-23"
//       },
//       {
//         "sample": "TCGA-24"
//       },
//       {
//         "disp_mrna": "down",
//         "sample": "TCGA-25"
//       },
//       {
//         "disp_mrna": "up",
//         "disp_mut": "inframe",
//         "sample": "TCGA-26"
//       },
//       {
//         "disp_mut": "inframe",
//         "sample": "TCGA-27"
//       },
//       {
//         "disp_cna": "homdel",
//         "sample": "TCGA-28"
//       },
//       {
//         "disp_cna": "gain",
//         "sample": "TCGA-29"
//       },
//       {
//         "sample": "TCGA-30"
//       },
//       {
//         "disp_mut": "promoter",
//         "sample": "TCGA-31"
//       },
//       {
//         "disp_prot": "down",
//         "sample": "TCGA-32"
//       },
//       {
//         "sample": "TCGA-33"
//       },
//       {
//         "sample": "TCGA-34"
//       },
//       {
//         "sample": "TCGA-35"
//       },
//       {
//         "disp_cna": "amp",
//         "disp_prot": "up",
//         "sample": "TCGA-36"
//       },
//       {
//         "disp_cna": "amp",
//         "disp_prot": "down",
//         "sample": "TCGA-37",
//         "disp_mrna": "down"
//       },
//       {
//         "sample": "TCGA-38"
//       },
//       {
//         "sample": "TCGA-39"
//       },
//       {
//         "sample": "TCGA-40"
//       },
//       {
//         "disp_cna": "hetloss",
//         "disp_prot": "up",
//         "disp_mut": "missense",
//         "sample": "TCGA-41",
//         "disp_mrna": "up"
//       },
//       {
//         "disp_mut": "trunc",
//         "sample": "TCGA-42"
//       },
//       {
//         "disp_cna": "homdel",
//         "disp_mut": "promoter",
//         "sample": "TCGA-43"
//       },
//       {
//         "sample": "TCGA-44"
//       },
//       {
//         "disp_cna": "diploid",
//         "disp_mut": "inframe",
//         "sample": "TCGA-45",
//         "disp_mrna": "up"
//       },
//       {
//         "sample": "TCGA-46"
//       },
//       {
//         "disp_mut": "inframe",
//         "sample": "TCGA-47"
//       },
//       {
//         "disp_mrna": "down",
//         "sample": "TCGA-48"
//       },
//       {
//         "disp_cna": "diploid",
//         "disp_prot": "up",
//         "sample": "TCGA-49"
//       }
//     ]
//   },
//   {
//     "gene": "GENE2",
//     "desc": "Annotation for GENE2",
//     "data": [
//       {
//         "disp_cna": "homdel",
//         "sample": "TCGA-00"
//       },
//       {
//         "sample": "TCGA-01"
//       },
//       {
//         "sample": "TCGA-02"
//       },
//       {
//         "disp_cna": "homdel",
//         "disp_prot": "up",
//         "disp_mut": "promoter",
//         "sample": "TCGA-03"
//       },
//       {
//         "disp_prot": "up",
//         "disp_mut": "promoter",
//         "sample": "TCGA-04"
//       },
//       {
//         "disp_prot": "up",
//         "disp_mut": "missense",
//         "sample": "TCGA-05"
//       },
//       {
//         "disp_mrna": "up",
//         "sample": "TCGA-06"
//       },
//       {
//         "disp_cna": "gain",
//         "sample": "TCGA-07"
//       },
//       {
//         "disp_mut": "promoter",
//         "sample": "TCGA-08"
//       },
//       {
//         "disp_prot": "down",
//         "sample": "TCGA-09"
//       },
//       {
//         "disp_cna": "gain",
//         "disp_mut": "missense",
//         "sample": "TCGA-10"
//       },
//       {
//         "disp_mrna": "up",
//         "disp_prot": "up",
//         "disp_mut": "inframe",
//         "sample": "TCGA-11"
//       },
//       {
//         "disp_mrna": "up",
//         "sample": "TCGA-12"
//       },
//       {
//         "sample": "TCGA-13"
//       },
//       {
//         "disp_cna": "gain",
//         "disp_mut": "missense",
//         "sample": "TCGA-14"
//       },
//       {
//         "sample": "TCGA-15"
//       },
//       {
//         "disp_prot": "up",
//         "disp_mut": "trunc",
//         "sample": "TCGA-16"
//       },
//       {
//         "disp_mrna": "up",
//         "sample": "TCGA-17"
//       },
//       {
//         "disp_cna": "amp",
//         "sample": "TCGA-18",
//         "disp_mrna": "up"
//       },
//       {
//         "sample": "TCGA-19"
//       },
//       {
//         "disp_cna": "diploid",
//         "disp_prot": "down",
//         "sample": "TCGA-20"
//       },
//       {
//         "disp_prot": "down",
//         "sample": "TCGA-21"
//       },
//       {
//         "disp_mrna": "down",
//         "disp_mut": "missense",
//         "sample": "TCGA-22"
//       },
//       {
//         "disp_mut": "missense",
//         "sample": "TCGA-23"
//       },
//       {
//         "disp_prot": "up",
//         "sample": "TCGA-24"
//       },
//       {
//         "disp_prot": "up",
//         "disp_mut": "inframe",
//         "sample": "TCGA-25"
//       },
//       {
//         "disp_cna": "gain",
//         "disp_mut": "missense",
//         "sample": "TCGA-26"
//       },
//       {
//         "disp_mrna": "down",
//         "sample": "TCGA-27"
//       },
//       {
//         "disp_mrna": "up",
//         "disp_prot": "up",
//         "sample": "TCGA-28"
//       },
//       {
//         "sample": "TCGA-29"
//       },
//       {
//         "sample": "TCGA-30"
//       },
//       {
//         "disp_cna": "homdel",
//         "disp_mut": "promoter",
//         "sample": "TCGA-31",
//         "disp_mrna": "up"
//       },
//       {
//         "disp_prot": "down",
//         "sample": "TCGA-32"
//       },
//       {
//         "disp_cna": "homdel",
//         "sample": "TCGA-33"
//       },
//       {
//         "disp_prot": "up",
//         "disp_mut": "promoter",
//         "sample": "TCGA-34"
//       },
//       {
//         "disp_mut": "trunc",
//         "sample": "TCGA-35"
//       },
//       {
//         "sample": "TCGA-36"
//       },
//       {
//         "sample": "TCGA-37"
//       },
//       {
//         "disp_mrna": "down",
//         "disp_mut": "missense",
//         "sample": "TCGA-38"
//       },
//       {
//         "disp_mrna": "up",
//         "sample": "TCGA-39"
//       },
//       {
//         "sample": "TCGA-40"
//       },
//       {
//         "disp_mut": "inframe",
//         "sample": "TCGA-41"
//       },
//       {
//         "disp_mut": "trunc",
//         "sample": "TCGA-42"
//       },
//       {
//         "sample": "TCGA-43"
//       },
//       {
//         "disp_prot": "down",
//         "sample": "TCGA-44"
//       },
//       {
//         "disp_cna": "diploid",
//         "sample": "TCGA-45",
//         "disp_mrna": "down"
//       },
//       {
//         "disp_cna": "amp",
//         "sample": "TCGA-46"
//       },
//       {
//         "disp_mrna": "down",
//         "sample": "TCGA-47"
//       },
//       {
//         "sample": "TCGA-48"
//       },
//       {
//         "disp_cna": "amp",
//         "disp_mut": "inframe",
//         "sample": "TCGA-49",
//         "disp_mrna": "up"
//       }
//     ]
//   },
//   {
//     "gene": "GENE3",
//     "desc": "Annotation for GENE3",
//     "data": [
//       {
//         "disp_prot": "down",
//         "disp_mut": "trunc",
//         "sample": "TCGA-00"
//       },
//       {
//         "disp_cna": "diploid",
//         "sample": "TCGA-01"
//       },
//       {
//         "sample": "TCGA-02"
//       },
//       {
//         "disp_prot": "up",
//         "sample": "TCGA-03"
//       },
//       {
//         "sample": "TCGA-04"
//       },
//       {
//         "sample": "TCGA-05"
//       },
//       {
//         "sample": "TCGA-06"
//       },
//       {
//         "disp_mrna": "down",
//         "sample": "TCGA-07"
//       },
//       {
//         "sample": "TCGA-08"
//       },
//       {
//         "sample": "TCGA-09"
//       },
//       {
//         "disp_cna": "amp",
//         "disp_prot": "up",
//         "disp_mut": "missense",
//         "sample": "TCGA-10",
//         "disp_mrna": "up"
//       },
//       {
//         "sample": "TCGA-11"
//       },
//       {
//         "disp_cna": "diploid",
//         "disp_prot": "down",
//         "sample": "TCGA-12",
//         "disp_mrna": "down"
//       },
//       {
//         "disp_cna": "gain",
//         "sample": "TCGA-13"
//       },
//       {
//         "disp_mut": "missense",
//         "sample": "TCGA-14"
//       },
//       {
//         "disp_cna": "homdel",
//         "disp_mut": "missense",
//         "sample": "TCGA-15"
//       },
//       {
//         "sample": "TCGA-16"
//       },
//       {
//         "disp_cna": "amp",
//         "sample": "TCGA-17"
//       },
//       {
//         "disp_mut": "trunc",
//         "sample": "TCGA-18"
//       },
//       {
//         "sample": "TCGA-19"
//       },
//       {
//         "sample": "TCGA-20"
//       },
//       {
//         "disp_cna": "homdel",
//         "sample": "TCGA-21"
//       },
//       {
//         "disp_mrna": "up",
//         "sample": "TCGA-22"
//       },
//       {
//         "disp_mut": "inframe",
//         "sample": "TCGA-23"
//       },
//       {
//         "disp_mut": "trunc",
//         "sample": "TCGA-24"
//       },
//       {
//         "sample": "TCGA-25"
//       },
//       {
//         "sample": "TCGA-26"
//       },
//       {
//         "disp_cna": "hetloss",
//         "sample": "TCGA-27"
//       },
//       {
//         "disp_prot": "up",
//         "disp_mut": "trunc",
//         "sample": "TCGA-28"
//       },
//       {
//         "disp_cna": "homdel",
//         "sample": "TCGA-29",
//         "disp_mrna": "down"
//       },
//       {
//         "sample": "TCGA-30"
//       },
//       {
//         "disp_cna": "homdel",
//         "disp_mut": "promoter",
//         "sample": "TCGA-31"
//       },
//       {
//         "sample": "TCGA-32"
//       },
//       {
//         "sample": "TCGA-33"
//       },
//       {
//         "disp_cna": "gain",
//         "disp_prot": "up",
//         "sample": "TCGA-34"
//       },
//       {
//         "sample": "TCGA-35"
//       },
//       {
//         "disp_mrna": "up",
//         "disp_prot": "up",
//         "disp_mut": "inframe",
//         "sample": "TCGA-36"
//       },
//       {
//         "disp_mrna": "up",
//         "disp_mut": "trunc",
//         "sample": "TCGA-37"
//       },
//       {
//         "disp_cna": "hetloss",
//         "sample": "TCGA-38"
//       },
//       {
//         "disp_mut": "inframe",
//         "sample": "TCGA-39"
//       },
//       {
//         "sample": "TCGA-40"
//       },
//       {
//         "disp_mrna": "up",
//         "sample": "TCGA-41"
//       },
//       {
//         "disp_cna": "amp",
//         "sample": "TCGA-42"
//       },
//       {
//         "sample": "TCGA-43"
//       },
//       {
//         "disp_mut": "promoter",
//         "sample": "TCGA-44"
//       },
//       {
//         "sample": "TCGA-45"
//       },
//       {
//         "sample": "TCGA-46"
//       },
//       {
//         "disp_prot": "down",
//         "disp_mut": "promoter",
//         "sample": "TCGA-47"
//       },
//       {
//         "sample": "TCGA-48"
//       },
//       {
//         "disp_prot": "up",
//         "disp_mut": "promoter",
//         "sample": "TCGA-49"
//       }
//     ]
//   },
//   {
//     "gene": "GENE4",
//     "desc": "Annotation for GENE4",
//     "data": [
//       {
//         "disp_cna": "diploid",
//         "sample": "TCGA-00"
//       },
//       {
//         "sample": "TCGA-01"
//       },
//       {
//         "sample": "TCGA-02"
//       },
//       {
//         "disp_cna": "amp",
//         "disp_mut": "trunc",
//         "sample": "TCGA-03"
//       },
//       {
//         "disp_mut": "inframe",
//         "sample": "TCGA-04"
//       },
//       {
//         "sample": "TCGA-05"
//       },
//       {
//         "disp_cna": "amp",
//         "sample": "TCGA-06"
//       },
//       {
//         "sample": "TCGA-07"
//       },
//       {
//         "sample": "TCGA-08"
//       },
//       {
//         "disp_prot": "up",
//         "sample": "TCGA-09"
//       },
//       {
//         "disp_mrna": "down",
//         "sample": "TCGA-10"
//       },
//       {
//         "disp_cna": "gain",
//         "sample": "TCGA-11"
//       },
//       {
//         "sample": "TCGA-12"
//       },
//       {
//         "disp_cna": "amp",
//         "sample": "TCGA-13"
//       },
//       {
//         "sample": "TCGA-14"
//       },
//       {
//         "disp_prot": "down",
//         "sample": "TCGA-15"
//       },
//       {
//         "disp_cna": "homdel",
//         "sample": "TCGA-16"
//       },
//       {
//         "disp_mut": "promoter",
//         "sample": "TCGA-17"
//       },
//       {
//         "disp_cna": "homdel",
//         "sample": "TCGA-18"
//       },
//       {
//         "disp_prot": "up",
//         "sample": "TCGA-19"
//       },
//       {
//         "disp_cna": "hetloss",
//         "sample": "TCGA-20"
//       },
//       {
//         "sample": "TCGA-21"
//       },
//       {
//         "disp_mrna": "down",
//         "disp_prot": "down",
//         "sample": "TCGA-22"
//       },
//       {
//         "disp_mrna": "up",
//         "sample": "TCGA-23"
//       },
//       {
//         "disp_prot": "down",
//         "sample": "TCGA-24"
//       },
//       {
//         "sample": "TCGA-25"
//       },
//       {
//         "disp_cna": "hetloss",
//         "disp_mut": "promoter",
//         "sample": "TCGA-26"
//       },
//       {
//         "sample": "TCGA-27"
//       },
//       {
//         "disp_mrna": "up",
//         "disp_prot": "up",
//         "sample": "TCGA-28"
//       },
//       {
//         "sample": "TCGA-29"
//       },
//       {
//         "sample": "TCGA-30"
//       },
//       {
//         "disp_prot": "up",
//         "sample": "TCGA-31"
//       },
//       {
//         "disp_cna": "gain",
//         "sample": "TCGA-32",
//         "disp_mrna": "down"
//       },
//       {
//         "disp_cna": "gain",
//         "sample": "TCGA-33"
//       },
//       {
//         "disp_mrna": "down",
//         "disp_prot": "up",
//         "sample": "TCGA-34"
//       },
//       {
//         "disp_cna": "amp",
//         "sample": "TCGA-35"
//       },
//       {
//         "disp_mut": "missense",
//         "sample": "TCGA-36"
//       },
//       {
//         "sample": "TCGA-37"
//       },
//       {
//         "disp_prot": "up",
//         "sample": "TCGA-38"
//       },
//       {
//         "sample": "TCGA-39"
//       },
//       {
//         "sample": "TCGA-40"
//       },
//       {
//         "disp_cna": "gain",
//         "sample": "TCGA-41"
//       },
//       {
//         "disp_cna": "homdel",
//         "sample": "TCGA-42",
//         "disp_mrna": "down"
//       },
//       {
//         "disp_mrna": "down",
//         "disp_prot": "up",
//         "sample": "TCGA-43"
//       },
//       {
//         "disp_mut": "promoter",
//         "sample": "TCGA-44"
//       },
//       {
//         "disp_prot": "up",
//         "sample": "TCGA-45"
//       },
//       {
//         "sample": "TCGA-46"
//       },
//       {
//         "disp_mrna": "down",
//         "disp_prot": "up",
//         "disp_mut": "inframe",
//         "sample": "TCGA-47"
//       },
//       {
//         "disp_cna": "diploid",
//         "disp_mut": "missense",
//         "sample": "TCGA-48"
//       },
//       {
//         "disp_cna": "homdel",
//         "disp_prot": "up",
//         "sample": "TCGA-49",
//         "disp_mrna": "up"
//       }
//     ]
//   }
// ];

