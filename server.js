'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const { DATABASE, PORT } = require('./config');
const app = express();

function constructURL(protocol, host, id){
  return `${protocol}://${host}/api/items/${id}`;
}

// Add middleware and .get, .post, .put and .delete endpoints
app.use('/api/items', bodyParser.json());

//prevents cors issues
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  next();
});

//gets the items from the database. Inserts a url into the response prior to responding.
app.get('/api/items', (req, res) => { 
  knex('items').select('title', 'id').then(results => {
    results.forEach(item =>{
      item.url = constructURL(req.protocol, req.get('host'), item.id); //inserts here
    });
    res.status(200).send(results);
  });
}); 

//sends back a response with the row of the item that matched the query.
app.get('/api/items/:itemId', (req, res) => {  
  knex('items').select('*').where('id', req.params.itemId).then(results => res.status(200).send(results[0]));
});

app.post('/api/items', (req, res) => {
  //first checks if the post request has a title to prevent a not null error.
  if(!req.body.title){
    return res.status(400).send();
  }
  knex('items')
  .insert({title: req.body.title})
  .returning(['id', 'title', 'completed'])
  .then(results => {
    const url = constructURL(req.protocol, req.get('host'), results[0].id);  //constructs a new url
    res.status(201).location(url).send({url: url, title: results[0].title, id: results[0].id, completed: results[0].completed});
  });
});
 
app.put('/api/items/:itemId', (req, res) => {
  if(!(req.body.title || req.body.completed)){ //checks if the request has a title or completed key.
    res.status(400).send();
  }
  knex('items').where('id', req.params.itemId).update({completed: req.body.completed, title: req.body.title}).then(() => {
    return knex('items').where('id', req.params.itemId).select(Object.keys(req.body));
  }).then(results => {
    res.status(200).send(results[0]);
  });
});

app.delete('/api/items/:itemId', (req, res)=>{
  knex('items').where('id', req.params.itemId).del().returning('title').then((result) =>{
    //deletes the row that matches the id, the responds with a message that it has done so.
    res.status(204).send(result);
  });
});

let server;
let knex;
function runServer(database = DATABASE, port = PORT) {
  return new Promise((resolve, reject) => {
    try {
      knex = require('knex')(database);
      server = app.listen(port, () => {
        console.info(`App listening on port ${server.address().port}`);
        resolve();
      });
    } catch (err) {
      console.error(`Can't start server: ${err}`);
      reject(err);
    }
  });
}

function closeServer() {
  return knex.destroy().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing servers');
      server.close(err => {
        if (err) {
          return reject(err); 
        }
        resolve();
      });
    }); 
  });
}

if (require.main === module) {
  runServer().catch(err => {
    console.error(`Can't start server: ${err}`);
    throw err;
  });
}

module.exports = { app, runServer, closeServer };
