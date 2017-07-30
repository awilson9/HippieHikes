angular.module('starter.services', [])
  .factory('Auth', function($firebaseAuth){
    var auth = $firebaseAuth();

    return auth;
  })
  
  .factory('Setup', function($cordovaGeolocation, $http, $firebaseObject){
    var service = {};
     service.run = function(){

      var promise = new Promise(function(resolve, reject){
      if(service.complete)resolve();
      else{
      var ref = firebase.database().ref();
      // download the data into a local object
      var syncObject = $firebaseObject(ref);
      // synchronize the object with a three-way data binding
      // click on `index.html` above to see it used in the DOM!
      syncObject.$bindTo(service, "data");
      
      syncObject.$loaded()
      .then(fillTrailheads)
      .then(getUserPos)
      .then(calculateClosest)
      .then(function(){
        service.complete = true;
        resolve();
      });
      }
      })
      return promise;
    }
    service.getData = function(){
      return service.data;
    }
    service.getClosest = function(){
      return service.closest;
    }
    var calculateClosest = function(){
      service.closest = [];
      var promise = new Promise(function (resolve, reject){
        var promises = [];
        for(var marker in service.markers){
          promises.push(getDirections(service.userPos, service.markers[marker]));
        }
        Promise.all(promises).then(function(){
          sortClosest();
          resolve()
        }, function(err){
          console.log(err);
        });
  
      })
       return promise;
  }
  var fillTrailheads = function(){
    var promise = new Promise(function(resolve, reject){
       service.markers = [];
              for(var guide in service.data.guides){
                service.markers.push({
                  lat: service.data.guides[guide].coords[0].lat,
                  lng: service.data.guides[guide].coords[0].long,
                  title: service.data.guides[guide].name_description,
                  name:service.data.guides[guide].name
                });
          
              }
              resolve();
    })
    return promise;
  }
  var getUserPos = function(){
   var promise = new Promise(function(resolve, reject){
    var posOptions = {timeout: 10000, enableHighAccuracy: false};
      $cordovaGeolocation
        .getCurrentPosition(posOptions)
        .then(function (position) {
          console.log('got user pos');
         var userPos = {lat: position.coords.latitude, lng: position.coords.longitude};
          service.userPos = userPos;
          
          resolve();
        }, function(err) {
          alert(err);
          service.userPos = {lat:40.758701 ,lng:-111.876183}
          resolve();
        });    

   })
    return promise;
  }
  var getDirections = function(origin,destination){
  //mapbox way
  var promise = new Promise(function(resolve, reject){
     var reqURL = "https://api.mapbox.com/directions/v5/mapbox/driving/"+origin.lng+","+origin.lat+";"+ destination.lng+","+destination.lat+ "?geometries=geojson&access_token=pk.eyJ1IjoiYXdpbHNvbjkiLCJhIjoiY2lyM3RqdGloMDBrbTIzbm1haXI2YTVyOCJ9.h62--AvCDGN25QoAJm6sLg";
      $http.get(reqURL)
            .success(function(data) {
            var src = service.data.guides[destination.name].image_descriptions[0].URL;
            service.closest.push({duration:data.routes[0].duration, name:destination.name, src:src
            });
            resolve();
            })
            .error(function(data) {
               reject();
            });
          
  })
   return promise;
  //  google maps way
  //        if($rootScope.directionsService==null)$rootScope.directionsService = new google.maps.DirectionsService;
  //         $rootScope.directionsService.route({
  //         origin: origin,
  //         destination: destination,
  //         travelMode: 'DRIVING'
  //       }, function(response, status) {
  //         // Route the directions and pass the response to a function to create
  //         // markers for each step.
  //         if (status === 'OK') {
  //           console.log('ok');
  //         } else {
  //           window.alert('Directions request failed due to ' + status);
  //         }
  // })
  }
  var sortClosest = function(){
    compare = function(a, b){
      return a.duration - b.duration;
    }
   service.closest.sort(compare);
   var small_arr = [];
   for(var i=0;i<5;i++){
    small_arr.push(service.closest[i]);
   }
   service.closest = small_arr;

  }
   
  return service;
  })
