const fs = require("fs");

const path = "./commands/stocks/stocks.json";
const MAX_ENTRIES = 720;
const STOCKS = ["SQRE", "TRI", "CRC", "HEX", "PENT", "DECA"];

// Parameters controlling the market's behavior
const VOLATILITY = {
    SQRE: 1.5,
    TRI: 1.0,
    CRC: 0.8,
    HEX: 50, // Super Volatile
    PENT: 0.5, // Stable
    DECA: 1.2
};

const TREND_PROBABILITY = 0.75 // Chance to follow market trend
const EVENT_PROBABILITY = 0.02 // Chance of a market event

function generatePrice(lastPrice, stock){
    let change = (Math.random() - 0.5) * VOLATILITY[stock]; 
    // Reinforcing a trend
    if (Math.random() < TREND_PROBABILITY) {
        change += Math.sign(change) * Math.random();
    }
    // Rare market event
    if (Math.random() < EVENT_PROBABILITY) {
        change *= (Math.random() > 0.5 ? 25 : -25); // Half chance of pumping or dumping
    }
    return Math.max(1, lastPrice + change); // Price will always be above 1
}

function updatePrices() {
    let data = JSON.parse(fs.readFileSync(path, "utf8"));
    let timestamp = Date.now();

    STOCKS.forEach((stock) => {
        let stockData = data[stock];
        let lastPrice = stockData.prices.length ? stockData.prices[stockData.prices.length - 1] : 100;
        let newPrice = generatePrice(lastPrice, stock);
        stockData.timestamps.push(timestamp);
        stockData.prices.push(newPrice);

        if (stockData.timestamps.length > MAX_ENTRIES) {
            stockData.timestamps.shift();
            stockData.prices.shift();
        }
    });

    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    console.log(`[${new Date().toLocaleTimeString()}] Stock prices updated.`);
}

setInterval(updatePrices, 30000);
updatePrices();