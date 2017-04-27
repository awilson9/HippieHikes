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
  .controller('HomepageCtrl', function($scope, $rootScope, $firebaseObject, $state, $timeout, $window) {
    
    var ref = firebase.database().ref();
    // download the data into a local object
    var syncObject = $firebaseObject(ref);
    // synchronize the object with a three-way data binding
    // click on `index.html` above to see it used in the DOM!
    syncObject.$bindTo($rootScope, "data");
    syncObject.$loaded().then(function(){
      $scope.setUp();
    });

  $scope.setUp = function(){
   
    if($rootScope.data!=null){
      tryAgain = false;
     if($scope.used==null)$scope.used = [];
      if($scope.nearest==null){
        $scope.calculateClosest(true);
      }
      if($scope.favorited==null){
        $scope.getFavorited();
      }
      if($scope.featured==null){
        $scope.getFeatured();
      }
      if($scope.new==null){
        $scope.getNew();
      }

  }

  }
  $scope.featured_style = {
    row_index: 0, 
    one_row:false,
    row:0
  };
   $scope.near_style = {
    row_index: 0, 
    one_row:false,
    row:0
  };
   $scope.new_style = {
    row_index: 0, 
    one_row:false,
    row:0
  };
  $scope.setStyle = function(obj, type){
    var active;
    if(type==="near")active = $scope.near_style;
    else if(type==="featured")active = $scope.featured_style;
    else if(type==="new")active=$scope.new_style;
    

    var toReturn = "";
    if(active.one_row){
      toReturn = "height:175px;width:"+($window.innerWidth-2)+"px;margin-top:0.5px;margin-bottom:0.5px;margin-left:1px;margin-righ:1px;display:block;";
    }
    else if(active.row_index==0){
      toReturn = "height:125px;width:"+((7*$window.innerWidth/16)-1.5)+"px;margin-left:1px;margin-right:0.5px;margin-top:0.5px;margin-bottom:0.5px;display:block;";
    }
    else{
       toReturn = "height:125px;width:"+((9*$window.innerWidth/16)-1.5)+"px;margin:1px;margin-right:0.5px;margin-top:0.5px;margin-bottom:0.5px;display:block;"
    }
    if(!active.one_row){
          if(active.row_index==1){
            active.one_row = true;
            active.row_index=0;
            active.row++;
          }
          else{
            active.row_index++;
          }
        }
        else{
          active.row++;
          active.one_row = false;
        }
    return toReturn;
  }
  $scope.getFeatured = function(){
    $scope.featured = [];
    for(var guide in $rootScope.data.guides){
      if($rootScope.data.guides[guide].featured&&($scope.used.indexOf(guide)==-1)){
        $scope.featured.push(
          {
          src:$rootScope.data.guides[guide].image_descriptions[0].URL,
          name:guide,
        }
        );
        $scope.used.push(guide);
        //indexes for styling, alternate between one image per row and two
      
      }
    }
  }
  $scope.getFavorited = function(){
   
  }
  $scope.getNew = function(){
    $scope.new = [];
    for(var guide in $rootScope.data.guides){
      if($rootScope.data.guides[guide].new&&($scope.used.indexOf(guide)==-1)){
        $scope.new.push(
          {
          src:$rootScope.data.guides[guide].image_descriptions[0].URL,
          name:guide
        }
        );
        $scope.used.push(guide);
      }
    }
  }
  $scope.calculateClosest = function(getPos){
    if($rootScope.userPos==null){
      if(getPos)$rootScope.getUserPos();
      $timeout($scope.calculateClosest(false), 500);
    }
    else{
    $rootScope.closest = [];
    if($rootScope.markers==null)$rootScope.fillTrailheads();
    for(var marker in $rootScope.markers){
      $rootScope.getDirectionsFromUser($rootScope.markers[marker]);
    }
  }
  }
  $scope.openGuide = function(guide){
    console.log('going to guide');
    $state.go('guide', {'data': $rootScope.data.guides[guide]});
  }
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
    for(var i = 1; i<$scope.data.gal_size;i++){
      
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
