/*
 * Copyright 2013 Memorial-Sloan Kettering Cancer Center.
 *
 * This file is part of PCViz.
 *
 * PCViz is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * PCViz is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with PCViz. If not, see <http://www.gnu.org/licenses/>.
 */


var _ = require('underscore');

module.exports = function( model){


    return{
        el:'#idxCard-container',
        render: function() {
            // pass variables in using Underscore.js template
            var variables = {
                idxCards: model
            };

            // compile the template using underscore
            var template = _.template( $("#idxCard-template").html()); //funda

            // load the compiled HTML into the Backbone "el"
            $(this.el).html(template(variables));  //funda!!! has to be called like this



            return this;
        },


    }
};