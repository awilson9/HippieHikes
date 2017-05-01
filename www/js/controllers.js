  angular.module('starter.controllers', [])
  .controller('AuthCtrl', function(Auth, $state, $state, $scope){
    var authCtrl = this;
    authCtrl.user = {
      email: '',
      password: ''
    };
  authCtrl.login = function (){
    Auth.$signInWithEmailAndPassword(authCtrl.user.email, authCtrl.user.password).then(function (auth){
      $state.go('tab.homepage');
    }, function (error){
      authCtrl.error = error;
    });
  };
  authCtrl.register = function (){
     Auth.$createUserWithEmailAndPassword(authCtrl.user.email, authCtrl.user.password).then(function (user){
       $state.go('tab.homepage');
     }, function (error){
       authCtrl.error = error;
     });
    };
    $scope.register = function(){
      $state.go('register');
    }
  }) 
  .controller('ProfileCtrl', function($state, md5, Auth, profile, auth,$scope, Setup){
    var profileCtrl = this;
    $scope.data = Setup.data;
    $scope.profile = profile;
    profileCtrl.profile = profile;
    $scope.view = {
      future:true,
      offline:false,
      past:false,
      checkins:false
    }
  $scope.display = function(change){
    $scope.view = {
      future:false,
      offline:false,
      past:false,
      checkins:false
    }
    $scope.view[change] = true;
  }
  $scope.openGuide = function(guide){
    console.log('going to guide');
    $state.go('guide', {'data': guide});
  }
    
    profileCtrl.updateProfile = function(){
      profileCtrl.profile.emailHash = md5.createHash(auth.email);
      profileCtrl.profile.$save();
    };
    profileCtrl.logout = function(){
    Auth.$signOut().then(function(){
    $state.go('login');
  });
};
  })
  .controller('HomepageCtrl', function(Guide, $ionicModal, Setup, HomepageService,$scope,  $state, $timeout) {
  
  var setUp = function(){     
    HomepageService.setup()
    $scope.closest = HomepageService.closest;
    $scope.featured = HomepageService.featured;
    $scope.new = HomepageService.new;
    $scope.data = HomepageService.data;
    $state.reload();
  }
  Setup.run().then(setUp);
 
  $ionicModal.fromTemplateUrl('templates/guide.html', {
          scope: $scope,
          animation: 'slide-in-up'
        }).then(function(modal) {
          $scope.modal = modal;
          
        });
        $scope.openModal = function() {
          Guide.setup($scope.guide).then($scope.setGuide);
          $scope.modal.show();
        };
        $scope.setGuide = function(){
          $scope.hyperlapse = Guide.hyperlapse
          $scope.siteURL = Guide.siteURL;
          $scope.data = Guide.data;
            $scope.images = [];
         var img_index = 1;
         for(var i = 1; i<=$scope.data.gal_size;i++){      
           $scope.images.push({
             src:$scope.data.image_descriptions[img_index].URL,
             sub:$scope.data.image_descriptions[img_index].caption
         })
            img_index++;
         }
          $scope.profile = Guide.profile;
          $scope.globalData = Setup.data;
        }
        $scope.closeModal = function() {
          $scope.modal.hide();
        };
        // Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function() {
          $scope.modal.remove();
        });
        // Execute action on hide modal
        $scope.$on('modal.hidden', function() {
          // Execute action
        });
        // Execute action on remove modal
        $scope.$on('modal.removed', function() {
          // Execute action
        });
        $scope.addToFuture = function(){
          Guide.addToFuture();
        }
        $scope.showMap = function(){
          $scope.displayMap = true;
          Guide.showMap();
        }
        $scope.closeMap = function(){
          $scope.displayMap = false;
          Guide.closeMap();
        }

  $scope.openGuide = function(guide){
    console.log('going to guide');
    $scope.guide = guide;
    $scope.openModal();

  }
   // $scope.setUp();
  })
  .controller('GuideCtrl', function($scope, $state, $stateParams, Setup, profile,$ionicModal){
    
    
   
    
  })
  .controller('SearchCtrl', function($scope, $ionicFilterBar, $state, Setup) {
    $scope.data = Setup.data;
    $scope.openGuide = function(guide){
    console.log('going to guide');
    $state.go('guide', {'data': guide.name});
  }
    $scope.doRefresh = function () {
      $scope.values = window.Values;
      $scope.$broadcast('scroll.refreshComplete');
    }

    $scope.showFilterBar = function () {
      filterBar = $ionicFilterBar.show({
        items: Object.keys($scope.data.guides).map(function (key) { return $scope.data.guides[key]; }),
        update: function (filteredItems, string) {
          $scope.values = filteredItems
        }
        //filterProperties : 'first_name'
      });
    }

   
  })

  
  .controller('MainCtrl', function($scope, $stateParams) {
   
  })


  .controller('MapCtrl', function($scope, $cordovaGeolocation,$cordovaInAppBrowser, Setup) {
   var scheme;
   $scope.markers= Setup.markers;
   $scope.userPos = Setup.userPos;
   $scope.data = Setup.data;

    // Don't forget to add the org.apache.cordova.device plugin!
    if(device.platform === 'iOS') {
        scheme = 'comgooglemaps';
    }
    else if(device.platform === 'Android') {
        scheme = 'geo://';
    }
    $scope.$on('$ionicView.beforeEnter', function() {
            
          
             Mapbox.addMarkers(
              $scope.markers
               );
             Mapbox.addMarkerCallback(function (selectedMarker) {
                var query = "comgooglemaps://?saddr=" + $scope.userPos.lat + "," + $scope.userPos.long + "daddr=" + selectedMarker.lat + "," + selectedMarker.long + "directionsmode=transit";
                alert("Marker selected: " + JSON.stringify(selectedMarker));
                appAvailability.check(
                 scheme, // URI Scheme
                 function() {  // Success callback
                     window.open(query, '_system', 'location=no');
                     console.log('Twitter is available');
                 },
                 function() {  // Error callback
                     window.open('https://twitter.com/gajotres', '_system', 'location=no');
                     console.log('Twitter is not available');
    }
);
              });

          });
    Mapbox.show(
    {
      style: 'mapbox://styles/awilson9/cirl1qq6k001dg4mb3f4bs1iv', // light|dark|emerald|satellite|streets , default 'streets'
      margins: {
        left: 0, // default 0
        right: 0, // default 0
        top: 0, // default 0
        bottom: 50 // default 0
      },
      center: { // optional, without a default
        lat: 40.758701,
        lng: -111.876183
      },
      zoomLevel: 8, // 0 (the entire world) to 20, default 10
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
   $scope.$on('$destroy', function() {
      Mapbox.hide(
    {},
    function(msg) {
      console.log("Mapbox successfully hidden");
    }
  );
  });
  });
