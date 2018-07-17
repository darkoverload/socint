# Social Intelligence Project (socint)
An interactive social research platform developed to further the public understanding of foreign social media operations. I am making this project available to the community in hopes that it can be used to help make social media a better place for everyone. This project will be updated as new data becomes available, when bugs are fixed, or when new functionality is added.

## Interface
Standard mouse navigation is used to pan and zoom around the map. Clicking a node shows more information about it. Clicking the account link at the top of the information panel opens a new window/tab with the selected node's account. Clicking any of the node links under mutual, incoming, or outgoing will select that node. I've added functionality which allows the forward and back buttons to be used to navigate previous node selections.

## Bugs
I've tried my best to get the group selector working properly but it still seems to break the selector element on every other dataset switch. I have disabled it in the individual dataset config files for this reason. If you want to have a go at it solving this problem, please let me know if you sort it out. There may also be other bugs so if you find one please report it.

## Data Source
All data shown here was collected from [Twitter](https://twitter.com/) using [DMI-TCAT](https://github.com/digitalmethodsinitiative/dmi-tcat) to monitor the selected hashtags. It was then mapped using [Gephi](https://gephi.org/) and exported using the [JSON Exporter](https://github.com/oxfordinternetinstitute/gephi-plugins/tree/jsonexporter-plugin) plugin.

## Credits
This project was built on technology developed by the [Oxford Internet Institute](http://www.oii.ox.ac.uk/) and [JISC](http://jisc.ac.uk/). The main engine used to power this project is [Sigma.js](http://sigmajs.org/), but [jQuery](https://jquery.com/) and [FancyBox](http://fancybox.net/) are also used.