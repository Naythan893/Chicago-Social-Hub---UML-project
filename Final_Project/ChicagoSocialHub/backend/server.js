////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////


/// This file and the source code provided can be used only for
/// the projects and assignments of this course

/// Last Edit by Dr. Atef Bader: 1/27/2019


////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////
//////////////////////              SETUP NEEDED                ////////////////////
////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

//  Install Nodejs (the bundle includes the npm) from the following website:
//      https://nodejs.org/en/download/


//  Before you start nodejs make sure you install from the
//  command line window/terminal the following packages:
//      1. npm install express
//      2. npm install pg
//      3. npm install pg-format
//      4. npm install moment --save
//      5. npm install elasticsearch


//  Read the docs for the following packages:
//      1. https://node-postgres.com/
//      2.  result API:
//              https://node-postgres.com/api/result
//      3. Nearest Neighbor Search
//              https://postgis.net/workshops/postgis-intro/knn.html
//      4. https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/quick-start.html
//      5. https://momentjs.com/
//      6. http://momentjs.com/docs/#/displaying/format/


////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////


const express = require('express');

var pg = require('pg');

var bodyParser = require('body-parser');

const moment = require('moment');

const Server = require('socket.io');
const io = new Server();
const http_server = require('http').createServer();

// Connect to elasticsearch Server

const elasticsearch = require('elasticsearch');
const esClient = new elasticsearch.Client({
  host: '127.0.0.1:9200',
  log: 'error'
});


// Connect to PostgreSQL server

var conString = "pg://postgres:root@127.0.0.1:5432/chicago_divvy_stations";
var pgClient = new pg.Client(conString);
pgClient.connect();

var find_places_task_completed = false;


const app = express();
const router = express.Router();


app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

router.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});



var places_found = [];
var stations_found = [];
var place_selected;


io.on('connect', (socket) => {
  console.log("connected")
});


/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

//////   The following are the routes received from NG/Browser client        ////////

/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////



router.route('/places').get((req, res) => {

    res.json(places_found);
})



router.route('/place_selected').get((req, res) => {

    res.json(place_selected)

});



router.route('/allPlaces').get((req, res) => {

    res.json(places_found)

});

router.route('/stations').get((req, res) => {

    res.json(stations_found)

});



router.route('/allstations').get((req, res) => {

    var minutes = 2;
    var interval = minutes * 60 * 1000;


    const query = {
        // give the query a unique name
        name: 'fetch-all-divvy',
        text: ' SELECT * FROM divvy_stations_status'

    }
    get_stations_live().then(function (response) {
        var hits = response;
        res.json({'total_stations_found': hits});
    });


    setInterval(function(){
      get_stations_live();
    },interval)


});



async function get_stations_live(){
  date = new Date();
  formatdate = moment(date.setMinutes(date.getMinutes() - 5)).format('YYYY-MM-DD HH:mm:ss');
  let body = {
    "from":0,
    "size":1000,
    "query": {
      "bool": {
        "filter": {
                    "range": { "lastCommunicationTime.keyword": { "gte": formatdate } }

        }
      }
    },
    "sort": [

            {"id": { "order": "asc" }},
            {"lastCommunicationTime.keyword": { "order": "asc" }} ,
    ],
  }

  results = await esClient.search({index: 'divvy_stations_logs', body: body});
  return_result = [];
  results.hits.hits.forEach((hit, index) => {
    var place = {
      "id": hit._source.id,
      "stationName": hit._source.stationName,
      "availableBikes": hit._source.availableBikes,
      "availableDocks": hit._source.availableDocks,
      "is_renting": hit._source.is_renting,
      "lastCommunicationTime": hit._source.lastCommunicationTime,
      "latitude": hit._source.latitude,
      "longitude": hit._source.longitude,
      "status": hit._source.status,
      "totalDocks": hit._source.totalDocks
    };

    return_result.push(place);

  });



  io.emit(`live_data_stations`, {"data" : return_result});

  return return_result;
}




router.route('/places/find').post((req, res) => {

    var str = JSON.stringify(req.body, null, 4);

    find_places_task_completed = false;

    find_places_from_yelp(req.body.find, req.body.where, req.body.zip_code).then(function (response) {
        var hits = response;

        res.json(places_found);
    });

});





