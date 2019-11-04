$(document).ready(function(){
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      window.location.replace("loggedIn.html");
    } else {
      $('#content').css('display', 'block');
      var uiConfig = {
        signInSuccessUrl: 'loggedIn.html',
        signInOptions: [
          firebase.auth.EmailAuthProvider.PROVIDER_ID,
          firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        ],
        tosUrl: '<your-tos-url>',
        privacyPolicyUrl: function() {
          window.location.assign('<your-privacy-policy-url>');
        }
      };

      var ui = new firebaseui.auth.AuthUI(firebase.auth());
      ui.start('#firebaseui-auth-container', uiConfig);
    }
  }, function(error) {
    console.log(error);
  });
});
