Total number codes : 5620  

#Packages used in the implementation:

///IMPORTANT//
Go to frontend folder and type : npm install
Go to Backend folder and type : npm install
//It will install all dependencies//

npm install google-maps
npm install heatmap.js
npm install @types/google-maps
npm install --save d3
npm install --save-dev @types/d3
npm install c3-angularjs
npm install d3-shape

#Steps to run the application:
1. With the modified Yelp API key and the google map API added to the frontend we begin the execution.
2. Run ChicagpSocialHub-Yelp.ipynb to create an index to Chicago Business on ElasticSearch 
3. Execute the following commands from the command line window/terminal: 
	3.1. Start ElasticSearch: server from the command prompt
	3.2. Start logstash.
	3.3. Run python scripts divvy_station_status_logs.py
	3.4. Start node.js server: node server 
	3.5. Start Angular client: ng serve --open
