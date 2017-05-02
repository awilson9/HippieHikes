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
  .controller('ProfileCtrl', function($state, md5, Auth, profile, auth,$scope, Setup, OfflineMap, $ionicModal){
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
$ionicModal.fromTemplateUrl('templates/map.html', {
          scope: $scope,

          animation: 'slide-in-up'
        }).then(function(modal) {
          $scope.modal = modal;
        });
        $scope.openModal = function() {
          $scope.modal.show();
        };
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
    $scope.openMap = function(guide){
      OfflineMap.setUp($scope.data.guides[guide]);
      $scope.openModal();
    }
  })
  .controller('HomepageCtrl', function(Setup, HomepageService,$scope, $rootScope, $state, $timeout, $window) {
  
  var setUp = function(){     
    HomepageService.setup()
    $scope.closest = HomepageService.closest;
    $scope.featured = HomepageService.featured;
    $scope.new = HomepageService.new;
    $scope.data = HomepageService.data;
    $state.reload();
  }
  Setup.run().then(setUp);
 
  

  $scope.openGuide = function(guide){
    console.log('going to guide');
    $state.go('guide', {'data': guide});
  }
  
   // $scope.setUp();
  })
  .controller('GuideCtrl', function($scope, $state, $stateParams, Setup, profile,$ionicModal){
    $scope.profile = profile;  
    $scope.data = Setup.data.guides[$stateParams.data];
    $scope.globalData = Setup.data;
   
    if($scope.data.hyperlapse!=null)$scope.hyperlapse = "https://www.youtube.com/embed/"+$scope.data.hyperlapse;
    $scope.siteURL = $scope.data.image_descriptions[0].URL;
    $scope.images = [];
    var img_index = 1;
    for(var i = 1; i<=$scope.data.gal_size;i++){
      
        $scope.images.push({
          src:$scope.data.image_descriptions[img_index].URL,
          sub:$scope.data.image_descriptions[img_index].caption
      })
         img_index++;
        $ionicModal.fromTemplateUrl('templates/checkin.html', {
          scope: $scope,

          animation: 'slide-in-up'
        }).then(function(modal) {
          $scope.modal = modal;
        });
        $scope.openModal = function() {
          $scope.modal.show();
        };
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
        $scope.diff={
          easy:false,
          medium:false,
          intermediate:false,
          hard:false
        }
        $scope.checkin = {
          diff:'',
          hour:'',
          minute:'',
          notes:'',
          date:'',
          distance:'',
          guide:$scope.data.name
        }
        $scope.submit = function(){
          if($scope.profile.checkins==null)$scope.profile.checkins = [];
          $scope.profile.checkins.push($scope.checkin);
          $scope.profile.$save();
          $scope.closeModal();
        }
        $scope.setDiff = function(diff){
          var change = $scope.diff[diff];
          $scope.diff={
          easy:false,
          medium:false,
          intermediate:false,
          hard:false
        }
        $scope.diff[diff]=!change;
        $scope.checkin.diff = diff; 
        }
    $scope.addToFuture = function(){
      if($scope.profile.future==null){
        $scope.profile.future = []
        
        }
      if($scope.profile.future.indexOf($stateParams.data)==-1){
        $scope.profile.future.push($stateParams.data);
        alert("Guide Added");
      }
      else{
        $scope.profile.future.splice($scope.profile.future.indexOf($stateParams.data), 1);
        alert("Guide Succesfully Removed");
      }
      $scope.profile.$save();
    }
    $scope.displayMap = false;
    $scope.back = function(){
      $state.go('tab.homepage');
    }
    $scope.closeMap = function(){
      $scope.displayMap = false;
       Mapbox.hide(
    {},
    function(msg) {
      console.log("Mapbox successfully hidden");
    }
  );
    }
    $scope.showMap = function(){
      $scope.displayMap = true;
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
        lat: $scope.data.coords[0].lat,
        lng: $scope.data.coords[0].long
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
  $scope.openGuide = function(guide){
    console.log('going to guide');
    $state.go('guide', {'data': guide});
  }
    

    
      
    }
    $scope.slideVisible = function(index){
      if(  index < $ionicSlideBoxDelegate.currentIndex() -1 
         || index > $ionicSlideBoxDelegate.currentIndex() + 1){
        return false;
      }
      
      return true;
    }
    
   
    
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

  .controller('MapCtrl', function($window, $scope, $cordovaGeolocation,$cordovaInAppBrowser, Setup, Map) {
    //for using non cordova version of mapbox
   //Map.setup();
   $scope.markers= Setup.markers;
   $scope.userPos = Setup.userPos;
   $scope.data = Setup.data;
  
    // Don't forget to add the org.apache.cordova.device plugin!
    // if(device.platform === 'iOS') {
    //     scheme = 'comgooglemaps';
    // }
    // else if(device.platform === 'Android') {
    //     scheme = 'geo://';
    // }
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
