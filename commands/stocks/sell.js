const path = require('path');
const fs = require("fs");
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const accountPath = path.join(__dirname, '../account', 'users.json');
const pricesPath = path.join(__dirname, 'stocks.json');

// Read the stock prices from file
const readPricesFile = () => {
  try {
    const data = fs.readFileSync(pricesPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading stock prices:', error);
    return {};
  }
};

// Read the users data from file
const readUsersFile = () => {
  try {
    const data = fs.readFileSync(accountPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users data:', error);
    return {};
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Sell a stock.')
    .addStringOption(option =>
      option.setName('stock')
        .setDescription('Choose a stock to sell.')
        .setRequired(true)
        .addChoices(
          { name: 'SQRE', value: 'SQRE' },
          { name: 'TRI', value: 'TRI' },
          { name: 'CRC', value: 'CRC' },
          { name: 'HEX', value: 'HEX' },
          { name: 'PENT', value: 'PENT' },
          { name: 'DECA', value: 'DECA' },
          { name: 'All Stocks', value: 'ALL' }
        )
    )
    .addIntegerOption(option =>
      option.setName('quantity')
        .setDescription('How many shares would you like to sell?')
        .setRequired(true)
    ),
  async execute(interaction) {
    const stockChoice = interaction.options.getString('stock');
    const stockQuantity = interaction.options.getInteger('quantity');
    const priceData = readPricesFile();

    // Check if stock choice is valid
    if (!priceData[stockChoice]) {
      return interaction.reply(`Invalid stock choice: ${stockChoice}`);
    }

    const stockPrice = priceData[stockChoice].prices[priceData[stockChoice].prices.length - 1];
    const totalValue = stockPrice * stockQuantity;

    const users = readUsersFile(); // Read users data
    const userId = interaction.user.id;

    // Check if the user has an account
    if (!users[userId]) {
      return await interaction.reply(`You need an account, ${interaction.user.username}. You can register for one with the /init command.`);
    }

    const user = users[userId];

    // Check if the user has enough shares of the stock to sell
    if (user.portfolio[stockChoice] >= stockQuantity) {
      // Deduct shares and add funds to user balance
      user.portfolio[stockChoice] -= stockQuantity;
      user.balance += totalValue;

      // Write the updated data back to the file
      fs.writeFileSync(accountPath, JSON.stringify(users, null, 2));

      // Create the success embed
      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('Sell successful!')
        .setDescription(`You sold ${stockQuantity} shares of ${stockChoice}.`)
        .addFields(
          { name: 'Remaining Balance', value: `$${user.balance}`, inline: true },
          { name: 'Stock Portfolio', value: `${stockChoice}: ${user.portfolio[stockChoice]}`, inline: true }
        );

      return interaction.reply({ embeds: [embed] });
    } else {
      // Not enough shares to sell
      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('Insufficient shares')
        .setDescription(`You do not have enough shares of ${stockChoice} to sell ${stockQuantity} shares.`);

      return interaction.reply({ embeds: [embed] });
    }
  }
};
