'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const { DATABASE, PORT } = require('./config');
const app = express();

// Add middleware and .get, .post, .put and .delete endpoints
app.use('/api/items', bodyParser.json());
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  next();
});

app.get('/api/items', (req, res) => {
  knex('items').select('title', 'id').then(results => res.status(200).send(results));
}); 
app.get('/api/items/:itemId', (req, res) => {  
  knex('items').select('id', 'title').where('id', req.params.itemId).then(results => res.status(200).send(results[0]));
});

app.post('/api/items', (req, res) => {
  const protocol = req.protocol;
  const host = req.get('host');
  if(!req.body.title){
    return res.status(400).send();
  }else {
    knex('items').insert(req.body)
  .returning(['id'])
  .then(results => {
    return knex('items').select('id', 'title', 'completed').where('id', results[0].id);
  })
  .then(results =>{ 
    const id = results[0].id;
    const url = `${protocol}://${host}/api/items/${id}`;
    res.status(201).location(`${protocol}://${host}/api/items/${id}/`).send({url: url, title: results[0].title, id: results[0].id, completed: results[0].completed});
  });
  }
});
 
app.put('/api/items/:itemId', (req, res) => {
  knex('items').where('id', req.params.itemId).update(req.body).then(results => {
    return knex('items').where('id', req.params.itemId).select(Object.keys(req.body));
  }).then(results => {
    res.status(200).send(results[0]);
  });
});

app.delete('/api/items/:itemId', (req, res)=>{
  knex('items').where('id', req.params.itemId).del().returning('title').then(results =>{
    res.status(204).send([]);
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
