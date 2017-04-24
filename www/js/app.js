// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'firebase', 'starter.controllers', 'starter.services', 'ngCordova','ion-gallery','jett.ionic.filter.bar','ngMd5'])

.run(function($ionicPlatform, $rootScope, $cordovaGeolocation, $http) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
    $rootScope.getUserPos();
    $rootScope.fillTrailheads();
  });
  $rootScope.fillTrailheads = function(){
    if($rootScope.data!=null){
    $rootScope.markers = [];
              for(var guide in $rootScope.data.guides){
                $rootScope.markers.push({
                  lat: $rootScope.data.guides[guide].coords[0].lat,
                  lng: $rootScope.data.guides[guide].coords[0].long,
                  title: $rootScope.data.guides[guide].name_description,
                  name:$rootScope.data.guides[guide].name
                });
          
              }
            }
  }
  $rootScope.getUserPos = function(){
   
    var posOptions = {timeout: 10000, enableHighAccuracy: false};
      $cordovaGeolocation
        .getCurrentPosition(posOptions)
        .then(function (position) {
          console.log('got user pos');
         var userPos = {lat: position.coords.latitude, lng: position.coords.longitude};
          $rootScope.userPos = userPos;
        
        }, function(err) {
          console.log(err);
          $rootScope.userPos = {lat:40.758701 ,lng:-111.876183}
        });           
  }
  $rootScope.getDirectionsFromUser=function(destination){
    $rootScope.getDirections($rootScope.userPos, destination);
  }
  $rootScope.getDirections = function(origin,destination){
  //mapbox way
  var reqURL = "https://api.mapbox.com/directions/v5/mapbox/driving/"+origin.lng+","+origin.lat+";"+ destination.lng+","+destination.lat+ "?geometries=geojson&access_token=pk.eyJ1IjoiYXdpbHNvbjkiLCJhIjoiY2lyM3RqdGloMDBrbTIzbm1haXI2YTVyOCJ9.h62--AvCDGN25QoAJm6sLg";
   $http.get(reqURL)
            .success(function(data) {
           var src = $rootScope.data.guides[destination.name].image_descriptions[0].URL;
            $rootScope.closest.push({duration:data.routes[0].duration, name:destination.name, src:src});
            
            if($rootScope.closest.length==$rootScope.data.num_guides){

            $rootScope.sortClosest();
            console.log(JSON.stringify($rootScope.closest, null, 4));
          }
            })
            .error(function(data) {
               
            });
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
  $rootScope.sortClosest = function(){
    compare = function(a, b){
      return a.duration - b.duration;
    }
   $rootScope.closest.sort(compare);
   var small_arr = [];
   for(var i=0;i<5;i++){
    small_arr.push($rootScope.closest[i]);
   }
   $rootScope.closest = small_arr;
  //   var size = ($rootScope.closest.length<5) ? $rootScope.closest.length : 5;
  //   if(size<5){
  //     $rootScope.closest.push(obj);
  //   }
  //   else{
  //   for(var i=0;i<size;i++){

  //     if(obj.duration<$rootScope.closest[i].duration){
  //       $rootScope.closest.splice(i, 0, obj);
  //     }
  //   }
  //   if(size<5)$rootScope.closest[size] = obj;
  // }
  }

})

.config(function($stateProvider, $urlRouterProvider, $sceDelegateProvider) {
  $sceDelegateProvider.resourceUrlWhitelist(['self', new RegExp('^(http[s]?):\/\/(w{3}.)?youtube\.com/.+$')])
  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
   var config = {
      apiKey: "AIzaSyAalRJwK4GE3UviGtXGhSw63b7OgE6bE90",
      authDomain: "hippiehikes-a35e3.firebaseapp.com",
      databaseURL: "https://hippiehikes-a35e3.firebaseio.com",
      storageBucket: "hippiehikes-a35e3.appspot.com",

    };
    firebase.initializeApp(config);

  $stateProvider

  // setup an abstract state for the tabs directive
    .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html',
    controller:'MainCtrl'
  })

  // Each tab has its own nav history stack:

  .state('tab.homepage', {
    url: '/homepage',
    views: {
      'tab-homepage': {
        templateUrl: 'templates/homepage.html',
        controller: 'HomepageCtrl'
      }
    }
  })
  .state('guide',{
    url:'/guide',
    templateUrl:'templates/guide.html',
    controller:'GuideCtrl',
    params:{'data':null, 'ref':null},
    cache:false
        
  })


  .state('tab.search', {
      url: '/search',
      views: {
        'tab-search': {
          templateUrl: 'templates/search.html',
          controller: 'SearchCtrl'
        }
      }
    })

  .state('tab.map', {
    url: '/map',
    cache:false,
    views: {
      'tab-map': {
        templateUrl: 'templates/map.html',
        controller: 'MapCtrl'
      }
    }
  })
  .state('login', {
  url: '/login',
  controller: 'AuthCtrl as authCtrl',
  templateUrl: 'templates/login.html',
  resolve: {
  requireNoAuth: function($state, Auth){
    return Auth.$requireSignIn().then(function(auth){
      $state.go('tab.homepage');
    }, function(error){
      return;
    });
  }
}
})
.state('register', {
  url: '/register',
  controller: 'AuthCtrl as authCtrl',
  templateUrl: 'templates/register.html',
  resolve: {
  requireNoAuth: function($state, Auth){
    return Auth.$requireSignIn().then(function(auth){
      $state.go('tab.homepage');
    }, function(error){
      return;
    });
  }
}
})
.state('tab.profile', {
  url: '/profile',
  resolve: {
    auth: function($state, Users, Auth){
      return Auth.$requireSignIn().catch(function(){
        $state.go('tab.homepage');
      });
    },
    profile: function(Users, Auth){
      return Auth.$requireSignIn().then(function(auth){
        return Users.getProfile(auth.uid).$loaded();
      });
    }
  },
  views:{
    'tab-profile':{
        controller: 'ProfileCtrl as profileCtrl',
        templateUrl: 'templates/profile.html',
    }
  }

});

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');

})