router.route('/stations/find').post((req, res) => {

    var str = JSON.stringify(req.body, null, 4);

    for (var i = 0,len = places_found.length; i < len; i++) {

        if ( places_found[i].name === req.body.placeName ) { // strict equality test

            place_selected = places_found[i];

            break;
        }
    }

    const query = {
        // give the query a unique name
        name: 'fetch-divvy',
        text: ' SELECT * FROM divvy_stations_status ORDER BY (divvy_stations_status.where_is <-> ST_POINT($1,$2)) LIMIT 3',
        values: [place_selected.latitude, place_selected.longitude]
    }

    find_stations_from_divvy(query).then(function (response) {
        var hits = response;
        res.json({'stations_found': 'Added successfully'});
    });


});
  router.route('/stations/live1').post((req,res) => {

    var id = req.body.id;

    var minutes = 2;
    var interval = minutes * 60 * 1000;
    get_divy_heartbeat1(id).then( (stations) =>  {

      res.json({"message": "live_data stream started", "stations" : stations});
    });



    setInterval(function(){
      get_divy_heartbeat_live1(id);
    },interval)


  })
async function get_divy_heartbeat1(id){
  let body = {
    "from":0, "size":1000,
    "query": {
      "bool": {
        "must": {
          "term": {
            "id": id
          }
        }
      }
    }
  }

  results = await esClient.search({index: 'divvy_stations_logs', body: body});
  return_result = [];
  results.hits.hits.forEach((hit, index) => {
    var place = {
            "location": hit._source.location,
            "availabledocks": hit._source.availableDocks,
            "lastcommunicationtime": hit._source.lastCommunicationTime,
            "id":hit._source.id
    };

    return_result.push(place);

  });

  function compare(a,b) {
    if (a.lastcommunicationtime < b.lastcommunicationtime)
      return -1;
    if (a.lastcommunicationtime > b.lastcommunicationtime)
      return 1;
    return 0;
  }

  return_result.sort(compare);
  console.log(return_result.length)

  return_result.forEach((doc,index) => {
    var time = new Date(doc.lastcommunicationtime);

    var ONE_HOUR = 60 * 60 * 1000; /* ms */
    if(((new Date()) - time) > ONE_HOUR ){
      doc.id = "-1"
    }
  });
  return_result = return_result.filter(function(el) { return el.id != -1; });
  console.log(return_result.length)
  return return_result;
}



async function get_divy_heartbeat_live1(id){

  let body = {
    "from":0, "size":1000,
    "query": {
      "bool": {
        "must": {
          "term": {
            "id": id
          }
        }
      }
    }
  }

  results = await esClient.search({index: 'divvy_stations_logs', body: body});
  return_result = [];
  results.hits.hits.forEach((hit, index) => {
    var place = {
            "location": hit._source.location,
            "availabledocks": hit._source.availableDocks,
            "lastcommunicationtime": hit._source.lastCommunicationTime,
            "id":hit._source.id
    };

    return_result.push(place);

  });

  function compare(a,b) {
    if (a.lastcommunicationtime < b.lastcommunicationtime)
      return -1;
    if (a.lastcommunicationtime > b.lastcommunicationtime)
      return 1;
    return 0;
  }

  return_result.sort(compare);
  io.emit(`live_data${id}`, {"data" : return_result[return_result.length -1]});
}

router.route('/stations/live24').post((req,res) => {

  var id = req.body.id;

  var minutes = 2;
  var interval = minutes * 60 * 1000;
  get_divy_heartbeat24(id).then( (stations) =>  {

    res.json({"message": "live_data stream started", "stations" : stations});
  });
  setInterval(function(){
    get_divy_heartbeat_live24(id);
  },interval)


})

router.route('/stations/live7').post((req,res) => {

  var id = req.body.id;

  var minutes = 2;
  var interval = minutes * 60 * 1000;
  get_divy_heartbeat7(id).then( (stations) =>  {

    res.json({"message": "live_data stream started", "stations" : stations});
  });
  setInterval(function(){
    get_divy_heartbeat_live24(id);
  },interval)


})


