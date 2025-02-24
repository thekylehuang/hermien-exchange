const path = require('path');
const fs = require('fs');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const usersFilePath = path.join(__dirname, 'users.json');

const readUsersFile = () => {
  try {
    const data = fs.readFileSync(usersFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users data:', error);
    return {};
  }
};

const writeUsersFile = (data) => {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing users data:', error);
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('init')
    .setDescription('Register for a Hermien Exchange account.'),
  async execute(interaction) {
    const user = interaction.user;
    const avatar = user.avatarURL({format: 'png', size: 1024 });
    const embed = new EmbedBuilder()
      .setColor('#FFFFFF')
      .setTitle('Welcome to Hermien Exchange!')
      .setDescription(`Thank you for choosing Hermien Exchange, ${user.username}! You now have an account with a balance of $1000.`)
      .setThumbnail(avatar)
      .setTimestamp();
    const usersFile = readUsersFile();
    if (usersFile[user.id]) {
      return await interaction.reply(`You already have an account, ${user.username}.`);
    }

    usersFile[user.id] = {
      username: user.username,
      balance: 1000,
      stocks: []
    };

    writeUsersFile(usersFile);

    await interaction.reply({ embeds: [embed] });
  }
}