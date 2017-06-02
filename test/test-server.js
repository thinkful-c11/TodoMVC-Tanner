'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const { app, runServer, closeServer } = require('../server');
const { DATABASE } = require('../config');
const knex = require('knex')(DATABASE);

chai.should();
chai.use(chaiHttp);

describe('TodoMVC API:', () => {
  // before runs once at the beginning of the test suite
  before(() => runServer());

  // after runs at the end of the tests 
  after(() => {
    return knex.destroy()
      .then(closeServer);
  });

  /** SKELETON ENDPOINTS
   *  ==================
   * - Create skeleton endpoints for GET and POST
   * 
   * Hint: Use `.only` or `.skip` to focus on a specific `describe` or `it` block
   *  - https://mochajs.org/#exclusive-tests
   */
  describe('GET and POST endpoint skeleton:', function () {
    /**
     * This test requires a skeleton GET endpoint which responds with an array
     * and a status of 200 "OK"
     * 
     * Inspect the test for clues to the route, status and correct response
     */
    it('should respond to GET with status 200 and an array', function () {
      return chai.request(app)
        .get('/api/items')
        .then(function (result) {
          result.should.have.status(200);
          result.should.be.json;
          result.body.should.be.a('array');
          result.body.should.be.empty;
        })
        .catch((err) => {
          throw (err);
        });
    });

    /**
     * This test checks that CORS headers are properly configured
     * 
     * Hint: "It's CORS time!"
     *  - https://enable-cors.org/server_expressjs.html
     *  The hint is not the *complete* solution, you will need to expand on it
     */
    it('should respond with CORS headers', function () {
      return chai.request(app)
        .get('/api/items')
        .then(function (result) {
          result.should.have.header('Access-Control-Allow-Origin', '*');
          result.should.have.header('Access-Control-Allow-Headers', /Content-Type/); // RegEx: does it contain "Content-Type" 
          result.should.have.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
        })
        .catch((err) => {
          throw (err);
        });
    });

    /**
     * This test requires a skeleton POST endpoint which responds with an object,
     * a location header and a status of 201 "Created"
     * 
     * NOTE: For now, the location header value can be any placeholder text
     * 
     * HINT: https://expressjs.com/en/4x/api.html#res.location
     */
    it('should respond to POST with an object a status 201 and a location header', function () {
      return chai.request(app)
        .post('/api/items')
        .send({title: "name"})
        .then(function (result) {
          result.should.have.status(201);
          result.should.have.header('location');
          result.should.be.json;
          result.body.should.be.a('object');
        })
        .catch((err) => {
          throw (err);
        });
    });

    /**
     * This test requires the POST endpoint to responds the title of the item POSTed
     * 
     * HINT: "Use the body-parser, Luke!"
     * https://expressjs.com/en/4x/api.html#req.body
     */
    it('should respond to POST with the title of item that was POSTed', function () {
      const newItem = { title: 'Walk the dog' };
      return chai.request(app)
        .post('/api/items')
        .send(newItem)
        .then(function (result) {
          result.should.be.json;
          result.body.should.be.a('object');
          result.body.should.have.property('title', newItem.title);
        })
        .catch((err) => {
          throw (err);
        });
    });
  });

  /** SET UP YOUR DATABASE
   *  ====================
   * - Create a Database, you choose the name
   * - Create a table named "items" with an "id" (primary key) and a "title" (text)
   * 
   *    CREATE TABLE items ( 
   *      id     serial  NOT NULL,
   *      title  text    NOT NULL,
   *      CONSTRAINT items_pkey PRIMARY KEY ( id )
   *    );
   * 
   * NOTE: previously working tests may fail as the database is wired-up, use `.only` to focus on your task.
   */

  // NOTE: This describe block wraps sub-blocks and tests
  describe('With database:', function () {

    // afterEach test, delete the test items in the table
    beforeEach(() => {
      return knex('items')
        .del()
        .catch((err) => {
          console.error('ERROR', err.message);
        });
    });

    afterEach(() => {
      return knex('items')
        .del()
        .catch((err) => { 
          console.error('ERROR', err.message);
        });
    });

    describe('GET endpoints', function () {
      /**
       * This requires you to wire-up the GET /api/items endpoint to knex and postgres
       */
      it('should respond with the items in the database', function () {
        const newItem = { title: 'Buy soy milk' };
        let itemId;
        return knex('items')
          .insert(newItem)
          .returning(['id'])
          .then(function (result) {
            itemId = result[0].id;
            return chai.request(app).get('/api/items/').send();
          })
          .then(function (result) {
            result.should.have.status(200);
            result.body.should.be.a('array');
            result.body[0].should.have.property('id', itemId);
          })
          .catch((err) => {
            throw (err);
          });
      });

      /** 
       * This requires you to create a GET /api/items/:id endpoint and wire it up to knex and postgres
       */
      it('should respond with the item corresponding to the item `id` in the route', function () {
        const newItem = { title: 'Buy soy milk' };
        let itemId;
        return knex('items')
          .insert(newItem)
          .returning(['id'])
          .then(function (result) {
            itemId = result[0].id;
            return chai.request(app).get(`/api/items/${itemId}`).send();
          })
          .then(function (result) {
            result.should.have.status(200);
            result.body.should.have.property('id', itemId);

          })
          .catch((err) => {
            throw (err);
          });
      });
    });

    describe('POST endpoint', function () {
      /**
       * This test requires you to check the incoming post body to make sure it contains
       * valid data before saving to the database
       */
      it('should respond to an improper POST with status 400', function () {
        const newItem = { foo: 'bar' };
        return chai.request(app)
          .post('/api/items')
          .send(newItem)
          .catch((err) => {
            err.should.have.status(400);
          });
      });

      /**
       * This test requires you to wire-up the POST /api/items endpoint to the database
       */
      it('should persist the data and respond with new item id', function () {
        const newItem = { title: 'Walk the dog' };
        return chai.request(app)
          .post('/api/items')
          .send(newItem)
          .then(function (result) {
            result.should.have.status(201);
            return knex
              .select('title')
              .from('items')
              .where('id', result.body.id);
          })
          .then(function (result) {
            result.should.have.length(1);
            result[0].should.have.property('title', newItem.title);
          })
          .catch((err) => {
            throw (err);
          });
      });

      /**
       * This test requires you to add a URL to the response which has the location of the new item. 
       */
      it('should respond with a URL which can be used to retrieve the new item', function () {
        const newItem = { title: 'Buy milk' };
        return chai.request(app)
          .post('/api/items')
          .send(newItem)
          .then(function (result) {
            const url = result.body.url;
            const split = url.lastIndexOf('/');
            const root = url.slice(0, split);
            const path = url.substr(split);
            return chai.request(root).get(path);
          })
          .then(function (result) {
            result.body.should.have.property('title', newItem.title);
          })
          .catch((err) => {
            throw (err);
          });
      });

      /**
       * This test requires you to add a `completed` column to the database which defaults to false
       */
      it('should respond with a `completed` property is set to false', function () {
        const newItem = { title: 'Mow the lawn' };
        return chai.request(app)
          .post('/api/items')
          .send(newItem)
          .then(function (result) {
            result.body.should.have.property('completed', false);
            return knex
              .select('completed')
              .from('items')
              .where('id', result.body.id);
          })
          .then(function (result) {
            result.should.have.length(1);
            result[0].should.have.property('completed', false);
          })
          .catch((err) => {
            throw (err);
          });
      });

      /** 
       * This test requires you to add a `location` header with the URL of the item 
       * 
       * HINT: 
       * - http://stackoverflow.com/a/10185427
       * - https://expressjs.com/en/api.html#req.protocol
       */
      it('should respond with a valid location header', function () {
        const newItem = { title: 'Buy milk' };
        return chai.request(app)
          .post('/api/items')
          .send(newItem)
          .then(function (result) {
            result.should.have.header('location');
            result.body.should.have.property('url').is.a('string');
            const url = result.get('location');
            const split = url.lastIndexOf('/');
            const root = url.slice(0, split);
            const path = url.substr(split);

            return chai.request(root).get(path);
          })
          .then(function (result) {
            result.body.should.have.property('title', newItem.title);
          })
          .catch((err) => {
            throw (err);
          });
      });

      /**
       * This test requires you to add a URL to the GET response which has the location of the new item. 
       */
      it('should respond with a URL which can be used to retrieve the new item', function () {
        const newItem = { title: 'Rake leaves' };
        return knex('items')
          .insert(newItem)
          .then(function () {
            return chai.request(app).get('/api/items');
          })
          .then(function (result) {
            const url = result.body[0].url;
            const split = url.lastIndexOf('/');
            const root = url.slice(0, split);
            const path = url.substr(split);
            return chai.request(root).get(path);
          })
          .then(function (result) {
            result.body.should.have.property('title', newItem.title);
          })
          .catch((err) => {
            throw (err);
          });
      });

    });

    describe('PUT endpoint', function () {
      /**
       * This test requires you to wireup the database to the PUT endpoint so the title can be changed
       */
      it('should change a todo title by PUTing', function () {
        const newItem = { title: 'Buy soy milk' };
        const putItem = { title: 'Buy real milk' };
        let itemId;
        return knex('items')
          .insert(newItem)
          .returning(['id'])
          .then(function (result) {
            itemId = result[0].id;
            return chai.request(app).put(`/api/items/${itemId}`).send(putItem);
          })
          .then(function (result) {
            result.body.should.have.property('title', putItem.title);
            return knex
              .select('title')
              .from('items')
              .where('id', itemId);
          })
          .then(function (result) {
            result[0].should.have.property('title', putItem.title);
          })
          .catch((err) => {
            throw (err);
          });
      });

      /**
       * This test requires you to wireup the database to the PUT endpoint so the completed status can be changed
       */
      it('should PUT a change to the `completed` field of an item', function () {
        const newItem = { title: 'Buy soy milk' };
        const putItem = { completed: true };
        let itemId;
        return knex('items')
          .insert(newItem)
          .returning(['id'])
          .then(function (result) {
            itemId = result[0].id;
            return chai.request(app).put(`/api/items/${itemId}`).send(putItem);
          })
          .then(function (result) {
            result.body.should.have.property('completed', true);
            return knex
              .select('completed')
              .from('items')
              .where('id', itemId);
          })
          .then(function (result) {
            result[0].should.have.property('completed', true);
          })
          .catch((err) => {
            throw (err);
          });
      });
    });

    describe('DELETE endpoint', function () {
      /**
       * This test requires you to wire-up the delete endpoint so items can be deleted.
       */
      it('should DELETE an item', function () {
        const newItem = { title: 'Buy soy milk' };
        let itemId;
        return knex('items')
          .insert(newItem)
          .returning(['id'])
          .then(function (result) {
            itemId = result[0].id;
            return chai.request(app).delete(`/api/items/${itemId}`).send();
          })
          .then(function () {
            return knex
              .select('title')
              .from('items')
              .where('id', itemId);
          })
          .then(function (result) {
            result.should.be.empty;
          })
          .catch((err) => {
            throw (err);
          });
      });
    });


  });


});