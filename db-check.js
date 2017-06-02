'use strict';

const { DATABASE, PORT } = require('./config');
const knex = require('knex')(DATABASE);

// clear the console before each run
console.log('\x1b\c');

knex
  .insert({
    title: 'Test This',
  })
  .into('items')
  .then(result => console.log(JSON.stringify(result, null, 2)));

knex.select('*')
  .from('items')
  .then(result => console.log(JSON.stringify(result, null, 2)));


// Destroy the connection pool
knex.destroy().then(() => { console.log('closed'); });