async function get_divy_heartbeat24(id){

  let body = {
    "from":0, "size":1000,
    "query": {
      "bool": {
        "must": {
          "term": {
            "id": id
          }
        }
      }
    }
  }

  results = await esClient.search({index: 'divvy_stations_logs', body: body});
  return_result = [];
  results.hits.hits.forEach((hit, index) => {
    var place = {
            "location": hit._source.location,
            "availabledocks": hit._source.availableDocks,
            "lastcommunicationtime": hit._source.lastCommunicationTime,
            "id":hit._source.id
    };

    return_result.push(place);

  });

  function compare(a,b) {
    if (a.lastcommunicationtime < b.lastcommunicationtime)
      return -1;
    if (a.lastcommunicationtime > b.lastcommunicationtime)
      return 1;
    return 0;
  }

  return_result.sort(compare);
  console.log(return_result.length)

  return_result.forEach((doc,index) => {
    var time = new Date(doc.lastcommunicationtime);

    var ONE_HOUR = 24 *60 * 60 * 1000; /* ms */
    if(((new Date()) - time) > ONE_HOUR ){
      doc.id = "-1"
    }
  });
  return_result = return_result.filter(function(el) { return el.id != -1; });
  console.log(return_result.length)
  return return_result;
}

async function get_divy_heartbeat7(id){

  let body = {
    "from":0, "size":1000,
    "query": {
      "bool": {
        "must": {
          "term": {
            "id": id
          }
        }
      }
    }
  }

  results = await esClient.search({index: 'divvy_stations_logs', body: body});
  return_result = [];
  results.hits.hits.forEach((hit, index) => {
    var place = {
            "location": hit._source.location,
            "availabledocks": hit._source.availableDocks,
            "lastcommunicationtime": hit._source.lastCommunicationTime,
            "id":hit._source.id
    };

    return_result.push(place);

  });

  function compare(a,b) {
    if (a.lastcommunicationtime < b.lastcommunicationtime)
      return -1;
    if (a.lastcommunicationtime > b.lastcommunicationtime)
      return 1;
    return 0;
  }

  return_result.sort(compare);
  console.log(return_result.length)

  return_result.forEach((doc,index) => {
    var time = new Date(doc.lastcommunicationtime);

    var s_days  =  7 * 24 *60 * 60 * 1000; /* ms */
    if(((new Date()) - time) > s_days ){
      doc.id = "-1"
    }
  });
  return_result = return_result.filter(function(el) { return el.id != -1; });
  console.log(return_result.length)
  return return_result;
}


async function get_divy_heartbeat_live24(id){

  let body = {
    "from":0, "size":1000,
    "query": {
      "bool": {
        "must": {
          "term": {
            "id": id
          }
        }
      }
    }
  }

  results = await esClient.search({index: 'divvy_stations_logs', body: body});
  return_result = [];
  results.hits.hits.forEach((hit, index) => {
    var place = {
            "location": hit._source.location,
            "availabledocks": hit._source.availableDocks,
            "lastcommunicationtime": hit._source.lastCommunicationTime,
            "id":hit._source.id
    };

    return_result.push(place);

  });

  function compare(a,b) {
    if (a.lastcommunicationtime < b.lastcommunicationtime)
      return -1;
    if (a.lastcommunicationtime > b.lastcommunicationtime)
      return 1;
    return 0;
  }

  return_result.sort(compare);
  io.emit(`live_data${id}`, {"data" : return_result[return_result.length -1]});
}



/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

////////////////////    Divvy - PostgreSQL - Client API            /////////////////

////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////


async function find_stations_from_divvy(query) {

    const response = await pgClient.query(query);

    stations_found = [];

    for (i = 0; i < 3; i++) {

         plainTextDateTime =  moment(response.rows[i].lastcommunicationtime).format('YYYY-MM-DD, h:mm:ss a');


        var station = {
                    "id": response.rows[i].id,
                    "stationName": response.rows[i].stationname,
                    "availableBikes": response.rows[i].availablebikes,
                    "availableDocks": response.rows[i].availabledocks,
                    "is_renting": response.rows[i].is_renting,
                    "lastCommunicationTime": plainTextDateTime,
                    "latitude": response.rows[i].latitude,
                    "longitude": response.rows[i].longitude,
                    "status": response.rows[i].status,
                    "totalDocks": response.rows[i].totaldocks
        };

        stations_found.push(station);

    }


}
async function find_all_stations_from_divvy(query) {

    const response = await pgClient.query(query);

    var stations_found = [];

    for (i = 0; i < response.rows.length; i++) {

         plainTextDateTime =  moment(response.rows[i].lastcommunicationtime).format('YYYY-MM-DD, h:mm:ss a');


        var station = {
                    "id": response.rows[i].id,
                    "stationName": response.rows[i].stationname,
                    "availableBikes": response.rows[i].availablebikes,
                    "availableDocks": response.rows[i].availabledocks,
                    "is_renting": response.rows[i].is_renting,
                    "lastCommunicationTime": plainTextDateTime,
                    "latitude": response.rows[i].latitude,
                    "longitude": response.rows[i].longitude,
                    "status": response.rows[i].status,
                    "totalDocks": response.rows[i].totaldocks
        };

        stations_found.push(station);

    }
    return stations_found;


}




