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
      r.is_active DESC,
      r.next_run_date ASC
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
      accountId,
      title,
      amount,
      type,
      frequency,
      startDate,
      notes

    }

  ){

    const { rows } = await pool.query(

      `

      INSERT INTO recurring_transactions(

      user_id,
      category_id,
      account_id,
      title,
      amount,
      type,
      frequency,
      start_date,
      next_run_date,
      is_active,
      notes

      )

      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$8,true,$9)

      RETURNING *
      `,

      [

        userId,
        categoryId,
        accountId || null,
        title,
        amount,
        type,
        frequency,
        startDate,
        notes || null

      ]

    );

    return rows[0];

  },

  async update(

    id,
    userId,

    {

      categoryId,
      accountId,
      title,
      amount,
      type,
      frequency,
      isActive,
      notes

    }

  ){

    const { rows } = await pool.query(

      `

      UPDATE recurring_transactions

      SET

      category_id=$1,
      account_id=$2,
      title=$3,
      amount=$4,
      type=$5,
      frequency=$6,
      is_active=$7,
      notes=$8

      WHERE

      id=$9
      AND user_id=$10

      RETURNING *
      `,

      [

        categoryId,
        accountId || null,
        title,
        amount,
        type,
        frequency,
        isActive,
        notes || null,
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

      AND is_active=true

      AND next_run_date <= $2

      ORDER BY next_run_date
      `,

      [

        userId,
        today

      ]

    );

    return rows;

  },

  async advance(id,{ nextRunDate, lastRunDate }){

    await pool.query(

      `

      UPDATE recurring_transactions

      SET next_run_date=$1, last_run_date=$2

      WHERE id=$3
      `,

      [

        nextRunDate,
        lastRunDate || null,
        id

      ]

    );

  }

};

module.exports = RecurringModel;
