import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { formatCurrency } from '../utils/helpers';

const toJsDate = (value) => {
  if (!value) return new Date();
  if (typeof value.toDate === 'function') return value.toDate();
  return new Date(value);
};

const groupSalesByDay = (transactions) => {
  const salesMap = transactions.reduce((map, transaction) => {
    const dateKey = toJsDate(transaction.timestamp).toISOString().slice(0, 10);
    map[dateKey] = (map[dateKey] || 0) + Number(transaction.totalAmount || 0);
    return map;
  }, {});

  return Object.entries(salesMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, sales]) => ({ date, sales: Number(sales.toFixed(2)) }));
};

const getProductDemand = (transactions) => {
  const demandMap = {};

  transactions.forEach((transaction) => {
    transaction.items?.forEach((item) => {
      const productId = item.productId || item.id;
      if (!demandMap[productId]) {
        demandMap[productId] = { productId, name: item.name, unitsSold: 0, revenue: 0 };
      }
      demandMap[productId].unitsSold += Number(item.quantity || 0);
      demandMap[productId].revenue += Number(item.price || 0) * Number(item.quantity || 0);
    });
  });

  return Object.values(demandMap).sort((a, b) => b.unitsSold - a.unitsSold);
};

const computeTrendModel = (points) => {
  const n = points.length;
  if (n < 2) {
    return { slope: 0, intercept: points[0]?.sales ?? 0 };
  }

  const sumX = points.reduce((s, _, i) => s + i, 0);
  const sumY = points.reduce((s, p) => s + p.sales, 0);
  const sumXY = points.reduce((s, p, i) => s + i * p.sales, 0);
  const sumXX = points.reduce((s, _, i) => s + i * i, 0);

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) {
    return { slope: 0, intercept: sumY / n };
  }

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
};

const computeAccuracyMetrics = (previousForecast, actualSalesByDay) => {
  if (!previousForecast?.dailySalesForecast?.length) {
    return { mae: null, rmse: null, mape: null, dataPoints: 0 };
  }

  const matched = previousForecast.dailySalesForecast
    .map((f) => ({ predicted: f.predictedSales, actual: actualSalesByDay[f.date] }))
    .filter((m) => m.actual !== undefined && m.actual !== null);

  if (matched.length === 0) {
    return { mae: null, rmse: null, mape: null, dataPoints: 0 };
  }

  const n = matched.length;
  const mae = matched.reduce((s, m) => s + Math.abs(m.predicted - m.actual), 0) / n;
  const rmse = Math.sqrt(matched.reduce((s, m) => s + Math.pow(m.predicted - m.actual, 2), 0) / n);
  const mape = matched
    .filter((m) => m.actual > 0)
    .reduce((s, m) => s + Math.abs((m.predicted - m.actual) / m.actual), 0) /
    Math.max(matched.filter((m) => m.actual > 0).length, 1) * 100;

  return {
    mae: Number(mae.toFixed(2)),
    rmse: Number(rmse.toFixed(2)),
    mape: Number(mape.toFixed(1)),
    dataPoints: n,
  };
};

const getLastForecast = async () => {
  try {
    const q = query(
      collection(db, 'forecastResults'),
      orderBy('runAt', 'desc'),
      limit(1),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data();
  } catch {
    return null;
  }
};

const buildLocalForecast = (transactions, products, accuracyMetrics = null) => {
  const salesTrend = groupSalesByDay(transactions);
  const productDemand = getProductDemand(transactions);

  const { slope, intercept } = computeTrendModel(salesTrend);

  const avgSales = salesTrend.length
    ? salesTrend.reduce((s, d) => s + d.sales, 0) / salesTrend.length
    : 0;

  const dailySalesForecast = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index + 1);
    const x = salesTrend.length + index;
    const predicted = Math.max(slope * x + intercept, 0);
    return {
      date: date.toISOString().slice(0, 10),
      predictedSales: Number(predicted.toFixed(2)),
    };
  });

  const demandByProduct = productDemand.reduce((map, item) => {
    map[item.productId] = item.unitsSold;
    return map;
  }, {});

  const restockRecommendations = products
    .map((product) => {
      const recentUnitsSold = demandByProduct[product.id] || product.recentUnitsSold || 0;
      const predictedDemand = Math.max(
        recentUnitsSold,
        product.lowStock ? product.minimumStockThreshold * 2 : recentUnitsSold,
      );
      const recommendedRestock = Math.max(
        Math.ceil(predictedDemand + (product.minimumStockThreshold || 5) - (product.stockQuantity || 0)),
        product.lowStock ? product.suggestedRestockQuantity || 0 : 0,
      );

      return {
        productId: product.id,
        name: product.name,
        stockQuantity: product.stockQuantity || 0,
        predictedDemand,
        recommendedRestock,
        risk: product.outOfStock
          ? 'Critical'
          : product.lowStock || recommendedRestock > 0
            ? 'Low Stock'
            : 'Healthy',
      };
    })
    .filter((item) => item.recommendedRestock > 0 || item.risk !== 'Healthy')
    .sort((a, b) => b.recommendedRestock - a.recommendedRestock)
    .slice(0, 8);

  return {
    source: 'AI Forecast Engine',
    summary: {
      expectedDailySales: formatCurrency(avgSales),
      topProduct: productDemand[0]?.name || 'No sales yet',
      lowStockCount: products.filter((p) => p.lowStock).length,
    },
    accuracyMetrics,
    salesTrend,
    dailySalesForecast,
    bestSellingProducts: productDemand.slice(0, 5),
    restockRecommendations,
  };
};

export const forecastService = {
  getForecast: async ({ transactions, products }) => {
    const [lastForecast] = await Promise.all([getLastForecast()]);

    const actualSalesByDay = groupSalesByDay(transactions).reduce((m, d) => {
      m[d.date] = d.sales;
      return m;
    }, {});

    const accuracyMetrics = computeAccuracyMetrics(lastForecast, actualSalesByDay);
    const result = buildLocalForecast(transactions, products, accuracyMetrics);

    addDoc(collection(db, 'forecastResults'), {
      runAt: new Date(),
      summary: result.summary,
      dailySalesForecast: result.dailySalesForecast,
      accuracyMetrics,
      transactionCount: transactions.length,
      productCount: products.length,
    }).catch(() => {});

    return result;
  },
};
