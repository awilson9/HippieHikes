angular.module('starter.services', [])
  .factory('Auth', function($firebaseAuth){
    var auth = $firebaseAuth();

    return auth;
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
