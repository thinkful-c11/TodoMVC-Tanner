'use strict';

require('dotenv').config();
const DATABASE_URL = process.env.DATABASE_URL || global.DATABASE_URL || 'postgres://zarbeteg:E66VH_mjBv8O6nXk17zP2C7X_oB2OXMx@stampy.db.elephantsql.com:5432/zarbeteg';

exports.DATABASE = {
  client: 'pg',
  connection: DATABASE_URL,
  pool: { min: 0, max: 3 },
  // debug: true
};

exports.PORT = process.env.PORT || 8080; 