// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'firebase', 'starter.controllers', 'starter.services', 'ngCordova','ion-gallery','jett.ionic.filter.bar','ngMd5'])
.constant('mapDbName', 'map.mbtiles')
.run(function($ionicPlatform, $rootScope, $cordovaGeolocation, $http, $firebaseObject) {
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
   
     
    
    
  });

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
    resolve:{
      profile: function(Users, Auth){
      return Auth.$requireSignIn().then(function(auth){
        return Users.getProfile(auth.uid).$loaded().then(function(data){
          return data;
        });
      });
    }
    },
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
