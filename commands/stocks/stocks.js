const path = require('path');
const fs = require('fs');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createCanvas } = require('canvas');
const { Chart, CategoryScale, LinearScale, LineElement, PointElement, Title, LineController } = require('chart.js');

// Register the necessary components for Chart.js v3+
Chart.register(CategoryScale, LinearScale, LineElement, PointElement, Title, LineController);

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

    // Generate a chart
    const generateChart = (prices, labels) => {
      const canvas = createCanvas(800, 400);
      const ctx = canvas.getContext('2d');
    
      // Set the background color of the entire canvas
      ctx.fillStyle = '#171717';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    
      const chartData = {
        labels: labels,
        datasets: [{
          label: 'Stock Price',
          data: prices,
          borderColor: 'rgb(255, 255, 255)',
          borderWidth: 1,
          fill: false,
        }]
      };
    
      const chart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
          responsive: true,
          scales: {
            x: {
              display: false,
            },
            y: {
              title: {
                display: true,
                text: 'Price ($)',
                font: {
                  size: 16,
                  weight: 'bold',
                  family: 'Arial',
                },
                color: 'white',
              },
              ticks: {
                beginAtZero: false,
                color: 'white',
                font: {
                  size: 12,
                  family: 'Arial',
                },
              }
            }
          }
        }
      });
    
      return canvas.toBuffer(); 
    };    

    if (stockChoice === 'ALL') {
      const allPrices = [];
      const labels = [];
      // Add stock prices to the embed
      for (const stock in priceData) {
        const stockData = priceData[stock];
        const prices = stockData.prices.map(price => Math.round(price * 100) / 100);
        labels.push(stock);
        allPrices.push(prices[prices.length - 1]);
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
      await interaction.reply({
        embeds: [embed],
      });
    }
     else {
      const stockData = priceData[stockChoice];
      const prices = stockData.prices.map(price => Math.round(price * 100) / 100);
      const labels = prices.map((_, index) => `Day ${index + 1}`);

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

        const chartBuffer = await generateChart(prices, labels);
        embed.setImage('attachment://chart.png');
        await interaction.reply({
          embeds: [embed],
          files: [{
            attachment: chartBuffer,
            name: 'chart.png'
          }]
        });
      } 
      else {
        embed.addFields({
          name: 'Error',
          value: 'Not enough stock data.',
        });
        await interaction.reply({ embeds: [embed] });
      }
    }
  }
};
