const asyncHandler = require('../utils/asyncHandler');
const UserModel = require('../models/user.model');

// Password changes and email changes now go through Firebase directly on
// the client (re-authentication is required for those by Firebase itself),
// so this only updates the profile fields Postgres actually owns.
const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatarUrl, currency, monthlyIncome, country, timezone, theme } = req.body;

  const user = await UserModel.updateProfile(req.user.id, {
    name,
    avatar_url: avatarUrl,
    currency,
    monthly_income: monthlyIncome,
    country,
    timezone,
    theme,
  });

  res.json({ success: true, data: { user } });
});

module.exports = { updateProfile };
