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
  .controller('ProfileCtrl', function($state, md5, Auth, profile, auth){
    var profileCtrl = this;
    profileCtrl.profile = profile;
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
  .controller('HomepageCtrl', function(Setup, HomepageService,$scope, $rootScope, $state, $timeout, $window) {
  
  var setUp = function(){     
    HomepageService.setup()
    $scope.closest = HomepageService.closest;
    $scope.featured = HomepageService.featured;
    $scope.new = HomepageService.new;
    $scope.data = HomepageService.data;
  }
  Setup.run().then(setUp);
 
  

  $scope.openGuide = function(guide){
    console.log('going to guide');
    $state.go('guide', {'data': $scope.data.guides[guide]});
  }
   // $scope.setUp();
  })


  .directive('positionBarsAndContent', function($timeout) {

   return {
      
      restrict: 'AC',
      
      link: function(scope, element) {
        
        var offsetTop = 44;
        
        // Get the parent node of the ion-content
        var parent = angular.element(element[0].parentNode);
        
        // Get all the headers in this parent
        var headers = parent[0].getElementsByClassName('bar');

        // Iterate through all the headers
        for(x=0;x<headers.length;x++)
        {
          // If this is not the main header or nav-bar, adjust its position to be below the previous header
          if(x > 0) {
            headers[x].style.top = offsetTop + 'px';
          }
          
          // Add up the heights of all the header bars
          offsetTop = offsetTop + headers[x].offsetHeight;
        }      
        
        // Position the ion-content element directly below all the headers
        element[0].style.top = offsetTop + 'px';
        
      }
    };  
  })
  .controller('GuideCtrl', function($scope, $state, $stateParams){
    $scope.back = function(){
      $state.go('tab.homepage');
    }

   


    $scope.data = $stateParams.data;
   
    if($scope.data.hyperlapse!=null)$scope.hyperlapse = "https://www.youtube.com/embed/"+$scope.data.hyperlapse;
    var storage = firebase.storage();
    var imgRef = storage.refFromURL('gs://hippiehikes-a35e3.appspot.com/'+$scope.data.name+'/'+'0.png'); 
    imgRef.getDownloadURL().then(function(url){
      $scope.$apply(function(){
        $scope.siteURL = url;
      })
    })
    $scope.images = [];
    var img_index = 1;
    for(var i = 1; i<=$scope.data.gal_size;i++){
      
        $scope.images.push({
          src:$scope.data.image_descriptions[img_index].URL,
          sub:$scope.data.image_descriptions[img_index].caption
      })
         img_index++;

    
      
    }
    $scope.slideVisible = function(index){
      if(  index < $ionicSlideBoxDelegate.currentIndex() -1 
         || index > $ionicSlideBoxDelegate.currentIndex() + 1){
        return false;
      }
      
      return true;
    }
    
   
    
  })
  .controller('SearchCtrl', function($scope, $rootScope, $ionicFilterBar, $state) {

    $scope.openGuide = function(guide){
    console.log('going to guide');
    $state.go('guide', {'data': guide});
  }
    $scope.doRefresh = function () {
      $scope.values = window.Values;
      $scope.$broadcast('scroll.refreshComplete');
    }

    $scope.showFilterBar = function () {
      filterBar = $ionicFilterBar.show({
        items: Object.keys($rootScope.data.guides).map(function (key) { return $rootScope.data.guides[key]; }),
        update: function (filteredItems, string) {
          $scope.values = filteredItems
        }
        //filterProperties : 'first_name'
      });
    }

   
  })

  
  .controller('MainCtrl', function($scope, $stateParams) {
   
  })


  .controller('MapCtrl', function($scope, $rootScope, $cordovaGeolocation,$cordovaInAppBrowser) {
   var scheme;
 
    // Don't forget to add the org.apache.cordova.device plugin!
    if(device.platform === 'iOS') {
        scheme = 'comgooglemaps';
    }
    else if(device.platform === 'Android') {
        scheme = 'geo://';
    }
    $scope.$on('$ionicView.beforeEnter', function() {
            if($rootScope.userPos==null)$rootScope.getUserPos();
             if($rootScope.markers==null){
                $rootScope.fillTrailheads();
             }
             Mapbox.addMarkers(
              $rootScope.markers
               );
             Mapbox.addMarkerCallback(function (selectedMarker) {
                var query = "comgooglemaps://?saddr=" + $rootScope.userPos.lat + "," + $rootScope.userPos.long + "daddr=" + selectedMarker.lat + "," + selectedMarker.long + "directionsmode=transit";
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
