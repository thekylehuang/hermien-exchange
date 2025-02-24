const path = require('path');
const fs = require('fs');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const usersFilePath = path.join(__dirname, 'users.json');

// Read the users file
const readUsersFile = () => {
  try {
    const data = fs.readFileSync(usersFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users data:', error);
    return {};
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('account')
    .setDescription('Display information about your account in an embed.'),
  async execute(interaction) {
    const user = interaction.user;
    const avatar = user.avatarURL({ format: 'png', size: 1024 });
    const usersFile = readUsersFile();

    if (!usersFile[user.id]) {
      return await interaction.reply(`You need an account, ${user.username}. You can register for one with the /init command.`);
    }

    const balance = usersFile[user.id].balance;
    const portfolio = usersFile[user.id].portfolio;
    
    // Create the portfolio string
    let portfolioDisplay = '';
    for (const [stock, quantity] of Object.entries(portfolio)) {
      portfolioDisplay += `${stock}: ${quantity} shares\n`;
    }

    const embed = new EmbedBuilder()
      .setColor('#FFFFFF')
      .setTitle(`${user.username}`)
      .setDescription(`The account is under the name "${user.username}". The account has a balance of $${balance}.`)
      .addFields(
        { name: 'Portfolio', value: portfolioDisplay || 'No stocks purchased yet.', inline: false }
      )
      .setThumbnail(avatar)
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  }
}
