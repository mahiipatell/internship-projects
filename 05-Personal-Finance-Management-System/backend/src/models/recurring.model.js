const pool = require("../config/db");

const RecurringModel = {

  async list(userId) {

    const { rows } = await pool.query(

      `
      SELECT

      r.*,

      c.name AS category_name,
      c.icon,
      c.color

      FROM recurring_transactions r

      LEFT JOIN categories c
      ON c.id = r.category_id

      WHERE r.user_id = $1

      ORDER BY
      r.active DESC,
      r.next_due ASC
      `,

      [userId]

    );

    return rows;

  },

  async findById(id,userId){

    const { rows } = await pool.query(

      `
      SELECT *
      FROM recurring_transactions
      WHERE id=$1
      AND user_id=$2
      `,

      [id,userId]

    );

    return rows[0];

  },

  async create(

    userId,

    {

      categoryId,
      title,
      amount,
      type,
      frequency,
      nextDue

    }

  ){

    const { rows } = await pool.query(

      `

      INSERT INTO recurring_transactions(

      user_id,
      category_id,
      title,
      amount,
      type,
      frequency,
      next_due,
      active

      )

      VALUES($1,$2,$3,$4,$5,$6,$7,true)

      RETURNING *

      `,

      [

        userId,
        categoryId,
        title,
        amount,
        type,
        frequency,
        nextDue

      ]

    );

    return rows[0];

  },

  async update(

    id,
    userId,

    {

      categoryId,
      title,
      amount,
      type,
      frequency,
      nextDue,
      active

    }

  ){

    const { rows } = await pool.query(

      `

      UPDATE recurring_transactions

      SET

      category_id=$1,
      title=$2,
      amount=$3,
      type=$4,
      frequency=$5,
      next_due=$6,
      active=$7

      WHERE

      id=$8
      AND user_id=$9

      RETURNING *

      `,

      [

        categoryId,
        title,
        amount,
        type,
        frequency,
        nextDue,
        active,
        id,
        userId

      ]

    );

    return rows[0];

  },

  async delete(id,userId){

    const { rows } = await pool.query(

      `
      DELETE
      FROM recurring_transactions

      WHERE id=$1
      AND user_id=$2

      RETURNING id
      `,

      [id,userId]

    );

    return rows[0];

  },

  async findDue(userId,today){

    const { rows } = await pool.query(

      `

      SELECT *

      FROM recurring_transactions

      WHERE

      user_id=$1

      AND active=true

      AND next_due <= $2

      ORDER BY next_due

      `,

      [

        userId,
        today

      ]

    );

    return rows;

  },

  async advance(id,nextDate){

    await pool.query(

      `

      UPDATE recurring_transactions

      SET next_due=$1

      WHERE id=$2

      `,

      [

        nextDate,
        id

      ]

    );

  }

};

module.exports = RecurringModel;