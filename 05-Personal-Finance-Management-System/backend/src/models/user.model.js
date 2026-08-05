const pool = require("../config/db");

const PUBLIC_COLUMNS = `
id,
firebase_uid,
name,
email,
email_verified,
avatar_url,
currency,
monthly_income,
country,
timezone,
theme,
notifications,
last_login,
created_at,
updated_at
`;

const UserModel = {

    async findByFirebaseUid(firebaseUid){

        const { rows } = await pool.query(

            `
            SELECT ${PUBLIC_COLUMNS}
            FROM users
            WHERE firebase_uid=$1
            `,

            [firebaseUid]

        );

        return rows[0];

    },

    async findByEmail(email){

        const { rows } = await pool.query(

            `
            SELECT ${PUBLIC_COLUMNS}
            FROM users
            WHERE email=$1
            `,

            [email]

        );

        return rows[0];

    },

    async createFromFirebase({

        firebaseUid,
        email,
        name,
        avatarUrl,
        emailVerified

    }){

        const { rows } = await pool.query(

            `
            INSERT INTO users(

                firebase_uid,
                name,
                email,
                avatar_url,
                email_verified

            )

            VALUES($1,$2,$3,$4,$5)

            RETURNING ${PUBLIC_COLUMNS}
            `,

            [

                firebaseUid,
                name,
                email,
                avatarUrl || null,
                emailVerified

            ]

        );

        return rows[0];

    },

    async updateLastLogin(firebaseUid){

        await pool.query(

            `
            UPDATE users
            SET last_login = NOW()
            WHERE firebase_uid=$1
            `,

            [firebaseUid]

        );

    },

    async updateProfile(id,data){

        const {

            name,
            avatar_url,
            currency,
            monthly_income,
            country,
            timezone,
            theme,
            notifications

        } = data;

        const { rows } = await pool.query(

            `
            UPDATE users

            SET

            name=$1,
            avatar_url=$2,
            currency=$3,
            monthly_income=$4,
            country=$5,
            timezone=$6,
            theme=$7,
            notifications=$8

            WHERE id=$9

            RETURNING ${PUBLIC_COLUMNS}
            `,

            [

                name,
                avatar_url,
                currency,
                monthly_income,
                country,
                timezone,
                theme,
                notifications,
                id

            ]

        );

        return rows[0];

    }

};

module.exports = UserModel;