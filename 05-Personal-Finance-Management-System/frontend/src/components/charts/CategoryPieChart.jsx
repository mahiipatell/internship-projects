import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import { formatCurrency } from '../../utils/formatCurrency';

// Warm finance-app palette only — butter yellow, pastel green, mint, cream, soft coral, sage
const COLORS = ['#eab308', '#93b98a', '#c9e9d8', '#e08e79', '#749768', '#f5c944', '#fbe98d', '#5b9a6f'];

function CategoryPieChart({ data, title = 'Category Breakdown' }) {
  const hasData = data && data.length > 0;

  return (
    <Card title={title}>
      {hasData ? (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={3}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: 12, border: '1px solid #eee6cc' }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <EmptyState emoji="📊" title="No expenses yet" description="Add a transaction to see your category breakdown here." />
      )}
    </Card>
  );
}

export default CategoryPieChart;
