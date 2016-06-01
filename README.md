# Traveler Analysis Framework Widget
This widget for [Web App Builder](https://developers.arcgis.com/web-appbuilder/) interacts with a set of layers to explore a number of variables for a given dataset oriented around origin-destination flows. The goal is to quickly pivot among the multiple attributes to explore rich datasets like the [Traveler Analysis Framework](http://www.fhwa.dot.gov/policyinformation/analysisframework/01.cfm), which predicts passenger flows by mode for 2008 & 2040 and by Origin/Destination.  This was developed as a prototype for the 2016 FedGIS Conference and was part of a presentation by [U.S. DOT](http://video.esri.com/watch/4973/infrastructure-modernization-_and_-the-cloud).

## Expected Interaction
1. The widget is opened in a configured Web App Builder
2. Using the search box at the top, a user enters the name of a feature (U.S. County) they wish to map the data for.
3. The variables (mode, year) are selected
4. The map is updated with requested data; switching variables will update the map to reflect the requested change 

## Data Setup
This widget requires 2 sets of data.  The first set is the reference features that enable the search box.  This service requires:
- The shape of the feature (for display)
- A field to apply the search against
- A field that provides a name that a user can distinguish the results from (i.e., Washington County, PA vs. Washington County, MD)
- A field with a unique identifier for the feature (i.e., FIPS)

The second set of data is used to query and present results.  This consists of multiple feature layers that are selected based on the combination of variables specified.  These layers could be from separate feature services, either hosted or from ArcGIS Server, or separate feature layers contained in one map service.  With the current configuration, the following fields are required:
- The shape of the feature
- A field containing the ID of the feature selected in the search service. This may change based on whether you are examining origin or destination flows.
- A field containing the value of the flow.  The widget currently assumes that all have an identically named field that contains the values.

## Configuration File
The configuration file is a JSON file whose object has the following properties:
- searchService: the configuration of the search box and first dataset described above to allow users to find a specific feature
  - url: URL of the feature layer
  - name: A display name for the layer
  - placeholder: A sample value to inform the user of expected input
  - keyField: the field whose value will be used as in the query to isolate values for the specified feature
  - outFields: an array of the fields whose values should be provided on search
  - searchFields: an array of fields to search the user submitted value for
- displayVariables: an array of objects that specify the variables that can be selected to filter the query. Each object requires the following values:
  - name: The user-visible name of the variable; also used in the 'layers' configuration to specify the key for a variable
  - values: An *ordered* array of values used in the 'layers' configuration (below)
  - displayValues: An *ordered* array of user-visible representations of the values.  The order of items in values and displayValues must be in agreement
  - bindTo: the name of the buttonSet when rendered in HTML; used to distinguish the selection of one variable option from another
- layers: an array of layer configurations that have a unique combination of values of the displayVariable parameters.  Each configuration has the following properties:
  - A set of properties that correspond to the names of displayVariable items.  The values must be valid values as specified in the displayVariable configuration section
  - idName: a unique layer id used in manipulating the map
  - url: the URL of the feature layer displaying the specified combination of variables
  - keyField: the field containing the unique value specified in the searchService configuration section.  This is used to limit the query to only those items that match the search
- valueField: the name of the field containing values for all layers.  An improvement would be to move this into the layer configuration
- excludeValuesClause: a clause component to limit the values returned; in the example to only those features with a value of more than 1