.factory('HomepageService', function(Setup, $window){
    var service = {};
    service.featured = [];
    service.favorited = [];
    service.new = [];
    service.used = [];
   
    

    service.setup = function(){
      service.data = Setup.getData();
      for(var guide in Setup.closest){
        service.used.push(Setup.closest[guide].name);
      }
      getFeatured();
      getFavorited();
      getNew();
      service.closest = Setup.closest;
      setStyles();

    }
    var setStyles = function(){
       var setStyle = function(guide, style){
        var toReturn = "";
        if(style.one_row){
          toReturn = "height:175px;width:"+($window.innerWidth-2)+"px;margin-top:0.5px;margin-bottom:0.5px;margin-left:1px;margin-righ:1px;display:block;";
        }
        else if(style.row_index==0&&!style.left){
          toReturn = "height:125px;width:"+((7*$window.innerWidth/16)-1.5)+"px;margin-left:1px;margin-right:0.5px;margin-top:0.5px;margin-bottom:0.5px;display:block;";
        }
        else if(style.row_index==0&&style.left){
          toReturn = "height:125px;width:"+((9*$window.innerWidth/16)-1.5)+"px;margin-left:1px;margin-right:0.5px;margin-top:0.5px;margin-bottom:0.5px;display:block;"
        }
        else if(!style.left){
           toReturn = "height:125px;width:"+((9*$window.innerWidth/16)-1.5)+"px;margin-right:1px;margin-left:0.5px;margin-top:0.5px;margin-bottom:0.5px;display:block;"
        }
        else{
          toReturn = "height:125px;width:"+((7*$window.innerWidth/16)-1.5)+"px;margin-right:1px;margin-left:0.5px;margin-top:0.5px;margin-bottom:0.5px;display:block;";        
        }
        if(!style.one_row){
              if(style.row_index==1){
                style.one_row = true;
                style.row_index=0;
                    style.row++;
                    style.left=!style.left;
              }
              else{
                style.row_index++;
              }
            }
            else{
              style.row++;
              style.one_row = false;
            }
         guide.style = toReturn;
      }
      var featured_style = {
       row_index: 0, 
       one_row:false,
       row:0, 
       left:false
     };
    if(service.featured.length==1)featured_style.one_row = true;
     for(var guide in service.featured){
     
      setStyle(service.featured[guide], featured_style);
     }
      var near_style = {
       row_index: 0, 
       one_row:false,
       row:0,
       left:false
     };
     if(service.closest.length==1)near_style.one_row = true;
     for(var guide in service.closest){
      setStyle(service.closest[guide], near_style);
     }
      var new_style = {
       row_index: 0, 
       one_row:false,
       row:0,
       left:false
     };
     if(service.new.length==1)new_style.one_row = true;
     for(var guide in service.new){
      setStyle(service.new[guide], new_style);
     }
    
    }
    var getFeatured = function(){
    for(var guide in service.data.guides){
      if(service.data.guides[guide].featured&&(service.used.indexOf(guide)==-1)){
        service.featured.push(
          {
          src:service.data.guides[guide].image_descriptions[0].URL,
          name:guide,
        }
        );
        service.used.push(guide);
        //indexes for styling, alternate between one image per row and two
      
      }
    }
  }
  var getFavorited = function(){
   
  }
  var getNew = function(){
    for(var guide in service.data.guides){
      if(service.data.guides[guide].new&&(service.used.indexOf(guide)==-1)){
        service.new.push(
          {
          src:service.data.guides[guide].image_descriptions[0].URL,
          name:guide
        }
        );
        service.used.push(guide);
      }
    }
  }
    return service;
  })
  .factory('Users', function($firebaseArray, $firebaseObject){
    var usersRef = firebase.database().ref('users');
    var users = $firebaseArray(usersRef);

    var Users = {
       getGravatar: function(uid){
         return '//www.gravatar.com/avatar/' + users.$getRecord(uid).emailHash;
       },

      getProfile: function(uid){
        return $firebaseObject(usersRef.child(uid));
      },
      getDisplayName: function(uid){
        return users.$getRecord(uid).displayName;
      },
      all: users
    };
   
    return Users;
  }).factory('Map', function(){
    var service = {}
    service.setup = function(coords){
 
    var center = new mapboxgl.LngLat(coords[0][0], coords[0][1]);
    mapboxgl.accessToken = 'pk.eyJ1IjoiYXdpbHNvbjkiLCJhIjoiY2lyM3RqdGloMDBrbTIzbm1haXI2YTVyOCJ9.h62--AvCDGN25QoAJm6sLg';
    service.map = new mapboxgl.Map({
    container: 'route-map',
    style: 'mapbox://styles/awilson9/cirl1qq6k001dg4mb3f4bs1iv',
    center: center,
    zoom:14
    });
    service.done = true;
    service.map.on('load', function(){
      service.drawLine(coords);
    })

    //service.addMarkers(Setup.markers);
    }
    service.drawLine = function(coords){

    service.map.addLayer({
        "id": "route",
        "type": "line",
        "source": {
            "type": "geojson",
            "data": {
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "type": "LineString",
                    "coordinates": coords
                }
            }
        },
        "layout": {
            "line-join": "round",
            "line-cap": "round"
        },
        "paint": {
            "line-color": "#888",
            "line-width": 8
        }
    });
    }
    service.addMarkers = function(markers){
      for(var mark in markers){
        var marker = markers[mark];
        var popup = new mapboxgl.Popup({offset: 25})
        .setText(marker.title);

        // create DOM element for the marker
        var el = document.createElement('div');
        el.id = marker.name + 'marker';
     
        
        // create the marker
        new mapboxgl.Marker(el, {offset:[-25, -25]})
            .setLngLat([marker.lng, marker.lat])
            .setPopup(popup) // sets a popup on this marker
            .addTo(service.map);
          }
    }

    

    return service;
  })
  .service('OfflineMap', function($cordovaSQLite, $cordovaGeolocation){
    var service = {};
    service.layerPositionMarker = null;
    service.guides = {
      "blanche" : {
        name: "blanche",
        name_description:"Lake Blanche",
        center:{
          lat: 40.6336,
          long:-111.724
        },
        line:[[-111.724043,40.63366],[-111.72213,40.632456],[-111.720849,40.63281],[-111.719488,40.632682],[-111.718442,40.63199],[-111.717718,40.631886],[-111.717698,40.632297],[-111.71677,40.631544],[-111.713525,40.627194],[-111.712134,40.624241],[-111.711507,40.623767],[-111.710105,40.619857],[-111.707868,40.617299],[-111.70733,40.616038],[-111.705415,40.614758],[-111.702169,40.613755],[-111.700601,40.612907],[-111.699843,40.613334],[-111.698898,40.613134],[-111.696758,40.610986],[-111.695817,40.610987],[-111.695732,40.611297],[-111.694291,40.610193],[-111.693245,40.609956],[-111.693417,40.610576],[-111.692315,40.609815],[-111.692338,40.608355],[-111.6917,40.607668],[-111.691495,40.606683]]


      },
      "harriman" : {
        name:"harriman",
        name_description:"Silver Lake Loop",
        center:{
          lat:44.323043,
          long:-111.460475
        },
        line:[[-111.460475,44.323043],[-111.45954,44.323728],[-111.459511,44.324163],[-111.459733,44.324419],[-111.460618,44.324782],[-111.460927,44.325368],[-111.461701,44.325956],[-111.462186,44.326725],[-111.46245,44.327581],[-111.462824,44.327605],[-111.463256,44.327455],[-111.46367,44.327616],[-111.463548,44.327882],[-111.462433,44.328429],[-111.461495,44.329763],[-111.461832,44.330305],[-111.461766,44.330743],[-111.462183,44.332518],[-111.463246,44.333354],[-111.463768,44.334007],[-111.464006,44.334652],[-111.465752,44.335088],[-111.467434,44.336353],[-111.467866,44.338838],[-111.467562,44.338859],[-111.467948,44.33909],[-111.468128,44.3397],[-111.469056,44.34015],[-111.46992,44.34048],[-111.471899,44.34025],[-111.473919,44.340617],[-111.4743,44.340574],[-111.475084,44.340179],[-111.475955,44.340113]]
      },
      "whitepine" : {
        name:"whitepine",
        name_description:"White Pine Lake",
        center:{
          lat:41.895301,
          long:-111.642342
        },
        line:[[-111.642342,41.895301],[-111.641561,41.895723],[-111.642528,41.896998],[-111.642624,41.898167],[-111.642014,41.899243],[-111.641066,41.903358],[-111.644024,41.905745],[-111.643374,41.906071],[-111.643245,41.906443],[-111.644055,41.908517],[-111.643144,41.909347],[-111.642346,41.911274],[-111.6392,41.911494],[-111.637757,41.911984],[-111.635943,41.911624],[-111.635706,41.912087],[-111.63615,41.914379],[-111.635844,41.916113],[-111.637502,41.917259],[-111.637957,41.919147],[-111.637947,41.919654],[-111.63693,41.921101],[-111.638085,41.921806],[-111.637518,41.922175],[-111.637554,41.92273],[-111.636887,41.923593],[-111.639647,41.922402],[-111.640861,41.922181],[-111.641888,41.922578],[-111.64406,41.922431],[-111.646813,41.922767],[-111.649147,41.922126],[-111.650223,41.923015],[-111.650851,41.922633],[-111.652707,41.922897],[-111.655254,41.92264],[-111.656156,41.923421],[-111.655254,41.92264],[-111.652895,41.922897],[-111.650851,41.922633],[-111.650223,41.923015],[-111.649147,41.922126],[-111.646813,41.922767],[-111.64406,41.922431],[-111.641888,41.922578],[-111.640861,41.922181],[-111.639647,41.922402],[-111.636887,41.923593],[-111.637554,41.92273],[-111.637518,41.922175],[-111.638085,41.921806],[-111.63693,41.921101],[-111.637947,41.919654],[-111.637957,41.919147],[-111.637502,41.917259],[-111.635844,41.916113],[-111.63615,41.914379],[-111.635706,41.912087],[-111.635943,41.911624],[-111.637757,41.911984],[-111.6392,41.911494],[-111.642346,41.911274],[-111.643144,41.909347],[-111.644055,41.908517],[-111.643245,41.906443],[-111.643374,41.906071],[-111.644024,41.905745],[-111.641797,41.904115],[-111.641017,41.903013],[-111.642014,41.899243],[-111.642624,41.898167],[-111.642528,41.896998],[-111.641597,41.895754],[-111.642342,41.895301]]
      },
      "doglake":{
        name:"doglake",
        name_description:"Dog Lake",
        center:{
          lat:40.649797,
          long:-111.648125
        },
        line:[[-111.648125,40.649797],[-111.648187,40.650113],[-111.647675,40.650203],[-111.644391,40.648535],[-111.642813,40.647829],[-111.641883,40.647568],[-111.641553,40.647566],[-111.639806,40.64846],[-111.638205,40.648748],[-111.637388,40.64967],[-111.636941,40.650436],[-111.636332,40.650615],[-111.63438,40.65182],[-111.633147,40.652826],[-111.632156,40.653221],[-111.631029,40.655027],[-111.630751,40.655879],[-111.630176,40.656514],[-111.629139,40.659537],[-111.629121,40.660004],[-111.629307,40.661201],[-111.629958,40.662316],[-111.630982,40.66283],[-111.632307,40.663221],[-111.633098,40.663886],[-111.635746,40.664924],[-111.638546,40.666707],[-111.638902,40.666873],[-111.639578,40.666458],[-111.640188,40.666391],[-111.641731,40.66745],[-111.642778,40.667124],[-111.644007,40.667028],[-111.646335,40.667468],[-111.647322,40.667237],[-111.64798,40.66728],[-111.648228,40.666608],[-111.648527,40.666547],[-111.649118,40.666864],[-111.65015,40.66692],[-111.650685,40.667409],[-111.651406,40.667576],[-111.651721,40.667837],[-111.652812,40.668053],[-111.654211,40.667565],[-111.654748,40.667137],[-111.655493,40.666806],[-111.656547,40.666466],[-111.657941,40.666381],[-111.658547,40.666057],[-111.65993,40.666006],[-111.66132,40.665152],[-111.661617,40.664477],[-111.662106,40.664141],[-111.662617,40.66318],[-111.662368,40.661993],[-111.66287,40.660325],[-111.663632,40.659915],[-111.663996,40.659376],[-111.663978,40.659165],[-111.664466,40.658685],[-111.664956,40.6575],[-111.66522,40.657256],[-111.665029,40.655486],[-111.663906,40.653932],[-111.663874,40.651358],[-111.663498,40.650818],[-111.66248,40.650365],[-111.661817,40.649316],[-111.66248,40.650365],[-111.663498,40.650818],[-111.663874,40.651358],[-111.663906,40.653932],[-111.665029,40.655486],[-111.66522,40.657256],[-111.664956,40.6575],[-111.664466,40.658685],[-111.663978,40.659165],[-111.664012,40.659342],[-111.663632,40.659915],[-111.66287,40.660325],[-111.662368,40.661993],[-111.662642,40.663074],[-111.662106,40.664141],[-111.661617,40.664477],[-111.66132,40.665152],[-111.660058,40.665958],[-111.658547,40.666057],[-111.657941,40.666381],[-111.656179,40.666539],[-111.654748,40.667137],[-111.654211,40.667565],[-111.652812,40.668053],[-111.651721,40.667837],[-111.651406,40.667576],[-111.650685,40.667409],[-111.65015,40.66692],[-111.649118,40.666864],[-111.648527,40.666547],[-111.648228,40.666608],[-111.64798,40.66728],[-111.647322,40.667237],[-111.646049,40.667454],[-111.644007,40.667028],[-111.642778,40.667124],[-111.641731,40.66745],[-111.640188,40.666391],[-111.639578,40.666458],[-111.638902,40.666873],[-111.63773,40.666264],[-111.635746,40.664924],[-111.633098,40.663886],[-111.632307,40.663221],[-111.630982,40.66283],[-111.629958,40.662316],[-111.629231,40.660963],[-111.629139,40.659537],[-111.630077,40.65671],[-111.630751,40.655879],[-111.631369,40.654448],[-111.632156,40.653221],[-111.633147,40.652826],[-111.63438,40.65182],[-111.636332,40.650615],[-111.636941,40.650436],[-111.638086,40.648805],[-111.639806,40.64846],[-111.641553,40.647566],[-111.641883,40.647568],[-111.642813,40.647829],[-111.644391,40.648535],[-111.647675,40.650203],[-111.648187,40.650113],[-111.648125,40.649797]]
      },
      "bryce":{
        name:"bryce",
        name_description:"Queen's Garden/Navajo Loop",
        center:{
          lat:37.6282535,
          long:-112.16295389999999
          },
        line:[[-112.162963,37.628226],[-112.163088,37.628225],[-112.162986,37.628454],[-112.162724,37.628248],[-112.162679,37.628084],[-112.162527,37.62797],[-112.162351,37.628037],[-112.161709,37.627956],[-112.161869,37.627811],[-112.161512,37.627929],[-112.161519,37.627779],[-112.161148,37.627457],[-112.160908,37.627477],[-112.160385,37.627678],[-112.160223,37.627641],[-112.160154,37.62754],[-112.160223,37.627378],[-112.159632,37.627199],[-112.159497,37.627028],[-112.159331,37.627012],[-112.15916,37.627083],[-112.159314,37.626893],[-112.159117,37.626954],[-112.159203,37.626839],[-112.158997,37.626886],[-112.159236,37.626494],[-112.159229,37.626161],[-112.159022,37.625962],[-112.158834,37.625615],[-112.158863,37.625354],[-112.158928,37.625445],[-112.158966,37.625354],[-112.159023,37.625418],[-112.159045,37.625565],[-112.159264,37.625562],[-112.159443,37.625689],[-112.159425,37.625808],[-112.159616,37.625818],[-112.159782,37.625912],[-112.16009,37.625484],[-112.160061,37.625281],[-112.160317,37.624992],[-112.160629,37.625282],[-112.160659,37.625679],[-112.160852,37.625693],[-112.160999,37.625804],[-112.160973,37.625603],[-112.161056,37.625417],[-112.161457,37.625809],[-112.161525,37.625998],[-112.161732,37.625961],[-112.161525,37.625998],[-112.161457,37.625809],[-112.161225,37.625632],[-112.161145,37.625455],[-112.161391,37.624602],[-112.160925,37.624058],[-112.160571,37.623777],[-112.160367,37.623756],[-112.159889,37.623902],[-112.159726,37.623861],[-112.159649,37.623773],[-112.159742,37.623596],[-112.159546,37.623378],[-112.159632,37.622658],[-112.158851,37.62225],[-112.158482,37.622168],[-112.158259,37.621175],[-112.158301,37.620681],[-112.158556,37.62004],[-112.158799,37.619816],[-112.159031,37.619728],[-112.159409,37.619401],[-112.160427,37.618881],[-112.16053,37.618732],[-112.160912,37.618556],[-112.16146,37.618701],[-112.161477,37.618565],[-112.161949,37.618497],[-112.161922,37.618341],[-112.162027,37.618244],[-112.162684,37.619303],[-112.163337,37.620062],[-112.1634,37.620483],[-112.164215,37.621134],[-112.164431,37.621765],[-112.164999,37.622036],[-112.165218,37.622356],[-112.165493,37.622529],[-112.165717,37.623336],[-112.165791,37.623216],[-112.16575,37.623099],[-112.165911,37.623017],[-112.165818,37.622477],[-112.166152,37.623003],[-112.166033,37.623185],[-112.166008,37.623422],[-112.166351,37.624021],[-112.166482,37.624618],[-112.166461,37.625039],[-112.166287,37.625404],[-112.165608,37.625953],[-112.165011,37.626872],[-112.164675,37.627191],[-112.164229,37.627444],[-112.163719,37.628019],[-112.163194,37.628311],[-112.163007,37.628344],[-112.163088,37.628225],[-112.162963,37.628226]]
        },
        "cascade":{
          name:"cascade",
          name_description:"Cascade Canyon",
          center:{
            lat:43.7514791,
            long:-110.72232930000001
          },
          line:[[-110.722217,43.751514],[-110.723837,43.750944],[-110.724941,43.749791],[-110.726558,43.749973],[-110.728815,43.749285],[-110.729251,43.749875],[-110.730918,43.749875],[-110.733111,43.748658],[-110.734623,43.748683],[-110.736545,43.747906],[-110.739897,43.748805],[-110.73869,43.751281],[-110.739482,43.753945],[-110.74266,43.761229],[-110.745153,43.764844],[-110.748095,43.765117],[-110.749759,43.76468],[-110.750239,43.765395],[-110.748793,43.765697],[-110.749612,43.766136],[-110.748401,43.766883],[-110.748529,43.76733],[-110.753157,43.767281],[-110.75485,43.766932],[-110.755716,43.765616],[-110.761437,43.763205],[-110.765264,43.76371],[-110.768166,43.763519],[-110.770084,43.762582],[-110.773126,43.763176],[-110.779988,43.763278],[-110.79713,43.764697],[-110.805189,43.76438],[-110.809636,43.765266],[-110.81216,43.764407],[-110.816689,43.764505],[-110.81216,43.764407],[-110.809636,43.765266],[-110.805189,43.76438],[-110.79713,43.764697],[-110.784278,43.76355],[-110.773126,43.763176],[-110.770084,43.762582],[-110.768166,43.763519],[-110.765264,43.76371],[-110.761534,43.763178],[-110.755716,43.765616],[-110.754548,43.767038],[-110.748612,43.767355],[-110.748401,43.766883],[-110.749612,43.766136],[-110.748793,43.765697],[-110.750239,43.765395],[-110.750171,43.764944],[-110.747309,43.763873],[-110.747355,43.763341],[-110.744853,43.761673],[-110.744445,43.759955],[-110.744018,43.757571],[-110.741956,43.754347],[-110.741981,43.752825],[-110.740601,43.752089],[-110.739541,43.750166],[-110.739654,43.748606],[-110.736545,43.747906],[-110.734476,43.748708],[-110.732977,43.74825],[-110.731555,43.748463],[-110.726934,43.749905],[-110.724459,43.749932],[-110.724005,43.750827],[-110.722217,43.751514]]
        },
        "catherine":{
          name:"catherine",
          name_description:"Lake Catherine",
          center:{
            lat:40.57927797826895,
            long:-111.61068646019015
          },
          line:[[-111.610705,40.579265],[-111.610705,40.579265],[-111.610614,40.580441],[-111.610426,40.580637],[-111.610187,40.581548],[-111.609819,40.581143],[-111.609806,40.580744],[-111.609441,40.580422],[-111.608601,40.579955],[-111.608008,40.579955],[-111.607903,40.57985],[-111.60778,40.579013],[-111.606656,40.57916],[-111.606279,40.579028],[-111.60612,40.57913],[-111.606197,40.579566],[-111.60532,40.580261],[-111.603646,40.580623],[-111.603436,40.580511],[-111.602864,40.580841],[-111.602391,40.580793],[-111.601992,40.580931],[-111.60116,40.580844],[-111.600834,40.581617],[-111.600962,40.581994],[-111.600044,40.581524],[-111.600327,40.581949],[-111.600167,40.581954],[-111.599692,40.581535],[-111.599016,40.581246],[-111.598501,40.580722],[-111.597751,40.581336],[-111.59685,40.581711],[-111.596428,40.581744],[-111.595939,40.581357],[-111.595661,40.581638],[-111.594685,40.581905],[-111.593237,40.58242],[-111.591467,40.58272],[-111.591141,40.583037],[-111.590548,40.583042],[-111.589692,40.583437],[-111.589557,40.58374],[-111.589213,40.583841],[-111.589147,40.584393],[-111.588595,40.585353],[-111.588473,40.585922],[-111.588789,40.585927],[-111.589046,40.585431],[-111.590343,40.584568],[-111.590454,40.58558],[-111.590255,40.586194],[-111.589984,40.586416],[-111.590011,40.586871],[-111.589203,40.587014],[-111.588956,40.587209],[-111.588988,40.587607],[-111.588626,40.588155],[-111.588666,40.588829],[-111.588505,40.58925],[-111.588065,40.589462],[-111.587745,40.589982],[-111.585807,40.589375],[-111.584975,40.589596],[-111.585149,40.58985],[-111.58575,40.589658],[-111.586197,40.589894],[-111.586894,40.590609],[-111.588659,40.591476],[-111.588578,40.591786],[-111.588911,40.592201],[-111.588642,40.593279],[-111.591641,40.593665],[-111.592443,40.594365],[-111.592586,40.594327],[-111.593068,40.594587],[-111.593361,40.594382],[-111.59376,40.594466],[-111.594377,40.594829],[-111.59472,40.595537],[-111.594195,40.595998],[-111.594892,40.596352],[-111.595278,40.597016],[-111.595962,40.597515],[-111.595476,40.598131],[-111.595072,40.598193],[-111.595164,40.598763],[-111.596145,40.598966],[-111.596183,40.599249],[-111.596882,40.599793],[-111.597581,40.599553],[-111.600173,40.599662],[-111.601091,40.599325],[-111.601563,40.599426],[-111.602375,40.599361],[-111.603313,40.599105],[-111.603676,40.598875],[-111.604255,40.598844],[-111.60465,40.598264],[-111.60524,40.597985],[-111.605613,40.597535],[-111.606739,40.597056],[-111.607951,40.596294],[-111.608918,40.595262],[-111.609145,40.594586],[-111.60936,40.594513]]
        },
        "grandaddy":{
          name:"grandaddy",
          name_description:"Grandaddy Basin",
          center:{
            lat:40.56768453437445,
            long:-110.8251111645466,
          },
          line:[[-110.825115,40.567694],[-110.823426,40.570221],[-110.825486,40.578175],[-110.822224,40.582738],[-110.822353,40.585926],[-110.817375,40.593747],[-110.811924,40.597599],[-110.812697,40.599225],[-110.810852,40.604503],[-110.808636,40.606701],[-110.811023,40.610465],[-110.816045,40.612586],[-110.820111,40.617176],[-110.817718,40.627992],[-110.820782,40.630507],[-110.823684,40.632421],[-110.820669,40.636491],[-110.815873,40.638804],[-110.811876,40.63907],[-110.805702,40.639228],[-110.801282,40.642712],[-110.803041,40.647271],[-110.801153,40.646424],[-110.801142,40.648051],[-110.798535,40.650885],[-110.803535,40.653522],[-110.803509,40.654746],[-110.803535,40.653522],[-110.798464,40.650847],[-110.795188,40.648704],[-110.791685,40.648255],[-110.793645,40.635355],[-110.796971,40.629867],[-110.803065,40.623499],[-110.810321,40.623924],[-110.809522,40.618873],[-110.811496,40.617212],[-110.808653,40.616264],[-110.812487,40.611537],[-110.808663,40.606787],[-110.810852,40.604503],[-110.812697,40.599225],[-110.811924,40.597599],[-110.817375,40.593747],[-110.822353,40.585926],[-110.822224,40.582738],[-110.825486,40.578175],[-110.823426,40.570221],[-110.825115,40.567694]]
        },
        "muley":{
          name:"muley",
          name_description:"Upper Muley Twist",
          center:{
            lat:37.8583807,
            long:-111.03865080000003
          },
          line:[[-111.038827,37.858381],[-111.038935,37.85911],[-111.037663,37.859172],[-111.037197,37.859908],[-111.03901,37.860832],[-111.039041,37.862298],[-111.040073,37.863099],[-111.040725,37.865209],[-111.043232,37.865076],[-111.041043,37.867288],[-111.0416,37.869575],[-111.044543,37.868908],[-111.044916,37.869309],[-111.044511,37.870585],[-111.042699,37.871261],[-111.044855,37.873543],[-111.044378,37.874711],[-111.045304,37.875599],[-111.046115,37.880648],[-111.047373,37.882844],[-111.049786,37.884717],[-111.049514,37.885504],[-111.050956,37.888614],[-111.053595,37.891579],[-111.0533,37.893023],[-111.054839,37.893423],[-111.054784,37.894918],[-111.056031,37.895229],[-111.058044,37.899257],[-111.059796,37.900688],[-111.059796,37.900688],[-111.059395,37.901858],[-111.060327,37.902632],[-111.059617,37.90319],[-111.061732,37.905397],[-111.062447,37.907564],[-111.064952,37.907885],[-111.065118,37.908959],[-111.0661,37.909574],[-111.065796,37.910417],[-111.067477,37.910676],[-111.067084,37.911928],[-111.068978,37.912752],[-111.070026,37.914539],[-111.06984,37.915782],[-111.071365,37.916769],[-111.072117,37.92026],[-111.071718,37.92111],[-111.073321,37.921082],[-111.0735,37.92292],[-111.074608,37.923709],[-111.07578,37.926114],[-111.076794,37.928582],[-111.076771,37.931071],[-111.07165,37.925051],[-111.071299,37.92391],[-111.07011,37.922119],[-111.070012,37.918971],[-111.067607,37.916385],[-111.066112,37.912741],[-111.061527,37.908762],[-111.060146,37.90611],[-111.058272,37.904741],[-111.055647,37.901425],[-111.056537,37.900154],[-111.057288,37.900068],[-111.058441,37.901383],[-111.059425,37.901587],[-111.05982,37.900337],[-111.058044,37.899257],[-111.056031,37.895229],[-111.054784,37.894918],[-111.054839,37.893423],[-111.0533,37.893023],[-111.053595,37.891579],[-111.050956,37.888614],[-111.049514,37.885504],[-111.049786,37.884717],[-111.047373,37.882844],[-111.046115,37.880648],[-111.045304,37.875599],[-111.044378,37.874711],[-111.044855,37.873543],[-111.042699,37.871261],[-111.044511,37.870585],[-111.044916,37.869309],[-111.044543,37.868908],[-111.0416,37.869575],[-111.041043,37.867288],[-111.043232,37.865076],[-111.040846,37.865313],[-111.040073,37.863099],[-111.039041,37.862298],[-111.03901,37.860832],[-111.037197,37.859908],[-111.037663,37.859172],[-111.038935,37.85911],[-111.038827,37.858381]]
        }
      
    }
    service.setUp = function(guide){
        var div = document.createElement("div");
        div.setAttribute("id", "map");
        div.setAttribute("style", "height:600px;top:50px");
          // as an example add it to the body
         document.getElementById("map-container").appendChild(div);
      if (window.sqlitePlugin) {
          console.log('has sqlitePlugin');
          
          service.copysuccess = function () {
            console.log("copy success");
            service.buildMap(guide);

          };

          service.copyerror = function (e) {
            //db already exists or problem in copying the db file. Check the Log.
            console.log("Error Code = "+JSON.stringify(e));
            //e.code = 516 => if db exists
            if (e.code == 516) {
                console.log('removing existent database file..new copy');
                window.plugins.sqlDB.remove(guide+".mbtiles", 0, service.removesuccess, service.removeerror);          }
          };

          service.removesuccess = function () {
            console.log("remove success");
            window.plugins.sqlDB.copy(guide+".mbtiles", 0, service.copysuccess, service.copyerror);
          };

          service.removeerror = function () {
            console.log("remove error");
          };

          window.plugins.sqlDB.copy(guide+".mbtiles",  0, service.copysuccess, service.copyerror);
      }
      else{
        console.log("no");
      }

  }
  service.closeDB = function(){
    if(service.db)service.db.close();
    if(service.map){
      service.map = null;
      var node  = document.getElementById("map");
      node.parentNode.removeChild(node);

    }
  }
  service.buildMap = function(guide) {
    console.log("build map");
  
   var dbOptions = {};

   if (ionic.Platform.isAndroid()) {
     dbOptions = {name: guide+".mbtiles", createFromLocation: 1, location: 'default', androidDatabaseImplementation: 2, androidLockWorkaround: 1};
   }
   else {
     dbOptions = {name: guide+".mbtiles", createFromLocation: 1, location:'default'};
   }

   var db = window.sqlitePlugin.openDatabase(dbOptions, function(db) {
     db.transaction(function(tx) {
       console.log("transaction: " + tx);
       console.log(JSON.stringify(service.guides[guide]));
       service.map = new L.Map('map', {
         center: new L.LatLng(service.guides[guide].center.lat,service.guides[guide].center.long),
         attributionControl: true,
         zoom: 14,
         maxZoom: 16,
         minZoom: 12,
     
       });
       var line = [];
       for(var coord in service.guides[guide].line){
        line.push([service.guides[guide].line[coord][1], service.guides[guide].line[coord][0]]);
       }
       var polyline = L.polyline(line, {color: 'black'}).addTo(service.map);
        // zoom the map to the polyline
   

       var lyr = new L.TileLayer.MBTiles('',
          {
           tms: true,
           scheme: 'tms',
           unloadInvisibleTiles:true
         },  db);

       lyr.addTo(service.map);

       console.log("end of build map");
     }, function(err) {
       console.log('Open database ERROR: ' + JSON.stringify(err));
     });
   });
   service.db = db;

  };

  /**
   * Center map on user's current position
   */
  service.locate = function(){

    $cordovaGeolocation
      .getCurrentPosition()
      .then(function (position) {
        console.log('current position: '+position);

        // remove layer que contém markers de posição
        if (service.layerPositionMarker != null) {
          service.map.removeLayer($scope.layerPositionMarker);
        }

        service.map.setView(new L.LatLng(position.coords.latitude, position.coords.longitude), 17, {animate: true});

        var marker = L.marker([position.coords.latitude,position.coords.longitude]).bindPopup("<b>Estou aqui</b>").openPopup();

        service.layerPositionMarker = L.layerGroup([marker]);
        service.layerPositionMarker.addTo($scope.map);

      }, function(err) {
        // error
        console.log("Location error!");
        console.log(err);
      });

  };
  return service;
  })
  .factory('ConnectivityMonitor', function($rootScope, $cordovaNetwork){
  service = {};

    service.isOnline = function(){
    
        return navigator.onLine;
      
    },
    service.isOffline = function(){
        return !navigator.onLine;
      
    },
    service.startWatching = function(){
        if(ionic.Platform.isWebView()){
 
          $rootScope.$on('$cordovaNetwork:online', function(event, networkState){
            console.log("went online");
            service.online = true;
          });
 
          $rootScope.$on('$cordovaNetwork:offline', function(event, networkState){
            Mapbox.hide();
            console.log("went offline");
            service.offline = false;
          });
 
        }
        else {
 
          window.addEventListener("online", function(e) {
            console.log("went online");
            service.online = true;
          }, false);    
 
          window.addEventListener("offline", function(e) {
            Mapbox.hide();
            console.log("went offline");
            service.online = false;
          }, false);  
        }       
    }
  service.online = service.isOnline();  
  return service
  
})
  .factory('BackgroundLocation', function(){
    var service = {};
    service.coords = [];
    var bgGeo = window.BackgroundGeolocation;
     var callbackFn = function(location, taskId) {
      service.distance +=1;
        var coords = location.coords;
        var lat    = coords.latitude;
        var lng    = coords.longitude;
        service.coords.push([lat, lng]);
        console.log('- Location: ', JSON.stringify(location));

        // Must signal completion of your callbackFn.
        bgGeo.finish(taskId);
    };
       var failureFn = function(errorCode) {
        console.warn('- BackgroundGeoLocation error: ', errorCode);
    }
    bgGeo.configure({
        // Geolocation config
        desiredAccuracy: 100,
        distanceFilter: 15,
      });
    // Listen to location events & errors.
    bgGeo.on('location', callbackFn, failureFn);
    service.toggle = function(value) {
        if (value) {
            service.coords = [];
            service.distance = 0;
            bgGeo.start();
        } else {
            bgGeo.stop();
            return service.coords;
        }
    }
    return service;
  });
