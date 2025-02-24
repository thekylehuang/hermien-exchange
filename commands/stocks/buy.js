const path = require('path');
const fs = require("fs");
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const accountPath = path.join(__dirname, '../account','users.json');
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
    .setName('buy')
    .setDescription('Purchase a stock.')
    .addStringOption(option =>
      option.setName('stock')
        .setDescription('Choose a stock to purchase.')
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
        .setDescription('How many shares would you like to purchase?')
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
    const totalCost = stockPrice * stockQuantity;

    const users = readUsersFile(); // Read users data
    const userId = interaction.user.id;

    // Check if the user has an account
    if (!users[userId]) {
      return await interaction.reply(`You need an account, ${interaction.user.username}. You can register for one with the /init command.`);
    }

    const user = users[userId];

    // Check if the user has enough balance
    if (user.balance >= totalCost) {
      // Deduct balance and update portfolio
      user.balance -= totalCost;
      if (!user.portfolio[stockChoice]) {
        user.portfolio[stockChoice] = 0;  // Initialize the stock in the portfolio if not already present
      }
      user.portfolio[stockChoice] += stockQuantity;

      // Write the updated data back to the file
      fs.writeFileSync(accountPath, JSON.stringify(users, null, 2));

      // Create the success embed
      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('Purchase successful!')
        .setDescription(`You purchased ${stockQuantity} shares of ${stockChoice}.`)
        .addFields(
          { name: 'Remaining Balance', value: `$${user.balance}`, inline: true },
          { name: 'Stock Portfolio', value: `${stockChoice}: ${user.portfolio[stockChoice]}`, inline: true }
        );

      return interaction.reply({ embeds: [embed] });
    } else {
      // Insufficient funds
      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('Insufficient funds')
        .setDescription(`You do not have enough funds to purchase ${stockQuantity} shares of ${stockChoice}.`);

      return interaction.reply({ embeds: [embed] });
    }
  }
};
