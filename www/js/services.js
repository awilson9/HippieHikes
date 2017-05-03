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
          console.log(err);
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
  }).factory('SqliteService',function($q, $cordovaSQLite, $ionicPlatform){
  var self = this;
  self.db = null;
  self.dbPromise = null;

  self.copysuccess = function () {
    console.log("copy success");
    $scope.buildMap();
  };

  self.copyerror = function (e) {
    //db already exists or problem in copying the db file. Check the Log.
    console.log("Error Code = "+JSON.stringify(e));
    //e.code = 516 => if db exists
    if (e.code == 516) {
        console.log('removing existent database file..new copy');
        window.plugins.sqlDB.remove(mapDbName, 0, removesuccess, removeerror);          }
  };

  self.removesuccess = function () {
    console.log("remove success");
    window.plugins.sqlDB.copy(mapDbName, 0, copysuccess, copyerror);
  };

  self.removeerror = function () {
    console.log("remove error");
  };

  self.openDataBase = function (def) {
    var dbOptions = {};

    if (ionic.Platform.isAndroid()) {
      dbOptions = {name: mapDbName, createFromLocation: 1, androidDatabaseImplementation: 2, androidLockWorkaround: 1};
    }
    else {
      dbOptions = {name: mapDbName, createFromLocation: 1};
    }

    self.db = window.sqlitePlugin.openDatabase(dbOptions, function(){
      def.resolve(true);
      console.log('opened def = true');
    });
  };

  self.init = function() {
      console.log("sqlservice init");
      var def = $q.defer();
      if (self.db != null) {
        console.log('database already created');
        return self.dbPromise;
      }
      else {
        try {
          if (window.sqlitePlugin) {
            var dbOptions = {};

            if (ionic.Platform.isAndroid()) {
              dbOptions = {name: mapDbName, createFromLocation: 1, androidDatabaseImplementation: 2, androidLockWorkaround: 1};
            }
            else {
              dbOptions = {name: mapDbName, createFromLocation: 1};
            }

            self.db = window.sqlitePlugin.openDatabase(dbOptions, function(){
              def.resolve(true);
              console.log('opened def = true');
            });

        } else {
          def.reject();
        }
      } catch (e) {
        def.reject(e);
      }
    }
    self.dbPromise = def.promise; // salva a promise de abertura do bd

    return def.promise;
  };

self.query = function(query, bindings) {
  self.dbPromise = self.init();
  //do stuff to the database. use promises
  bindings = typeof bindings !== 'undefined' ? bindings : [];
  var execQueryDef = $q.defer();

  self.dbPromise.then(function(query, bindings) {
    self.db.transaction(function(transaction) {
        transaction.executeSql(query, bindings,function(trans,resp){
            execQueryDef.resolve(resp);
        });
    });
  });

  return execQueryDef.promise;
}

return self;
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
        else if(style.row_index==0){
          toReturn = "height:125px;width:"+((7*$window.innerWidth/16)-1.5)+"px;margin-left:1px;margin-right:0.5px;margin-top:0.5px;margin-bottom:0.5px;display:block;";
        }
        else{
           toReturn = "height:125px;width:"+((9*$window.innerWidth/16)-1.5)+"px;margin:1px;margin-right:0.5px;margin-top:0.5px;margin-bottom:0.5px;display:block;"
        }
        if(!style.one_row){
              if(style.row_index==1){
                style.one_row = true;
                style.row_index=0;
                    style.row++;
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
       row:0
     };
    if(service.featured.length==1)featured_style.one_row = true;
     for(var guide in service.featured){
     
      setStyle(service.featured[guide], featured_style);
     }
      var near_style = {
       row_index: 0, 
       one_row:false,
       row:0
     };
     if(service.closest.length==1)near_style.one_row = true;
     for(var guide in service.closest){
      setStyle(service.closest[guide], near_style);
     }
      var new_style = {
       row_index: 0, 
       one_row:false,
       row:0
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
  }).factory('Map', function(Setup){
    var service = {}
    service.setup = function(){
    if(!service.done){
    var mapStyle = {
    "version": 8,
    "Name": "Demo",
    "sources": {
      "naturalearth": {
        "type": "vector",
        "tiles": [
          "{z}/{x}/{y}"
        ],
        "mbtiles": true
      },
      "naoverview": {
        "type": "raster",
        "tiles": [
          "{z}/{x}/{y}"
        ],
        "tileSize": 256,
        "mbtiles": true
      }
    },
    "layers": [
      {
        "id": "background",
        "type": "background",
        "paint": {
          "background-color": "#000000"
        }
      },
      {
        "id": "naturalearth",
        "type": "line",
        "source": "naturalearth",
        "source-layer": "ne_110m_admin_0_countries_lakes",
        "minzoom": 0,
        "paint": {
          "line-color": "#ff0000"
        }
      },
      {
        "id": "naoverview",
        "type": "raster",
        "source": "naoverview",
        "minzoom": 2,
        "layout": {
            "visibility": "visible"
        },
        "paint": {}
      }
    ]
  };

    mapboxgl.accessToken = 'pk.eyJ1IjoiYXdpbHNvbjkiLCJhIjoiY2lyM3RqdGloMDBrbTIzbm1haXI2YTVyOCJ9.h62--AvCDGN25QoAJm6sLg';
    service.map = new mapboxgl.Map({
    container: 'map',
    style: mapStyle,
    center:[-111.6954831, 40.6055049],
    zoom:14
    });
    service.done = true;
    }
    //service.addMarkers(Setup.markers);
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
  .service('OfflineMap', function($cordovaSQLite, $cordovaGeolocation,SqliteService){
    var service = {};
    service.layerPositionMarker = null;
    service.guides = {
      "blanche" :{
        name: "blanche",
        center:{
          lat: 40.6336,
          long:-111.724
        }
      },
      "bryce":{
        name:"bryce",
        center:{
          lat:37.6282535,
          long:-112.16295389999999
        },
        "cascade":{
          name:"cascade",
          center:{
            lat:43.7514791,
            long:-110.72232930000001
          }
        },
        "catherine":{
          name:"catherine",
          center:{
            lat:40.57927797826895,
            long:-111.61068646019015
          }
        },
        "grandaddy":{
          name:"grandaddy",
          center:{
            lat:40.56768453437445,
            long:-110.8251111645466
          }
        },
        "muley":{
          name:"muley",
          center:{
            lat:37.8583807,
            long:-111.03865080000003
          }
        }
      }
    }
    service.setUp = function(guide){
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
  
});