/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

////////////////////    Yelp - ElasticSerch - Client API            /////////////////

////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////



async function find_places_from_yelp(place, where, zip_code) {

    places_found = [];

//////////////////////////////////////////////////////////////////////////////////////
// Using the business name to search for businesses will leead to incomplete results
// better to search using categorisa/alias and title associated with the business name
// For example one of the famous places in chicago for HotDogs is Portillos
// However, it also offers Salad and burgers
// Here is an example of a busness review from Yelp for Pertilos
//               alias': 'portillos-hot-dogs-chicago-4',
//              'categories': [{'alias': 'hotdog', 'title': 'Hot Dogs'},
//                             {'alias': 'salad', 'title': 'Salad'},
//                             {'alias': 'burgers', 'title': 'Burgers'}],
//              'name': "Portillo's Hot Dogs",
//////////////////////////////////////////////////////////////////////////////////////
    console.log(place)
    console.log(where)
    console.log(zip_code)
    let body = {
        size: 1000,
        from: 0,
        "query": {
          "bool" : {
            "must" : [
               {"term" : { "categories.alias" : place }},
               {
                  "bool" :{
                    "should": [
                        {"term" : { "location.address1" : where}},
                        {"term" : { "location.zip_code" : zip_code}},
                    ],
                  }
                }
          ],

            "must_not" :  {
              "range" : {
                "rating" : { "lte" : 3 }
              }
            },

            "must_not" : {
              "range" : {
                "review_count" : { "lte" : 500 }
              }
            },

            "should" : [
              { "term" : { "is_closed" : "false" } }
            ],
          }
        }
    }


    results = await esClient.search({index: 'chicago_yelp_reviews', body: body});

    results.hits.hits.forEach((hit, index) => {


        var place = {
                "name": hit._source.name,
                "display_phone": hit._source.display_phone,
                "address1": hit._source.location.address1,
                "is_closed": hit._source.is_closed,
                "rating": hit._source.rating,
                "review_count": hit._source.review_count,
                "latitude": hit._source.coordinates.latitude,
                "longitude": hit._source.coordinates.longitude
        };

        places_found.push(place);

    });

    find_places_task_completed = true;

}



app.use('/', router);

app.listen(4000, () => console.log('Express server running on port 4000'));

io.attach(http_server, {
  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false
});


http_server.listen(3000);

//heatMap

router.route('/divvy_docks').get((req, res) => {

    res.json(heatmap_data);

});

router.route('/divvy_docks/find').post((req, res) => {
    date = new Date();
    // heatmap_completed = false;

    timeInterval = req.body.hours;
    // console.log("server-hours:", timeInterval)
    // console.log("time Interval from front end", timeInterval);

    formatdate = moment(date.setHours(date.getHours() - 1)).format('YYYY-MM-DD HH:mm:ss');
    // formatdate = date.setHours(date.getHours() - timeInterval);

    //console.log("Formated Date: ", formatdate);
    const heatmap_query = {
        name: 'fetch-heathours',
        text: 'SELECT DISTINCT * FROM divvy_stations_logs WHERE city=$1 and lastcommunicationtime>=$2 ORDER BY lastcommunicationtime',
        values: [req.body.placeName,formatdate]
    }


    find_heatmap_data(heatmap_query).then(function (response) {
        var hits = response;

        res.json(heatmap_data);
    });


});

async function find_heatmap_data(heatmap_query) {

    const response = await pgClient.query(heatmap_query);
console.log("yahaan aya",response);
    heatmap_data = [];


    // response.rows.length
    for (var i = 0; i < response.rows.length; i++) {
        plainTextDateTime = moment(response.rows[i].lastcommunicationtime).format('YYYY-MM-DD, h:mm:ss a');

        var station = {
            "id": response.rows[i].id,
            "stationName": response.rows[i].stationname,
            "availableBikes": response.rows[i].availablebikes,
            "availableDocks": response.rows[i].availabledocks,
            "is_renting": response.rows[i].is_renting,
            "lastCommunicationTime": plainTextDateTime,
            "latitude": response.rows[i].latitude,
            "longitude": response.rows[i].longitude,
            "status": response.rows[i].status,
            "totalDocks": response.rows[i].totaldocks
        };
        heatmap_data.push(station);
        console.log("heatmap:",heatmap_data)


    }

}
