chrome.cookies.get({ url: "http://localhost", name: "token" }, function (cookie) {
    if (cookie) {
        console.log("Token:", cookie.value);
    } else {
        console.log("CSRF Token non trouvé !");
    }
});
