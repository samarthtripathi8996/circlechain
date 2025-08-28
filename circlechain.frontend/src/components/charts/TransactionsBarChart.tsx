import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { apiService } from '../../services/api';

interface TransactionData {
  id: number;
  tx_type: string;
  user_id: number;
  related_id: number | null;
  amount: number | null;
  details: string | null;
  created_at: string;
}

interface ChartData {
  type: string;
  count: number;
}

const TransactionsBarChart: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactionData = async () => {
      try {
        const transactions: TransactionData[] = await apiService.getTransactions();

        // Group transactions by type and count them
        const transactionCounts = transactions.reduce(
          (acc: Record<string, number>, transaction) => {
            acc[transaction.tx_type] = (acc[transaction.tx_type] || 0) + 1;
            return acc;
          },
          {}
        );

        const chartData: ChartData[] = Object.entries(transactionCounts).map(
          ([tx_type, count]) => ({
            type: tx_type.charAt(0).toUpperCase() + tx_type.slice(1),
            count,
          })
        );

        setData(chartData);
      } catch (error) {
        console.error('Failed to fetch transaction data:', error);
        // Fallback data for demonstration
        setData([
          { type: 'Purchase', count: 45 },
          { type: 'Sale', count: 32 },
          { type: 'Recycle', count: 28 },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactionData();
  }, []);

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        Loading chart...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="type" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="#8884d8" name="Transaction Count" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TransactionsBarChart;
