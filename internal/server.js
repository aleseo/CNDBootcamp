'use strict';

// express is a nodejs web server
// https://www.npmjs.com/package/express
const express = require('express');

// converts content in the request into parameter req.body
// https://www.npmjs.com/package/body-parser
const bodyParser = require('body-parser');

// create the server
const app = express();

// the backend server will parse json, not a form request
app.use(bodyParser.json());

// firebase admin 
var admin = require('firebase-admin');
var serviceAccount = require("./dtc-attendee111-firebase-adminsdk-wo2ow-b09d644ad5.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://dtc-attendee111.firebaseio.com"
});

/* if on google cloud
admin.initializeApp({
    credentials: admin.credential.applicationdefault()
});
*/

const db = admin.firestore();

// mock events data - for a real solution this data should be coming 
// from a cloud data store
const mockEvents = {
    events: [
        { title: 'an event', id: 1, description: 'something really cool' },
        { title: 'another event', id: 2, description: 'something even cooler' }
    ]
};

// FIRESTORE
// read data in
db.collection('events').get().then(col => {
    col.forEach(doc =>{
        console.log(doc.id, '=>', doc.data());
        mockEvents.events.push(doc.data());
    });
    
}).catch(err => {
    console.log('Error getting documents', err);
});

// health endpoint - returns an empty array
app.get('/', (req, res) => {
    res.json([]);
});

// version endpoint to provide easy convient method to demonstrating tests pass/fail
app.get('/version', (req, res) => {
    res.json({ version: '1.0.0' });
});


// mock events endpoint. this would be replaced by a call to a datastore
// if you went on to develop this as a real application.
app.get('/events', (req, res) => {
    res.json(mockEvents);
});

// Adds an event - in a real solution, this would insert into a cloud datastore.
// Currently this simply adds an event to the mock array in memory
// this will produce unexpected behavior in a stateless kubernetes cluster. 
app.post('/event', (req, res) => {
    // create a new object from the json data and add an id
    const ev = { 
        title: req.body.title, 
        description: req.body.description,
     }
    // add to the mock array
    mockEvents.events.push(ev);

    console.log("adding to firebase: ", ev);
    // add to firebase
    db.collection('events').add(ev);

    // return the complete array
    res.json(mockEvents);
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message });
});

const PORT = 8082;
const server = app.listen(PORT, () => {
    const host = server.address().address;
    const port = server.address().port;

    console.log(`Events app listening at http://${host}:${port}`);
});

module.exports = app;