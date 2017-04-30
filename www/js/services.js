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
     for(var guide in service.featured){
      setStyle(service.featured[guide], featured_style);
     }
      var near_style = {
       row_index: 0, 
       one_row:false,
       row:0
     };
     for(var guide in service.closest){
      setStyle(service.closest[guide], near_style);
     }
      var new_style = {
       row_index: 0, 
       one_row:false,
       row:0
     };
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
  });
