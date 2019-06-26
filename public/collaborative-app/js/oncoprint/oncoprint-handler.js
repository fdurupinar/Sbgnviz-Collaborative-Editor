
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

