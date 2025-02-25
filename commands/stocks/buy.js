const path = require('path');
const fs = require("fs");
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const accountPath = path.join(__dirname, '../account', 'users.json');
const pricesPath = path.join(__dirname, 'stocks.json');

// Read and parse JSON files
const readJSON = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return {};
  }
};

// Write updated data back to JSON file
const writeJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
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
          { name: 'DECA', value: 'DECA' }
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

    const priceData = readJSON(pricesPath);
    const users = readJSON(accountPath);
    const userId = interaction.user.id;

    if (!priceData[stockChoice]) {
      return interaction.reply(`Invalid stock choice: ${stockChoice}`);
    }

    const stock = priceData[stockChoice];
    if (stock.prices.length === 0) {
      return interaction.reply(`Stock ${stockChoice} has no price history.`);
    }

    const stockPrice = stock.prices[stock.prices.length - 1];
    const totalCost = stockPrice * stockQuantity;

    if (!users[userId]) {
      return await interaction.reply(`You need an account, ${interaction.user.username}. Register using /init.`);
    }

    const user = users[userId];

    if (user.balance < totalCost) {
      return interaction.reply({ 
        embeds: [
          new EmbedBuilder()
            .setColor(0xFFFFFF)
            .setTitle('Insufficient Funds')
            .setDescription(`You don't have enough money to buy ${stockQuantity} shares of ${stockChoice}.`)
        ]
      });
    }

    // Deduct balance and update portfolio
    user.balance -= totalCost;
    user.portfolio[stockChoice] = (user.portfolio[stockChoice] || 0) + stockQuantity;

    // Increase total shares in circulation
    stock.shares += stockQuantity;

    // Adjust stock price based on demand
    const demandFactor = 1 + (stockQuantity / stock.shares) * 0.1;
    const newPrice = Math.round(stockPrice * demandFactor * 100) / 100;

    stock.prices.push(newPrice);
    stock.timestamps.push(Date.now());

    // Write updates to files
    writeJSON(accountPath, users);
    writeJSON(pricesPath, priceData);

    return interaction.reply({ 
      embeds: [
        new EmbedBuilder()
          .setColor(0xFFFFFF)
          .setTitle('Purchase Successful!')
          .setDescription(`You bought ${stockQuantity} shares of ${stockChoice} for $${Math.round(totalCost * 100) / 100}.`)
          .addFields(
            { name: 'New Stock Price', value: `$${newPrice}`, inline: true },
            { name: 'Remaining Balance', value: `$${Math.round(user.balance * 100) / 100}`, inline: true },
            { name: 'Stock Portfolio', value: `${stockChoice}: ${user.portfolio[stockChoice]}`, inline: true }
          )
      ]
    });
  }
};
