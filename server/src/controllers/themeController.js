const Theme = require('../models/Theme');

const getTheme = async (req, res) => {
  const theme = await Theme.findOne().sort({ updatedAt: -1 });
  if (!theme) {
    const defaultTheme = await Theme.create({});
    return res.json(defaultTheme);
  }
  res.json(theme);
};

const updateTheme = async (req, res) => {
  const { primaryColor, secondaryColor, accentColor, fontStyle, heroText, tagline, logoURL, bannerURL } = req.body;
  let theme = await Theme.findOne().sort({ updatedAt: -1 });
  if (!theme) {
    theme = new Theme({});
  }
  if (primaryColor) theme.primaryColor = primaryColor;
  if (secondaryColor) theme.secondaryColor = secondaryColor;
  if (accentColor) theme.accentColor = accentColor;
  if (fontStyle) theme.fontStyle = fontStyle;
  if (heroText) theme.heroText = heroText;
  if (tagline) theme.tagline = tagline;
  if (logoURL) theme.logoURL = logoURL;
  if (bannerURL) theme.bannerURL = bannerURL;
  theme.updatedBy = req.user._id;
  await theme.save();
  res.json(theme);
};

module.exports = { getTheme, updateTheme };
