/*jshint browser:true, strict:false, maxlen: 200  */
/*globals define, console */

define(['dojo/_base/declare', 'jimu/BaseWidget', 'dojo/_base/lang', "dojo/json", "dojo/on",
       "esri/dijit/Search", "esri/layers/FeatureLayer",
       "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/Color",
       "esri/tasks/AlgorithmicColorRamp", "esri/tasks/GenerateRendererParameters", "esri/tasks/GenerateRendererTask",
       "esri/tasks/ClassBreaksDefinition"],
    function (declare, BaseWidget, lang, JSON, on,
        Search, FeatureLayer,
        SLS, SFS, Color,
        AlgorithmicColorRamp, GenerateRendererParameters, GenerateRendererTask,
        ClassBreaksDefinition
      ) {
        //To create a widget, you need to derive from BaseWidget.
        return declare([BaseWidget], {
            // Custom widget code goes here

            baseClass: 'jimu-widget-customwidget',
            layers: [],
            activeDirection: undefined,
            activeYear: undefined,
            activeMode: undefined,
            activeField: undefined,

            activeLayer: undefined,
            activeFeatureLayer: undefined,
            activeServiceId: undefined,

            activeLocation: null,
            color1: "#FFDD88",
            color2: "#FF2A00",
            transparencyFN: function (i, t) {
                return 0.6 + 0.3 * i / t;
            },
            colors: ["#c5e5f9", "#80bce0", "#615AA6", "#9944DD", "#ED2DFD"],
            maskLayer: null,
            whereClause: "",

            legend: null,
            lowRenderer: null,

            //this property is set by the framework when widget is loaded.
            //name: 'CustomWidget',


            //methods to communication with app container:

            // postCreate: function() {
            //   this.inherited(arguments);
            //   console.log('postCreate');
            // },

            startup: function () {
                this.inherited(arguments);
                //        this.mapIdNode.innerHTML = 'map id:' + this.map.id;

                //--- SEARCH BOX ---//
                this.searchBox = new Search({
                    map: this.map,
                    sources: [
                        {
                            featureLayer: new FeatureLayer(this.config.searchService.url),
                            autoNavigate: false,
                            enableInfoWindow: false,
                            searchFields: this.config.searchService.searchFields,
                            displayField: this.config.searchService.displayField,
                            exactMatch: false,
                            outFields: this.config.searchService.outFields,
                            name: this.config.searchService.name,
                            placeholder: this.config.searchService.placeholder,
                            //infoTemplate: new InfoTemplate("hello"),
                            maxResults: 6,
                            maxSuggestions: 10,
                            enableSuggestions: true,
                            minCharacters: 0,
                            highlightSymbol: new SFS(SFS.STYLE_SOLID,
                                new SLS(SLS.STYLE_NULL, new Color([19, 52, 105, 0.9]), 0),
                                new Color([255, 255, 0, 0.9]))
                        }]
                }, this.travelSearch);
                this.searchBox.on("select-result", lang.hitch(this, this.searchTravelData));
                this.searchBox.startup();


                //--- LAYERS ---///
                for (var f=0; f < this.config.layers.length; f++) {
                    var thisLayerConfig = this.config.layers[f];
                    var thisLayer = new FeatureLayer(thisLayerConfig.url, {
                        visible: false,
                        id: thisLayerConfig.idName
                    });
                    this.layers[f] = thisLayerConfig;
                    this.layers[f].layer = thisLayer;
                    this.map.addLayer(thisLayer, 0);
                }



                //--- FORM UI ---//
                this.activeField = this.config.valueField;
                for (var i = 0; i < this.config.displayVariables.length; i++) {
                    var thisVar = this.config.displayVariables[i];
                    var numValues = thisVar.values.length;
                    //Use a max of col-xs-10
                    var colSize = (numValues <= 3) ? Math.floor(12 / numValues) : 12;
                    var thisDiv = document.createElement("div");
                    thisDiv.setAttribute("class", "btn-group col-xs-12");
                    thisDiv.setAttribute("data-toggle", "buttons-radio");
                    thisDiv.innerHTML="<h5>" + thisVar.name + "</h5>";
                    for (var j=0; j < thisVar.values.length; j++) {
                        var thisValue = document.createElement("button");
                        thisValue.setAttribute("class", "btn btn-primary col-xs-" + colSize );
                        thisValue.setAttribute("value", thisVar.values[j]);
                        thisValue.setAttribute("name", thisVar.bindTo);
                        thisValue.innerHTML = thisVar.displayValues[j];
                        on(thisValue, "click", lang.hitch(this, this.setProperty, thisVar.bindTo, thisVar.values[j]));

                        thisDiv.appendChild(thisValue);
                    }
                    this.widgetDiv.appendChild(thisDiv);

                }
                this.legendDiv = document.createElement("div");
                this.legendDiv.setAttribute("class", "travel-legend col-xs-12");
                this.widgetDiv.appendChild(this.legendDiv);


                //--- RENDERERS ---//

            },

            setProperty: function (propName, value) {
                this[propName] = value;
                this.updateSelf();
            },
            updateSelf: function() {
                //Set the visible layer
                for (var f = 0; f < this.layers.length; f++) {
                    var thisLayer = this.layers[f];
                    /* NOTE: This is probably the most hard coded aspect.  Should change to iterate through displayVariables, use that to populate a testing array and evaluate */
                    if (/*this.activeDirection === thisLayer.Direction &&*/ this.activeMode === thisLayer.Mode && this.activeYear === thisLayer.Year) {
                        this.activeFeatureLayer = thisLayer;
                        this.activeField = (thisLayer.hasOwnProperty("valueField")) ? this.activeFeatureLayer.valueField : this.config.valueField;
                    } else {
                        thisLayer.layer.hide();
                    }
                }

                if (this.activeFeatureLayer !== null && this.activeField !== null && this.activeLocation !== null) {
                    this.classBreaks('_2008', 4);
                    //this.smartMap();
                }
            },

            onOpen: function () {
                console.log('onOpen');
            },

             onClose: function(){
               for (var c = 0; c < this.layers.length; c++) {
                   this.layers[c].layer.hide();
               }
             },

            // onMinimize: function(){
            //   console.log('onMinimize');
            // },

            // onMaximize: function(){
            //   console.log('onMaximize');
            // },

            // onSignIn: function(credential){
            //   /* jshint unused:false*/
            //   console.log('onSignIn');
            // },

            // onSignOut: function(){
            //   console.log('onSignOut');
            // }

            // onPositionChange: function(){
            //   console.log('onPositionChange');
            // },

            // resize: function(){
            //   console.log('resize');
            // }

            //methods to communication between widgets:

            //Function methods
            searchTravelData: function (e) {
                var thisGraphic = e.result.feature;

                this.searchBox.set('value', e.result.name);
                this.map.centerAndZoom(e.result.extent.getCenter(), 7);

                this.activeLocation = thisGraphic.attributes[this.config.searchService.keyField];
                if (this.activeFeatureLayer) {
                    this.activeFeatureLayer.layer.suspend();
                }

                for (var q = 0; q < this.layers.length; q++) {
                    var defExp = this.layers[q].keyField + " = '" + this.activeLocation + "'";
                    this.layers[q].layer.setDefinitionExpression(defExp);
                }

                if (this.activeFeatureLayer !== null && this.activeField !== null && this.activeLocation !== null) {
                    this.classBreaks('_2008', 4);
//                    this.smartMap();
                }


            },
//             smartMap: function() {
//                 console.log(this);
//                 var req = smartMapping.createClassedColorRenderer({
//                     layer: this.activeFeatureLayer.layer,
//                     field: this.activeField,
//                     basemap: 'dark-gray',
//                     classificationMethod: "natural-breaks",
//                     numClasses: 5
//                 });
//                 console.log(req);
//                 req.then(lang.hitch(this, this.applyFeatureRenderer));
// //                this.applyFeatureRenderer({r:'hello'});
//             },
            // applyFeatureRenderer: function(response) {
            //     var renderer = response;
            //     var stops = [];
            //     var numStops = renderer.infos.length;
            //
            //     while (this.legendDiv.firstChild) {
            //         this.legendDiv.removeChild(this.legendDiv.firstChild);
            //     }
            //     var thisTable = document.createElement('table');
            //     thisTable.setAttribute('class', 'travel-legend-table');
            //
            //     //Manually adjust the infos for the 2040 to reflect a new max class
            //     if (numStops === 5) {
            //         var maxSymbol = new SFS("solid", new SLS(SLS.STYLE_SOLID, new Color([63, 63, 65, 255]), 0.25), Color.fromHex(this.colors[this.colors.length-1]));
            //         var newRenderer = new ClassBreaksRenderer(maxSymbol, this.activeField);
            //         var maxValue = renderer.infos[numStops-1].classMaxValue;
            //         for (var s=0; s < numStops-1; s++) {
            //             var thisbreakInfo = this.lowRenderer.infos[s];
            //             newRenderer.addBreak(thisbreakInfo.minValue, thisbreakInfo.maxValue, thisbreakInfo.symbol);
            //         }
            //         newRenderer.addBreak(newRenderer.infos[numStops-2].maxValue, maxValue, maxSymbol);
            //         renderer = newRenderer;
            //     }
            //
            //     for (var t=0; t < numStops; t++) {
            //         stops.push({value: renderer.breaks[t][1]});
            //         Color.fromHex(this.colors[t], renderer.infos[t].symbol.color);
            //         renderer.infos[t].symbol.color.a =  this.transparencyFN(t+1, numStops);
            //         //legend
            //         var thisLegendRow = document.createElement('tr');
            //         thisLegendRow.setAttribute('class', '.travel-legend-row');
            //         var swatchCell = document.createElement('td');
            //         var labelCell = document.createElement('td');
            //         swatchCell.setAttribute('class', 'travel-swatch');
            //         labelCell.setAttribute('class', 'travel-label');
            //         var thisSwatch = document.createElement('div');
            //         var thisRGBA = [renderer.infos[t].symbol.color.r, renderer.infos[t].symbol.color.g, renderer.infos[t].symbol.color.b, renderer.infos[t].symbol.color.a].join(',');
            //         thisSwatch.setAttribute('style', 'background-color:rgba('+ thisRGBA + '); height:20px; width:40px');
            //         swatchCell.appendChild(thisSwatch);
            //         labelCell.innerHTML = "<span>" + number.format(Math.floor(renderer.infos[t].minValue)) + ' - ' + number.format(Math.floor(renderer.infos[t].maxValue)) + "</span>";
            //
            //         thisLegendRow.appendChild(swatchCell);
            //         thisLegendRow.appendChild(labelCell);
            //         thisTable.appendChild(thisLegendRow);
            //
            //     }
            //
            //     var legendTitle = document.createElement('div');
            //     legendTitle.innerHTML = "Number of Person-Trips /Year Going to County";
            //     this.legendDiv.appendChild(legendTitle);
            //     this.legendDiv.appendChild(thisTable);
            //
            //     if (this.activeMode !== 'Rail') {
            //         this.legendDiv.innerHTML += "* Does not include local trips";
            //     }
            //
            //     this.activeFeatureLayer.layer.setRenderer(renderer);
            //     this.activeFeatureLayer.layer.resume();
            //
            //     if (!this.activeFeatureLayer.layer.visible) {
            //         this.activeFeatureLayer.layer.show();
            //     }
            //
            // },
            // findLayer: function(params) {
            //     var theLayer = null;
            //     for (var f= 0; f < this.layers.length; f++) {
            //         var thisLayer = this.layers[f];
            //         if (/*params.Direction === thisLayer.Direction &&*/ params.Mode === thisLayer.Mode && params.Year === thisLayer.Year) {
            //             theLayer = thisLayer;
            //         }
            //     }
            //     return theLayer;
            // },
            classBreaks: function (year, numClasses) {
                var renderLayer;
                if (this.activeYear === year) {
                    renderLayer = this.activeFeatureLayer;
                } else {
                    renderLayer = this.findLayer({Mode: this.activeFeatureLayer.Mode, Year: year});
                }
                if (renderLayer === null) {
                    console.log('Weird');
                    return false;
                }

                var classDef = new ClassBreaksDefinition();
                classDef.classificationField = this.activeField;
                classDef.classificationMethod = "natural-breaks"; // always natural breaks
                classDef.breakCount = numClasses;

                var colorRamp = new AlgorithmicColorRamp();
                colorRamp.fromColor = new Color.fromHex(this.color1);
                colorRamp.toColor = new Color.fromHex(this.color2);
                colorRamp.algorithm = "lab-lch"; // options are:  "cie-lab", "hsv", "lab-lch"

                classDef.baseSymbol = new SFS("solid", new SLS(SLS.STYLE_SOLID, new Color([63, 63, 65, 255]), 0.25), Color.fromHex(this.colors[this.colors.length-1]));
                classDef.colorRamp = colorRamp;

                var params = new GenerateRendererParameters();
                params.classificationDefinition = classDef;
                params.where = renderLayer.keyField + " = '" + this.activeLocation + "'";
                if (this.config.excludeValuesClause !== null) {
                    params.where += " AND " + this.renderLayer.keyField + " " + this.config.excludeValuesClause;
                }
                //var generateRenderer = new GenerateRendererTask(this.activeLayer.url);
                //generateRenderer.execute(params, lang.hitch(this, this.applyRenderer), this.errorHandler);
                var generateRenderer = new GenerateRendererTask(renderLayer.url);
                if (this.activeYear === year) {
                    generateRenderer.execute(params, lang.hitch(this, this.applyFeatureRenderer), this.errorHandler);
                } else {
                    generateRenderer.execute(params, lang.hitch(this, this.wayPoint), this.errorHandler);
                }
            },
            wayPoint: function(e) {
                this.lowRenderer = e;
                this.classBreaks(this.activeYear, 5);
            },
            // applyRenderer: function (renderer) {
            //     // dynamic layer stuff
            //     var optionsArray = [];
            //     var drawingOptions = new LDO();
            //     drawingOptions.renderer = renderer;
            //     // set the drawing options for the relevant layer
            //     // optionsArray index corresponds to layer index in the map service
            //     optionsArray[0] = drawingOptions;
            //     //this.activeLayer.layer.hide();
            //     this.activeLayer.layer.setLayerDrawingOptions(optionsArray);
            //     //this.activeLayer.layer.show();
            //
            // },
            errorHandler: function (err) {
                // console.log("Something broke, error: ", err);
                console.log("error: ", JSON.stringify(err));
            }


        });
    });
