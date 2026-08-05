const pool = require("../config/db");

const BudgetModel = {

  async getSettings(userId) {

    const { rows } = await pool.query(

      `
      SELECT *
      FROM budgets
      WHERE user_id=$1
      ORDER BY year DESC, month DESC
      LIMIT 1
      `,

      [userId]

    );

    return rows[0];

  },

  async getCategories(budgetId){

    const { rows } = await pool.query(

      `
      SELECT

      ba.id,
      ba.category_id,
      ba.allocated_amount,
      ba.spent_amount,

      c.name,
      c.icon,
      c.color

      FROM budget_allocations ba

      JOIN categories c
      ON c.id=ba.category_id

      WHERE ba.budget_id=$1

      ORDER BY c.name

      `,

      [budgetId]

    );

    return rows;

  },

  async enable(userId,{monthlyIncome,savingsGoal}){

    const now=new Date();

    const month=now.getMonth()+1;

    const year=now.getFullYear();

    const { rows } = await pool.query(

      `

      INSERT INTO budgets(

      user_id,
      month,
      year,
      monthly_income,
      savings_goal,
      enabled

      )

      VALUES($1,$2,$3,$4,$5,true)

      ON CONFLICT(user_id,month,year)

      DO UPDATE

      SET

      monthly_income=$4,
      savings_goal=$5,
      enabled=true

      RETURNING *

      `,

      [

        userId,
        month,
        year,
        monthlyIncome,
        savingsGoal

      ]

    );

    return rows[0];

  },

  async setEnabled(userId,isEnabled){

    const { rows } = await pool.query(

      `

      UPDATE budgets

      SET enabled=$1

      WHERE id=(

      SELECT id

      FROM budgets

      WHERE user_id=$2

      ORDER BY year DESC,month DESC

      LIMIT 1

      )

      RETURNING *

      `,

      [

        isEnabled,
        userId

      ]

    );

    return rows[0];

  },

  async addAllocation(budgetId,categoryId,amount){

    const { rows } = await pool.query(

      `

      INSERT INTO budget_allocations(

      budget_id,
      category_id,
      allocated_amount

      )

      VALUES($1,$2,$3)

      ON CONFLICT(budget_id,category_id)

      DO UPDATE

      SET allocated_amount=$3

      RETURNING *

      `,

      [

        budgetId,
        categoryId,
        amount

      ]

    );

    return rows[0];

  },

  async findAllocationOwnedByUser(allocationId,userId){

    const { rows } = await pool.query(

      `

      SELECT

      ba.*

      FROM budget_allocations ba

      JOIN budgets b

      ON b.id=ba.budget_id

      WHERE

      ba.id=$1

      AND

      b.user_id=$2

      `,

      [

        allocationId,
        userId

      ]

    );

    return rows[0];

  },

  async updateAllocationAmount(id,amount){

    const { rows } = await pool.query(

      `

      UPDATE budget_allocations

      SET allocated_amount=$1

      WHERE id=$2

      RETURNING *

      `,

      [

        amount,
        id

      ]

    );

    return rows[0];

  },

  async deleteAllocation(id){

    await pool.query(

      `

      DELETE FROM budget_allocations

      WHERE id=$1

      `,

      [id]

    );

    return true;

  },

  async reset(userId){

    const budget=await this.getSettings(userId);

    if(!budget) return null;

    const client=await pool.connect();

    try{

      await client.query("BEGIN");

      await client.query(

        "DELETE FROM budget_allocations WHERE budget_id=$1",

        [budget.id]

      );

      await client.query(

        `

        UPDATE budgets

        SET

        enabled=false,

        monthly_income=0,

        savings_goal=0

        WHERE id=$1

        `,

        [budget.id]

      );

      await client.query("COMMIT");

    }

    catch(err){

      await client.query("ROLLBACK");

      throw err;

    }

    finally{

      client.release();

    }

    return true;

  },

  async getSpentByCategoryThisMonth(userId){

    const { rows } = await pool.query(

      `

      SELECT

      category_id,

      COALESCE(SUM(amount),0)::float AS spent

      FROM transactions

      WHERE

      user_id=$1

      AND type='expense'

      AND date_trunc('month',transaction_date)=date_trunc('month',CURRENT_DATE)

      GROUP BY category_id

      `,

      [userId]

    );

    return rows;

  }

};

module.exports = BudgetModel;