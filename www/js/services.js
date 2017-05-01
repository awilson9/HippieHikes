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
           toReturn = "height:125px;width:"+((7*$window.innerWidth/16)-1.5)+"px;margin-right:1px;margin-left:0.5px;margin-top:0.5px;margin-bottom:0.5px;display:block;"
        }
        if(!style.one_row){
              if(style.row_index==1){
                style.one_row = true;
                style.row_index=0;
                    style.row++;
                    style.left = !style.left;
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
  })
  .factory('Guide', function(Setup, Users, Auth){
    var service = {};
    service.setup = function(guide){
      var promise = new Promise(function(resolve, reject){
        Auth.$requireSignIn().then(function(auth){
        Users.getProfile(auth.uid).$loaded().then(function(data){
          service.profile=data;
          resolve();
        });
      });
      service.guide = guide;
      service.data = Setup.data.guides[guide];
      if(service.data.hyperlapse!=null)service.hyperlapse = "https://www.youtube.com/embed/"+service.data.hyperlapse;
      else service.hyperlapse = "";
      service.siteURL = service.data.image_descriptions[0].URL;
      
      })
       return promise;
    } 
      // $ionicModal.fromTemplateUrl('templates/checkin.html', {
      //     scope: $scope,

      //     animation: 'slide-in-up'
      //   }).then(function(modal) {
      //     $scope.modal = modal;
      //   });
      //   $scope.openModal = function() {
      //     $scope.modal.show();
      //   };
      //   $scope.closeModal = function() {
      //     $scope.modal.hide();
      //   };
      //   // Cleanup the modal when we're done with it!
      //   $scope.$on('$destroy', function() {
      //     $scope.modal.remove();
      //   });
      //   // Execute action on hide modal
      //   $scope.$on('modal.hidden', function() {
      //     // Execute action
      //   });
      //   // Execute action on remove modal
      //   $scope.$on('modal.removed', function() {
      //     // Execute action
      //   });
      //   $scope.diff={
      //     easy:false,
      //     medium:false,
      //     intermediate:false,
      //     hard:false
      //   }
      //   $scope.checkin = {
      //     diff:'',
      //     hour:'',
      //     minute:'',
      //     notes:'',
      //     date:'',
      //     distance:'',
      //     guide:$scope.data.name
      //   }
      //   $scope.submit = function(){
      //     if($scope.profile.checkins==null)$scope.profile.checkins = [];
      //     $scope.profile.checkins.push($scope.checkin);
      //     $scope.profile.$save();
      //     $scope.closeModal();
      //   }
      //   $scope.setDiff = function(diff){
      //     var change = $scope.diff[diff];
      //     $scope.diff={
      //     easy:false,
      //     medium:false,
      //     intermediate:false,
      //     hard:false
      //   }
      //   $scope.diff[diff]=!change;
      //   $scope.checkin.diff = diff; 
      //   }
    service.addToFuture = function(){
      if(service.profile.future==null){
        service.profile.future = []
        
        }
      if(service.profile.future.indexOf(service.guide)==-1){
        service.profile.future.push(service.guide);
        alert("Guide Added");
      }
      else{
        service.profile.future.splice(service.profile.future.indexOf(service.guide), 1);
        alert("Guide Succesfully Removed");
      }
      service.profile.$save();
    }
    service.displayMap = false;

    service.closeMap = function(){
        Mapbox.hide(
    {},
    function(msg) {
      console.log("Mapbox successfully hidden");
    }
  );
    }
    service.showMap = function(){
         Mapbox.show(
    {
      style: 'mapbox://styles/awilson9/cirl1qq6k001dg4mb3f4bs1iv', // light|dark|emerald|satellite|streets , default 'streets'
      margins: {
        left: 0, // default 0
        right: 0, // default 0
        top: 64, // default 0
        bottom: 0 // default 0
      },
      center: { // optional, without a default
        lat: service.data.coords[0].lat,
        lng: service.data.coords[0].long
      },
      zoomLevel: 11, // 0 (the entire world) to 20, default 10
      showUserLocation: true, // your app will ask permission to the user, default false
      hideAttribution: false, // default false, Mapbox requires this default if you're on a free plan
      hideLogo: false, // default false, Mapbox requires this default if you're on a free plan
      hideCompass: false, // default false
      disableRotation: false, // default false
      disableScroll: false, // default false
      disableZoom: false, // default false
      disablePitch: false, // disable the two-finger perspective gesture, default false
      
    },

    // optional success callback
    function(msg) {
      console.log("Success :) " + JSON.stringify(msg));
    },

    // optional error callback
    function(msg) {
      alert("Error :( " + JSON.stringify(msg));
    }
  )
    }
 service.openGuide = function(guide){
    
  }
    

    
      
    
    service.slideVisible = function(index){
      if(  index < $ionicSlideBoxDelegate.currentIndex() -1 
         || index > $ionicSlideBoxDelegate.currentIndex() + 1){
        return false;
      }
      
      return true;
    }
    return service;
  });
