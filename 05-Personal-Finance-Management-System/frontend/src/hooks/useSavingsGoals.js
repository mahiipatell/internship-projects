import { useCallback, useEffect, useState } from 'react';
import savingsGoalService from '../services/savingsGoal.service';

export function useSavingsGoals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    return savingsGoalService.getGoals().then((data) => {
      setGoals(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createGoal = useCallback(async (data) => {
    await savingsGoalService.createGoal(data);
    await refresh();
  }, [refresh]);

  const updateGoal = useCallback(async (id, data) => {
    await savingsGoalService.updateGoal(id, data);
    await refresh();
  }, [refresh]);

  const contribute = useCallback(async (id, amount) => {
    await savingsGoalService.contribute(id, amount);
    await refresh();
  }, [refresh]);

  const deleteGoal = useCallback(async (id) => {
    await savingsGoalService.deleteGoal(id);
    await refresh();
  }, [refresh]);

  return { goals, loading, refresh, createGoal, updateGoal, contribute, deleteGoal };
}
