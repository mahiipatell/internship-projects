import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import Card from '../ui/Card';
import { formatCurrency } from '../../utils/formatCurrency';

function IncomeVsExpenseChart({ data }) {
  return (
    <Card title="Income vs Expense">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#efe9d8" />
          <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} stroke="#8a8870" />
          <YAxis fontSize={12} tickLine={false} axisLine={false} width={40} stroke="#8a8870" />
          <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: 12, border: '1px solid #eee6cc' }} />
          <Legend />
          <Bar dataKey="income" name="Income" fill="#93b98a" radius={[8, 8, 0, 0]} />
          <Bar dataKey="expense" name="Expense" fill="#e08e79" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export default IncomeVsExpenseChart;
