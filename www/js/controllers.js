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
  .controller('ProfileCtrl', function($state, md5, Auth, profile, auth,$scope, Setup, OfflineMap, $ionicModal, Map){
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
$ionicModal.fromTemplateUrl('templates/map-modal.html', {
          scope: $scope,
          animation: 'slide-in-up'
        }).then(function(modal) {
          $scope.mapModal = modal;
        });
        $scope.openMapModal = function() {
          $scope.mapModal.show();
        };
        $scope.closeMapModal = function() {
          $scope.mapModal.hide();
        };
        // Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function() {
          $scope.mapModal.remove();
        });

$ionicModal.fromTemplateUrl('templates/route-map.html', {
          scope: $scope,
          animation: 'slide-in-up'
        }).then(function(modal) {
          $scope.routeModal = modal;  
        });
        $scope.openRouteModal = function(route) {
          $scope.routeModal.show();
          
          var points = [];
          for(var coord in route.coords){
            points.push([route.coords[coord][1], route.coords[coord][0]]);
          }
          Map.setup(points);
        };
        $scope.closeRouteModal = function() {
          Map.map.remove();
          $scope.routeModal.hide();
        };
     
      
    $scope.openMap = function(guide){
      $scope.openMapModal();
      $scope.guidename = $scope.data.guides[guide].name_description;
      OfflineMap.setUp($scope.data.guides[guide].name);
    }
    $scope.openRoute = function(route){
      $scope.openRouteModal(route);
    }
  })
  .controller('RouteCtrl', function(BackgroundLocation, profile, $scope, $timeout){
      $scope.tracking = false
      $('#recButton').addClass("notRec");

     $('#recButton').click(function(){
      if($('#recButton').hasClass('notRec')){
       $('#recButton').removeClass("notRec");
       $('#recButton').addClass("Rec");
     }
     else{
       $('#recButton').removeClass("Rec");
       $('#recButton').addClass("notRec");
     }
    });
     
    $scope.add = function() {
      $scope.distance = ((15*BackgroundLocation.distance)/5280);
      $scope.seconds++;
      if ($scope.seconds >= 60) {
          $scope.seconds = 0;
          $scope.minutes++;
          if ($scope.minutes >= 60) {
              $scope.minutes = 0;
              $scope.hours++;
          }
      }
    
  
    $scope.timer();
}
$scope.timer = function() {
    $scope.t = $timeout($scope.add, 1000);
}


$scope.route = function(){
      if($scope.tracking){

        var arr = BackgroundLocation.toggle();
        console.log(JSON.stringify(arr));
        if(profile.routes==null){
          profile.routes = [];
        }
        $timeout.cancel($scope.t);
        var today = new Date();
        var dateFormat = (today.getMonth()+1)+'/'+today.getDate() + '/' + today.getFullYear();
        profile.routes.push({coords:arr, date:dateFormat, distance:$scope.distance, time:$scope.hours + ":" + $scope.minutes + ":" + $scope.seconds});
        profile.$save();
        $scope.tracking = false;
      }
      else{
        $scope.tracking = true;
        $scope.seconds = 0;
        $scope.minutes = 0;
        $scope.hours = 0;
        $scope.timer();
        BackgroundLocation.toggle(true);
      }
    } 
  })
  .controller('HomepageCtrl', function(ConnectivityMonitor, Setup, HomepageService,$scope, $rootScope, $state, $timeout, $window) {
  
  var setUp = function(){     
    HomepageService.setup()
    $scope.closest = HomepageService.closest;
    $scope.featured = HomepageService.featured;
    $scope.new = HomepageService.new;
    $scope.data = HomepageService.data;
    $state.reload();
  }
  if(ConnectivityMonitor.online)Setup.run().then(setUp);
 
  

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
    $scope.addToOffline = function(){
      if($scope.profile.offline == null){
        $scope.profile.offline = []
        
        }
      if($scope.profile.offline.indexOf($stateParams.data)==-1){
        $scope.profile.offline.push($stateParams.data);
        alert("Map Added");
      }
      else{
        $scope.profile.offline.splice($scope.profile.offline.indexOf($stateParams.data), 1);
        alert("Map Succesfully Removed");
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
  .controller('SearchCtrl', function(ConnectivityMonitor, $scope, $ionicFilterBar, $state, Setup) {
    if(ConnectivityMonitor.online)Setup.run().then(function(){
      $scope.data = Setup.data;
    });
   
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
  .controller('MapCtrl', function($ionicPopup,ConnectivityMonitor, $window, $scope, $cordovaGeolocation,$cordovaInAppBrowser, Setup, Map,OfflineMap) {
    //for using non cordova version of mapbox
   //Map.setup();
    if(ConnectivityMonitor.online){
      Setup.run().then(function(){
      $scope.display_online = true;
      $scope.markers= Setup.markers;
      $scope.userPos = Setup.userPos;
      $scope.data = Setup.data;
      $scope.showMap();
      });
  }
  else{
    $scope.display_online = false; 
  }
  $scope.switch = function(online){
    console.log(online);
    //switch to online
    if(online){
      console.log("going online");
      if(!ConnectivityMonitor.online)alert("Sorry, you must be connected to display online maps");
      else{
       $scope.display_online = true;
       $scope.showMap();
      }
    }
    else{
      console.log("going offline");
      $scope.startOffline();
    }
  }
  $scope.startOffline = function(){
     OfflineMap.closeDB();
      $scope.display_online = false;
      $scope.hide();
      $scope.maps = OfflineMap.guides;  
      $scope.showPopup().then(function(){
      OfflineMap.setUp($scope.selected);
      })
  }
  $scope.selectGuide = function(guide){
    $scope.selected = guide.name;
  }
  // When button is clicked, the popup will be shown...
   $scope.showPopup = function() {
      var promise = new Promise(function(resolve, reject){
        $scope.data = {}
    
      // Custom popup
      var myPopup = $ionicPopup.show({
         template: '<div ng-repeat="map in maps" class="tag-wrapper"><div class="tag-description" ng-click="selectGuide(map)" ng-show="selected!=map.name">{{map.name}}</div><div class="tag-description selected" ng-click="selectGuide(map)" ng-show="selected===map.name">{{map.name}}</div></div>',
         title: 'Choose a guide to display',
         scope: $scope,
      
         buttons: [
            {
               text: '<b>Save</b>',
               type: 'button-positive',
                  onTap: function(e) {
            
                     if (!$scope.selected) {
                        //don't allow the user to close unless he enters model...
                           e.preventDefault();
                           alert("You must choose a guide!")
                     } else {
                        return 
                     }
                  }
            }
         ]
      });

      myPopup.then(function(res) {
         console.log('Tapped!', res);
         resolve();
      });    
      })
      return promise;
   };
   var scheme = null;
    //Don't forget to add the org.apache.cordova.device plugin!
    if(ionic.Platform.isAndroid()) {
       scheme = 'geo://';
        
    }
    else {
       scheme = 'comgooglemaps';
    }
    $scope.showMap = function(){
      Mapbox.show(
        {
          style: 'mapbox://styles/awilson9/cirl1qq6k001dg4mb3f4bs1iv', // light|dark|emerald|satellite|streets , default 'streets'
          margins: {
            left: 0, // default 0
            right: 0, // default 0
            top: 60, // default 0
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
      Mapbox.addMarkers(
        $scope.markers
      );
      Mapbox.addMarkerCallback(function (selectedMarker) {
        var query = "comgooglemaps://?saddr=" + $scope.userPos.lat + "," + $scope.userPos.lng + "&daddr=" + selectedMarker.lat + "," + selectedMarker.lng + "&directionsmode=transit"; 
        appAvailability.check(
          scheme, // URI Scheme
          function() {  // Success callback
            window.open(query, '_system', 'location=no');    
            },
          function() {  // Error callback
            window.open("http://maps.apple.com/?saddr=" + $scope.userPos.lat + "," + $scope.userPos.lng + "&daddr=" + selectedMarker.lat + "," + selectedMarker.lng + "&dirflg=d", '_system', 'location=yes');      
            }
        );
      });
      console.log("done");
    }

   $scope.hide = function(){
     Mapbox.hide(
    {},
    function(msg) {
      console.log("Mapbox successfully hidden");
    }
    );
   }
   $scope.$on('$destroy', function() {
     $scope.hide();
  });
  });
