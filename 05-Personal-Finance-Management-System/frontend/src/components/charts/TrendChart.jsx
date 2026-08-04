import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import Card from '../ui/Card';
import { formatCurrency } from '../../utils/formatCurrency';

function TrendChart({ data }) {
  return (
    <Card title="Monthly Trends">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#efe9d8" />
          <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} stroke="#8a8870" />
          <YAxis fontSize={12} tickLine={false} axisLine={false} width={40} stroke="#8a8870" />
          <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: 12, border: '1px solid #eee6cc' }} />
          <Legend />
          <Line type="monotone" dataKey="income" name="Income" stroke="#749768" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="expense" name="Expense" stroke="#e08e79" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

export default TrendChart;
