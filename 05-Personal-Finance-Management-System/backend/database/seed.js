const pool = require("../src/config/db");

async function seed() {

    try {

        console.log("Checking database...");

        const { rows } = await pool.query(

            `
            SELECT COUNT(*) AS count
            FROM categories
            WHERE is_default = true;
            `
        );

        if(Number(rows[0].count) > 0){

            console.log("Default categories already exist.");

            process.exit();

        }

        console.log("No seed required.");

    }

    catch(err){

        console.error(err);

    }

    finally{

        process.exit();

    }

}

seed();