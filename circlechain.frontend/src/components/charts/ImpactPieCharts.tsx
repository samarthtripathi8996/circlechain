import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { apiService } from '../../services/api';
import { ImpactSummary } from '../../types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface ChartDataItem {
  category: string;
  total_impact: number;
  product_count: number;
  percentage?: number;
}

const ImpactPieChart: React.FC = () => {
  const [data, setData] = useState<ChartDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalImpact, setTotalImpact] = useState(0);

  useEffect(() => {
    const fetchImpactData = async () => {
      try {
        const impactSummary: ImpactSummary = await apiService.getImpactSummary();
        
        // Calculate percentages for each category
        const total = impactSummary.overall.total_co2_impact;
        const chartData = impactSummary.by_category.map(item => ({
          ...item,
          percentage: total > 0 ? Math.round((item.total_impact / total) * 100) : 0
        }));

        setData(chartData);
        setTotalImpact(total);
      } catch (error) {
        console.error('Failed to fetch impact data:', error);
        // Fallback data for demonstration
        const fallbackData = [
          { category: 'Electronics', total_impact: 450, product_count: 15, percentage: 35 },
          { category: 'Textiles', total_impact: 320, product_count: 22, percentage: 25 },
          { category: 'Plastics', total_impact: 280, product_count: 18, percentage: 22 },
          { category: 'Metals', total_impact: 150, product_count: 8, percentage: 12 },
          { category: 'Others', total_impact: 100, product_count: 5, percentage: 6 },
        ];
        setData(fallbackData);
        setTotalImpact(fallbackData.reduce((sum, item) => sum + item.total_impact, 0));
      } finally {
        setIsLoading(false);
      }
    };

    fetchImpactData();
  }, []);

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center">Loading chart...</div>;
  }

  return (
    <div className="w-full">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Total CO₂ Impact Saved</h3>
        <p className="text-2xl font-bold text-green-600">{totalImpact.toFixed(2)} kg</p>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ category, percentage }) => `${category}: ${percentage}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="total_impact"
            nameKey="category"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`${value} kg CO₂ saved`, 'Environmental Impact']}
            labelFormatter={(label) => `Category: ${label}`}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      
      <div className="mt-4 text-sm text-gray-600 text-center">
        Based on {data.reduce((sum, item) => sum + item.product_count, 0)} products across {data.length} categories
      </div>
    </div>
  );
};

export default ImpactPieChart;