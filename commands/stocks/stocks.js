const path = require('path');
const fs = require('fs');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const pricesPath = path.join(__dirname, 'stocks.json');

const readPricesFile = () => {
  try {
    const data = fs.readFileSync(pricesPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading stock prices:', error);
    return {};
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stocks')
    .setDescription('Check the current prices of available stocks.')
    .addStringOption(option =>
      option.setName('stock')
        .setDescription('Choose a stock to view.')
        .setRequired(true)
        .addChoices(
          { name: 'SQRE', value: 'SQRE' },
          { name: 'TRI', value: 'TRI' },
          { name: 'CRC', value: 'CRC' },
          { name: 'HEX', value: 'HEX' },
          { name: 'PENT', value: 'PENT' },
          { name: 'DECA', value: 'DECA' },
          { name: 'All Stocks', value: 'ALL' }
        )),
  async execute(interaction) {
    const stockChoice = interaction.options.getString('stock');
    const priceData = readPricesFile();
    if (!priceData || Object.keys(priceData).length === 0) {
      return interaction.reply({ content: 'Stock data is unavailable.', ephemeral: true });
    }
    let embed = new EmbedBuilder()
      .setColor('#FFFFFF')
      .setTitle(`📈 Hermien Exchange`)
      .setThumbnail('https://i.imgur.com/d8B6JVn.png');

    if (stockChoice === 'ALL') {
      // Add stock prices to the embed
      for (const stock in priceData) {
        const stockData = priceData[stock];
        const prices = stockData.prices;
        if (!prices || prices.length < 2) {
          embed.addFields({ name: stock, value: `Price: **$${prices[0] ?? 'N/A'}**`, inline: true });
          continue;
        }
        const latestPrice = prices[prices.length - 1];
        const previousPrice = prices[prices.length - 2];
        const priceChange = latestPrice - previousPrice;
        const changeEmoji = priceChange > 0 ? '🟢' : priceChange < 0 ? '🔴' : '⚪';
        const changeText = priceChange > 0 ? `+${priceChange.toFixed(2)}` : priceChange.toFixed(2);

        embed.addFields({
          name: stock,
          value: `Price: **$${latestPrice.toFixed(2)}** ${changeEmoji}\nChange: **${changeText}**`,
          inline: true,
        });
      }
    }
    else {
      const stockData = priceData[stockChoice];
      const prices = stockData.prices;
      const labels = prices.map((_, index) => `Time ${index + 1}`);
      if (prices && prices.length >= 2) {
        const latestPrice = prices[prices.length - 1];
        const previousPrice = prices[prices.length - 2];
        const priceChange = latestPrice - previousPrice;
        const changeEmoji = priceChange > 0 ? '🟢' : priceChange < 0 ? '🔴' : '⚪';
        const changeText = priceChange > 0 ? `+${priceChange.toFixed(2)}` : priceChange.toFixed(2);
        embed.addFields({
          name: stockChoice,
          value: `Price: **$${latestPrice.toFixed(2)}** ${changeEmoji}\nChange: **${changeText}**`,
        });
        const incrementedPrice = prices.filter((_, index) => index % 20 === 0);
        const incrementedLabel = labels.filter((_, index) => index % 20 === 0);
        const chartConfig = `{"type":"line","data":{"labels":["${incrementedLabel.join('","')}"],"datasets":[{"data":[${incrementedPrice.join(',')}],"borderColor":"rgb(148,77,255)","backgroundColor":"transparent","tension":0.1,"fill":true}]},"options":{"responsive":true,"scales":{"x":{"display":false},"y":{"display":false}},"plugins":{"title":{"display":true,"text":"Stock Prices","color":"#fff","font":{"size":20}}},"backgroundColor":"#171717"}}`;
        const encodedChartConfig = encodeURIComponent(chartConfig.trim());
        embed.setImage(`https://quickchart.io/chart?width=600&height=315&chart=${encodedChartConfig}`)
      }
      else {
        embed.addFields({
          name: 'Error',
          value: 'Stock not found.',
        })
      }
    }
    await interaction.reply({ embeds: [embed] });
  }
}