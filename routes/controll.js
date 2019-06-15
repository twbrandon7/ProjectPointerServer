var express = require('express');
var router = express.Router();

/*var admin = require("firebase-admin");

var serviceAccount = require("../key/niu-project-mmn-firebase-adminsdk-iezpx-ce8b0ddb0b.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://niu-project-mmn.firebaseio.com"
});

const db = admin.firestore();

function isFunction(functionToCheck) {
    return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}

function getDocument(collection, document, cb) {
    const docRef = db.collection(collection);
    docRef.doc(document).get()
        .then(doc => {
            if(isFunction(cb)) {
                if (!doc.exists) {
                    cb(null, doc);
                } else {
                    cb(doc.data(), doc);
                }
            }
        })
        .catch(err => {
            console.log('Error getting document', err);
        });
}*/

/* GET users listing. */
/*router.get('/*', function (req, res, next) {
    // res.send("->");
    getDocument("doc1", "hey", (data) => {
        var x = data.ok;
        res.send(x+"!");
    });
});*/

module.exports = router;
