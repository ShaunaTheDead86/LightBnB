const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool
    .query(`
  SELECT email 
  FROM users
  WHERE email = $1;
  `, [email])
    .then((res) => res.rows)
    .catch((err) => console.log(err));
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool
    .query(`
  SELECT id 
  FROM users 
  HAVING id = $1;
  `, [id])
    .then((res) => res.rows)
    .catch((err) => console.log(err));
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {
  return pool
    .query(`
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)  
    RETURNING *;
    `, [user.name, user.email, user.password])
    .then((res) => res.rows)
    .catch((err) => console.log(err))
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool
    .query(`
  SELECT * 
  FROM reservations
  WHERE guest_id = $1
  LIMIT $2;
  `, [guest_id, limit])
    .then((res) => res.rows)
    .catch((err) => console.log(err));
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  const queryParams = [];
  let wherePassed = false;

  let queryString = `SELECT properties.*, avg(property_reviews.rating) AS average_rating
FROM properties 
JOIN property_reviews ON properties.id = property_id 
`;

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    if (!wherePassed) {
      queryString += `WHERE city LIKE $${queryParams.length} 
`;
      wherePassed = true;
    } else {
      queryString += `AND city LIKE $${queryParams.length} 
`;
    }
  }

  if (options.owner_id) {
    queryParams.push(options.owner_id);
    if (!wherePassed) {
      queryString += `WHERE owner_id LIKE $${queryParams.length} 
`;
      wherePassed = true;
    } else {
      queryString += `AND owner_id LIKE $${queryParams.length} 
`;
    }
  }

  if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night);
    if (!wherePassed) {
      queryString += `WHERE cost_per_night >= $${queryParams.length} 
  `;
      wherePassed = true;
    } else {
      queryString += `AND cost_per_night >= $${queryParams.length} 
  `;
    }
  }

  if (options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night);
    if (!wherePassed) {
      queryString += `WHERE cost_per_night <= $${queryParams.length} 
`;
      wherePassed = true;
    } else {
      queryString += `AND cost_per_night <= $${queryParams.length} 
`;
    }
  }


  if (options.minimum_rating) {
    queryString += `GROUP BY properties.id, property_reviews.id 
`;
    queryParams.push(options.minimum_rating);
    if (!wherePassed) {
      queryString += `HAVING avg(property_reviews.rating) >= $${queryParams.length} 
`;
      wherePassed = true;
    } else {
      queryString += `HAVING avg(property_reviews.rating) >= $${queryParams.length} 
`;
    }
  } else {
    queryString += `GROUP BY properties.id 
`;
  }

  queryString += `ORDER BY cost_per_night
LIMIT ${limit};
`

  console.log(queryString, queryParams);

  return pool
    .query(queryString, queryParams)
    .then((result) => {
      result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
}

exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;